/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../functions/Functions"
import {Note, NoteSearch, NoteUpdateColumns, UnverifiedNote, UnverifiedNoteSearch} from "../types/Types"

export default class SQLNote {
    /** Insert note. */
    public static insertNote = async (postID: string, updater: string, order: number, transcript: string, translation: string,
        x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean, fontSize: number, backgroundColor: string, textColor: string, fontFamily: string, backgroundAlpha: number,
        bold: boolean, italic: boolean, strokeColor: string, strokeWidth: number, breakWord: boolean, rotation: number, borderRadius: number,
        character: boolean, characterTag: string | null) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO "notes" ("postID", "updater", "updatedDate", "order", "transcript", "translation", "x", "y", 
                "width", "height", "imageWidth", "imageHeight", "imageHash", "overlay", "fontSize", "backgroundColor", "textColor",
                "fontFamily", "backgroundAlpha", "bold", "italic", "strokeColor", "strokeWidth", "breakWord", "rotation", "borderRadius",
                "character", "characterTag") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25,
                $26, $27, $28) 
                RETURNING "noteID"
            `),
            rowMode: "array",
            values: [postID, updater, now, order, transcript, translation, x, y, width, height, imageWidth, imageHeight, imageHash, overlay,
            fontSize, backgroundColor, textColor, fontFamily, backgroundAlpha, bold, italic, strokeColor, strokeWidth, breakWord, rotation,
            borderRadius, character, characterTag]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Resaves a note. */
    public static resaveNote = async (noteID: string, updater: string, transcript: string, translation: string,
        x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean, fontSize: number, backgroundColor: string, textColor: string, fontFamily: string, backgroundAlpha: number,
        bold: boolean, italic: boolean, strokeColor: string, strokeWidth: number, breakWord: boolean, rotation: number, borderRadius: number,
        character: boolean, characterTag: string | null) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "notes" SET "updater" = $1, "updatedDate" = $2, "transcript" = $3, "translation" = $4, "x" = $5, "y" = $6, 
            "width" = $7, "height" = $8, "imageWidth" = $9, "imageHeight" = $10, "imageHash" = $11, "overlay" = $12, "fontSize" = $13, 
            "backgroundColor" = $14, "textColor" = $15, "fontFamily" = $16, "backgroundAlpha" = $17, "bold" = $18, "italic" = $19, 
            "strokeColor" = $20, "strokeWidth" = $21, "breakWord" = $22, "rotation" = $23, "borderRadius" = $24, "character" = $25,
            "characterTag" = $26 WHERE "noteID" = $27`,
            values: [updater, now, transcript, translation, x, y, width, height, imageWidth, imageHeight, imageHash, overlay, fontSize,
            backgroundColor, textColor, fontFamily, backgroundAlpha, bold, italic, strokeColor, strokeWidth, breakWord, rotation, 
            borderRadius, character, characterTag, noteID]
        }
        await SQLQuery.run(query)
    }

    /** Updates a note */
    public static updateNote = async (noteID: string, column: NoteUpdateColumns, value: string | number | boolean) => {
        let whitelist = ["order", "transcript", "translation", "x", "y", "width", "height", "rotation", 
            "imageWidth", "imageHeight", "imageHash", "overlay", "fontSize", "fontFamily", "bold", "italic",
            "textColor", "backgroundColor", "backgroundAlpha", "strokeColor", "strokeWidth", "breakWord", "borderRadius",
            "character", "characterTag"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "notes" SET "${column}" = $1 WHERE "noteID" = $2`,
            values: [value, noteID]
        }
        await SQLQuery.run(query)
    }

    /** Updates a note (unverified) */
    public static updateUnverifiedNote = async (noteID: string, column: "order", value: string | number | boolean) => {
        let whitelist = ["order"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified notes" SET "${column}" = $1 WHERE "noteID" = $2`,
            values: [value, noteID]
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

    /** Get note. */
    public static note = async (noteID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT notes.*
                FROM notes
                WHERE notes."noteID" = $1
                GROUP BY notes."noteID"
            `),
            values: [noteID]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<Note | undefined>
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
    public static insertUnverifiedNote = async (postID: string, originalID: string | null, updater: string, order: number, transcript: string, 
        translation: string, x: number, y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean, fontSize: number, backgroundColor: string, textColor: string, fontFamily: string, backgroundAlpha: number,
        bold: boolean, italic: boolean, strokeColor: string, strokeWidth: number, breakWord: boolean, rotation: number, borderRadius: number,
        character: boolean, characterTag: string | null, addedEntries: any, removedEntries: any, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryArrayConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO "unverified notes" ("postID", "originalID", "updater", "updatedDate", "order", "transcript", "translation", 
                "x", "y", "width", "height", "imageWidth", "imageHeight", "imageHash", "overlay", "fontSize", "backgroundColor", "textColor", 
                "fontFamily", "backgroundAlpha", "bold", "italic", "strokeColor", "strokeWidth", "breakWord", "rotation", "borderRadius", 
                "character", "characterTag", "addedEntries", "removedEntries", "reason") 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32) 
                RETURNING "noteID"
            `),
            rowMode: "array",
            values: [postID, originalID, updater, now, order, transcript, translation, x, y, width, height, imageWidth, imageHeight, 
            imageHash, overlay, fontSize, backgroundColor, textColor, fontFamily, backgroundAlpha, bold, italic, strokeColor, strokeWidth, 
            breakWord, rotation, borderRadius, character, characterTag, addedEntries, removedEntries, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Updates a note (unverified). */
    public static resaveUnverifiedNote = async (noteID: string, transcript: string, translation: string, x: number, 
        y: number, width: number, height: number, imageWidth: number, imageHeight: number, imageHash: string,
        overlay: boolean, fontSize: number, backgroundColor: string, textColor: string, fontFamily: string, backgroundAlpha: number,
        bold: boolean, italic: boolean, strokeColor: string, strokeWidth: number, breakWord: boolean, rotation: number, borderRadius: number,
        character: boolean, characterTag: string | null, reason?: string) => {
        const now = new Date().toISOString()
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified notes" SET "updatedDate" = $1, "transcript" = $2, "translation" = $3, 
            "x" = $4, "y" = $5, "width" = $6, "height" = $7, "imageWidth" = $8, "imageHeight" = $9, 
            "imageHash" = $10, "overlay" = $11, "fontSize" = $12, "backgroundColor" = $13, "textColor" = $14, "fontFamily" = $15,
            "backgroundAlpha" = $16, "bold" = $17, "italic" = $18, "strokeColor" = $19, "strokeWidth" = $20, "breakWord" = $21, 
            "rotation" = $22, "borderRadius" = $23, "character" = $24, "characterTag" = $25, "reason" = $26 WHERE "noteID" = $27`,
            values: [now, transcript, translation, x, y, width, height, imageWidth, imageHeight, imageHash, overlay, fontSize,
            backgroundColor, textColor, fontFamily, backgroundAlpha, bold, italic, strokeColor, strokeWidth, breakWord, rotation,
            borderRadius, character, characterTag, reason, noteID]
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
                WITH base_notes AS (
                    SELECT DISTINCT ON ("unverified notes"."postID", "unverified notes"."order")
                        "unverified notes"."noteID", "unverified notes"."postID", "unverified notes"."order", 
                        "unverified notes"."updatedDate", "unverified notes"."updater"
                    FROM "unverified notes"
                    ORDER BY "unverified notes"."postID", "unverified notes"."order", "unverified notes"."updatedDate" DESC
                ),
                post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images) AS images
                    FROM posts
                    LEFT JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                ), 
                note_json AS (
                    SELECT "unverified notes"."postID", "unverified notes"."order", 
                    jsonb_agg("unverified notes") AS data
                    FROM "unverified notes"
                    JOIN base_notes ON base_notes."postID" = "unverified notes"."postID" AND base_notes."order" = "unverified notes"."order"
                    GROUP BY "unverified notes"."postID", "unverified notes"."order"
                )
                SELECT base_notes."noteID", base_notes."postID", base_notes."updater", base_notes."updatedDate",
                base_notes."order", note_json.data AS notes,
                users."image", users."imageHash", users."imagePost", 
                users."role", users."premium", users."banned", users."deleted",
                to_jsonb(post_json) AS post,
                COUNT(*) OVER () AS "noteCount"
                FROM base_notes
                JOIN users ON users."username" = base_notes."updater"
                LEFT JOIN post_json ON post_json."postID" = base_notes."postID"
                LEFT JOIN note_json ON note_json."postID" = base_notes."postID" AND note_json."order" = base_notes."order"
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
                WITH base_notes AS (
                    SELECT DISTINCT ON ("unverified notes"."postID", "unverified notes"."order")
                        "unverified notes"."noteID", "unverified notes"."postID", "unverified notes"."order", 
                        "unverified notes"."updatedDate", "unverified notes"."updater"
                    FROM "unverified notes"
                    WHERE "unverified notes"."updater" = ANY ($1)
                    ORDER BY "unverified notes"."postID", "unverified notes"."order", "unverified notes"."updatedDate" DESC
                ),
                post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images) AS images
                    FROM posts
                    LEFT JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                ), 
                note_json AS (
                    SELECT "unverified notes"."postID", "unverified notes"."order", 
                    jsonb_agg("unverified notes") AS data
                    FROM "unverified notes"
                    JOIN base_notes ON base_notes."postID" = "unverified notes"."postID" AND base_notes."order" = "unverified notes"."order"
                    GROUP BY "unverified notes"."postID", "unverified notes"."order"
                )
                SELECT base_notes."noteID", base_notes."postID", base_notes."updater", base_notes."updatedDate",
                base_notes."order", note_json.data AS notes,
                users."image", users."imageHash", users."imagePost", 
                users."role", users."premium", users."banned", users."deleted",
                to_jsonb(post_json) AS post,
                COUNT(*) OVER () AS "noteCount"
                FROM base_notes
                JOIN users ON users."username" = base_notes."updater"
                LEFT JOIN post_json ON post_json."postID" = base_notes."postID"
                LEFT JOIN note_json ON note_json."postID" = base_notes."postID" AND note_json."order" = base_notes."order"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedNoteSearch[]>
    }

    /** Search notes. */
    public static searchNotes = async (search: string, sort: string, offset?: number, limit?: number) => {
        let whereQuery = ""
        let i = 1
        if (search) {
            whereQuery = `WHERE notes.transcript ILIKE '%' || $${i} || '%' OR notes.translation ILIKE '%' || $${i} || '%'`
            i++
        }
        let offsetValue = i
        if (offset) {
            i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY base_notes."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY base_notes."updatedDate" ASC`
        const query: QueryConfig = {
                text: functions.multiTrim(/*sql*/`
                WITH base_notes AS (
                    SELECT DISTINCT ON (notes."postID", notes."order")
                        notes."noteID", notes."postID", notes."order", notes."updatedDate", notes."updater"
                    FROM notes
                    ${whereQuery}
                    ORDER BY notes."postID", notes."order", notes."updatedDate" DESC
                ),
                post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images) AS images
                    FROM posts
                    LEFT JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                ), 
                note_json AS (
                    SELECT notes."postID", notes."order", 
                    jsonb_agg(notes) AS data
                    FROM notes
                    JOIN base_notes ON base_notes."postID" = notes."postID" AND base_notes."order" = notes."order"
                    GROUP BY notes."postID", notes."order"
                )
                SELECT base_notes."noteID", base_notes."postID", base_notes."updater", base_notes."updatedDate",
                base_notes."order", note_json.data AS notes,
                users."image", users."imageHash", users."imagePost", 
                users."role", users."premium", users."banned", users."deleted",
                to_jsonb(post_json) AS post,
                COUNT(*) OVER () AS "noteCount"
                FROM base_notes
                JOIN users ON users."username" = base_notes."updater"
                LEFT JOIN post_json ON post_json."postID" = base_notes."postID"
                LEFT JOIN note_json ON note_json."postID" = base_notes."postID" AND note_json."order" = base_notes."order"
                ${sortQuery}
                LIMIT ${limit ? `$${i}` : 100} ${offset ? `OFFSET $${offsetValue}` : ""}
            `),
            values: []
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        if (limit) query.values?.push(limit)
        const result = await SQLQuery.run(query)
        return result as Promise<NoteSearch[]>
    }

    /** Notes by usernames. */
    public static searchNotesByUsername = async (usernames: string[], search: string, sort: string, offset?: number, limit?: number) => {
        let i = 2
        let whereQuery = `WHERE notes."updater" = ANY ($1)`
        if (search) {
            whereQuery += `AND (notes.transcript ILIKE '%' || $${i} || '%' OR notes.translation ILIKE '%' || $${i} || '%')`
            i++
        }
        let offsetValue = i
        if (offset) {
            i++
        }
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY notes."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY notes."updatedDate" ASC`
        const query: QueryConfig = {
                text: functions.multiTrim(/*sql*/`
                WITH base_notes AS (
                    SELECT DISTINCT ON (notes."postID", notes."order")
                        notes."noteID", notes."postID", notes."order", notes."updatedDate", notes."updater"
                    FROM notes
                    ${whereQuery}
                    ORDER BY notes."postID", notes."order", notes."updatedDate" DESC
                ),
                post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images) AS images
                    FROM posts
                    LEFT JOIN images ON images."postID" = posts."postID"
                    GROUP BY posts."postID"
                ), 
                note_json AS (
                    SELECT notes."postID", notes."order", 
                    jsonb_agg(notes) AS data
                    FROM notes
                    JOIN base_notes ON base_notes."postID" = notes."postID" AND base_notes."order" = notes."order"
                    GROUP BY notes."postID", notes."order"
                )
                SELECT base_notes."noteID", base_notes."postID", base_notes."updater", base_notes."updatedDate",
                base_notes."order", note_json.data AS notes,
                users."image", users."imageHash", users."imagePost", 
                users."role", users."premium", users."banned", users."deleted",
                to_jsonb(post_json) AS post,
                COUNT(*) OVER () AS "noteCount"
                FROM base_notes
                JOIN users ON users."username" = base_notes."updater"
                LEFT JOIN post_json ON post_json."postID" = base_notes."postID"
                LEFT JOIN note_json ON note_json."postID" = base_notes."postID" AND note_json."order" = base_notes."order"
                ${sortQuery}
                LIMIT ${limit ? `$${i}` : 100} ${offset ? `OFFSET $${offsetValue}` : ""}
            `),
            values: [usernames]
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        if (limit) query.values?.push(limit)
        const result = await SQLQuery.run(query)
        return result as Promise<NoteSearch[]>
    }

    /** Rename character notes. */
    public static renameCharacterNotes = async (tag: string, newTag: string) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "notes" SET "characterTag" = $1 WHERE "characterTag" = $2`,
            values: [newTag, tag]
        }
        await SQLQuery.run(query)
    }
}