import express from "express";
import { scraper } from "../scraper.js";
import { env } from "../env.js";

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

  return res.json({
    status: result,
  });
});

ScraperRouter.get("/status", (req, res) => {
  return res.json({
    status: scraper.getState(),
  });
});
