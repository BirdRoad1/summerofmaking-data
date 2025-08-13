import { Prisma } from "../../../.generated/client.js";
import { db } from "../../../config/db.js";
import { projectsSchema } from "../../../schema/projects-schema.js";
import express from "express";

const getProjects = async (req: express.Request, res: express.Response) => {
  const parsed = projectsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error,
    });
    return;
  }

  const query = parsed.data;

  let conditions = [];

  if (query.author) {
    conditions.push(
      Prisma.sql`(LOWER("user"."display_name") LIKE '%' || LOWER(${query.author}) || '%' OR LOWER("user"."slack_id") LIKE '%' || LOWER(${query.author}) || '%')`
    );
  }

  if (query.nameOrDesc) {
    conditions.push(
      Prisma.sql`(LOWER("project"."name") LIKE '%' || LOWER(${query.nameOrDesc}) || '%' OR LOWER("project"."description") LIKE '%' || LOWER(${query.nameOrDesc}) || '%')`
    );
  }

  let orderClause =
    query.sort === "devlogs"
      ? Prisma.sql`ORDER BY project.devlogs_count`
      : query.sort === "mins"
      ? Prisma.sql`ORDER BY project.seconds_spent`
      : query.sort === "url"
      ? Prisma.sql`ORDER BY project.project_id`
      : Prisma.sql`ORDER BY RANDOM()`;

  const limitClause = Prisma.sql`LIMIT ${query.limit}`;

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  const sql = Prisma.sql`SELECT
      project.name,
      project.project_id as "projectId",
      project.image_url as "imageUrl",
      project.description,
      project.category,
      project.readme_link as "readmeLink",
      project.demo_link as "demoLink",
      project.repo_link as "repoLink",
      project.project_created_at as "projectCreatedAt",
      project.project_updated_at as "projectUpdatedAt",
      project.seconds_spent as "secondsSpent",
      project.devlogs_count as "devlogsCount",
      "user"."display_name" as "authorName",
      "user"."slack_id" as "authorSlackId"
  FROM
      project
      LEFT JOIN "user" ON "project"."slack_id" = "user"."slack_id" ${whereClause} ${orderClause} DESC ${limitClause}`;

  const result = await db.$queryRaw(sql);

  res.json(result);
};

const getCount = async (req: express.Request, res: express.Response) => {
  const aggregate = await db.project.aggregate({
    _sum: {
      secondsSpent: true,
      devlogsCount: true,
    },
    _count: {
      _all: true,
    },
  });
  res.json({
    devlogs: aggregate._sum.devlogsCount,
    projects: aggregate._count._all,
    seconds: aggregate._sum.secondsSpent,
  });
};

const getProject = async (req: express.Request, res: express.Response) => {
  const { projectId: projectIdStr } = req.params;
  const projectId = Number(projectIdStr);
  if (!Number.isFinite(projectId)) {
    res.status(400).json({ error: "Invalid project id" });
    return;
  }

  const project = await db.project.findFirst({
    where: {
      projectId,
    },
    select: {
      projectId: true,
      name: true,
      imageUrl: true,
      description: true,
      category: true,
      readmeLink: true,
      demoLink: true,
      repoLink: true,
      projectCreatedAt: true,
      projectUpdatedAt: true,
      secondsSpent: true,
      devlogsCount: true,
      createdAt: true,
      updatedAt: true,
      slackId: true,
    },
  });

  if (project === null) {
    res.status(404).json({ error: "The project does not exist" });
    return;
  }

  return res.json({ project });
};

export const projectsController = Object.freeze({
  getProjects,
  getCount,
  getProject,
});
