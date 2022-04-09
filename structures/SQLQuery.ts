import {Pool, QueryArrayConfig, QueryConfig} from "pg"
import fs from "fs"
import CreateDB from "./CreateDB.sql"
import functions from "./Functions"

const pgPool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(process.env.PG_PORT)
})

export default class SQLQuery {
  /** Run an SQL Query */
  public static run = async (query: QueryConfig | QueryArrayConfig | string) => {
      const pgClient = await pgPool.connect()
      try {
            const result = await pgClient.query(query)
            return result.rows as any
        } catch (error) {
            return Promise.reject(error)
        } finally {
            pgClient.release(true)
        }
  }

  /** Create the Database. */
  public static createDB = async () => {
    return SQLQuery.run(CreateDB)
  }

  /** Create a new post. */
  public static insertPost = async () => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "posts" VALUES (default) RETURNING "postID"`,
      rowMode: "array"
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Updates a post */
  public static updatePost = async (postID: number, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "posts" SET "${column}" = $1 WHERE "postID" = $2`,
        values: [value, postID]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new image. */
  public static insertImage = async (postID: number) => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "images" ("postID") VALUES ($1) RETURNING "imageID"`,
      rowMode: "array",
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Updates an image */
  public static updateImage = async (imageID: number, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "images" SET "${column}" = $1 WHERE "imageID" = $2`,
        values: [value, imageID]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new tag. */
  public static insertTag = async (tag: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "tags" ("tag") VALUES ($1)`,
      values: [tag]
    }
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Update a tag. */
  public static updateTag = async (tag: string, column: string, value: string) => {
    const query: QueryConfig = {
      text: `UPDATE "tags" SET "${column}" = $1 WHERE "tag" = $2`,
      values: [value, tag]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new tag map. */
  public static insertTagMap = async (postID: number, tag: string) => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "tag map" ("postID", "tag") VALUES ($1, $2)`,
      rowMode: "array",
      values: [postID, tag]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /*
            WITH image_tags AS (
              SELECT images."post id", json_build_object (
                      'imageID', images."image id",
                      'type', images."type",
                      'style', images."style",
                      'order', images."order",
                      'cuteness', images."cuteness",
                      'thirdParty', images."third party",
                      'drawn', images."drawn",
                      'uploaded', images."uploaded",
                      'hash', images."hash",
                      'filename', images."filename",
                      'title', images."title",
                      'artist', images."artist",
                      'link', images."link",
                      'commentary', images."commentary",
                      'tags', json_agg("tag map".tag)
                    ) AS image,
                    first_value(images."uploaded") OVER (PARTITION BY images."post id" ORDER BY images."uploaded" DESC, images."order" DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS date,
                    first_value(images."drawn") OVER (PARTITION BY images."post id" ORDER BY images."drawn" DESC, images."order" DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS drawn,
                    first_value(images."cuteness") OVER (PARTITION BY images."post id" ORDER BY images."cuteness" DESC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS cuteness
              FROM images
              JOIN "tag map" ON images."image id" = "tag map"."image id"
              ${whereQueries ? `WHERE ${whereQueries}` : ""}
              GROUP BY images."post id", images."image id"
              ORDER BY images."order" DESC
          )
          SELECT posts."post id" AS "postID", json_agg(image_tags.image) AS images 
          FROM posts
          JOIN image_tags ON posts."post id" = image_tags."post id"
          GROUP BY posts."post id", image_tags.date, image_tags.drawn, image_tags.cuteness
          ${sortQuery}
          LIMIT 100
   */

  /** Search posts. */
  public static search = async (tags: string[], type: string, restrict: string, style: string, sort: string) => {
    let typeQuery = ""
    if (type === "image") typeQuery = `posts.type = 'image'`
    if (type === "animation") typeQuery = `posts.type = 'animation'`
    if (type === "video") typeQuery = `posts.type = 'video'`
    if (type === "comic") typeQuery = `posts.type = 'comic'`
    let restrictQuery = ""
    if (restrict === "safe") restrictQuery = `posts.restrict = 'safe'`
    if (restrict === "questionable") restrictQuery = `posts.restrict = 'questionable'`
    if (restrict === "explicit") restrictQuery = `posts.restrict = 'explicit'`
    let styleQuery = ""
    if (style === "2d") styleQuery = `lower(posts.style) = '2d'`
    if (style === "3d") styleQuery = `lower(posts.style) = '3d'`
    if (style === "pixel") styleQuery = `posts.style = 'pixel'`
    if (style === "chibi") styleQuery = `posts.style = 'chibi'`
    let sortQuery = ""
    if (sort === "date") sortQuery = `ORDER BY posts.updated DESC`
    if (sort === "reverse date") sortQuery = `ORDER BY posts.updated ASC`
    if (sort === "drawn") sortQuery = `ORDER BY posts.drawn DESC`
    if (sort === "reverse drawn") sortQuery = `ORDER BY posts.drawn ASC`
    if (sort === "cuteness") sortQuery = `ORDER BY posts.cuteness DESC`
    if (sort === "reverse cuteness") sortQuery = `ORDER BY posts.cuteness ASC`
    let ANDtags = [] as string[]
    let ORtags = [] as string[]
    let NOTtags = [] as string[]
    tags.forEach((tag) => {
      if (tag.startsWith("+")) {
        ORtags.push(tag.replace("+", ""))
      } else if (tag.startsWith("-")) {
        NOTtags.push(tag.replace("-", ""))
      } else {
        ANDtags.push(tag)
      }
    })
    let i = 1
    let values = [] as any
    let tagQueryArray = [] as any
    if (ANDtags.length) {
      values.push(ANDtags)
      tagQueryArray.push(`tags @> $${i}`)
      i++ 
    }
    if (ORtags.length) {
      values.push(ORtags)
      tagQueryArray.push(`tags && $${i}`)
      i++ 
    }
    if (NOTtags.length) {
      values.push(NOTtags)
      tagQueryArray.push(`NOT tags @> $${i}`)
    }
    let tagQuery = tagQueryArray.length ? "WHERE " + tagQueryArray.join(" AND ") : ""
    const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT *
        FROM (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, array_agg(DISTINCT "tag map".tag) AS tags
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          ${whereQueries ? `WHERE ${whereQueries}` : ""}
          GROUP BY posts."postID"
          ${sortQuery}
          LIMIT 100
        ) AS posts
        ${tagQuery}
      `)
    }
    if (values?.[0]) query.values = values
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get post. */
  public static post = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          WHERE posts."postID" = $1
          GROUP BY posts."postID"
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  public static tagCounts = async (tags: string[]) => {
    let whereQuery = tags?.[0] ? `WHERE "tag map".tag = ANY ($1)` : ""
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT "tag map".tag, COUNT(*) AS count
                  FROM "tag map"
                  ${whereQuery}
                  GROUP BY "tag map".tag
                  ORDER BY count DESC
          `),
          values: [tags]
    }
    const result = await SQLQuery.run(query)
    return result
  }
}