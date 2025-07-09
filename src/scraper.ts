import { parse as parseHTML } from "node-html-parser";
import { db } from "./db";
const cookie = "";

function request(url: string, options?: RequestInit) {
  options ??= {};
  options.headers ??= {};
  (options.headers as Record<string, string>).cookie = cookie;

  return fetch(url, options);
}

function parseTimeString(str: string) {
  const parts = str.split(" ");
  let minutes = 0;
  for (const part of parts) {
    if (part.endsWith("h")) {
      minutes += Number.parseInt(part.substring(0, part.length - 1)) * 60;
    } else if (part.endsWith("m")) {
      minutes += Number.parseInt(part.substring(0, part.length - 1));
    } else {
      console.log("Unknown time unit for part:", part);
    }
  }

  return minutes;
}

// scrape task
async function scrape(page: number) {
  const res = await request(
    `https://summer.hackclub.com/explore.turbo_stream?page=${page}&tab=gallery`
  );

  const txt = await res.text();
  if (!res.ok) {
    console.log("scraping failed:", res.status, "text:", txt);
    return 0;
  }

  const document = parseHTML(txt);
  //   console.log(parsed);
  //   console.log(txt);
  //   fs.writeFileSync("nice.html", txt);
  const projects = document.querySelectorAll(
    "turbo-stream[action=append] > template > a"
  );

  for (const project of projects) {
    const url = project.getAttribute("href");
    const imgUrl = project.querySelector("img")?.getAttribute("src");
    const name = project.querySelector("h2")?.textContent;
    const byLine = project
      .querySelector("p.mb-2.line-clamp-3.break-words.overflow-wrap-anywhere")
      ?.textContent?.trim()
      ?.split("•")
      .map((a) => a.trim());
    const description = project
      .querySelector("p.line-clamp-3.text-sm.overflow-hidden.mb-4")
      ?.textContent?.trim();
    if (byLine == null || byLine.length < 3) {
      console.log("Invalid by line:", byLine, ", url:", url);
      continue;
    }
    let [by, devlogsStr, timeStr] = byLine;
    by = by.split("by ")?.[1];
    const mins = parseTimeString(timeStr);
    const devlogs = Number.parseInt(devlogsStr.split(" ")[0]);

    if (Number.isNaN(devlogs)) {
      console.log("Invalid devlogs:", devlogs, project.outerHTML);
      continue;
    }
    if (name == null) {
      console.log("Missing name", project.outerHTML);
      continue;
    }
    if (description == null) {
      console.log("Missing description", project.outerHTML);
      continue;
    }

    if (url == null) {
      console.log("Missing url", project.outerHTML);
      continue;
    }

    if (imgUrl == null) {
      console.log("Missing imageUrl", project.outerHTML);
      continue;
    }

    if ((await db.project.count({ where: { url } })) > 0) {
      console.log(`Project ${name} already in db, skipping...`);
      continue;
    }

    await db.project.create({
      data: {
        name,
        author: by,
        description,
        devlogsCount: Number(devlogs),
        minutesSpent: mins,
        url,
        imageUrl: imgUrl,
      },
    });

    console.log(`Added ${name} to the database!`);
  }

  return projects.length;
}

let scraping = false;
async function requestScrape() {
  if (scraping) return false;
  scraping = true;

  const projs = await db.project.findMany({
    where: {
      author: {
        startsWith: "by ",
      },
    },
  });

  for (const proj of projs) {
    const updated = await db.project.update({
      where: {
        id: proj.id,
      },
      data: {
        author: proj.author.replace("by ", ""),
      },
    });

    console.log("updated:", updated.id, updated.name, updated.author);
  }

  let page = 200;
  let added = await scrape(page);
  while (added > 0) {
    console.log(`Scraped ${added} projects.`);
    ++page;

    console.log(`Scraping page ${page}`);
    added = await scrape(page);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  scraping = false;
  return true;
}

function getState() {
  return scraping ? "scraping" : "idle";
}

export const scraper = {
  requestScrape,
  getState,
};
