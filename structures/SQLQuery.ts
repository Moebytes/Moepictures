import {Pool, QueryArrayConfig, QueryConfig} from "pg"
import fs from "fs"
import CreateDB from "./CreateDB.sql"
import functions from "./Functions"

const pgPool = functions.isLocalHost() ? new Pool({
  user: process.env.PG_LOCAL_USER,
  host: process.env.PG_LOCAL_HOST,
  database: process.env.PG_LOCAL_DATABASE,
  password: process.env.PG_LOCAL_PASSWORD,
  port: Number(process.env.PG_LOCAL_PORT)
}) : new Pool({
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

  /** Create a new post (unverified). */
  public static insertUnverifiedPost = async () => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "unverified posts" VALUES (default) RETURNING "postID"`,
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

  /** Bulk updates a post */
  public static bulkUpdatePost = async (postID: number, params: {restrict?: string, style?: string, thirdParty?: boolean, title?: string, translatedTitle?: string,
    artist?: string, drawn?: string, link?: string, commentary?: string, translatedCommentary?: string, bookmarks?: string, mirrors?: string, type?: string, uploadDate?: string, uploader?: string, updatedDate?: string, updater?: string}) => {
    const {restrict, style, thirdParty, title, translatedTitle, artist, drawn, link, commentary, translatedCommentary, bookmarks, mirrors, type, uploadDate, uploader, updatedDate, updater} = params
    let setArray = [] as any
    let values = [] as any
    let i = 1 
    if (restrict) {
      setArray.push(`"restrict" = $${i}`)
      values.push(restrict)
      i++
    }
    if (style) {
      setArray.push(`"style" = $${i}`)
      values.push(style)
      i++
    }
    if (thirdParty) {
      setArray.push(`"thirdParty" = $${i}`)
      values.push(thirdParty)
      i++
    }
    if (title) {
      setArray.push(`"title" = $${i}`)
      values.push(title)
      i++
    }
    if (translatedTitle) {
      setArray.push(`"translatedTitle" = $${i}`)
      values.push(translatedTitle)
      i++
    }
    if (artist) {
      setArray.push(`"artist" = $${i}`)
      values.push(artist)
      i++
    }
    if (drawn) {
      setArray.push(`"drawn" = $${i}`)
      values.push(drawn)
      i++
    }
    if (link) {
      setArray.push(`"link" = $${i}`)
      values.push(link)
      i++
    }
    if (commentary) {
      setArray.push(`"commentary" = $${i}`)
      values.push(commentary)
      i++
    }
    if (translatedCommentary) {
      setArray.push(`"translatedCommentary" = $${i}`)
      values.push(translatedCommentary)
      i++
    }
    if (bookmarks) {
      setArray.push(`"bookmarks" = $${i}`)
      values.push(bookmarks)
      i++
    }
    if (mirrors) {
      setArray.push(`"mirrors" = $${i}`)
      values.push(mirrors)
      i++
    }
    if (type) {
      setArray.push(`"type" = $${i}`)
      values.push(type)
      i++
    }
    if (uploadDate) {
      setArray.push(`"uploadDate" = $${i}`)
      values.push(uploadDate)
      i++
    }
    if (uploader) {
      setArray.push(`"uploader" = $${i}`)
      values.push(uploader)
      i++
    }
    if (updatedDate) {
      setArray.push(`"updatedDate" = $${i}`)
      values.push(updatedDate)
      i++
    }
    if (updater) {
      setArray.push(`"updater" = $${i}`)
      values.push(updater)
      i++
    }
    let setQuery = `SET ${setArray.join(", ")}`
    const query: QueryConfig = {
        text: `UPDATE "posts" ${setQuery} WHERE "postID" = $${i}`,
        values: [...values, postID]
    }
    return SQLQuery.run(query)
  }

  /** Bulk updates a post (unverified). */
  public static bulkUpdateUnverifiedPost = async (postID: number, params: {restrict?: string, style?: string, thirdParty?: boolean, title?: string, translatedTitle?: string,
    artist?: string, drawn?: string, link?: string, commentary?: string, translatedCommentary?: string, bookmarks?: string, mirrors?: string, type?: string, uploadDate?: string, uploader?: string, updatedDate?: string, updater?: string
  duplicates?: boolean, newTags?: number, originalID?: number, reason?: string}) => {
    const {restrict, style, thirdParty, title, translatedTitle, artist, drawn, link, commentary, translatedCommentary, bookmarks, mirrors, type, uploadDate, uploader, updatedDate, updater, duplicates, originalID, newTags, reason} = params
    let setArray = [] as any
    let values = [] as any
    let i = 1 
    if (restrict) {
      setArray.push(`"restrict" = $${i}`)
      values.push(restrict)
      i++
    }
    if (style) {
      setArray.push(`"style" = $${i}`)
      values.push(style)
      i++
    }
    if (thirdParty) {
      setArray.push(`"thirdParty" = $${i}`)
      values.push(thirdParty)
      i++
    }
    if (title) {
      setArray.push(`"title" = $${i}`)
      values.push(title)
      i++
    }
    if (translatedTitle) {
      setArray.push(`"translatedTitle" = $${i}`)
      values.push(translatedTitle)
      i++
    }
    if (artist) {
      setArray.push(`"artist" = $${i}`)
      values.push(artist)
      i++
    }
    if (drawn) {
      setArray.push(`"drawn" = $${i}`)
      values.push(drawn)
      i++
    }
    if (link) {
      setArray.push(`"link" = $${i}`)
      values.push(link)
      i++
    }
    if (commentary) {
      setArray.push(`"commentary" = $${i}`)
      values.push(commentary)
      i++
    }
    if (translatedCommentary) {
      setArray.push(`"translatedCommentary" = $${i}`)
      values.push(translatedCommentary)
      i++
    }
    if (bookmarks) {
      setArray.push(`"bookmarks" = $${i}`)
      values.push(bookmarks)
      i++
    }
    if (mirrors) {
      setArray.push(`"mirrors" = $${i}`)
      values.push(mirrors)
      i++
    }
    if (type) {
      setArray.push(`"type" = $${i}`)
      values.push(type)
      i++
    }
    if (uploadDate) {
      setArray.push(`"uploadDate" = $${i}`)
      values.push(uploadDate)
      i++
    }
    if (uploader) {
      setArray.push(`"uploader" = $${i}`)
      values.push(uploader)
      i++
    }
    if (updatedDate) {
      setArray.push(`"updatedDate" = $${i}`)
      values.push(updatedDate)
      i++
    }
    if (updater) {
      setArray.push(`"updater" = $${i}`)
      values.push(updater)
      i++
    }
    if (duplicates) {
      setArray.push(`"duplicates" = $${i}`)
      values.push(duplicates)
      i++
    }
    if (newTags) {
      setArray.push(`"newTags" = $${i}`)
      values.push(newTags)
      i++
    }
    if (originalID) {
      setArray.push(`"originalID" = $${i}`)
      values.push(originalID)
      i++
    }
    if (reason) {
      setArray.push(`"reason" = $${i}`)
      values.push(reason)
      i++
    }
    let setQuery = `SET ${setArray.join(", ")}`
    const query: QueryConfig = {
        text: `UPDATE "unverified posts" ${setQuery} WHERE "postID" = $${i}`,
        values: [...values, postID]
    }
    return SQLQuery.run(query)
  }

  /** Updates a post (unverified) */
  public static updateUnverifiedPost = async (postID: number, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "unverified posts" SET "${column}" = $1 WHERE "postID" = $2`,
        values: [value, postID]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new image. */
  public static insertImage = async (postID: number, filename: string, type: string, order: number, hash: string, width: string, height: string, size: number) => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "images" ("postID", "filename", "type", "order", "hash", "width", "height", "size") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "imageID"`,
      rowMode: "array",
      values: [postID, filename, type, order, hash, width, height, size]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Insert a new image (unverified). */
  public static insertUnverifiedImage = async (postID: number, filename: string, type: string, order: number, hash: string, width: string, height: string, size: string) => {
    const query: QueryArrayConfig = {
      text: `INSERT INTO "unverified images" ("postID", "filename", "type", "order", "hash", "width", "height", "size") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING "imageID"`,
      rowMode: "array",
      values: [postID, filename, type, order, hash, width, height, size]
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

  /** Updates an image (unverified) */
  public static updateUnverifiedImage = async (imageID: number, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "unverified images" SET "${column}" = $1 WHERE "imageID" = $2`,
        values: [value, imageID]
    }
    return SQLQuery.run(query)
  }

  /** Delete an image. */
  public static deleteImage = async (imageID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM images WHERE images."imageID" = $1`),
      values: [imageID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete an image (unverified). */
  public static deleteUnverifiedImage = async (imageID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM "unverified images" WHERE "unverified images"."imageID" = $1`),
      values: [imageID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert a new tag. */
  public static insertTag = async (tag: string, type?: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "tags" ("tag"${type ? `, "type"` : ""}) VALUES ($1${type ? `, $2` : ""})`,
      values: [tag]
    }
    if (type) query.values?.push(type)
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Bulk insert new tags. */
  public static bulkInsertTags = async (bulkTags: any[], noImageUpdate?: boolean) => {
    let tagValues = [] as any
    let rawValues = [] as any
    let valueArray = [] as any 
    let i = 1 
    for (let j = 0; j < bulkTags.length; j++) {
      if (tagValues.includes(bulkTags[j].tag)) continue
      tagValues.push(bulkTags[j].tag)
      valueArray.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`)
      rawValues.push(bulkTags[j].tag)
      rawValues.push(bulkTags[j].type)
      rawValues.push(bulkTags[j].description)
      rawValues.push(bulkTags[j].image)
      i += 4
    }
    let valueQuery = `VALUES ${valueArray.join(", ")}`
    const query: QueryConfig = {
      text: `INSERT INTO "tags" ("tag", "type", "description", "image") ${valueQuery} 
             ON CONFLICT ("tag") DO UPDATE SET "type" = EXCLUDED."type"${noImageUpdate ? "" : ", \"image\" = EXCLUDED.\"image\""}`,
      values: [...rawValues]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new tag (unverified). */
  public static insertUnverifiedTag = async (tag: string, type?: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "unverified tags" ("tag"${type ? `, "type"` : ""}) VALUES ($1${type ? `, $2` : ""})`,
      values: [tag]
    }
    if (type) query.values?.push(type)
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Bulk insert new tags (unverified). */
  public static bulkInsertUnverifiedTags = async (bulkTags: any[], noImageUpdate?: boolean) => {
    let tagValues = [] as any
    let rawValues = [] as any
    let valueArray = [] as any 
    let i = 1 
    for (let j = 0; j < bulkTags.length; j++) {
      if (tagValues.includes(bulkTags[j].tag)) continue
      tagValues.push(bulkTags[j].tag)
      valueArray.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`)
      rawValues.push(bulkTags[j].tag)
      rawValues.push(bulkTags[j].type)
      rawValues.push(bulkTags[j].description)
      rawValues.push(bulkTags[j].image)
      i += 4
    }
    let valueQuery = `VALUES ${valueArray.join(", ")}`
    const query: QueryConfig = {
      text: `INSERT INTO "unverified tags" ("tag", "type", "description", "image") ${valueQuery} 
             ON CONFLICT ("tag") DO UPDATE SET "type" = EXCLUDED."type"${noImageUpdate ? "" : ", \"image\" = EXCLUDED.\"image\""}`,
      values: [...rawValues]
    }
    return SQLQuery.run(query)
  }

  /** Update a tag. */
  public static updateTag = async (tag: string, column: string, value: string) => {
    const query: QueryConfig = {
      text: `UPDATE "tags" SET "${column}" = $1 WHERE "tag" = $2`,
      values: [value, tag]
    }
    return SQLQuery.run(query)
  }

  /** Update a tag (unverified). */
  public static updateUnverifiedTag = async (tag: string, column: string, value: string) => {
    const query: QueryConfig = {
      text: `UPDATE "unverified tags" SET "${column}" = $1 WHERE "tag" = $2`,
      values: [value, tag]
    }
    return SQLQuery.run(query)
  }

  /** Insert a new tag map. */
  public static insertTagMap = async (postID: number, tags: string[]) => {
    let i = 2
    let valueArray = [] as any
    for (let j = 0; j < tags.length; j++) {
      valueArray.push(`($1, $${i})`)
      i++
    }
    let valueQuery = `VALUES ${valueArray.join(", ")}`
    const query: QueryArrayConfig = {
      text: `INSERT INTO "tag map" ("postID", "tag") ${valueQuery}`,
      rowMode: "array",
      values: [postID, ...tags]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Insert a new tag map (unverified). */
  public static insertUnverifiedTagMap = async (postID: number, tags: string[]) => {
    let i = 2
    let valueArray = [] as any
    for (let j = 0; j < tags.length; j++) {
      valueArray.push(`($1, $${i})`)
      i++
    }
    let valueQuery = `VALUES ${valueArray.join(", ")}`
    const query: QueryArrayConfig = {
      text: `INSERT INTO "unverified tag map" ("postID", "tag") ${valueQuery}`,
      rowMode: "array",
      values: [postID, ...tags]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity)[0] as number
  }

  /** Search posts. */
  public static search = async (tags: string[], type: string, restrict: string, style: string, sort: string, offset?: string, limit?: string, withTags?: boolean) => {
    let typeQuery = ""
    if (type === "image") typeQuery = `posts.type = 'image'`
    if (type === "animation") typeQuery = `posts.type = 'animation'`
    if (type === "video") typeQuery = `posts.type = 'video'`
    if (type === "comic") typeQuery = `posts.type = 'comic'`
    if (type === "audio") typeQuery = `posts.type = 'audio'`
    if (type === "model") typeQuery = `posts.type = 'model'`
    let restrictQuery = ""
    if (restrict === "safe") restrictQuery = `posts.restrict = 'safe'`
    if (restrict === "questionable") restrictQuery = `posts.restrict = 'questionable'`
    if (restrict === "explicit") restrictQuery = `posts.restrict = 'explicit'`
    if (restrict === "all") restrictQuery = `(posts.restrict = 'safe' OR posts.restrict = 'questionable')`
    let styleQuery = ""
    if (style === "2d") styleQuery = `lower(posts.style) = '2d'`
    if (style === "3d") styleQuery = `lower(posts.style) = '3d'`
    if (style === "pixel") styleQuery = `posts.style = 'pixel'`
    if (style === "chibi") styleQuery = `posts.style = 'chibi'`
    let sortQuery = ""
    if (sort === "date") sortQuery = `ORDER BY posts."uploadDate" DESC`
    if (sort === "reverse date") sortQuery = `ORDER BY posts."uploadDate" ASC`
    if (sort === "drawn") sortQuery = `ORDER BY posts.drawn DESC NULLS LAST`
    if (sort === "reverse drawn") sortQuery = `ORDER BY posts.drawn ASC NULLS LAST`
    if (sort === "cuteness") sortQuery = `ORDER BY "cutenessAvg" DESC`
    if (sort === "reverse cuteness") sortQuery = `ORDER BY "cutenessAvg" ASC`
    if (sort === "tagcount") sortQuery = `ORDER BY "tagCount" DESC`
    if (sort === "reverse tagcount") sortQuery = `ORDER BY "tagCount" ASC`
    if (sort === "filesize") sortQuery = `ORDER BY "imageSize" DESC`
    if (sort === "reverse filesize") sortQuery = `ORDER BY "imageSize" ASC`
    if (sort === "bookmarks") sortQuery = `ORDER BY posts.bookmarks DESC NULLS LAST`
    if (sort === "reverse bookmarks") sortQuery = `ORDER BY posts.bookmarks ASC NULLS LAST`
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
      i++
    }
    let limitValue = i
    if (limit) {
      values.push(limit)
      i++
    }
    if (offset) values.push(offset)
    let tagQuery = tagQueryArray.length ? "WHERE " + tagQueryArray.join(" AND ") : ""
    const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
    let includeTags = withTags || tagQuery
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT *,
        COUNT(*) OVER() AS "postCount"
        FROM (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, ${includeTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ${includeTags ? `COUNT(DISTINCT "tag map"."tagID") AS "tagCount",` : ""}
          MAX(DISTINCT images."size") AS "imageSize",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          ${whereQueries ? `WHERE ${whereQueries}` : ""}
          GROUP BY posts."postID"
          ${sortQuery}
        ) AS posts
        ${tagQuery}
        ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
      `)
    }
    if (values?.[0]) query.values = values
    const result = await SQLQuery.run(query)
    return result
  }

  /** Search pixiv id. */
  public static searchPixivID = async (pixivID: number, withTags?: boolean) => {
    const pixivURL = `https://www.pixiv.net/en/artworks/${pixivID}`
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT *,
        COUNT(*) OVER() AS "postCount"
        FROM (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, ${withTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          ${withTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          WHERE posts."link" = $1
          GROUP BY posts."postID"
        ) AS posts
        LIMIT 1
      `),
      values: [pixivURL]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get posts. */
  public static posts = async (postIDs?: number[]) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags,
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          ${postIDs ? "WHERE posts.\"postID\" = ANY ($1)" : ""}
          GROUP BY posts."postID"
          `)
    }
    if (postIDs) query.values = [postIDs]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get posts (unverified). */
  public static unverifiedPosts = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, json_agg(DISTINCT "unverified tag map".tag) AS tags
          FROM "unverified posts"
          JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
          JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
          WHERE "originalID" IS NULL
          GROUP BY "unverified posts"."postID"
          ORDER BY "unverified posts"."uploadDate" ASC
          LIMIT 100 ${offset ? `OFFSET $1` : ""}
          `)
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

   /** Get post edits (unverified). */
   public static unverifiedPostEdits = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, json_agg(DISTINCT "unverified tag map".tag) AS tags
          FROM "unverified posts"
          JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
          JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
          WHERE "originalID" IS NOT NULL
          GROUP BY "unverified posts"."postID"
          ORDER BY "unverified posts"."uploadDate" ASC
          LIMIT 100 ${offset ? `OFFSET $1` : ""}
          `)
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get post. */
  public static post = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags,
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          WHERE posts."postID" = $1
          GROUP BY posts."postID"
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get post (unverified). */
  public static unverifiedPost = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, json_agg(DISTINCT "unverified tag map".tag) AS tags
          FROM "unverified posts"
          JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
          JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
          WHERE "unverified posts"."postID" = $1
          GROUP BY "unverified posts"."postID"
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get post tags. */
  public static postTags = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT json_agg(json_build_object('tag', "tags".tag, 'type', "tags".type, 'image', "tags".image, 'pixiv', "tags".pixiv, 'twitter', "tags".twitter)) AS tags
          FROM "tag map"
          JOIN tags ON "tag map".tag = "tags".tag
          WHERE "tag map"."postID" = $1
          GROUP BY "tag map"."postID"
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete post. */
  public static deletePost = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM posts WHERE posts."postID" = $1`),
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete post (unverified). */
  public static deleteUnverifiedPost = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM "unverified posts" WHERE "unverified posts"."postID" = $1`),
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get uploads. */
  public static uploads = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          JOIN "tag map" ON posts."postID" = "tag map"."postID"
          WHERE posts."uploader" = $1
          GROUP BY posts."postID"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static tags = async (tags: string[]) => {
    let whereQuery = tags?.[0] ? `WHERE "tags".tag = ANY ($1)` : ""
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT "implication map".*) AS implications
                  FROM tags
                  FULL JOIN aliases ON aliases."tag" = tags."tag"
                  FULL JOIN "implication map" ON "implication map"."tag" = tags."tag"
                  ${whereQuery}
                  GROUP BY "tags".tag
          `)
    }
    if (tags?.[0]) query.values = [tags]
    const result = await SQLQuery.run(query)
    return result
  }

  public static unverifiedTags = async (tags: string[]) => {
    let whereQuery = tags?.[0] ? `WHERE "unverified tags".tag = ANY ($1)` : ""
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT "unverified tags".*, json_agg(DISTINCT "unverified aliases".*) AS aliases, json_agg(DISTINCT "implication map".*) AS implications
                  FROM "unverified tags"
                  FULL JOIN "unverified aliases" ON "unverified aliases"."tag" = "unverified tags"."tag"
                  FULL JOIN "implication map" ON "implication map"."tag" = "unverified tags"."tag"
                  ${whereQuery}
                  GROUP BY "unverified tags".tag
          `)
    }
    if (tags?.[0]) query.values = [tags]
    const result = await SQLQuery.run(query)
    return result
  }

  public static tag = async (tag: string) => {
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT "implication map".*) AS implications
                  FROM tags
                  FULL JOIN aliases ON aliases."tag" = tags."tag"
                  FULL JOIN "implication map" ON "implication map"."tag" = tags."tag"
                  WHERE "tags".tag = $1
                  GROUP BY "tags".tag
          `),
          values: [tag]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  public static tagCounts = async (tags: string[]) => {
    let whereQuery = tags?.[0] ? `WHERE "tag map".tag = ANY ($1)` : ""
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT "tag map".tag, "tags".type, "tags".image, COUNT(*) AS count
                  FROM "tag map"
                  LEFT JOIN tags ON tags."tag" = "tag map".tag
                  ${whereQuery}
                  GROUP BY "tag map".tag, "tags".type, "tags".image
                  ORDER BY count DESC
          `)
    }
    if (tags?.[0]) query.values = [tags]
    const result = await SQLQuery.run(query)
    return result
  }

  public static relatedTags = async (tag: string) => {
    const query: QueryConfig = {
          text: functions.multiTrim(`
              SELECT json_agg(DISTINCT "implication map".tag) AS related FROM "implication map"
              WHERE "implication map".implication = $1
              GROUP BY "implication map"."implication"
          `),
          values: [tag]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  public static random = async (type: string, restrict: string, style: string, offset?: string, withTags?: boolean) => {
    let typeQuery = ""
    if (type === "image") typeQuery = `posts.type = 'image'`
    if (type === "animation") typeQuery = `posts.type = 'animation'`
    if (type === "video") typeQuery = `posts.type = 'video'`
    if (type === "comic") typeQuery = `posts.type = 'comic'`
    if (type === "audio") typeQuery = `posts.type = 'audio'`
    if (type === "model") typeQuery = `posts.type = 'model'`
    let restrictQuery = ""
    if (restrict === "safe") restrictQuery = `posts.restrict = 'safe'`
    if (restrict === "questionable") restrictQuery = `posts.restrict = 'questionable'`
    if (restrict === "explicit") restrictQuery = `posts.restrict = 'explicit'`
    if (restrict === "all") restrictQuery = `(posts.restrict = 'safe' OR posts.restrict = 'questionable')`
    let styleQuery = ""
    if (style === "2d") styleQuery = `lower(posts.style) = '2d'`
    if (style === "3d") styleQuery = `lower(posts.style) = '3d'`
    if (style === "pixel") styleQuery = `posts.style = 'pixel'`
    if (style === "chibi") styleQuery = `posts.style = 'chibi'`
    const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT *, 
        COUNT(*) OVER() AS "postCount"
        FROM (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, ${withTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
          FROM posts
          JOIN images ON posts."postID" = images."postID"
          ${withTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          ${whereQueries ? `WHERE ${whereQueries}` : ""}
          GROUP BY posts."postID"
          ORDER BY random()
        ) AS posts
        LIMIT 100 ${offset ? `OFFSET $1` : ""}
      `)
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  public static tagCategory = async (category: string, sort: string, search?: string, offset?: string, withTags?: boolean) => {
    let whereQueries = [] as string[]
    if (category === "artists") whereQueries.push(`tags.type = 'artist'`)
    if (category === "characters") whereQueries.push(`tags.type = 'character'`)
    if (category === "series") whereQueries.push(`tags.type = 'series'`)
    if (category === "tags") whereQueries.push(`tags.type = 'tag'`)
    let i = 1
    if (search) {
      whereQueries.push(`tags.tag LIKE $${i} || '%'`)
      i++
    }
    let whereQuery = whereQueries.length ? `AND ${whereQueries.join(" AND ")}` : ""
    let sortQuery = ""
    if (sort === "cuteness") sortQuery = `ORDER BY "cutenessAvg" DESC`
    if (sort === "reverse cuteness") sortQuery = `ORDER BY "cutenessAvg" ASC`
    if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
    if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
    if (sort === "alphabetic") sortQuery = `ORDER BY tags.tag ASC`
    if (sort === "reverse alphabetic") sortQuery = `ORDER BY tags.tag DESC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    GROUP BY posts."postID"
                  )
                  SELECT tags.*, json_agg(post_json.*) AS posts, 
                  COUNT(DISTINCT post_json."postID") AS "postCount",
                  ROUND(AVG(DISTINCT post_json."cutenessAvg")) AS "cutenessAvg"
                  FROM tags
                  JOIN "tag map" ON "tag map"."tag" = tags."tag" ${whereQuery}
                  JOIN post_json ON post_json."postID" = "tag map"."postID"
                  GROUP BY "tags".tag
                  ${sortQuery}
                  LIMIT 10 ${offset ? `OFFSET $${i}` : ""}
          `),
          values: []
    }
    if (search) query.values?.push(search)
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }

  public static tagSearch = async (search: string, sort: string, type?: string, offset?: string) => {
    let whereArray = [] as string[]
    let i = 1
    if (search) {
      whereArray.push( 
    `(tags.tag LIKE '%' || $${i} || '%'
    OR EXISTS (
      SELECT 1 
      FROM aliases
      WHERE aliases.tag = "tags".tag 
      AND aliases.alias LIKE '%' || $1 || '%'
    ))`)
      i++
    }
    if (type === "all") type = undefined
    if (type) {
      whereArray.push(`tags.type = $${i}`)
      i++
    }
    let whereQuery = whereArray.length ? `AND ${whereArray.join(" AND ")}` : ""
    let sortQuery = ""
    if (sort === "alphabetic") sortQuery = `ORDER BY tags.tag ASC`
    if (sort === "reverse alphabetic") sortQuery = `ORDER BY tags.tag DESC`
    if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
    if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
    if (sort === "image") sortQuery = `ORDER BY "imageCount" DESC`
    if (sort === "reverse image") sortQuery = `ORDER BY "imageCount" ASC`
    if (sort === "aliases") sortQuery = `ORDER BY "aliasCount" DESC`
    if (sort === "reverse aliases") sortQuery = `ORDER BY "aliasCount" ASC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT "implication map".*) AS implications,
                  COUNT(DISTINCT posts."postID") AS "postCount", 
                  COUNT(DISTINCT tags."image") AS "imageCount", 
                  COUNT(DISTINCT aliases."alias") AS "aliasCount"
                  FROM tags
                  FULL JOIN aliases ON aliases."tag" = tags."tag"
                  FULL JOIN "implication map" ON "implication map"."tag" = tags."tag"
                  JOIN "tag map" ON "tag map"."tag" = tags."tag" ${whereQuery}
                  JOIN posts ON posts."postID" = "tag map"."postID"
                  GROUP BY "tags".tag
                  ${sortQuery}
                  LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
          `),
          values: []
    }
    if (search) query.values?.push(search)
    if (type) query.values?.push(type)
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete tag. */
  public static deleteTag = async (tag: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM tags WHERE tags."tag" = $1`),
      values: [tag]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete tag (unverified). */
  public static deleteUnverifiedTag = async (tag: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM "unverified tags" WHERE "unverified tags"."tag" = $1`),
      values: [tag]
    }
    const result = await SQLQuery.run(query)
    return result
  }

   /** Create a new user. */
   public static insertUser = async (username: string, email: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "users" ("username", "email") VALUES ($1, $2)`,
      values: [username, email]
    }
    const result = await SQLQuery.run(query)
    return result
  }

   /** Updates a user */
   public static updateUser = async (username: string, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "users" SET "${column}" = $1 WHERE "username" = $2`,
        values: [value, username]
    }
    return SQLQuery.run(query)
  }

  /** Get user. */
  public static user = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT users.*
          FROM users
          WHERE users."username" = $1
          GROUP BY users."username"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get user by email. */
  public static userByEmail = async (email: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT users.*
          FROM users
          WHERE users."email" = $1
          GROUP BY users."username"
          `),
          values: [email]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete user. */
  public static deleteUser = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM users WHERE users."username" = $1`),
      values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert email token. */
  public static insertEmailToken = async (email: string, token: string) => {
    let now = new Date() as any
    now.setHours(now.getHours() + 1)
    const query: QueryConfig = {
      text: `INSERT INTO "email tokens" ("email", "token", "expires") VALUES ($1, $2, $3)`,
      values: [email, token, now.toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Updates email token. */
  public static updateEmailToken = async (email: string, token: string) => {
    let now = new Date() as any
    now.setHours(now.getHours() + 1)
    const query: QueryConfig = {
        text: `UPDATE "email tokens" SET "token" = $1, "expires" = $2 WHERE "email" = $3`,
        values: [token, now.toISOString(), email]
    }
    return SQLQuery.run(query)
  }

  /** Get email token. */
  public static emailToken = async (token: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "email tokens".*
          FROM "email tokens"
          WHERE "email tokens"."token" = $1
          GROUP BY "email tokens"."email"
          `),
          values: [token]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete email token. */
  public static deleteEmailToken = async (email: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "email tokens" WHERE "email tokens"."email" = $1`,
      values: [email]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get 2fa token. */
  public static $2faToken = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "2fa tokens".*
          FROM "2fa tokens"
          WHERE "2fa tokens"."username" = $1
          GROUP BY "2fa tokens"."username"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Insert 2fa token. */
  public static insert2faToken = async (username: string, token: string, qrcode: string) => {
    let now = new Date() as any
    now.setHours(now.getHours() + 1)
    const query: QueryConfig = {
      text: `INSERT INTO "2fa tokens" ("username", "token", "qrcode") VALUES ($1, $2, $3)`,
      values: [username, token, qrcode]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete 2fa token. */
  public static delete2faToken = async (username: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "2fa tokens" WHERE "2fa tokens"."username" = $1`,
      values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert password token. */
  public static insertPasswordToken = async (username: string, token: string) => {
    let now = new Date() as any
    now.setHours(now.getHours() + 1)
    const query: QueryConfig = {
      text: `INSERT INTO "password tokens" ("username", "token", "expires") VALUES ($1, $2, $3)`,
      values: [username, token, now.toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get password token. */
  public static passwordToken = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
          SELECT "password tokens".*
          FROM "password tokens"
          WHERE "password tokens"."username" = $1
          GROUP BY "password tokens"."username"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete password token. */
  public static deletePasswordToken = async (username: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "password tokens" WHERE "password tokens"."username" = $1`,
      values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert comment. */
  public static insertComment = async (postID: number, username: string, comment: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
      text: `INSERT INTO "comments" ("postID", "username", "comment", "postDate", "editedDate") VALUES ($1, $2, $3, $4, $5)`,
      values: [postID, username, comment, now, now]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Updates a comment. */
  public static updateComment = async (commentID: number, comment: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
        text: `UPDATE "comments" SET "comment" = $1, "editedDate" = $2 WHERE "commentID" = $3`,
        values: [comment, now, commentID]
    }
    return SQLQuery.run(query)
  }

  /** Get post comments. */
  public static comments = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT comments.*, users."image", users."imagePost", users."role"
            FROM comments
            JOIN "users" ON "users"."username" = "comments"."username"
            WHERE comments."postID" = $1
            GROUP BY comments."commentID", users."image", users."imagePost", users."role"
            ORDER BY comments."postDate" ASC
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Search comments. */
  public static searchComments = async (search: string, sort: string, offset?: string) => {
    let whereQuery = ""
    let i = 1
    if (search) {
      whereQuery = `WHERE comments."comment" LIKE '%' || $${i} || '%'`
      i++
    }
    let sortQuery = ""
    if (sort === "date") sortQuery = `ORDER BY comments."postDate" DESC`
    if (sort === "reverse date") sortQuery = `ORDER BY comments."postDate" ASC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT comments.*, users."image", users."imagePost", users."role", json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM comments
            JOIN "users" ON "users"."username" = "comments"."username"
            JOIN post_json ON post_json."postID" = "comments"."postID"
            ${whereQuery}
            GROUP BY comments."commentID", users."image", users."imagePost", users."role", post_json."type", post_json."restrict", post_json."style"
            ${sortQuery}
            LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
          `),
          values: []
    }
    if (search) query.values?.push(search)
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }

  /** Comments by usernames. */
  public static searchCommentsByUsername = async (usernames: string[], search: string, sort: string, offset?: string) => {
    let i = 2
    let whereQuery = `WHERE comments."username" = ANY ($1)`
    if (search) {
      whereQuery += `AND comments."comment" LIKE '%' || $${i} || '%'`
      i++
    }
    let sortQuery = ""
    if (sort === "date") sortQuery = `ORDER BY comments."postDate" DESC`
    if (sort === "reverse date") sortQuery = `ORDER BY comments."postDate" ASC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT comments.*, users."image", users."imagePost", users."role", json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM comments
            JOIN "users" ON "users"."username" = "comments"."username"
            JOIN post_json ON post_json."postID" = "comments"."postID"
            ${whereQuery}
            GROUP BY comments."commentID", users."image", users."imagePost", users."role", post_json."type", post_json."restrict", post_json."style"
            ${sortQuery}
            LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
          `),
          values: [usernames]
    }
    if (search) query.values?.push(search)
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get comment. */
  public static comment = async (commentID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT comments.*, users."image", users."imagePost", users."role"
            FROM comments
            JOIN "users" ON "users"."username" = "comments"."username"
            WHERE comments."commentID" = $1
            GROUP BY comments."commentID", users."image", users."imagePost", users."role"
            ORDER BY comments."postDate" ASC
          `),
          values: [commentID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete comment. */
  public static deleteComment = async (commentID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM comments WHERE comments."commentID" = $1`),
      values: [commentID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert translation. */
  public static insertTranslation = async (postID: number, updater: string, order: number, data: any) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
      text: `INSERT INTO "translations" ("postID", "updater", "updatedDate", "order", "data") VALUES ($1, $2, $3, $4, $5)`,
      values: [postID, updater, now, order, data]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Updates a translation. */
  public static updateTranslation = async (translationID: number, updater: string, data: any) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
        text: `UPDATE "translations" SET "updater" = $1, "updatedDate" = $2, "data" = $3 WHERE "translationID" = $4`,
        values: [updater, now, data, translationID]
    }
    return SQLQuery.run(query)
  }

  /** Get post translations. */
  public static translations = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT translations.*
            FROM translations
            WHERE translations."postID" = $1
            GROUP BY translations."translationID"
            ORDER BY translations."updatedDate" DESC
          `),
          values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get translation. */
  public static translation = async (postID: number, order: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT translations.*
            FROM translations
            WHERE translations."postID" = $1 AND translations."order" = $2
            GROUP BY translations."translationID"
          `),
          values: [postID, order]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete translation. */
  public static deleteTranslation = async (translationID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM translations WHERE translations."translationID" = $1`),
      values: [translationID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert translation (unverified). */
  public static insertUnverifiedTranslation = async (postID: number, updater: string, order: number, data: any, reason: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
      text: `INSERT INTO "unverified translations" ("postID", "updater", "updatedDate", "order", "data", "reason") VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [postID, updater, now, order, data, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Updates a translation (unverified). */
  public static updateUnverifiedTranslation = async (translationID: number, updater: string, data: any, reason: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
        text: `UPDATE "unverified translations" SET "updater" = $1, "updatedDate" = $2, "data" = $3, "reason" = $4 WHERE "translationID" = $5`,
        values: [updater, now, data, reason, translationID]
    }
    return SQLQuery.run(query)
  }

  /** Get translation (unverified). */
  public static unverifiedTranslation = async (postID: number, order: number, updater: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT "unverified translations".*
            FROM "unverified translations"
            WHERE "unverified translations"."postID" = $1 AND "unverified translations"."order" = $2 AND "unverified translations"."updater" = $3
            GROUP BY "unverified translations"."translationID"
          `),
          values: [postID, order, updater]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get translation (unverified by id). */
  public static unverifiedTranslationID = async (translationID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT "unverified translations".*
            FROM "unverified translations"
            WHERE "unverified translations"."translationID" = $1
            GROUP BY "unverified translations"."translationID"
          `),
          values: [translationID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete translation (unverified). */
  public static deleteUnverifiedTranslation = async (translationID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM "unverified translations" WHERE "unverified translations"."translationID" = $1`),
      values: [translationID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get translations (unverified). */
  public static unverifiedTranslations = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT "unverified translations".*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "unverified translations"
            JOIN post_json ON post_json."postID" = "unverified translations"."postID"
            GROUP BY "unverified translations"."translationID", post_json."type", post_json."restrict", post_json."style"
            ORDER BY "unverified translations"."updatedDate" ASC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
          `)
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert favorite. */
  public static insertFavorite = async (postID: number, username: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "favorites" ("postID", "username", "favoriteDate") VALUES ($1, $2, $3)`,
      values: [postID, username, new Date().toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get favorite. */
  public static favorite = async (postID: number, username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT favorites.*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM favorites
            JOIN post_json ON post_json."postID" = favorites."postID"
            WHERE favorites."postID" = $1 AND favorites."username" = $2
            GROUP BY favorites."favoriteID", post_json."type", post_json."restrict", post_json."style"
          `),
          values: [postID, username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get favorites. */
  public static favorites = async (username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT favorites.*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM favorites
            JOIN post_json ON post_json."postID" = favorites."postID"
            WHERE favorites."username" = $1
            GROUP BY favorites."favoriteID", post_json."type", post_json."restrict", post_json."style"
          `),
          values: [username]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete favorite. */
  public static deleteFavorite = async (favoriteID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM favorites WHERE favorites."favoriteID" = $1`),
      values: [favoriteID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Search posts. */
  public static searchFavorites = async (username: string, tags: string[], type: string, restrict: string, style: string, sort: string, offset?: string, limit?: string, withTags?: boolean) => {
    let userQuery = `favorites."username" = $1`
    let typeQuery = ""
    if (type === "image") typeQuery = `post_json.type = 'image'`
    if (type === "animation") typeQuery = `post_json.type = 'animation'`
    if (type === "video") typeQuery = `post_json.type = 'video'`
    if (type === "comic") typeQuery = `post_json.type = 'comic'`
    if (type === "audio") typeQuery = `post_json.type = 'audio'`
    if (type === "model") typeQuery = `post_json.type = 'model'`
    let restrictQuery = ""
    if (restrict === "safe") restrictQuery = `post_json.restrict = 'safe'`
    if (restrict === "questionable") restrictQuery = `post_json.restrict = 'questionable'`
    if (restrict === "explicit") restrictQuery = `post_json.restrict = 'explicit'`
    if (restrict === "all") restrictQuery = `(post_json.restrict = 'safe' OR post_json.restrict = 'questionable')`
    let styleQuery = ""
    if (style === "2d") styleQuery = `lower(post_json.style) = '2d'`
    if (style === "3d") styleQuery = `lower(post_json.style) = '3d'`
    if (style === "pixel") styleQuery = `post_json.style = 'pixel'`
    if (style === "chibi") styleQuery = `post_json.style = 'chibi'`
    let sortQuery = ""
    if (sort === "favorites") sortQuery = `ORDER BY favorites."favoriteDate" DESC`
    if (sort === "reverse favorites") sortQuery = `ORDER BY favorites."favoriteDate" ASC`
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
    let i = 2
    let values = [] as any
    let tagQueryArray = [] as any
    if (ANDtags.length) {
      values.push(ANDtags)
      tagQueryArray.push(`post_json.tags @> $${i}`)
      i++ 
    }
    if (ORtags.length) {
      values.push(ORtags)
      tagQueryArray.push(`post_json.tags && $${i}`)
      i++ 
    }
    if (NOTtags.length) {
      values.push(NOTtags)
      tagQueryArray.push(`NOT post_json.tags @> $${i}`)
      i++
    }
    let limitValue = i
    if (limit) {
      values.push(limit)
      i++
    }
    if (offset) values.push(offset)
    let tagQuery = tagQueryArray.length ? tagQueryArray.join(" AND ") : ""
    const whereQueries = [userQuery, typeQuery, restrictQuery, styleQuery, tagQuery].filter(Boolean).join(" AND ")
    let includeTags = withTags || tagQuery
    const query: QueryConfig = {
      text: functions.multiTrim(`
        WITH post_json AS (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images, ${includeTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
          COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
          AVG(DISTINCT cuteness."cuteness") AS "cutenessAvg"
          FROM posts
          JOIN images ON images."postID" = posts."postID"
          ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
          FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
          FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
          GROUP BY posts."postID"
        )
        SELECT favorites.*, 
        COUNT(*) OVER() AS "postCount",
        json_build_object(
          'postID', post_json."postID",
          'uploader', post_json."uploader",
          'updater', post_json."updater",
          'type', post_json."type",
          'restrict', post_json."restrict",
          'style', post_json."style",
          'cuteness', post_json."cutenessAvg",
          'favorites', post_json."favoriteCount",
          'thirdParty', post_json."thirdParty",
          'drawn', post_json."drawn",
          'uploadDate', post_json."uploadDate",
          'updatedDate', post_json."updatedDate",
          'title', post_json."title",
          'translatedTitle', post_json."translatedTitle",
          'artist', post_json."artist",
          'link', post_json."link",
          'commentary', post_json."commentary",
          'translatedCommentary', post_json."translatedCommentary",
          'bookmarks', post_json."bookmarks",
          'mirrors', post_json."mirrors",
          'images', (array_agg(post_json."images"))[1]${includeTags ? `,
          'tags', post_json."tags"` : ""}
        ) AS post
        FROM favorites
        JOIN post_json ON post_json."postID" = favorites."postID"
        ${whereQueries ? `WHERE ${whereQueries}` : ""}
        GROUP BY favorites."favoriteID", post_json."postID", post_json."uploader", post_json."updater", ${includeTags ? `post_json."tags",` : ""}
        post_json."type", post_json."restrict", post_json."style", post_json."cutenessAvg", post_json."favoriteCount",
        post_json."thirdParty", post_json."drawn", post_json."uploadDate", post_json."updatedDate", post_json."title",
        post_json."translatedTitle", post_json."artist", post_json."link", post_json."commentary", post_json."translatedCommentary", post_json."bookmarks", post_json."mirrors"
        ${sortQuery}
        ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
      `),
      values: [username]
    }
    if (values?.[0]) query.values?.push(...values)
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert cuteness. */
  public static insertCuteness = async (postID: number, username: string, cuteness: number) => {
    const query: QueryConfig = {
      text: `INSERT INTO "cuteness" ("postID", "username", "cuteness", "cutenessDate") VALUES ($1, $2, $3, $4)`,
      values: [postID, username, cuteness, new Date().toISOString()]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get cuteness. */
  public static cuteness = async (postID: number, username: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT cuteness.*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM cuteness
            JOIN post_json ON post_json."postID" = cuteness."postID"
            WHERE cuteness."postID" = $1 AND cuteness."username" = $2
            GROUP BY cuteness."cutenessID", post_json."type", post_json."restrict", post_json."style"
          `),
          values: [postID, username]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Delete cuteness. */
  public static deleteCuteness = async (cutenessID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM cuteness WHERE cuteness."cutenessID" = $1`),
      values: [cutenessID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Update cuteness */
  public static updateCuteness = async (postID: number, username: string, cuteness: number) => {
    const query: QueryConfig = {
        text: `UPDATE "cuteness" SET "cuteness" = $1 WHERE "postID" = $2 AND "username" = $3`,
        values: [cuteness, postID, username]
    }
    return SQLQuery.run(query)
  }

   /** Insert a new alias. */
   public static insertAlias = async (tag: string, alias: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "aliases" ("tag", "alias") VALUES ($1, $2)`,
      values: [tag, alias]
    }
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Insert a new alias (unverified). */
  public static insertUnverifiedAlias = async (tag: string, alias: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "unverified aliases" ("tag", "alias") VALUES ($1, $2)`,
      values: [tag, alias]
    }
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Get alias. */
  public static alias = async (alias: string) => {
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT aliases.*
                  FROM aliases
                  WHERE "aliases".alias = $1
                  GROUP BY "aliases"."aliasID"
          `),
          values: [alias]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Purge aliases. */
  public static purgeAliases = async (tag: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "aliases" WHERE aliases."tag" = $1`,
      values: [tag]
    }
    return SQLQuery.run(query)
  }

   /** Purge aliases (unverified). */
   public static purgeUnverifiedAliases = async (tag: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "unverified aliases" WHERE "unverified aliases"."tag" = $1`,
      values: [tag]
    }
    return SQLQuery.run(query)
  }

  /** Alias search. */
  public static aliasSearch = async (search: string) => {
    let whereQuery = ""
    if (search) whereQuery = `WHERE aliases.alias LIKE $1 || '%'`
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT aliases.*
                  FROM aliases
                  ${whereQuery}
                  GROUP BY "aliases"."aliasID"
          `)
    }
    if (search) query.values = [search]
    const result = await SQLQuery.run(query)
    return result
  }

   /** Insert a new implication. */
   public static insertImplication = async (tag: string, implication: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "implication map" ("tag", "implication") VALUES ($1, $2)`,
      values: [tag, implication]
    }
    try {
      await SQLQuery.run(query)
      return false
    } catch {
      return true
    }
  }

  /** Get implications. */
  public static implications = async (tag: string) => {
    const query: QueryConfig = {
          text: functions.multiTrim(`
                  SELECT "implication map".*
                  FROM "implication map"
                  WHERE "implication map".tag = $1
                  GROUP BY "implication map"."implicationID"
          `),
          values: [tag]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Purge implications. */
  public static purgeImplications = async (tag: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "implication map" WHERE "implication map"."tag" = $1`,
      values: [tag]
    }
    return SQLQuery.run(query)
  }

  /** Rename tag map. */
  public static renameTagMap = async (tag: string, newTag: string) => {
    const query: QueryConfig = {
        text: `UPDATE "tag map" SET "tag" = $1 WHERE "tag" = $2`,
        values: [newTag, tag]
    }
    return SQLQuery.run(query)
  }

  /** Purge tag map. */
  public static purgeTagMap = async (postID: number) => {
    const query: QueryConfig = {
        text: `DELETE FROM "tag map" WHERE "tag map"."postID" = $1`,
        values: [postID]
    }
    return SQLQuery.run(query)
  }

  /** Purge tag map (unverified). */
  public static purgeUnverifiedTagMap = async (postID: number) => {
    const query: QueryConfig = {
        text: `DELETE FROM "unverified tag map" WHERE "unverified tag map"."postID" = $1`,
        values: [postID]
    }
    return SQLQuery.run(query)
  }

  /** Insert third party relation. */
  public static insertThirdParty = async (postID: number, parentID: number) => {
    const query: QueryConfig = {
      text: `INSERT INTO "third party" ("postID", "parentID") VALUES ($1, $2)`,
      values: [postID, parentID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert third party relation (unverified). */
  public static insertUnverifiedThirdParty = async (postID: number, parentID: number) => {
    const query: QueryConfig = {
      text: `INSERT INTO "unverified third party" ("postID", "parentID") VALUES ($1, $2)`,
      values: [postID, parentID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete third party relation. */
  public static deleteThirdParty = async (postID: number) => {
    const query: QueryConfig = {
      text: `DELETE FROM "third party" WHERE "third party"."postID" = $1`,
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete third party relation (unverified). */
  public static deleteUnverifiedThirdParty = async (postID: number) => {
    const query: QueryConfig = {
      text: `DELETE FROM "unverified third party" WHERE "unverified third party"."postID" = $1`,
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get third party posts. */
  public static thirdParty = async (parentID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images,
              ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
              GROUP BY posts."postID"
            )
            SELECT "third party".*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "third party"
            JOIN post_json ON post_json."postID" = "third party"."postID"
            WHERE "third party"."parentID" = $1
            GROUP BY "third party"."thirdPartyID", post_json."type", post_json."restrict", post_json."style"
          `),
      values: [parentID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get third party posts (unverified). */
  public static unverifiedThirdParty = async (parentID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images,
              ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
              GROUP BY posts."postID"
            )
            SELECT "unverified third party".*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "unverified third party"
            JOIN post_json ON post_json."postID" = "unverified third party"."postID"
            WHERE "unverified third party"."parentID" = $1
            GROUP BY "unverified third party"."thirdPartyID", post_json."type", post_json."restrict", post_json."style"
          `),
      values: [parentID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Get the parent of a third party post. */
  public static parent = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images,
              ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
              GROUP BY posts."postID"
            )
            SELECT "third party".*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "third party"
            JOIN post_json ON post_json."postID" = "third party"."parentID"
            WHERE "third party"."postID" = $1
            GROUP BY "third party"."thirdPartyID", post_json."type", post_json."restrict", post_json."style"
          `),
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Get the parent of a third party post (unverified). */
  public static unverifiedParent = async (postID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images,
              ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cutenessAvg"
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
              GROUP BY posts."postID"
            )
            SELECT "unverified third party".*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "unverified third party"
            JOIN post_json ON post_json."postID" = "unverified third party"."parentID"
            WHERE "unverified third party"."postID" = $1
            GROUP BY "unverified third party"."thirdPartyID", post_json."type", post_json."restrict", post_json."style"
          `),
      values: [postID]
    }
    const result = await SQLQuery.run(query)
    return result[0]
  }

  /** Insert pending post delete. */
  public static insertPostDeleteRequest = async (username: string, postID: number, reason: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "delete requests" ("username", "postID", "reason") VALUES ($1, $2, $3)`,
      values: [username, postID, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete pending post delete. */
  public static deletePostDeleteRequest = async (username: string, postID: number) => {
    const query: QueryConfig = {
      text: `DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."postID" = $2`,
      values: [username, postID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static postDeleteRequests = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
        WITH post_json AS (
          SELECT posts.*, json_agg(DISTINCT images.*) AS images
          FROM posts
          JOIN images ON images."postID" = posts."postID"
          GROUP BY posts."postID"
        )
        SELECT "delete requests".*, json_build_object(
          'type', post_json."type",
          'restrict', post_json."restrict",
          'style', post_json."style",
          'images', (array_agg(post_json."images"))[1]
        ) AS post
        FROM "delete requests"
        JOIN post_json ON post_json."postID" = "delete requests"."postID"
        WHERE "delete requests"."postID" IS NOT NULL
        GROUP BY "delete requests"."deleteRequestID", post_json."type", post_json."restrict", post_json."style"
        LIMIT 100 ${offset ? `OFFSET $1` : ""}
      `),
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert pending tag delete. */
  public static insertTagDeleteRequest = async (username: string, tag: string, reason: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "delete requests" ("username", "tag", "reason") VALUES ($1, $2, $3)`,
      values: [username, tag, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

   /** Delete pending post delete. */
   public static deleteTagDeleteRequest = async (username: string, tag: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."tag" = $2`,
      values: [username, tag]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static tagDeleteRequests = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT "delete requests".*, tags.*
        FROM "delete requests"
        JOIN tags ON tags.tag = "delete requests".tag
        WHERE "delete requests"."tag" IS NOT NULL
        GROUP BY "delete requests"."deleteRequestID", tags.tag
        LIMIT 100 ${offset ? `OFFSET $1` : ""}
      `),
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert alias request. */
  public static insertAliasRequest = async (username: string, tag: string, aliasTo: string, reason: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "alias requests" ("username", "tag", "aliasTo", "reason") VALUES ($1, $2, $3, $4)`,
      values: [username, tag, aliasTo, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

   /** Delete alias request. */
   public static deleteAliasRequest = async (username: string, tag: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "alias requests" WHERE "alias requests"."username" = $1 AND "alias requests"."tag" = $2`,
      values: [username, tag]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static aliasRequests = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT "alias requests".*, tags.*
        FROM "alias requests"
        JOIN tags ON tags.tag = "alias requests".tag
        WHERE "alias requests"."tag" IS NOT NULL
        GROUP BY "alias requests"."aliasRequestID", tags.tag
        LIMIT 100 ${offset ? `OFFSET $1` : ""}
      `),
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert tag edit request. */
  public static insertTagEditRequest = async (username: string, tag: string, key: string, description: string, image: string, aliases: string[], implications: string[], pixivTags: string[], pixiv: string, twitter: string, website: string, fandom: string, reason: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "tag edit requests" ("username", "tag", "key", "description", "image", "aliases", "implications", "pixivTags", "pixiv", "twitter", "website", "fandom", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      values: [username, tag, key, description, image, aliases, implications, pixivTags, pixiv, twitter, website, fandom, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete tag edit request. */
  public static deleteTagEditRequest = async (username: string, tag: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "tag edit requests" WHERE "tag edit requests"."username" = $1 AND "tag edit requests"."tag" = $2`,
      values: [username, tag]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static tagEditRequests = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT tags.type, "tag edit requests".*
        FROM "tag edit requests"
        JOIN tags ON tags.tag = "tag edit requests".tag
        GROUP BY "tag edit requests"."tagEditRequestID", tags.type
        LIMIT 100 ${offset ? `OFFSET $1` : ""}
      `),
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert comment report. */
  public static inserCommentReport = async (username: string, commentID: number, reason: string) => {
    const query: QueryConfig = {
      text: `INSERT INTO "reported comments" ("reporter", "commentID", "reason") VALUES ($1, $2, $3)`,
      values: [username, commentID, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Delete comment report. */
  public static deleteCommentReport = async (username: string, commentID: number) => {
    const query: QueryConfig = {
      text: `DELETE FROM "reported comments" WHERE "reported comments"."reporter" = $1 AND "reported comments"."commentID" = $2`,
      values: [username, commentID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static reportedComments = async (offset?: string) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`
        SELECT comments.*, "reported comments".*, json_build_object(
          'username', users.username,
          'image', users.image
        ) AS user
        FROM "reported comments"
        JOIN comments ON comments."commentID" = "reported comments"."commentID"
        JOIN users ON users."username" = "comments"."username"
        GROUP BY "reported comments"."commentReportID", comments."commentID", users.username, users.image
        LIMIT 100 ${offset ? `OFFSET $1` : ""}
      `),
    }
    if (offset) query.values = [offset]
    const result = await SQLQuery.run(query)
    return result
  }

  public static insertTagHistory = async (username: string, tag: string, key: string, type: string, image?: string, description?: string, 
    aliases?: string[], implications?: string[], pixivTags?: string[], website?: string, pixiv?: string, twitter?: string, fandom?: string, reason?: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
      text: `INSERT INTO "tag history" ("tag", "user", "date", "key", "type", "image", "description", "aliases", "implications", "pixivTags", "website", "pixiv", "twitter", "fandom", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      values: [tag, username, now, key, type, image, description, aliases, implications, pixivTags, website, pixiv, twitter, fandom, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static deleteTagHistory = async (historyID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM "tag history" WHERE "tag history"."historyID" = $1`),
      values: [historyID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static tagHistory = async (tag?: string, offset?: string) => {
    const offsetAmt = tag ? 2 : 1
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT "tag history".*
            FROM "tag history"
            ${tag ? `WHERE "tag history"."tag" = $1` : ""}
            GROUP BY "tag history"."historyID"
            ORDER BY "tag history"."date" DESC
            ${offset ? `OFFSET $${offsetAmt}` : ""}
          `),
          values: []
    }
    if (tag) query.values?.push(tag)
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }

  public static insertPostHistory = async (username: string, postID: number, images?: string[], uploader?: string, updater?: string, uploadDate?: string, updatedDate?: string,
    type?: string, restrict?: string, style?: string, thirdParty?: string, title?: string, translatedTitle?: string, drawn?: string, artist?: string, link?: string,
    commentary?: string, translatedCommentary?: string, bookmarks?: string, mirrors?: string, artists?: string[], characters?: string[], series?: string[], tags?: string[], reason?: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
      text: `INSERT INTO "post history" ("postID", "user", "date", "images", "uploader", "updater", "uploadDate", "updatedDate",
      "type", "restrict", "style", "thirdParty", "title", "translatedTitle", "drawn", "artist", "link", "commentary",
      "translatedCommentary", "bookmarks", "mirrors", "artists", "characters", "series", "tags", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
      values: [postID, username, now, images, uploader, updater, uploadDate, updatedDate, type, restrict, style, thirdParty, 
        title, translatedTitle, drawn, artist, link, commentary, translatedCommentary, bookmarks, mirrors, artists, characters, series, tags, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static deletePostHistory = async (historyID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM "post history" WHERE "post history"."historyID" = $1`),
      values: [historyID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static postHistory = async (postID?: number, offset?: string) => {
    const offsetAmt = postID ? 2 : 1
    const query: QueryConfig = {
      text: functions.multiTrim(`
            SELECT "post history".*
            FROM "post history"
            ${postID ? `WHERE "post history"."postID" = $1` : ""}
            GROUP BY "post history"."historyID"
            ORDER BY "post history"."date" DESC
            ${offset ? `OFFSET $${offsetAmt}` : ""}
          `),
          values: []
    }
    if (postID) query.values?.push(postID)
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }

  public static insertTranslationHistory = async (postID: number, order: number, updater: string, data: any, reason?: string) => {
    const now = new Date().toISOString()
    const query: QueryConfig = {
      text: `INSERT INTO "translation history" ("postID", "order", "updater", "updatedDate", "data", "reason") VALUES ($1, $2, $3, $4, $5, $6)`,
      values: [postID, order, updater, now, data, reason]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static deleteTranslationHistory = async (historyID: number) => {
    const query: QueryConfig = {
      text: functions.multiTrim(`DELETE FROM "translation history" WHERE "translation history"."historyID" = $1`),
      values: [historyID]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  public static translationHistory = async (postID?: number, order?: number, offset?: string) => {
    let offsetAmt = 1
    if (postID) offsetAmt += 1
    if (order) offsetAmt += 1
    let whereArr = [] as string[]
    let i = 1
    if (postID) whereArr.push(`"translation history"."postID" = $${i++}`)
    if (order) whereArr.push(`"translation history"."order" = $${i++}`)
    const whereQueries = whereArr.length ? `WHERE ${whereArr.join(" AND ")}` : ""
    const query: QueryConfig = {
      text: functions.multiTrim(`
            WITH post_json AS (
              SELECT posts.*, json_agg(DISTINCT images.*) AS images
              FROM posts
              JOIN images ON images."postID" = posts."postID"
              GROUP BY posts."postID"
            )
            SELECT "translation history".*, json_build_object(
              'type', post_json."type",
              'restrict', post_json."restrict",
              'style', post_json."style",
              'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "translation history"
            JOIN post_json ON post_json."postID" = "translation history"."postID"
            ${whereQueries}
            GROUP BY "translation history"."historyID", post_json."type", post_json."restrict", post_json."style"
            ORDER BY "translation history"."updatedDate" DESC
            ${offset ? `OFFSET $${offsetAmt}` : ""}
      `),
      values: []
    }
    if (postID) query.values?.push(postID)
    if (order) query.values?.push(order)
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }

  /** Insert forum thread. */
  public static insertForumThread = async (creator: string, title: string, content: string) => {
    const now = new Date().toISOString()
    const sticky = false
    const locked = false
    const query: QueryConfig = {
      text: `INSERT INTO "forum threads" ("creator", "createDate", "updater", "updatedDate", "sticky", "locked", "title", "content") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      values: [creator, now, creator, now, sticky, locked, title, content]
    }
    const result = await SQLQuery.run(query)
    return result
  }

  /** Search threads. */
  public static searchThreads = async (search: string, sort: string, offset?: string) => {
    let whereQuery = ""
    let i = 1
    if (search) {
      whereQuery = `WHERE lower("forum threads"."title") LIKE '%' || $${i} || '%'`
      i++
    }
    let sortQuery = ""
    if (sort === "date") sortQuery = `ORDER BY "forum threads"."updatedDate" DESC`
    if (sort === "reverse date") sortQuery = `ORDER BY "forum threads"."updatedDate" ASC`
    const query: QueryConfig = {
          text: functions.multiTrim(`
            SELECT "forum threads".* 
            FROM "forum threads"
            ${whereQuery}
            GROUP BY "forum threads"."threadID"
            ${sortQuery}
            LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
          `),
          values: []
    }
    if (search) query.values?.push(search.toLowerCase())
    if (offset) query.values?.push(offset)
    const result = await SQLQuery.run(query)
    return result
  }
}