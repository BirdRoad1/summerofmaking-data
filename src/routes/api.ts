import express from "express";
import { db } from "../db.js";
import { ScraperRouter } from "./scraper.js";
import { imageCache } from "../img-cache.js";

export const APIRouter = express.Router();

APIRouter.use("/scraper", ScraperRouter);

APIRouter.get("/projects", async (req, res) => {
  const projects = await db.project.findMany({
    select: {
      author: true,
      description: true,
      devlogsCount: true,
      imageUrl: true,
      minutesSpent: true,
      name: true,
      url: true,
    },
  });

  return res.json(projects);
});

APIRouter.get("/img", async (req, res) => {
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
});
