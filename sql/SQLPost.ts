import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLPost {
    /** Create a new post. */
    public static insertPost = async () => {
        const query: QueryArrayConfig = {
        text: /*sql*/`INSERT INTO "posts" VALUES (default) RETURNING "postID"`,
        rowMode: "array"
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Create a new post (unverified). */
    public static insertUnverifiedPost = async () => {
        const query: QueryArrayConfig = {
        text: /*sql*/`INSERT INTO "unverified posts" VALUES (default) RETURNING "postID"`,
        rowMode: "array"
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Updates a post */
    public static updatePost = async (postID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "posts" SET "${column}" = $1 WHERE "postID" = $2`,
            values: [value, postID]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Bulk updates a post */
    public static bulkUpdatePost = async (postID: number, params: {restrict?: string, style?: string, parentID?: string, 
        title?: string, translatedTitle?: string, artist?: string, posted?: string, link?: string, commentary?: string, 
        translatedCommentary?: string, bookmarks?: string, purchaseLink?: string, mirrors?: string, slug?: string, type?: string, uploadDate?: string, uploader?: string, 
        updatedDate?: string, updater?: string, hidden?: boolean, approver?: string, approveDate?: string, hasOriginal?: boolean, hasUpscaled?: boolean}) => {
        const {restrict, style, parentID, title, translatedTitle, artist, posted, link, commentary, translatedCommentary, bookmarks, 
        purchaseLink, mirrors, slug, type, uploadDate, uploader, updatedDate, updater, hidden, approver, approveDate, hasOriginal, hasUpscaled} = params
        let setArray = [] as any
        let values = [] as any
        let i = 1 
        if (restrict !== undefined) {
            setArray.push(`"restrict" = $${i}`)
            values.push(restrict)
            i++
        }
        if (style !== undefined) {
            setArray.push(`"style" = $${i}`)
            values.push(style)
            i++
        }
        if (parentID !== undefined) {
            setArray.push(`"parentID" = $${i}`)
            values.push(parentID)
            i++
        }
        if (title !== undefined) {
            setArray.push(`"title" = $${i}`)
            values.push(title)
            i++
        }
        if (translatedTitle !== undefined) {
            setArray.push(`"translatedTitle" = $${i}`)
            values.push(translatedTitle)
            i++
        }
        if (artist !== undefined) {
            setArray.push(`"artist" = $${i}`)
            values.push(artist)
            i++
        }
        if (posted !== undefined) {
            setArray.push(`"posted" = $${i}`)
            values.push(posted)
            i++
        }
        if (link !== undefined) {
            setArray.push(`"link" = $${i}`)
            values.push(link)
            i++
        }
        if (commentary !== undefined) {
            setArray.push(`"commentary" = $${i}`)
            values.push(commentary)
            i++
        }
        if (translatedCommentary !== undefined) {
            setArray.push(`"translatedCommentary" = $${i}`)
            values.push(translatedCommentary)
            i++
        }
        if (bookmarks !== undefined) {
            setArray.push(`"bookmarks" = $${i}`)
            values.push(bookmarks)
            i++
        }
        if (purchaseLink !== undefined) {
            setArray.push(`"purchaseLink" = $${i}`)
            values.push(purchaseLink)
            i++
        }
        if (mirrors !== undefined) {
            setArray.push(`"mirrors" = $${i}`)
            values.push(mirrors)
            i++
        }
        if (slug !== undefined) {
            setArray.push(`"slug" = $${i}`)
            values.push(slug)
            i++
        }
        if (type !== undefined) {
            setArray.push(`"type" = $${i}`)
            values.push(type)
            i++
        }
        if (uploadDate !== undefined) {
            setArray.push(`"uploadDate" = $${i}`)
            values.push(uploadDate)
            i++
        }
        if (uploader !== undefined) {
            setArray.push(`"uploader" = $${i}`)
            values.push(uploader)
            i++
        }
        if (updatedDate !== undefined) {
            setArray.push(`"updatedDate" = $${i}`)
            values.push(updatedDate)
            i++
        }
        if (updater !== undefined) {
            setArray.push(`"updater" = $${i}`)
            values.push(updater)
            i++
        }
        if (hidden !== undefined) {
            setArray.push(`"hidden" = $${i}`)
            values.push(hidden)
            i++
        }
        if (hasOriginal !== undefined) {
            setArray.push(`"hasOriginal" = $${i}`)
            values.push(hasOriginal)
            i++
        }
        if (hasUpscaled !== undefined) {
            setArray.push(`"hasUpscaled" = $${i}`)
            values.push(hasUpscaled)
            i++
        }
        if (approver !== undefined) {
            setArray.push(`"approver" = $${i}`)
            values.push(approver)
            i++
        }
        if (approveDate !== undefined) {
            setArray.push(`"approveDate" = $${i}`)
            values.push(approveDate)
            i++
        }
        let setQuery = `SET ${setArray.join(", ")}`
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "posts" ${setQuery} WHERE "postID" = $${i}`,
            values: [...values, postID]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Bulk updates a post (unverified). */
    public static bulkUpdateUnverifiedPost = async (postID: number, params: {restrict?: string, style?: string, parentID?: string, 
        title?: string, translatedTitle?: string, artist?: string, posted?: string, link?: string, commentary?: string, translatedCommentary?: string, 
        bookmarks?: string, purchaseLink?: string, mirrors?: string, slug?: string, type?: string, uploadDate?: string, uploader?: string, updatedDate?: string, updater?: string, 
        duplicates?: boolean, newTags?: number, originalID?: number, reason?: string, hidden?: boolean, hasOriginal?: boolean, hasUpscaled?: boolean, isTranslation?: boolean, 
        addedTags?: string[], removedTags?: string[], imageChanged?: boolean, changes?: any}) => {
        const {restrict, style, parentID, title, translatedTitle, artist, posted, link, commentary, translatedCommentary, bookmarks, purchaseLink, 
        mirrors, slug, type, uploadDate, uploader, updatedDate, updater, duplicates, originalID, newTags, hidden, hasOriginal, hasUpscaled, isTranslation, 
        addedTags, removedTags, imageChanged, changes, reason} = params
        let setArray = [] as any
        let values = [] as any
        let i = 1 
        if (restrict !== undefined) {
            setArray.push(`"restrict" = $${i}`)
            values.push(restrict)
            i++
        }
        if (style !== undefined) {
            setArray.push(`"style" = $${i}`)
            values.push(style)
            i++
        }
        if (parentID !== undefined) {
            setArray.push(`"parentID" = $${i}`)
            values.push(parentID)
            i++
        }
        if (title !== undefined) {
            setArray.push(`"title" = $${i}`)
            values.push(title)
            i++
        }
        if (translatedTitle !== undefined) {
            setArray.push(`"translatedTitle" = $${i}`)
            values.push(translatedTitle)
            i++
        }
        if (artist !== undefined) {
            setArray.push(`"artist" = $${i}`)
            values.push(artist)
            i++
        }
        if (posted !== undefined) {
            setArray.push(`"posted" = $${i}`)
            values.push(posted)
            i++
        }
        if (link !== undefined) {
            setArray.push(`"link" = $${i}`)
            values.push(link)
            i++
        }
        if (commentary !== undefined) {
            setArray.push(`"commentary" = $${i}`)
            values.push(commentary)
            i++
        }
        if (translatedCommentary !== undefined) {
            setArray.push(`"translatedCommentary" = $${i}`)
            values.push(translatedCommentary)
            i++
        }
        if (bookmarks !== undefined) {
            setArray.push(`"bookmarks" = $${i}`)
            values.push(bookmarks)
            i++
        }
        if (purchaseLink !== undefined) {
            setArray.push(`"purchaseLink" = $${i}`)
            values.push(purchaseLink)
            i++
        }
        if (mirrors !== undefined) {
            setArray.push(`"mirrors" = $${i}`)
            values.push(mirrors)
            i++
        }
        if (slug !== undefined) {
            setArray.push(`"slug" = $${i}`)
            values.push(slug)
            i++
        }
        if (type !== undefined) {
            setArray.push(`"type" = $${i}`)
            values.push(type)
            i++
        }
        if (uploadDate !== undefined) {
            setArray.push(`"uploadDate" = $${i}`)
            values.push(uploadDate)
            i++
        }
        if (uploader !== undefined) {
            setArray.push(`"uploader" = $${i}`)
            values.push(uploader)
            i++
        }
        if (updatedDate !== undefined) {
            setArray.push(`"updatedDate" = $${i}`)
            values.push(updatedDate)
            i++
        }
        if (updater !== undefined) {
            setArray.push(`"updater" = $${i}`)
            values.push(updater)
            i++
        }
        if (duplicates !== undefined) {
            setArray.push(`"duplicates" = $${i}`)
            values.push(duplicates)
            i++
        }
        if (newTags !== undefined) {
            setArray.push(`"newTags" = $${i}`)
            values.push(newTags)
            i++
        }
        if (originalID !== undefined) {
            setArray.push(`"originalID" = $${i}`)
            values.push(originalID)
            i++
        }
        if (hidden !== undefined) {
            setArray.push(`"hidden" = $${i}`)
            values.push(hidden)
            i++
        }
        if (hasOriginal !== undefined) {
            setArray.push(`"hasOriginal" = $${i}`)
            values.push(hasOriginal)
            i++
        }
        if (hasUpscaled !== undefined) {
            setArray.push(`"hasUpscaled" = $${i}`)
            values.push(hasUpscaled)
            i++
        }
        if (isTranslation !== undefined) {
            setArray.push(`"isTranslation" = $${i}`)
            values.push(isTranslation)
            i++
        }
        if (addedTags !== undefined) {
            setArray.push(`"addedTags" = $${i}`)
            values.push(addedTags)
            i++
        }
        if (removedTags !== undefined) {
            setArray.push(`"removedTags" = $${i}`)
            values.push(removedTags)
            i++
        }
        if (imageChanged !== undefined) {
            setArray.push(`"imageChanged" = $${i}`)
            values.push(imageChanged)
            i++
        }
        if (changes !== undefined) {
            setArray.push(`"changes" = $${i}`)
            values.push(changes)
            i++
        }
        if (reason !== undefined) {
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
            text: /*sql*/`UPDATE "unverified posts" SET "${column}" = $1 WHERE "postID" = $2`,
            values: [value, postID]
        }
        return SQLQuery.run(query)
    }

    /** Insert a new image. */
    public static insertImage = async (postID: number, filename: string, upscaledFilename: string, type: string, order: number, hash: string, width: string, height: string, size: number) => {
        const query: QueryArrayConfig = {
        text: /*sql*/`INSERT INTO "images" ("postID", "filename", "upscaledFilename", "type", "order", "hash", "width", "height", "size") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING "imageID"`,
        rowMode: "array",
        values: [postID, filename, upscaledFilename, type, order, hash, width, height, size]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Insert a new image (unverified). */
    public static insertUnverifiedImage = async (postID: number, filename: string, upscaledFilename: string, type: string, order: number, hash: string, width: string, height: string, size: string) => {
        const query: QueryArrayConfig = {
        text: /*sql*/`INSERT INTO "unverified images" ("postID", "filename", "upscaledFilename", "type", "order", "hash", "width", "height", "size") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING "imageID"`,
        rowMode: "array",
        values: [postID, filename, upscaledFilename, type, order, hash, width, height, size]
        }
        const result = await SQLQuery.run(query)
        return result.flat(Infinity)[0] as number
    }

    /** Updates an image */
    public static updateImage = async (imageID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "images" SET "${column}" = $1 WHERE "imageID" = $2`,
            values: [value, imageID]
        }
        await SQLQuery.flushDB()
        return SQLQuery.run(query)
    }

    /** Updates an image (unverified) */
    public static updateUnverifiedImage = async (imageID: number, column: string, value: string | number | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified images" SET "${column}" = $1 WHERE "imageID" = $2`,
            values: [value, imageID]
        }
        return SQLQuery.run(query)
    }

    /** Delete an image. */
    public static deleteImage = async (imageID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM images WHERE images."imageID" = $1`),
        values: [imageID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete an image (unverified). */
    public static deleteUnverifiedImage = async (imageID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified images" WHERE "unverified images"."imageID" = $1`),
        values: [imageID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get post. */
    public static post = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags,
            COUNT(DISTINCT favorites."username") AS "favoriteCount",
            ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
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
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Get post (unverified). */
    public static unverifiedPost = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags
            FROM "unverified posts"
            LEFT JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            LEFT JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
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
        text: functions.multiTrim(/*sql*/`
            SELECT json_agg(json_build_object('tag', "tags".tag, 'type', "tags".type, 'image', "tags".image, 'social', "tags".social, 'twitter', "tags".twitter)) AS tags
            FROM "tag map"
            JOIN tags ON "tag map".tag = "tags".tag
            WHERE "tag map"."postID" = $1
            GROUP BY "tag map"."postID"
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Delete post. */
    public static deletePost = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM posts WHERE posts."postID" = $1`),
        values: [postID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete post (unverified). */
    public static deleteUnverifiedPost = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified posts" WHERE "unverified posts"."postID" = $1`),
        values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert child relation. */
    public static insertChild = async (postID: number, parentID: number) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "child posts" ("postID", "parentID") VALUES ($1, $2)`,
        values: [postID, parentID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert child relation (unverified). */
    public static insertUnverifiedChild = async (postID: number, parentID: number) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "unverified child posts" ("postID", "parentID") VALUES ($1, $2)`,
        values: [postID, parentID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete child relation. */
    public static deleteChild = async (postID: number) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "child posts" WHERE "child posts"."postID" = $1`,
        values: [postID]
        }
        await SQLQuery.flushDB()
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete child relation (unverified). */
    public static deleteUnverifiedChild = async (postID: number) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "unverified child posts" WHERE "unverified child posts"."postID" = $1`,
        values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get child posts. */
    public static childPosts = async (parentID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    GROUP BY posts."postID"
                )
                SELECT "child posts".*, 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "child posts"
                JOIN post_json ON post_json."postID" = "child posts"."postID"
                WHERE "child posts"."parentID" = $1
                GROUP BY "child posts"."childID"
            `),
        values: [parentID]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get child posts (unverified). */
    public static unverifiedChildPosts = async (parentID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    GROUP BY posts."postID"
                )
                SELECT "unverified child posts".*, 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "unverified child posts"
                JOIN post_json ON post_json."postID" = "unverified child posts"."postID"
                WHERE "unverified child posts"."parentID" = $1
                GROUP BY "unverified child posts"."childID"
            `),
        values: [parentID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get the parent of a child post. */
    public static parent = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    GROUP BY posts."postID"
                )
                SELECT "child posts".*, 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "child posts"
                JOIN post_json ON post_json."postID" = "child posts"."parentID"
                WHERE "child posts"."postID" = $1
                GROUP BY "child posts"."childID"
            `),
        values: [postID]
        }
        const result = await SQLQuery.run(query, true)
        return result[0]
    }

    /** Get the parent of a child post (unverified). */
    public static unverifiedParent = async (postID: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    GROUP BY posts."postID"
                )
                SELECT "unverified child posts".*, 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM "unverified child posts"
                JOIN post_json ON post_json."postID" = "unverified child posts"."parentID"
                WHERE "unverified child posts"."postID" = $1
                GROUP BY "unverified child posts"."childID"
            `),
        values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }
}