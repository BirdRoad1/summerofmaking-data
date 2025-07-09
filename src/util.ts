import express from "express";
import path from "path";
import { scraper } from "./scraper.js";
import { env } from "./env.js";

const file404 = path.resolve("./web/404.html");
export function send404(req: express.Request, res: express.Response) {
  res.status(404).sendFile(file404);
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
