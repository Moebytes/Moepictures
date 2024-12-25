import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {Note, NoteSearch, UnverifiedNote, UnverifiedNoteSearch} from "../types/Types"

export default class SQLNote {
    /** Insert note. */
    public static insertNote = async (postID: string, updater: string, order: number, transcript: string, translation: string,
        x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "notes" ("postID", "updater", "updatedDate", "order", "transcript", "translation", 
            "x", "y", "width", "height", "imageWidth", "imageHeight", "imageHash", "overlay") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 
            $9, $10, $11, $12, $13, $14) RETURNING "noteID"`,
            rowMode: "array",
            values: [postID, updater, now, order, transcript, translation, x, y, width, height, imageWidth, imageHeight, imageHash, overlay]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Updates a note. */
    public static updateNote = async (noteID: string, updater: string, transcript: string, translation: string,
        x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "notes" SET "updater" = $1, "updatedDate" = $2, "transcript" = $3, "translation" = $4, "x" = $5, "y" = $6, 
            "width" = $7, "height" = $8, "imageWidth" = $9, "imageHeight" = $10, "imageHash" = $11, "overlay" = $12 WHERE "noteID" = $13`,
            values: [updater, now, transcript, translation, x, y, width, height, imageWidth, imageHeight, imageHash, overlay, noteID]
        }
        await SQLQuery.run(query)
    }

    /** Get all post notes. */
    public static postNotes = async (postID: string) => {
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
        return result as Promise<Note[]>
    }

    /** Get notes. */
    public static notes = async (postID: string, order: number) => {
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
        return result as Promise<Note[]>
    }

    /** Delete note. */
    public static deleteNote = async (noteID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM notes WHERE notes."noteID" = $1`),
        values: [noteID]
        }
        await SQLQuery.run(query)
    }

    /** Insert note (unverified). */
    public static insertUnverifiedNote = async (postID: string, originalID: number, updater: string, order: number, transcript: string, 
        translation: string, x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean, addedEntries: any, removedEntries: any, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "unverified notes" ("postID", "originalID", "updater", "updatedDate", "order", "transcript", 
            "translation", "x", "y", "width", "height", "imageWidth", "imageHeight", "imageHash", "overlay", "addedEntries", 
            "removedEntries", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) 
            RETURNING "noteID"`,
            rowMode: "array",
            values: [postID, originalID, updater, now, order, transcript, translation, x, y, width, height, imageWidth, imageHeight, 
            imageHash, overlay, addedEntries, removedEntries, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Updates a note (unverified). */
    public static updateUnverifiedNote = async (noteID: string, transcript: string, translation: string, x: number, 
        y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean, reason: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified notes" SET "updatedDate" = $1, "transcript" = $2, "translation" = $3, 
            "x" = $4, "y" = $5, "width" = $6, "height" = $7, "imageWidth" = $8, "imageHeight" = $9, 
            "imageHash" = $10, "overlay" = $11, "reason" = $12, WHERE "noteID" = $13`,
            values: [now, transcript, translation, x, y, width, height, imageWidth, imageHeight, imageHash, overlay, reason, noteID]
        }
        await SQLQuery.run(query)
    }

    /** Get unverified post notes. */
    public static unverifiedPostNotes = async (postID: string) => {
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
        return result as Promise<UnverifiedNote[]>
    }

    /** Get notes (unverified). */
    public static unverifiedNotes = async (postID: string, order: number) => {
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
        return result as Promise<UnverifiedNote[]>
    }

    /** Get note (unverified by id). */
    public static unverifiedNoteID = async (noteID: string) => {
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
        return result[0] as Promise<UnverifiedNote | undefined>
    }

    /** Delete note (unverified). */
    public static deleteUnverifiedNote = async (noteID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified notes" WHERE "unverified notes"."noteID" = $1`),
        values: [noteID]
        }
        await SQLQuery.run(query)
    }

    /** Get notes (unverified). */
    public static allUnverifiedNotes = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images
                    FROM "unverified posts"
                    JOIN "unverified images" ON "unverified images"."postID" = "unverified posts"."postID"
                    GROUP BY "unverified posts"."postID"
                ), 
                note_json AS (
                    SELECT "unverified notes"."postID", "unverified notes"."order", 
                    jsonb_agg("unverified notes") AS data
                    FROM "unverified notes"
                    GROUP BY "unverified notes"."postID", "unverified notes"."order"
                ),
                ranked_notes AS (
                    SELECT "unverified notes"."noteID", "unverified notes"."originalID", "unverified notes"."postID", "unverified notes"."updater", 
                    "unverified notes"."updatedDate", "unverified notes"."order", "unverified notes"."reason", "unverified notes"."addedEntries", 
                    "unverified notes"."removedEntries", note_json.data AS notes, jsonb_array_length(note_json.data) AS "noteCount",
                    to_jsonb((array_agg(post_json))[1]) AS post,
                    ROW_NUMBER() OVER (
                        PARTITION BY note_json.data
                        ORDER BY notes."updatedDate" DESC
                    ) AS "row"
                    FROM "unverified notes"
                    LEFT JOIN post_json ON post_json."postID" = "unverified notes"."postID"
                    LEFT JOIN note_json ON note_json."postID" = "unverified notes"."postID" AND note_json."order" = "unverified notes"."order"
                    GROUP BY "unverified notes"."noteID", "unverified notes"."originalID", "unverified notes"."postID", "unverified notes"."updater", 
                    "unverified notes"."updatedDate", "unverified notes"."order", "unverified notes"."reason", "unverified notes"."addedEntries", 
                    "unverified notes"."removedEntries", note_json.data
                )
                SELECT *
                FROM ranked_notes
                WHERE "row" = 1
                ORDER BY ranked_notes."updatedDate" ASC
                LIMIT 100 ${offset ? `OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedNoteSearch[]>
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
                ), 
                note_json AS (
                    SELECT "unverified notes"."postID", "unverified notes"."order", 
                    jsonb_agg("unverified notes") AS data
                    FROM "unverified notes"
                    GROUP BY "unverified notes"."postID", "unverified notes"."order"
                ),
                ranked_notes AS (
                    SELECT "unverified notes"."noteID", "unverified notes"."originalID", "unverified notes"."postID", "unverified notes"."updater", 
                    "unverified notes"."updatedDate", "unverified notes"."order", "unverified notes"."reason", "unverified notes"."addedEntries", 
                    "unverified notes"."removedEntries", note_json.data AS notes, jsonb_array_length(note_json.data) AS "noteCount",
                    to_jsonb((array_agg(post_json))[1]) AS post,
                    ROW_NUMBER() OVER (
                        PARTITION BY note_json.data
                        ORDER BY notes."updatedDate" DESC
                    ) AS "row"
                    FROM "unverified notes"
                    LEFT JOIN post_json ON post_json."postID" = "unverified notes"."postID"
                    LEFT JOIN note_json ON note_json."postID" = "unverified notes"."postID" AND note_json."order" = "unverified notes"."order"
                    WHERE "unverified notes"."updater" = $1
                    GROUP BY "unverified notes"."noteID", "unverified notes"."originalID", "unverified notes"."postID", "unverified notes"."updater", 
                    "unverified notes"."updatedDate", "unverified notes"."order", "unverified notes"."reason", "unverified notes"."addedEntries", 
                    "unverified notes"."removedEntries", note_json.data
                )
                SELECT *
                FROM ranked_notes
                WHERE "row" = 1
                ORDER BY ranked_notes."updatedDate" ASC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedNoteSearch[]>
    }

    /** Search notes. */
    public static searchNotes = async (search: string, sort: string, offset?: number) => {
        let whereQuery = ""
        let i = 1
        if (search) {
            whereQuery = `WHERE notes.transcript ILIKE '%' || $${i} || '%' OR notes.translation ILIKE '%' || $${i} || '%'`
            i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY ranked_notes."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY ranked_notes."updatedDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images) AS images
                    FROM posts
                    LEFT JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                ), 
                note_json AS (
                    SELECT notes."postID", notes."order", 
                    jsonb_agg(notes) AS data
                    FROM notes
                    GROUP BY notes."postID", notes."order"
                ),
                ranked_notes AS (
                    SELECT notes."noteID", notes."postID", notes."updater", notes."updatedDate",
                    notes."order", note_json.data AS notes, jsonb_array_length(note_json.data) AS "noteCount",
                    users."image", users."imageHash", users."imagePost", users."role", users."banned",
                    to_jsonb((array_agg(post_json))[1]) AS post,
                    ROW_NUMBER() OVER (
                        PARTITION BY note_json.data
                        ORDER BY notes."updatedDate" DESC
                    ) AS "row"
                    FROM notes
                    JOIN users ON users."username" = notes."updater"
                    LEFT JOIN post_json ON post_json."postID" = notes."postID"
                    LEFT JOIN note_json ON note_json."postID" = notes."postID" AND note_json."order" = notes."order"
                    ${whereQuery}
                    GROUP BY notes."noteID", notes."postID", notes."updater", notes."updatedDate", notes."order", note_json.data,
                    users."image", users."imageHash", users."imagePost", users."role", users."banned"
                )
                SELECT *
                FROM ranked_notes
                WHERE "row" = 1
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result as Promise<NoteSearch[]>
    }

    /** Notes by usernames. */
    public static searchNotesByUsername = async (usernames: string[], search: string, sort: string, offset?: number) => {
        let i = 2
        let whereQuery = `WHERE notes."updater" = ANY ($1)`
        if (search) {
            whereQuery = `WHERE notes.transcript ILIKE '%' || $${i} || '%' OR notes.translation ILIKE '%' || $${i} || '%'`
            i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY ranked_notes."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY ranked_notes."updatedDate" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images) AS images
                    FROM posts
                    LEFT JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                ), 
                note_json AS (
                    SELECT notes."postID", notes."order", 
                    jsonb_agg(notes) AS data
                    FROM notes
                    GROUP BY notes."postID", notes."order"
                ),
                ranked_notes AS (
                    SELECT notes."noteID", notes."postID", notes."updater", notes."updatedDate",
                    notes."order", note_json.data AS notes, jsonb_array_length(note_json.data) AS "noteCount",
                    users."image", users."imageHash", users."imagePost", users."role", users."banned",
                    to_jsonb((array_agg(post_json))[1]) AS post,
                    ROW_NUMBER() OVER (
                        PARTITION BY note_json.data
                        ORDER BY notes."updatedDate" DESC
                    ) AS "row"
                    FROM notes
                    JOIN users ON users."username" = notes."updater"
                    LEFT JOIN post_json ON post_json."postID" = notes."postID"
                    LEFT JOIN note_json ON note_json."postID" = notes."postID" AND note_json."order" = notes."order"
                    ${whereQuery}
                    GROUP BY notes."noteID", notes."postID", notes."updater", notes."updatedDate", notes."order", note_json.data,
                    users."image", users."imageHash", users."imagePost", users."role", users."banned"
                )
                SELECT *
                FROM ranked_notes
                WHERE "row" = 1
                ${sortQuery}
                LIMIT 100 ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [usernames]
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query)
        return result as Promise<NoteSearch[]>
    }
}