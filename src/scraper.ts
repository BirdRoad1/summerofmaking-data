import { parse as parseHTML } from "node-html-parser";
import { db } from "./db.js";
import { env } from "./env.js";
const cookie = env.SOC_COOKIE;

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
  const abortController = new AbortController();
  let timeout = setTimeout(() => {
    abortController.abort("timed out");
  }, 20000);

  let res;
  try {
    res = await request(
      `https://summer.hackclub.com/explore.turbo_stream?page=${page}&tab=gallery`,
      {
        signal: abortController.signal,
      }
    );
  } catch (err) {
    let msg = err instanceof Error ? err.message : String(err);
    throw new Error("Failed to make request. Error: " + msg);
  }

  clearTimeout(timeout);

  const txt = await res.text();
  if (!res.ok) {
    throw new Error("Invalid status: " + res.status + ", text: " + txt);
  }

  const document = parseHTML(txt);
  const projects = document.querySelectorAll(
    "turbo-stream[action=append] > template > a"
  );

  if (projects.length === 0) {
    throw new Error("No projects found in HTML");
  }

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

async function startScraping() {
  const lastPageScraped = await db.scrapedPage.findFirst({
    orderBy: {
      page_number: "desc",
    },
    take: 1,
  });

  let page =
    lastPageScraped?.page_number !== undefined
      ? lastPageScraped.page_number + 1
      : 1;
  let added = await scrape(page);
  while (added >= 20) {
    console.log(`Scraped ${added} projects.`);
    ++page;

    console.log(`Scraping page ${page}`);
    if (
      (await db.scrapedPage.count({
        where: {
          page_number: page,
        },
      })) === 0
    ) {
      added = await scrape(page);

      await db.scrapedPage.create({
        data: {
          page_number: page,
        },
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

let scraping = false;
function requestScrape() {
  if (!env.SCRAPER_ENABLED || scraping) return false;
  scraping = true;
  startScraping()
    .catch((err) => {
      console.log("Scrape error:", err);
    })
    .finally(() => {
      scraping = false;
    });
  return true;
}

function getState() {
  return scraping ? "scraping" : "idle";
}

export const scraper = {
  requestScrape,
  getState,
};
