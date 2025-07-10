import express from "express";
import { ScraperRouter } from "./scraper.route.js";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";
import { apiController } from "../../controllers/api/index.controller.js";
import { projectsRouter } from "./projects/index.routes.js";
import { usersRouter } from "./users/index.route.js";
export const APIRouter = express.Router();

const rateHandler = (req: express.Request, res: express.Response) =>
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

APIRouter.use(
  "/projects",
  rateLimit({
    limit: 10,
    windowMs: 1000,
    handler: rateHandler,
    validate: { trustProxy: !env.REVERSE_PROXY },
  }),
  projectsRouter
);

APIRouter.use(
  "/users",
  rateLimit({
    limit: 10,
    windowMs: 1000,
    handler: rateHandler,
    validate: { trustProxy: !env.REVERSE_PROXY },
  }),
  usersRouter
);

// APIRouter.get(
//   "/projects",
//   rateLimit({
//     limit: 10,
//     windowMs: 1000,
//     handler: rateHandler,
//     validate: { trustProxy: !env.REVERSE_PROXY },
//   }),
//   async (req, res) => {
//     const projects = await db.project.findMany({
//       select: {
//         author: true,
//         description: true,
//         devlogsCount: true,
//         imageUrl: true,
//         minutesSpent: true,
//         name: true,
//         url: true,
//         slackId: true,
//         repoLink: true,
//         demoLink: true,
//         readmeLink: true,
//         projectUpdatedAt: true,
//         projectCreatedAt: true,
//       },
//     });

//     return res.json(projects);
//   }
// );

APIRouter.get(
  "/img",
  rateLimit({
    limit: 50,
    windowMs: 1000,
    handler: rateHandler,
    validate: { trustProxy: !env.REVERSE_PROXY },
  }),
  apiController.getImg
);

APIRouter.use((req, res, next) => {
  res.status(404).json({ error: "Not found" });
});
