import express from "express";
import { Prisma } from "../../../.generated/client.js";
import { db } from "../../../config/db.js";
import { usersSchema } from "../../../schema/users-schema.js";

const getUsers = async (req: express.Request, res: express.Response) => {
  const parsed = usersSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error,
    });
    return;
  }

  const query = parsed.data;

  let conditions = [];
  if (query.nameOrSlackId) {
    conditions.push(
      Prisma.sql`(LOWER("user"."display_name") LIKE '%' || LOWER(${query.nameOrSlackId}) || '%' OR LOWER("user"."slack_id") LIKE '%' || LOWER(${query.nameOrSlackId}) || '%')`
    );
  }

  let orderClause =
    query.sort === "devlogs"
      ? Prisma.sql`ORDER BY "devlogs"`
      : query.sort === "mins"
      ? Prisma.sql`ORDER BY "seconds"`
      : Prisma.sql`ORDER BY RANDOM()`;

  const limitClause = Prisma.sql`LIMIT ${query.limit}`;

  const whereClause =
    conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
      : Prisma.empty;

  const sql = Prisma.sql`
    SELECT
      "user"."display_name" as "name",
      "user"."slack_id" as "slackId",
      "user"."bio" as "bio",
      "user"."avatar" as avatar,
      COALESCE(SUM("project"."seconds_spent"),0) as "seconds",
      COALESCE(SUM("project"."devlogs_count"), 0) as "devlogs"
    FROM "user"
    LEFT JOIN "project"
      ON "project"."slack_id" = "user"."slack_id"
    ${whereClause}
    GROUP BY "user"."display_name", "user"."slack_id", "user"."bio", "user"."avatar"
    ${orderClause} DESC
    ${limitClause}`;

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

const getUser = async (req: express.Request, res: express.Response) => {
  const { slackId } = req.params;

  const project = await db.user.findFirst({
    where: {
      slackId,
    },
    select: {
      displayName: true,
      slackId: true,
    },
  });

  if (project === null) {
    res.status(404).json({ error: "The project does not exist" });
    return;
  }

  return res.json({ project });
};

export const usersController = Object.freeze({ getUsers, getCount, getUser });
