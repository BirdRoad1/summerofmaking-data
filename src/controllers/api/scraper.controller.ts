import express from "express";
import { scraper } from "../../scraper/scraper.js";
import { env } from "../../config/env.js";

const checkScraperEnabled = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (!env.SCRAPER_ENABLED) {
    res.status(400).json({ error: "The scraper is disabled" });
    return;
  }

  next();
};

const postRequest = async (req: express.Request, res: express.Response) => {
  const result = scraper.requestScrape();
  console.log("[scraper] scraper enable requested:", req.ip, result);

  return res.json({
    status: result,
  });
};

const postRequestForce = async (
  req: express.Request,
  res: express.Response
) => {
  const authHeader = req.headers["authorization"];
  if (
    typeof authHeader !== "string" ||
    authHeader !== "Bearer " + env.SECRET_KEY
  ) {
    console.log("[scraper] force request pages failed validation", req.ip);
    return res
      .status(403)
      .json({ error: "You are not authorized to do this!" });
  }

  await scraper.resetPages();

  const result = scraper.requestScrape();
  console.log("[scraper] force scrape requested", req.ip, result);

  return res.json({
    status: result,
  });
};

const getStatus = (req: express.Request, res: express.Response) => {
  res.json({
    status: scraper.getState(),
  });
};

export const scraperController = Object.freeze({
  checkScraperEnabled,
  postRequest,
  postRequestForce,
  getStatus,
});
