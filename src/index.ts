import express from "express";
import { APIRouter } from "./routes/api.js";
import { env } from "./env.js";

const app = express();

app.use(
  express.static("web/", {
    extensions: ["html"],
  })
);

app.use('/api', APIRouter);

app.listen(env.PORT, () => {
  console.log(`Listening on http://localhost:${env.PORT}/`);
});
