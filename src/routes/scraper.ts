import express from "express";
import { scraper } from "../scraper.js";
import { env } from "../env.js";
import { db } from "../db.js";

export const ScraperRouter = express.Router();

ScraperRouter.use((req, res, next) => {
  if (!env.SCRAPER_ENABLED) {
    res.status(400).json({ error: "The scraper is disabled" });
    return;
  }

  next();
});

ScraperRouter.post("/request", async (req, res) => {
  const result = scraper.requestScrape();

  console.log("[scraper] scraper enable requested:", result);

  return res.json({
    status: result,
  });
});

ScraperRouter.post("/reset-pages", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (
    typeof authHeader !== "string" ||
    authHeader !== "Bearer " + env.SECRET_KEY
  ) {
    console.log("[scraper] reset pages failed validation");
    return res.status(404).json({ error: "Not found" });
  }

  const result = await scraper.resetPages();

  console.log("[scraper] reset pages succeeded!");

  return res.json({
    result,
  });
});

ScraperRouter.get("/status", (req, res) => {
  return res.json({
    status: scraper.getState(),
  });
});
