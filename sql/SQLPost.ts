import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {PostFull, UnverifiedPost, MiniTag, ChildPost} from "../types/Types"

export default class SQLPost {
    /** Create a new post. */
    public static insertPost = async () => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "posts" VALUES (default) RETURNING "postID"`,
            rowMode: "array"
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Create a new post (unverified). */
    public static insertUnverifiedPost = async () => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "unverified posts" VALUES (default) RETURNING "postID"`,
            rowMode: "array"
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Updates a post */
    public static updatePost = async (postID: string, column: "type" | "hidden" | "locked" | "private" | "deleted" 
        | "deletionDate", value: string | number | boolean | null) => {
        let whitelist = ["type", "hidden", "locked", "private", "deleted", "deletionDate"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "posts" SET "${column}" = $1 WHERE "postID" = $2`,
            values: [value, postID]
        }
        await SQLQuery.run(query)
    }

    /** Bulk updates a post */
    public static bulkUpdatePost = async (postID: string, params: {rating?: string, style?: string, parentID?: string | null, 
        title?: string | null, englishTitle?: string | null, artist?: string | null, posted?: string | null, source?: string | null, commentary?: string | null, 
        englishCommentary?: string | null, bookmarks?: number | null, buyLink?: string | null, mirrors?: string | null, slug?: string, type?: string, 
        uploadDate?: string, uploader?: string, updatedDate?: string, updater?: string, hidden?: boolean, approver?: string, 
        approveDate?: string, hasOriginal?: boolean, hasUpscaled?: boolean}) => {
        const {rating, style, parentID, title, englishTitle, artist, posted, source, commentary, englishCommentary, bookmarks, 
        buyLink, mirrors, slug, type, uploadDate, uploader, updatedDate, updater, hidden, approver, approveDate, hasOriginal, 
        hasUpscaled} = params
        let setArray = [] as any
        let values = [] as any
        let i = 1 
        if (rating !== undefined) {
            setArray.push(`"rating" = $${i}`)
            values.push(rating)
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
        if (englishTitle !== undefined) {
            setArray.push(`"englishTitle" = $${i}`)
            values.push(englishTitle)
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
        if (source !== undefined) {
            setArray.push(`"source" = $${i}`)
            values.push(source)
            i++
        }
        if (commentary !== undefined) {
            setArray.push(`"commentary" = $${i}`)
            values.push(commentary)
            i++
        }
        if (englishCommentary !== undefined) {
            setArray.push(`"englishCommentary" = $${i}`)
            values.push(englishCommentary)
            i++
        }
        if (bookmarks !== undefined) {
            setArray.push(`"bookmarks" = $${i}`)
            values.push(bookmarks)
            i++
        }
        if (buyLink !== undefined) {
            setArray.push(`"buyLink" = $${i}`)
            values.push(buyLink)
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
        await SQLQuery.run(query)
    }

    /** Bulk updates a post (unverified). */
    public static bulkUpdateUnverifiedPost = async (postID: string, params: {rating?: string, style?: string, parentID?: string | null, 
        title?: string | null, englishTitle?: string | null, artist?: string | null, posted?: string | null, source?: string | null, commentary?: string | null, 
        englishCommentary?: string | null, bookmarks?: number | null, buyLink?: string | null, mirrors?: string | null, slug?: string, type?: string, 
        uploadDate?: string, uploader?: string, updatedDate?: string, updater?: string, duplicates?: boolean, newTags?: number, originalID?: string | null, 
        reason?: string | null, hidden?: boolean, hasOriginal?: boolean, hasUpscaled?: boolean, isNote?: boolean, addedTags?: string[], removedTags?: string[], 
        addedTagGroups?: string[], removedTagGroups?: string[], imageChanged?: boolean, changes?: any}) => {
        const {rating, style, parentID, title, englishTitle, artist, posted, source, commentary, englishCommentary, bookmarks, buyLink, 
        mirrors, slug, type, uploadDate, uploader, updatedDate, updater, duplicates, originalID, newTags, hidden, hasOriginal, hasUpscaled, 
        isNote, addedTags, removedTags, addedTagGroups, removedTagGroups, imageChanged, changes, reason} = params
        let setArray = [] as any
        let values = [] as any
        let i = 1 
        if (rating !== undefined) {
            setArray.push(`"rating" = $${i}`)
            values.push(rating)
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
        if (englishTitle !== undefined) {
            setArray.push(`"englishTitle" = $${i}`)
            values.push(englishTitle)
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
        if (source !== undefined) {
            setArray.push(`"source" = $${i}`)
            values.push(source)
            i++
        }
        if (commentary !== undefined) {
            setArray.push(`"commentary" = $${i}`)
            values.push(commentary)
            i++
        }
        if (englishCommentary !== undefined) {
            setArray.push(`"englishCommentary" = $${i}`)
            values.push(englishCommentary)
            i++
        }
        if (bookmarks !== undefined) {
            setArray.push(`"bookmarks" = $${i}`)
            values.push(bookmarks)
            i++
        }
        if (buyLink !== undefined) {
            setArray.push(`"buyLink" = $${i}`)
            values.push(buyLink)
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
        if (isNote !== undefined) {
            setArray.push(`"isNote" = $${i}`)
            values.push(isNote)
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
        if (addedTagGroups !== undefined) {
            setArray.push(`"addedTagGroups" = $${i}`)
            values.push(addedTagGroups)
            i++
        }
        if (removedTagGroups !== undefined) {
            setArray.push(`"removedTagGroups" = $${i}`)
            values.push(removedTagGroups)
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
        await SQLQuery.run(query)
    }

    /** Updates a post (unverified) */
    public static updateUnverifiedPost = async (postID: string, column: "hasUpscaled" | "deleted" | "deletionDate" |
        "appealed" | "appealer" | "appealReason", value: string | number | boolean | null) => {
        let whitelist = ["hasUpscaled", "deleted", "deletionDate", "appealed", "appealer", "appealReason"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified posts" SET "${column}" = $1 WHERE "postID" = $2`,
            values: [value, postID]
        }
        await SQLQuery.run(query)
    }

    /** Insert a new image. */
    public static insertImage = async (postID: string, filename: string | null, upscaledFilename: string | null, 
        type: string, order: number, hash: string, pixelHash: string, width: number | null, height: number | null, 
        upscaledWidth: number | null, upscaledHeight: number | null, size: number | null, upscaledSize: number | null, 
        duration: number | null, thumbnail: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "images" ("postID", "filename", "upscaledFilename", "type", "order", "hash", 
            "pixelHash", "width", "height", "upscaledWidth", "upscaledHeight", "size", "upscaledSize", "duration", 
            "thumbnail") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING "imageID"`,
            rowMode: "array",
            values: [postID, filename, upscaledFilename, type, order, hash, pixelHash, width, height, upscaledWidth, upscaledHeight, 
            size, upscaledSize, duration, thumbnail]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Insert a new image (unverified). */
    public static insertUnverifiedImage = async (postID: string, filename: string | null, upscaledFilename: string | null, 
        type: string, order: number, hash: string, pixelHash: string, width: number | null, height: number | null, 
        upscaledWidth: number | null, upscaledHeight: number | null, size: number | null, upscaledSize: number | null, 
        duration: number | null, thumbnail: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "unverified images" ("postID", "filename", "upscaledFilename", "type", "order", "hash", 
            "pixelHash", "width", "height", "upscaledWidth", "upscaledHeight", "size", "upscaledSize", "duration", "thumbnail") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING "imageID"`,
            rowMode: "array",
            values: [postID, filename, upscaledFilename, type, order, hash, pixelHash, width, height, upscaledWidth, upscaledHeight, 
            size, upscaledSize, duration, thumbnail]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Updates an image */
    public static updateImage = async (imageID: string, column: "hash" | "type" | "thumbnail", value: string | number | boolean) => {
        let whitelist = ["hash", "type", "thumbnail"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "images" SET "${column}" = $1 WHERE "imageID" = $2`,
            values: [value, imageID]
        }
        await SQLQuery.run(query)
    }

    /** Updates an image (unverified) */
    public static updateUnverifiedImage = async (imageID: string, column: "filename" | "thumbnail", value: string | number | boolean) => {
        let whitelist = ["filename", "thumbnail"]
        if (!whitelist.includes(column)) {
            return Promise.reject(`Invalid column: ${column}`)
        }
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "unverified images" SET "${column}" = $1 WHERE "imageID" = $2`,
            values: [value, imageID]
        }
        await SQLQuery.run(query)
    }

    /** Delete an image. */
    public static deleteImage = async (imageID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM images WHERE images."imageID" = $1`),
        values: [imageID]
        }
        await SQLQuery.run(query)
    }

    /** Delete an image (unverified). */
    public static deleteUnverifiedImage = async (imageID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified images" WHERE "unverified images"."imageID" = $1`),
        values: [imageID]
        }
        await SQLQuery.run(query)
    }

    /** Get post. */
    public static post = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH tag_groups_json AS (
                SELECT "tag group tags"."name", "tag group tags"."postID", "tag group tags"."tags"
                FROM "tag group tags"
            )
            SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags,
            COUNT(DISTINCT favorites."username") AS "favoriteCount",
            ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness",
            json_agg(DISTINCT tag_groups_json.*) AS "tagGroups"
            FROM posts
            JOIN images ON posts."postID" = images."postID"
            JOIN "tag map" ON posts."postID" = "tag map"."postID"
            LEFT JOIN tag_groups_json ON posts."postID" = tag_groups_json."postID"
            LEFT JOIN "favorites" ON posts."postID" = "favorites"."postID"
            LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
            LEFT JOIN "tag group map" ON "tag map"."mapID" = "tag group map"."tagMapID"
            LEFT JOIN "tag groups" ON "tag group map"."groupID" = "tag groups"."groupID"
            WHERE posts."postID" = $1
            GROUP BY posts."postID"
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query, `post/${postID}`)
        return result[0] as Promise<PostFull | undefined>
    }

    /** Get post (unverified). */
    public static unverifiedPost = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH tag_groups_json AS (
                SELECT "unverified tag groups".name, "unverified tag groups"."postID",
                jsonb_agg(DISTINCT "unverified tag map".tag) AS tags
                FROM "unverified tag groups"
                JOIN "unverified tag group map" ON "unverified tag group map"."groupID" = "unverified tag groups"."groupID"
                JOIN "unverified tag map" ON "unverified tag map"."mapID" = "unverified tag group map"."tagMapID"
                WHERE "unverified tag groups"."groupID" = "unverified tag group map"."groupID"
                GROUP BY "unverified tag groups"."groupID"
            )
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            json_agg(DISTINCT tag_groups_json.*) AS "tagGroups"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            LEFT JOIN tag_groups_json ON "unverified posts"."postID" = tag_groups_json."postID"
            LEFT JOIN "unverified tag group map" ON "unverified tag map"."mapID" = "unverified tag group map"."tagMapID"
            LEFT JOIN "unverified tag groups" ON "unverified tag group map"."groupID" = "unverified tag groups"."groupID"
            WHERE "unverified posts"."postID" = $1
            GROUP BY "unverified posts"."postID"
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query)
        return result[0] as Promise<UnverifiedPost | undefined>
    }

    /** Get post tags. */
    public static postTags = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT json_agg(json_build_object('tag', "tags".tag, 'type', "tags".type, 'image', "tags".image, 'imageHash', "tags"."imageHash", 
            'description', "tags".description, 'social', "tags".social, 'twitter', "tags".twitter, 'website', "tags".website, 'fandom', 
            "tags".fandom, 'wikipedia', "tags".wikipedia)) AS tags
            FROM "tag map"
            JOIN tags ON "tag map".tag = "tags".tag
            WHERE "tag map"."postID" = $1
            GROUP BY "tag map"."postID"
            `),
            values: [postID]
        }
        const result = await SQLQuery.run(query, `post/tags/${postID}`)
        return (result[0]?.tags || []) as Promise<MiniTag[]>
    }

    /** Delete post. */
    public static deletePost = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM posts WHERE posts."postID" = $1`),
        values: [postID]
        }
        await SQLQuery.run(query)
    }

    /** Delete post (unverified). */
    public static deleteUnverifiedPost = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM "unverified posts" WHERE "unverified posts"."postID" = $1`),
        values: [postID]
        }
        await SQLQuery.run(query)
    }

    /** Insert child relation. */
    public static insertChild = async (postID: string, parentID: string) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "child posts" ("postID", "parentID") VALUES ($1, $2) RETURNING "childID"`,
            rowMode: "array",
            values: [postID, parentID]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Insert child relation (unverified). */
    public static insertUnverifiedChild = async (postID: string, parentID: string) => {
        const query: QueryArrayConfig = {
        text: /*sql*/`INSERT INTO "unverified child posts" ("postID", "parentID") VALUES ($1, $2) RETURNING "childID"`,
        rowMode: "array",
        values: [postID, parentID]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete child relation. */
    public static deleteChild = async (postID: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "child posts" WHERE "child posts"."postID" = $1`,
        values: [postID]
        }
        await SQLQuery.run(query)
    }

    /** Delete child relation (unverified). */
    public static deleteUnverifiedChild = async (postID: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "unverified child posts" WHERE "unverified child posts"."postID" = $1`,
        values: [postID]
        }
        await SQLQuery.run(query)
    }

    /** Get child posts. */
    public static childPosts = async (parentID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
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
        const result = await SQLQuery.run(query, `post/children/${parentID}`)
        return result as Promise<ChildPost[]>
    }

    /** Get child posts (unverified). */
    public static unverifiedChildPosts = async (parentID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
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
        return result as Promise<ChildPost[]>
    }

    /** Get the parent of a child post. */
    public static parent = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
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
        const result = await SQLQuery.run(query, `post/parent/${postID}`)
        return result[0] as Promise<ChildPost | undefined>
    }

    /** Get the parent of a child post (unverified). */
    public static unverifiedParent = async (postID: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
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
        return result[0] as Promise<ChildPost | undefined>
    }
}