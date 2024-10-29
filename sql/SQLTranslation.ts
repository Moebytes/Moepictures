import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLTranslation {
    /** Insert translation. */
    public static insertTranslation = async (postID: number, updater: string, order: number, data: any) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "translations" ("postID", "updater", "updatedDate", "order", "data") VALUES ($1, $2, $3, $4, $5)`,
        values: [postID, updater, now, order, data]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates a translation. */
    public static updateTranslation = async (translationID: number, updater: string, data: any) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "translations" SET "updater" = $1, "updatedDate" = $2, "data" = $3 WHERE "translationID" = $4`,
            values: [updater, now, data, translationID]
        }
        return SQLQuery.run(query)
    }

    /** Get post translations. */
    public static translations = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
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
        text: functions.multiTrim(/*sql*/`
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
        text: functions.multiTrim(/*sql*/`DELETE FROM translations WHERE translations."translationID" = $1`),
        values: [translationID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert translation (unverified). */
    public static insertUnverifiedTranslation = async (postID: number, originalID: number, updater: string, order: number, data: any, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "unverified translations" ("postID", "originalID", "updater", "updatedDate", "order", "data", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        values: [postID, originalID, updater, now, order, data, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates a translation (unverified). */
    public static updateUnverifiedTranslation = async (translationID: number, data: any, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified translations" SET "updatedDate" = $1, "data" = $2, "reason" = $3 WHERE "translationID" = $4`,
            values: [now, data, reason, translationID]
        }
        return SQLQuery.run(query)
    }

    /** Get translation (unverified). */
    public static unverifiedTranslation = async (postID: number, order: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "unverified translations".*
                FROM "unverified translations"
                WHERE "unverified translations"."postID" = $1 AND "unverified translations"."order" = $2
                GROUP BY "unverified translations"."translationID"
            `),
            values: [postID, order]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get unverified post translations. */
    public static unverifiedPostTranslations = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "unverified translations".*
                FROM "unverified translations"
                WHERE "unverified translations"."postID" = $1
                GROUP BY "unverified translations"."translationID"
                ORDER BY "unverified translations"."updatedDate" DESC
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get translation (unverified by id). */
    public static unverifiedTranslationID = async (translationID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
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
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified translations" WHERE "unverified translations"."translationID" = $1`),
        values: [translationID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get translations (unverified). */
    public static unverifiedTranslations = async (offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images
                    FROM "unverified posts"
                    JOIN "unverified images" ON "unverified images"."postID" = "unverified posts"."postID"
                    GROUP BY "unverified posts"."postID"
                )
                SELECT "unverified translations".*, 
                COUNT(*) OVER() AS "translationCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "unverified translations"
                JOIN post_json ON post_json."postID" = "unverified translations"."postID"
                GROUP BY "unverified translations"."translationID"
                ORDER BY "unverified translations"."updatedDate" ASC
                LIMIT 100 ${offset ? `OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result
    }
}