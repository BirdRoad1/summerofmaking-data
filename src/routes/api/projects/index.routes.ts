import express from "express";
import { projectsController } from "../../../controllers/api/projects/index.controller.js";

export const projectsRouter = express.Router();

projectsRouter.get("/", projectsController.getProjects);

projectsRouter.get("/count", projectsController.getCount);
