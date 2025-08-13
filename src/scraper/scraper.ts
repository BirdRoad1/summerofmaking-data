import { parse as parseHTML } from "node-html-parser";
import { db } from "../config/db.js";
import { env } from "../config/env.js";
import { writeFileSync } from "node:fs";

const cookie = env.SOC_COOKIE;
const USER_AGENT =
  "SoM-Data/1.0.0 (+https://summer.hackclub.com/projects/5942; +https://som.jlmsz.com/)";

function request(url: string, options?: RequestInit) {
  options ??= {};
  options.headers ??= {};
  (options.headers as Record<string, string>).cookie = cookie;
  (options.headers as Record<string, string>)["user-agent"] = USER_AGENT;

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

type APIScrapeResult = {
  id: number;
  title: string;
  description: string;
  category: string;
  readme_link: string;
  demo_link: string;
  repo_link: string;
  slack_id: string;
  created_at: string;
  updated_at: string;
};

async function scrapeAPI(url: string): Promise<any> {
  const fullUrl = `https://summer.hackclub.com/api/v1` + url;
  const res = await request(fullUrl);
  if (!res.ok) return null;

  const json = await res.json();
  return json;
}

// scrape task
async function scrapeProject(page: number): Promise<number> {
  try {
    const abortController = new AbortController();
    let timeout = setTimeout(() => {
      abortController.abort("timed out");
    }, 20000);

    let res;
    try {
      res = await request(
        `https://summer.hackclub.com/api/v1/projects?page=${page}`, //`https://summer.hackclub.com/explore.turbo_stream?page=${page}&tab=gallery`,
        {
          signal: abortController.signal,
        }
      );
    } catch (err) {
      let msg = err instanceof Error ? err.message : String(err);
      throw new Error("Failed to make request. Error: " + msg);
    }

    clearTimeout(timeout);

    const json = await res.json();
    const { projects } = json;
    for (const project of projects) {
      const {
        id,
        title,
        description,
        category,
        devlogs_count,
        total_seconds_coded,
        banner,
        created_at,
        updated_at,
        readme_link,
        slack_id,
        demo_link,
        repo_link,
        is_shipped,
      } = project;

      await db.project.upsert({
        where: {
          projectId: id,
        },
        create: {
          projectId: id,
          name: title,
          User: {
            connectOrCreate: {
              where: {
                slackId: slack_id,
              },
              create: {
                slackId: slack_id,
              },
            },
          },
          description,
          devlogsCount: devlogs_count,
          secondsSpent: total_seconds_coded,
          imageUrl: banner,
          readmeLink: readme_link,
          repoLink: repo_link,
          demoLink: demo_link,
          category: category,
          projectCreatedAt: created_at,
          projectUpdatedAt: updated_at,
          shipped: is_shipped,
        },
        update: {
          name: title,
          description,
          devlogsCount: devlogs_count,
          secondsSpent: total_seconds_coded,
          imageUrl: banner,
          readmeLink: readme_link,
          repoLink: repo_link,
          demoLink: demo_link,
          category: category,
          projectCreatedAt: created_at,
          projectUpdatedAt: updated_at,
        },
      });
    }

    // const txt = await res.text();
    // if (!res.ok) {
    //   throw new Error("Invalid status: " + res.status + ", text: " + txt);
    // }

    // const document = parseHTML(txt);
    // const projects = document.querySelectorAll(
    //   "turbo-stream[action=append] > template > a"
    // );

    // if (projects.length === 0) {
    //   throw new Error("No projects found in HTML");
    // }

    // for (const project of projects) {
    //   console.log(
    //     project.querySelector("img.object-cover")?.getAttribute("src")
    //   );
    //   const url = project.getAttribute("href");
    //   const idStr = url?.split("/").pop();
    //   const id = idStr !== undefined ? Number(idStr) : undefined;
    //   const imgUrl = project
    //     .querySelector("img.object-cover")
    //     ?.getAttribute("src");
    //   const name = project.querySelector("h2")?.textContent;
    //   const byLine = project
    //     .querySelector("p.mb-2.line-clamp-3.break-words.overflow-wrap-anywhere")
    //     ?.textContent?.trim()
    //     ?.split("•")
    //     .map((a) => a.trim());
    //   const description = project
    //     .querySelector("p.line-clamp-3.text-sm.overflow-hidden.mb-4")
    //     ?.textContent?.trim();
    //   if (byLine == null || byLine.length < 3) {
    //     console.log("Invalid by line:", byLine, ", url:", url);
    //     continue;
    //   }
    //   let [by, devlogsStr, timeStr] = byLine;
    //   by = by.split("by ")?.[1];
    //   const mins = parseTimeString(timeStr);
    //   const devlogs = Number.parseInt(devlogsStr.split(" ")[0]);

    //   writeFileSync("nice.html", project.outerHTML);
    //   return;

    //   if (id === undefined || Number.isNaN(id)) {
    //     console.log("Invalid id:", id, url, project.outerHTML);
    //     continue;
    //   }

    //   if (Number.isNaN(devlogs)) {
    //     console.log("Invalid devlogs:", devlogs, project.outerHTML);
    //     continue;
    //   }

    //   if (name == null) {
    //     console.log("Missing name", project.outerHTML);
    //     continue;
    //   }
    //   if (description == null) {
    //     console.log("Missing description", project.outerHTML);
    //     continue;
    //   }

    //   if (url == null) {
    //     console.log("Missing url", project.outerHTML);
    //     continue;
    //   }

    //   if (imgUrl == null) {
    //     console.log("Missing imageUrl", project.outerHTML);
    //     continue;
    //   }

    //   const apiScraped: Partial<APIScrapeResult> | null = await scrapeAPI(url);
    //   if (!apiScraped || !apiScraped.slack_id) {
    //     console.log("Missing API data for user:", url);
    //     continue;
    //   }

    //   // const userScraped: Partial<any> | null = await scrapeAPI(url);
    //   // if (!userScraped || !userScraped.slack_id) {
    //   //   console.log("Missing API data for user:", url);
    //   //   continue;
    //   // }

    //   // console.log(userScraped);

    //   await db.project.upsert({
    //     where: {
    //       projectId: id,
    //     },
    //     create: {
    //       projectId: id,
    //       name,
    //       User: {
    //         connectOrCreate: {
    //           where: {
    //             slackId: apiScraped.slack_id,
    //           },
    //           create: {
    //             name: by,
    //             slackId: apiScraped.slack_id,
    //           },
    //         },
    //       },
    //       description,
    //       devlogsCount: Number(devlogs),
    //       minutesSpent: mins,
    //       imageUrl: imgUrl,
    //       readmeLink: apiScraped?.readme_link,
    //       repoLink: apiScraped?.repo_link,
    //       demoLink: apiScraped?.demo_link,
    //       category: apiScraped?.category,
    //       projectCreatedAt: apiScraped?.created_at,
    //       projectUpdatedAt: apiScraped?.updated_at,
    //     },
    //     update: {
    //       name,
    //       User: {
    //         update: {
    //           name: by,
    //         },
    //       },
    //       description,
    //       devlogsCount: Number(devlogs),
    //       minutesSpent: mins,
    //       imageUrl: imgUrl,
    //       readmeLink: apiScraped?.readme_link,
    //       repoLink: apiScraped?.repo_link,
    //       demoLink: apiScraped?.demo_link,
    //       category: apiScraped?.category,
    //       projectCreatedAt: apiScraped?.created_at,
    //       projectUpdatedAt: apiScraped?.updated_at,
    //     },
    //   });

    //   console.log(`Added or updated ${name} to the database!`);
    // }

    return projects.length;
  } catch (err) {
    console.log(`Scrape error on page ${page}:`, err);
    return 0;
  }
}

async function scrapeUser(page: number): Promise<number> {
  try {
    const abortController = new AbortController();
    let timeout = setTimeout(() => {
      abortController.abort("timed out");
    }, 20000);

    let res: Response | undefined;
    let attempts = 0;
    while (attempts++ < 5) {
      try {
        res = await request(
          `https://summer.hackclub.com/api/v1/users?page=${page}`,
          {
            signal: abortController.signal,
          }
        );
        break;
      } catch (err) {
        if (attempts === 4) {
        }

        if (err instanceof Error) {
          if (err.cause instanceof Error) {
            if (err.cause.name === "SocketError") {
              console.log(`Connection error. Retrying ${attempts}/5`);
              continue;
            }
          }
        }

        let msg = err instanceof Error ? err.message : String(err);
        console.log(err);
        throw new Error("Failed to make request. Error: " + msg);
      }
    }

    if (!res) {
      throw new Error("No response");
    }

    clearTimeout(timeout);

    let json;
    try {
      json = await res.json();
    } catch (err) {
      console.error("Failed to parse json. Are you logged in?");
      console.error(err);
    }

    const { users } = json;
    for (const user of users) {
      const { id, slack_id, display_name, bio, badges, avatar } = user;

      await db.user.upsert({
        where: {
          slackId: slack_id,
        },
        create: {
          userId: id,
          avatar,
          bio,
          displayName: display_name,
          slackId: slack_id,
          badges: {
            connectOrCreate: badges.map((badge: any) => {
              return {
                create: {
                  name: badge.name,
                  text: badge.text,
                  icon: badge.icon,
                },
                where: {
                  name: badge.name,
                },
              };
            }),
          },
        },
        update: {
          userId: id,
          avatar,
          bio,
          displayName: display_name,
          badges: {
            connectOrCreate: badges.map((badge: any) => {
              return {
                create: {
                  name: badge.name,
                  text: badge.text,
                  icon: badge.icon,
                },
                where: {
                  name: badge.name,
                },
              };
            }),
          },
        },
      });
    }

    return users.length;
  } catch (err) {
    console.log(`Scrape error on page ${page}:`, err);
    return 0;
  }
}

async function startScrapingProjects(): Promise<void> {
  const lastPageScraped = await db.scrapedPage.findFirst({
    orderBy: {
      pageNumber: "desc",
    },
    where: {
      valid: true,
      endpoint: "projects",
    },
    take: 1,
  });

  let page =
    lastPageScraped?.pageNumber !== undefined
      ? lastPageScraped.pageNumber + 1
      : 1;

  let added = await scrapeProject(page);
  while (added >= 20) {
    console.log(`Scraped ${added} projects.`);
    ++page;

    console.log(`Scraping project page ${page}`);
    added = await scrapeProject(page);

    await db.scrapedPage.create({
      data: {
        pageNumber: page,
        endpoint: "projects",
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

async function startScrapingUsers(): Promise<void> {
  const lastPageScraped = await db.scrapedPage.findFirst({
    orderBy: {
      pageNumber: "desc",
    },
    where: {
      valid: true,
      endpoint: "users",
    },
    take: 1,
  });

  let page =
    lastPageScraped?.pageNumber !== undefined
      ? lastPageScraped.pageNumber + 1
      : 1;
  let added = await scrapeUser(page);
  while (added >= 20) {
    console.log(`Scraped ${added} users.`);
    ++page;

    console.log(`Scraping user page ${page}`);
    added = await scrapeUser(page);

    await db.scrapedPage.create({
      data: {
        pageNumber: page,
        endpoint: "users",
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

let scraping = false;
function requestScrape(): boolean {
  if (!env.SCRAPER_ENABLED || scraping) return false;
  console.log("Start scraping");
  scraping = true;
  startScrapingProjects()
    .catch((err) => {
      console.log("Scrape error:", err);
    })
    .finally(() => {
      scraping = false;
    });
  startScrapingUsers()
    .catch((err) => {
      console.log("Scrape error:", err);
    })
    .finally(() => {
      scraping = false;
    });
  return true;
}

function getState(): "scraping" | "idle" {
  return scraping ? "scraping" : "idle";
}

async function resetPages() {
  return await db.scrapedPage.updateMany({
    where: {
      valid: true,
    },
    data: {
      valid: false,
    },
  });
}

export function scheduleScrape() {
  if (!env.SCRAPER_ENABLED) return;

  let start = Date.now();
  let scrapeInterval = 3 * 60 * 60 * 1000; // 3 hours
  let count = 1;

  setTimeout(async function exec() {
    let nextExecution = start + ++count * scrapeInterval;
    await scraper.resetPages();
    console.log("Requested scheduled scrape: " + scraper.requestScrape());

    setTimeout(exec, Math.max(0, nextExecution - Date.now()));
  }, scrapeInterval);
}

export const scraper = {
  requestScrape,
  getState,
  resetPages,
  scheduleScrape,
};
