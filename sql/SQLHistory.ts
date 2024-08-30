import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLHistory {
    /** Insert tag history */
    public static insertTagHistory = async (username: string, tag: string, key: string, type: string, image?: string, description?: string, 
        aliases?: string[], implications?: string[], pixivTags?: string[], website?: string, social?: string, twitter?: string, fandom?: string, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tag history" ("tag", "user", "date", "key", "type", "image", "description", "aliases", "implications", "pixivTags", "website", "social", "twitter", "fandom", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        values: [tag, username, now, key, type, image, description, aliases, implications, pixivTags, website, social, twitter, fandom, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete tag history */
    public static deleteTagHistory = async (historyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "tag history" WHERE "tag history"."historyID" = $1`),
        values: [historyID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get tag history */
    public static tagHistory = async (tag?: string, offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "tag history"
                ${tag ? `WHERE "tag history"."tag" = $1` : ""}
                GROUP BY "tag history"."historyID"
                ORDER BY "tag history"."date" DESC
            `),
            values: []
        }
        if (tag) query.values?.push(tag)
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get user tag history */
    public static userTagHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "tag history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "tag history"
                WHERE "tag history"."user" = $1
                GROUP BY "tag history"."historyID"
                ORDER BY "tag history"."date" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Insert post history */
    public static insertPostHistory = async (username: string, postID: number, images?: string[], uploader?: string, updater?: string, uploadDate?: string, updatedDate?: string,
        type?: string, restrict?: string, style?: string, thirdParty?: string, title?: string, translatedTitle?: string, drawn?: string, artist?: string, link?: string,
        commentary?: string, translatedCommentary?: string, bookmarks?: string, mirrors?: string, artists?: string[], characters?: string[], series?: string[], tags?: string[], reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "post history" ("postID", "user", "date", "images", "uploader", "updater", "uploadDate", "updatedDate",
        "type", "restrict", "style", "thirdParty", "title", "translatedTitle", "drawn", "artist", "link", "commentary",
        "translatedCommentary", "bookmarks", "mirrors", "artists", "characters", "series", "tags", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 
            $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        values: [postID, username, now, images, uploader, updater, uploadDate, updatedDate, type, restrict, style, thirdParty, 
            title, translatedTitle, drawn, artist, link, commentary, translatedCommentary, bookmarks, mirrors, artists, characters, series, tags, reason]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete post history */
    public static deletePostHistory = async (historyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "post history" WHERE "post history"."historyID" = $1`),
        values: [historyID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get post history */
    public static postHistory = async (postID?: string | number, offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "post history".*,
                COUNT(*) OVER() AS "historyCount"
                FROM "post history"
                ${postID ? `WHERE "post history"."postID" = $1` : ""}
                GROUP BY "post history"."historyID"
                ORDER BY "post history"."date" DESC
            `),
            values: []
        }
        if (postID) query.values?.push(postID)
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get user post history */
    public static userPostHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "post history".*
                FROM "post history"
                WHERE "post history"."user" = $1
                GROUP BY "post history"."historyID"
                ORDER BY "post history"."date" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Insert translation history */
    public static insertTranslationHistory = async (postID: number, order: number, updater: string, data: any, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "translation history" ("postID", "order", "updater", "updatedDate", "data", "reason") VALUES ($1, $2, $3, $4, $5, $6)`,
        values: [postID, order, updater, now, data, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete translation history */
    public static deleteTranslationHistory = async (historyID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "translation history" WHERE "translation history"."historyID" = $1`),
        values: [historyID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get translation history */
    public static translationHistory = async (postID?: string, order?: string, offset?: string) => {
        let whereArr = [] as string[]
        let i = 1
        if (postID) whereArr.push(`"translation history"."postID" = $${i++}`)
        if (order) whereArr.push(`"translation history"."order" = $${i++}`)
        const whereQueries = whereArr.length ? `WHERE ${whereArr.join(" AND ")}` : ""
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
                )
                SELECT "translation history".*, 
                COUNT(*) OVER() AS "historyCount",
                json_build_object(
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
        `),
        values: []
        }
        if (postID) query.values?.push(postID)
        if (order) query.values?.push(order)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user translation history */
    public static userTranslationHistory = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
                )
                SELECT "translation history".*, 
                COUNT(*) OVER() AS "historyCount",
                json_build_object(
                'type', post_json."type",
                'restrict', post_json."restrict",
                'style', post_json."style",
                'images', (array_agg(post_json."images"))[1]
                ) AS post
                FROM "translation history"
                JOIN post_json ON post_json."postID" = "translation history"."postID"
                WHERE "translation history"."updater" = $1
                GROUP BY "translation history"."historyID", post_json."type", post_json."restrict", post_json."style"
                ORDER BY "translation history"."updatedDate" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }
}