import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLFavorite {
    /** Insert favorite. */
    public static insertFavorite = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "favorites" ("postID", "username", "favoriteDate") VALUES ($1, $2, $3)`,
        values: [postID, username, new Date().toISOString()]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get favorite. */
    public static favorite = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
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
        text: functions.multiTrim(/*sql*/`
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
        text: functions.multiTrim(/*sql*/`DELETE FROM favorites WHERE favorites."favoriteID" = $1`),
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
        tags?.forEach((tag) => {
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
        text: functions.multiTrim(/*sql*/`
            WITH post_json AS (
            SELECT posts.*, json_agg(DISTINCT images.*) AS images, ${includeTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
            COUNT(DISTINCT favorites."favoriteID") AS "favoriteCount",
            AVG(DISTINCT cuteness."cuteness") AS "cuteness"
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
            'cuteness', post_json."cuteness",
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
            'hidden', post_json."hidden",
            'mirrors', post_json."mirrors",
            'images', (array_agg(post_json."images"))[1]${includeTags ? `,
            'tags', post_json."tags"` : ""}
            ) AS post
            FROM favorites
            JOIN post_json ON post_json."postID" = favorites."postID"
            ${whereQueries ? `WHERE ${whereQueries}` : ""}
            GROUP BY favorites."favoriteID", post_json."postID", post_json."uploader", post_json."updater", ${includeTags ? `post_json."tags",` : ""}
            post_json."type", post_json."restrict", post_json."style", post_json."cuteness", post_json."favoriteCount", post_json."thirdParty", 
            post_json."drawn", post_json."uploadDate", post_json."updatedDate", post_json."title", post_json."hidden", post_json."translatedTitle",
            post_json."artist", post_json."link", post_json."commentary", post_json."translatedCommentary", post_json."bookmarks", post_json."mirrors"
            ${sortQuery}
            ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
        `),
        values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result
    }
}