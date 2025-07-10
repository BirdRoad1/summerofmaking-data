import express from "express";
import { imageCache } from "../../scraper/img-cache.js";

const getImg = async (req: express.Request, res: express.Response) => {
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
};

export const apiController = Object.freeze({ getImg });
