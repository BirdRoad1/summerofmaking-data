import express from "express";
import path from "path";

const file404 = path.resolve("./web/404.html");
export function send404(
  req: express.Request,
  res: express.Response,
) {
  res.status(404).sendFile(file404);
}
