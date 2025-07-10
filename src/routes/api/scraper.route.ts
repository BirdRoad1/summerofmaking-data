import express from "express";
import { scraperController } from "../../controllers/api/scraper.controller.js";

export const ScraperRouter = express.Router();

ScraperRouter.use(scraperController.checkScraperEnabled);

ScraperRouter.post("/request", scraperController.postRequest);

ScraperRouter.post("/request-force", scraperController.postRequestForce);

ScraperRouter.get("/status", scraperController.getStatus);
