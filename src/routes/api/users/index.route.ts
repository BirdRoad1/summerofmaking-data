import express from "express";
import { usersController } from "../../../controllers/api/users/index.controller.js";

export const usersRouter = express.Router();

usersRouter.get("/", usersController.getUsers);


usersRouter.get("/count", usersController.getCount);

usersRouter.get("/:slackId", usersController.getUser);