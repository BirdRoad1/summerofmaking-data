import express from "express";
import { APIRouter } from "./routes/api/index.route.js";
import { env } from "./config/env.js";
import { scraper } from "./scraper/scraper.js";
import path from "path";

const app = express();

if (env.REVERSE_PROXY) {
  app.set("trust proxy", "127.0.0.1");
  console.log(
    "Warning: REVERSE_PROXY is enabled! Make sure the app is ONLY accessible behind a properly configured reverse proxy!"
  );
}

app.use(
  express.static("web/", {
    extensions: ["html"],
  })
);

app.use("/api", APIRouter);

const file404 = path.resolve("./web/404.html");
app.use((req: express.Request, res: express.Response) => {
  res.status(404).sendFile(file404);
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.log("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
);

app.listen(env.PORT, () => {
  console.log(`Listening on http://localhost:${env.PORT}/`);
  scraper.scheduleScrape();
});
