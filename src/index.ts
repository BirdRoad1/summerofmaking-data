import express from "express";
import { APIRouter } from "./routes/api.js";
import { env } from "./env.js";
import { scheduleScrape, send404 } from "./util.js";

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

app.use(send404);

scheduleScrape();

app.listen(env.PORT, () => {
  console.log(`Listening on http://localhost:${env.PORT}/`);
});
