import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLNote {
    /** Insert note. */
    public static insertNote = async (postID: number, updater: string, order: number, data: any) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "notes" ("postID", "updater", "updatedDate", "order", "data") VALUES ($1, $2, $3, $4, $5)`,
        values: [postID, updater, now, order, data]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates a note. */
    public static updateNote = async (noteID: number, updater: string, data: any) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "notes" SET "updater" = $1, "updatedDate" = $2, "data" = $3 WHERE "noteID" = $4`,
            values: [updater, now, data, noteID]
        }
        return SQLQuery.run(query)
    }

    /** Get post notes. */
    public static notes = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT notes.*
                FROM notes
                WHERE notes."postID" = $1
                GROUP BY notes."noteID"
                ORDER BY notes."updatedDate" DESC
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get note. */
    public static note = async (postID: number, order: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT notes.*
                FROM notes
                WHERE notes."postID" = $1 AND notes."order" = $2
                GROUP BY notes."noteID"
            `),
            values: [postID, order]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Delete note. */
    public static deleteNote = async (noteID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM notes WHERE notes."noteID" = $1`),
        values: [noteID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert note (unverified). */
    public static insertUnverifiedNote = async (postID: number, originalID: number, updater: string, order: number, data: any, 
        addedEntries: any, removedEntries: any, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "unverified notes" ("postID", "originalID", "updater", "updatedDate", "order", "data", 
        "addedEntries", "removedEntries", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        values: [postID, originalID, updater, now, order, data, addedEntries, removedEntries, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates a note (unverified). */
    public static updateUnverifiedNote = async (noteID: number, data: any, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified notes" SET "updatedDate" = $1, "data" = $2, "reason" = $3 WHERE "noteID" = $4`,
            values: [now, data, reason, noteID]
        }
        return SQLQuery.run(query)
    }

    /** Get note (unverified). */
    public static unverifiedNote = async (postID: number, order: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "unverified notes".*
                FROM "unverified notes"
                WHERE "unverified notes"."postID" = $1 AND "unverified notes"."order" = $2
                GROUP BY "unverified notes"."noteID"
            `),
            values: [postID, order]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get unverified post notes. */
    public static unverifiedPostNotes = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "unverified notes".*
                FROM "unverified notes"
                WHERE "unverified notes"."postID" = $1
                GROUP BY "unverified notes"."noteID"
                ORDER BY "unverified notes"."updatedDate" DESC
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get note (unverified by id). */
    public static unverifiedNoteID = async (noteID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT "unverified notes".*
                FROM "unverified notes"
                WHERE "unverified notes"."noteID" = $1
                GROUP BY "unverified notes"."noteID"
            `),
            values: [noteID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Delete note (unverified). */
    public static deleteUnverifiedNote = async (noteID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified notes" WHERE "unverified notes"."noteID" = $1`),
        values: [noteID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get notes (unverified). */
    public static unverifiedNotes = async (offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images
                    FROM "unverified posts"
                    JOIN "unverified images" ON "unverified images"."postID" = "unverified posts"."postID"
                    GROUP BY "unverified posts"."postID"
                )
                SELECT "unverified notes".*, 
                COUNT(*) OVER() AS "noteCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "unverified notes"
                JOIN post_json ON post_json."postID" = "unverified notes"."postID"
                GROUP BY "unverified notes"."noteID"
                ORDER BY "unverified notes"."updatedDate" ASC
                LIMIT 100 ${offset ? `OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get user notes (unverified). */
    public static userUnverifiedNotes = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images
                    FROM "unverified posts"
                    JOIN "unverified images" ON "unverified images"."postID" = "unverified posts"."postID"
                    GROUP BY "unverified posts"."postID"
                )
                SELECT "unverified notes".*, 
                COUNT(*) OVER() AS "noteCount",
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "unverified notes"
                JOIN post_json ON post_json."postID" = "unverified notes"."postID"
                WHERE "unverified notes"."updater" = $1
                GROUP BY "unverified notes"."noteID"
                ORDER BY "unverified notes"."updatedDate" ASC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Search notes. */
    public static searchNotes = async (search: string, sort: string, offset?: string) => {
        let whereQuery = ""
        let i = 1
        if (search) {
            whereQuery = `WHERE notes.data::text ILIKE '%' || $${i} || '%'`
            i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY notes."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY notes."updatedDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT notes.*,
                COUNT(*) OVER() AS "noteCount",
                users."image", users."imageHash", users."imagePost", users."role", users."banned", 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM notes
                JOIN "users" ON "users"."username" = "notes"."updater"
                JOIN post_json ON post_json."postID" = "notes"."postID"
                ${whereQuery}
                GROUP BY notes."noteID", users."image", users."imageHash", users."imagePost", users."role", users."banned"
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

    /** Notes by usernames. */
    public static searchNotesByUsername = async (usernames: string[], search: string, sort: string, offset?: string) => {
        let i = 2
        let whereQuery = `WHERE notes."updater" = ANY ($1)`
        if (search) {
            whereQuery = `WHERE notes.data::text ILIKE '%' || $${i} || '%'`
            i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY notes."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY notes."updatedDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                )
                SELECT notes.*,
                COUNT(*) OVER() AS "noteCount",
                users."image", users."imageHash", users."imagePost", users."role", users."banned", 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM notes
                JOIN "users" ON "users"."username" = "notes"."updater"
                JOIN post_json ON post_json."postID" = "notes"."postID"
                ${whereQuery}
                GROUP BY notes."noteID", users."image", users."imageHash", users."imagePost", users."role", users."banned"
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [usernames]
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result
    }
}