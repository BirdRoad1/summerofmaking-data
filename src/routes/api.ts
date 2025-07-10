import express from "express";
import { db } from "../db.js";
import { ScraperRouter } from "./scraper.js";
import { imageCache } from "../img-cache.js";
import rateLimit from "express-rate-limit";
import { env } from "../env.js";
export const APIRouter = express.Router();

const rateHandler = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) =>
  res
    .status(429)
    .json({ error: "You're doing this too fast! Try again later" });

APIRouter.use(
  "/scraper",
  rateLimit({
    limit: 5,
    windowMs: 1000,
    handler: rateHandler,
    validate: { trustProxy: !env.REVERSE_PROXY },
  }),
  ScraperRouter
);

APIRouter.get(
  "/projects",
  rateLimit({
    limit: 10,
    windowMs: 1000,
    handler: rateHandler,
    validate: { trustProxy: !env.REVERSE_PROXY },
  }),
  async (req, res) => {
    const projects = await db.project.findMany({
      select: {
        author: true,
        description: true,
        devlogsCount: true,
        imageUrl: true,
        minutesSpent: true,
        name: true,
        url: true,
        slackId: true,
      },
    });

    return res.json(projects);
  }
);

APIRouter.get(
  "/img",
  rateLimit({
    limit: 50,
    windowMs: 1000,
    handler: rateHandler,
    validate: { trustProxy: !env.REVERSE_PROXY },
  }),
  async (req, res) => {
    const url = req.query.url;
    if (typeof url !== "string") {
      res.status(400).send("no url!");
      return;
    }

    const allowed = [
      "https://hc-cdn.hel1.your-objectstorage.com/s/v3/",
      "https://summer.hackclub.com/rails/active_storage/",
    ];

    if (
      !allowed.some((allowedUrl) =>
        url.toLowerCase().startsWith(allowedUrl.toLowerCase())
      )
    ) {
      res.status(400).send("host not allowed!");
      return;
    }

    const cachedImg = imageCache.getImage(url);
    if (cachedImg != null) {
      cachedImg.stream.pipeTo(
        new WritableStream({
          start() {
            res.setHeader("content-type", cachedImg.type);
          },
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
        })
      );
      return;
    }

    const proxiedRes = await fetch(url);
    if (proxiedRes.ok && proxiedRes.body) {
      const streams = proxiedRes.body.tee();
      streams[0].pipeTo(
        new WritableStream({
          start() {
            proxiedRes.headers.forEach((v, n) => res.setHeader(n, v));
          },
          write(chunk) {
            res.write(chunk);
          },
          close() {
            res.end();
          },
        })
      );
      imageCache.saveImage(url, streams[1]);
    } else {
      res.status(500).send("no data");
    }
  }
);

APIRouter.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});
