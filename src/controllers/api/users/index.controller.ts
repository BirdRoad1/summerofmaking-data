import express from "express";
import { Prisma } from "../../../.generated/client.js";
import { projectsSchema } from "../../../schema/projects-schema.js";
import { db } from "../../../config/db.js";

const getUsers = async (req: express.Request, res: express.Response) => {
  const parsed = projectsSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error,
    });
    return;
  }

  const query = parsed.data;

  let conditions = [];
  if (query.name) {
    conditions.push(
      Prisma.sql`LOWER("user"."name") LIKE '%' || LOWER(${query.name}) || '%'`
    );
  }

  let orderClause =
    query.sort === "devlogs"
      ? Prisma.sql`ORDER BY "devlogs"`
      : query.sort === "mins"
      ? Prisma.sql`ORDER BY "minutes"`
      : Prisma.sql`ORDER BY RANDOM()`;

  const limitClause = Prisma.sql`LIMIT ${query.limit}`;

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  const sql = Prisma.sql`
    SELECT
      "user"."name" as "name",
      "user"."slack_id" as "slackId",
      SUM("project"."minutes_spent") as "minutes",
      SUM("project"."devlogs_count") as "devlogs"
  FROM
      "user"
      LEFT JOIN "project" ON "project"."user_id" = "user"."id" ${whereClause} GROUP BY "user"."name", "user"."slack_id" ${orderClause} DESC ${limitClause}`;

  const result = await db.$queryRaw(sql);

  res.contentType("application/json").send(
    JSON.stringify(result, (k, v) => {
      if (typeof v === "bigint") {
        return Number(v);
      }

      return v;
    })
  );
};

const getCount = async (req: express.Request, res: express.Response) => {
  const aggregate = await db.user.aggregate({
    _count: {
      _all: true,
    },
  });
  res.json({
    users: aggregate._count._all,
  });
};

export const usersController = Object.freeze({ getUsers, getCount });
