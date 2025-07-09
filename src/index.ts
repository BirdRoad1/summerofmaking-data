import express from "express";
import { db } from "./db";
import { imageCache } from "./img-cache";
import { scraper } from "./scraper";

const app = express();

app.use(
  express.static("web/", {
    extensions: ["html"],
  })
);

app.get("/img", async (req, res) => {
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

  const abc = await fetch(url);
  if (abc.ok && abc.body) {
    const streams = abc.body.tee();
    streams[0].pipeTo(
      new WritableStream({
        start() {
          abc.headers.forEach((v, n) => res.setHeader(n, v));
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

app.get("/projects", async (req, res) => {
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

app.post("/request-update", (req, res) => {
  const scraping = scraper.requestScrape();
  return res.json({
    scraping,
  });
});

app.listen(8000, () => {
  console.log("Listening on port 8000");
});
