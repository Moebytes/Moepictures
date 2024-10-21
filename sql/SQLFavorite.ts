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
                SELECT favorites.*, 
                to_json((array_agg(post_json.*))[1]) AS post
                FROM favorites
                JOIN post_json ON post_json."postID" = favorites."postID"
                WHERE favorites."postID" = $1 AND favorites."username" = $2
                GROUP BY favorites."postID", favorites."username"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get favorites. */
    public static favorites = async (username: string, limit?: string, offset?: string, type?: string, restrict?: string, style?: string, sort?: string, sessionUsername?: string) => {
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
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY posts."uploadDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY posts."uploadDate" ASC`
        if (sort === "drawn") sortQuery = `ORDER BY posts.drawn DESC NULLS LAST`
        if (sort === "reverse drawn") sortQuery = `ORDER BY posts.drawn ASC NULLS LAST`
        if (sort === "cuteness") sortQuery = `ORDER BY "cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY "cuteness" ASC`
        if (sort === "popularity") sortQuery = `ORDER BY "favoriteCount" DESC`
        if (sort === "reverse popularity") sortQuery = `ORDER BY "favoriteCount" ASC`
        if (sort === "variations") sortQuery = `ORDER BY "imageCount" DESC`
        if (sort === "reverse variations") sortQuery = `ORDER BY "imageCount" ASC`
        if (sort === "thirdparty") sortQuery = `ORDER BY posts."thirdParty" DESC NULLS LAST`
        if (sort === "reverse thirdparty") sortQuery = `ORDER BY posts."thirdParty" ASC NULLS LAST`
        if (sort === "tagcount") sortQuery = `ORDER BY "tagCount" DESC`
        if (sort === "reverse tagcount") sortQuery = `ORDER BY "tagCount" ASC`
        if (sort === "filesize") sortQuery = `ORDER BY "imageSize" DESC`
        if (sort === "reverse filesize") sortQuery = `ORDER BY "imageSize" ASC`
        if (sort === "width") sortQuery = `ORDER BY "imageWidth" DESC`
        if (sort === "reverse width") sortQuery = `ORDER BY "imageWidth" ASC`
        if (sort === "height") sortQuery = `ORDER BY "imageHeight" DESC`
        if (sort === "reverse height") sortQuery = `ORDER BY "imageHeight" ASC`
        if (sort === "bookmarks") sortQuery = `ORDER BY posts.bookmarks DESC NULLS LAST`
        if (sort === "reverse bookmarks") sortQuery = `ORDER BY posts.bookmarks ASC NULLS LAST`
        let includeTags = sort === "tagcount" || sort === "reverse tagcount"
        let i = 2
        let values = [] as any
        let userValue = i
        if (sessionUsername) {
            values.push(sessionUsername)
            i++
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = "100"
            values.push(limit)
            i++
        }
        if (offset) values.push(offset)
        const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, json_agg(DISTINCT images.*) AS images,
                    ${includeTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
                    ${includeTags ? `COUNT(DISTINCT "tag map"."tag") AS "tagCount",` : ""}
                    MAX(DISTINCT images."size") AS "imageSize",
                    MAX(DISTINCT images."width") AS "imageWidth",
                    MAX(DISTINCT images."height") AS "imageHeight",
                    COUNT(DISTINCT images."imageID") AS "imageCount",
                    COUNT(DISTINCT favorites."username") AS "favoriteCount",
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"${sessionUsername ? `,
                    CASE 
                        WHEN COUNT(favorites."username") FILTER (WHERE favorites."username" = $${userValue}) > 0 
                        THEN true ELSE false
                    END AS favorited,
                    CASE
                        WHEN COUNT("favgroup map"."username") FILTER (WHERE "favgroup map"."username" = $${userValue}) > 0 
                        THEN true ELSE false
                    END AS favgrouped` : ""}
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
                    FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    ${sessionUsername ? `LEFT JOIN "favgroup map" ON posts."postID" = "favgroup map"."postID"` : ""}
                    ${whereQueries ? `WHERE ${whereQueries}` : ""}
                    GROUP BY posts."postID"
                    ${sortQuery}
                )
                SELECT favorites.*, 
                COUNT(*) OVER() AS "postCount",
                post_json.* AS post
                FROM favorites
                JOIN post_json ON post_json."postID" = favorites."postID"
                WHERE favorites."username" = $1
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete favorite. */
    public static deleteFavorite = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM favorites WHERE favorites."postID" = $1 AND favorites."username" = $2`),
        values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert favgroup. */
    public static insertFavgroup = async (username: string, slug: string, name: string, isPrivate: boolean) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                INSERT INTO favgroups ("username", "slug", "name", "private", "createDate")
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT ("username", "slug") DO UPDATE
                SET "private" = EXCLUDED."private"
            `),
            values: [username, slug, name, isPrivate, new Date().toISOString()]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Update favgroup. */
    public static updateFavGroup = async (username: string, slug: string, column: string, value: string | boolean) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE favgroups SET "${column}" = $1 WHERE "username" = $2 AND "slug" = $3`,
            values: [value, username, slug]
        }
        return SQLQuery.run(query)
    }

    /** Delete favgroup. */
    public static deleteFavgroup = async (username: string, slug: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                DELETE FROM favgroups
                WHERE favgroups."username" = $1 AND favgroups."slug" = $2
            `),
            values: [username, slug]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert favgroup post. */
    public static insertFavgroupPost = async (username: string, slug: string, postID: number, order: number) => {
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "favgroup map" ("username", "slug", "postID", "order") VALUES ($1, $2, $3, $4)`,
            values: [username, slug, postID, order]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete favgroup post. */
    public static deleteFavgroupPost = async (postID: number, username: string, slug: string) => {
        const orderQuery: QueryArrayConfig = {
            text: /*sql*/`SELECT "favgroup map"."order" FROM "favgroup map" WHERE "favgroup map"."postID" = $1 AND "favgroup map"."username" = $2 AND "favgroup map"."slug" = $3`,
            rowMode: "array",
            values: [postID, username, slug]
        }
        const result = await SQLQuery.run(orderQuery)
        const deleteOrder = result[0]?.[0]
        if (!deleteOrder) return

        const deleteQuery: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                DELETE FROM "favgroup map" 
                WHERE "favgroup map"."postID" = $1 AND "favgroup map"."username" = $2 AND "favgroup map"."slug" = $3
            `),
            values: [postID, username, slug]
        }
        await SQLQuery.run(deleteQuery)

        const decrementQuery: QueryConfig = {
            text: /*sql*/`UPDATE "favgroup map" SET "order" = "order" - 1 WHERE "username" = $1 AND "slug" = $2 AND "order" > $3`,
            values: [username, slug, deleteOrder]
        }
        return SQLQuery.run(decrementQuery)
    }

    /** Get post favgroups. */
    public static postFavgroups = async (postID: number, username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "favgroup map"."order", json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    JOIN "favgroup map" ON "favgroup map"."postID" = posts."postID"
                    GROUP BY posts."postID", "favgroup map"."order"
                )
                SELECT favgroups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "favgroup map"
                JOIN favgroups ON favgroups."slug" = "favgroup map"."slug"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE "favgroup map"."postID" = $1 AND "favgroup map"."username" = $2
                GROUP BY favgroups."username", favgroups."slug"
            `),
            values: [postID, username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get favgroup. */
    public static favgroup = async (username: string, slug: string, type?: string, restrict?: string, style?: string, sort?: string, sessionUsername?: string) => {
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
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY posts."uploadDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY posts."uploadDate" ASC`
        if (sort === "drawn") sortQuery = `ORDER BY posts.drawn DESC NULLS LAST`
        if (sort === "reverse drawn") sortQuery = `ORDER BY posts.drawn ASC NULLS LAST`
        if (sort === "cuteness") sortQuery = `ORDER BY "cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY "cuteness" ASC`
        if (sort === "popularity") sortQuery = `ORDER BY "favoriteCount" DESC`
        if (sort === "reverse popularity") sortQuery = `ORDER BY "favoriteCount" ASC`
        if (sort === "variations") sortQuery = `ORDER BY "imageCount" DESC`
        if (sort === "reverse variations") sortQuery = `ORDER BY "imageCount" ASC`
        if (sort === "thirdparty") sortQuery = `ORDER BY posts."thirdParty" DESC NULLS LAST`
        if (sort === "reverse thirdparty") sortQuery = `ORDER BY posts."thirdParty" ASC NULLS LAST`
        if (sort === "tagcount") sortQuery = `ORDER BY "tagCount" DESC`
        if (sort === "reverse tagcount") sortQuery = `ORDER BY "tagCount" ASC`
        if (sort === "filesize") sortQuery = `ORDER BY "imageSize" DESC`
        if (sort === "reverse filesize") sortQuery = `ORDER BY "imageSize" ASC`
        if (sort === "width") sortQuery = `ORDER BY "imageWidth" DESC`
        if (sort === "reverse width") sortQuery = `ORDER BY "imageWidth" ASC`
        if (sort === "height") sortQuery = `ORDER BY "imageHeight" DESC`
        if (sort === "reverse height") sortQuery = `ORDER BY "imageHeight" ASC`
        if (sort === "bookmarks") sortQuery = `ORDER BY posts.bookmarks DESC NULLS LAST`
        if (sort === "reverse bookmarks") sortQuery = `ORDER BY posts.bookmarks ASC NULLS LAST`
        let includeTags = sort === "tagcount" || sort === "reverse tagcount"
        let i = 3
        let values = [] as any
        let userValue = i
        if (sessionUsername) {
            values.push(sessionUsername)
            i++
        }
        const whereQueries = [typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "favgroup map"."order", json_agg(DISTINCT images.*) AS images,
                    ${includeTags ? `array_agg(DISTINCT "tag map".tag) AS tags,` : ""}
                    ${includeTags ? `COUNT(DISTINCT "tag map"."tag") AS "tagCount",` : ""}
                    MAX(DISTINCT images."size") AS "imageSize",
                    MAX(DISTINCT images."width") AS "imageWidth",
                    MAX(DISTINCT images."height") AS "imageHeight",
                    COUNT(DISTINCT images."imageID") AS "imageCount",
                    COUNT(DISTINCT favorites."username") AS "favoriteCount",
                    ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"${sessionUsername ? `,
                    CASE 
                        WHEN COUNT(favorites."username") FILTER (WHERE favorites."username" = $${userValue}) > 0 
                        THEN true ELSE false
                    END AS favorited,
                    CASE
                        WHEN COUNT("favgroup map"."username") FILTER (WHERE "favgroup map"."username" = $${userValue}) > 0 
                        THEN true ELSE false
                    END AS favgrouped` : ""}
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
                    FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
                    FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                    JOIN "favgroup map" ON "favgroup map"."postID" = posts."postID"
                    ${whereQueries ? `WHERE ${whereQueries}` : ""}
                    GROUP BY posts."postID", "favgroup map"."order"
                    ${sortQuery}
                )
                SELECT favgroups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "favgroup map"
                JOIN favgroups ON favgroups."slug" = "favgroup map"."slug"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE "favgroup map"."username" = $1 AND "favgroup map"."slug" = $2 
                GROUP BY favgroups."username", favgroups."slug"
            `),
            values: [username, slug]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get user favgroup. */
    public static favgroups = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "favgroup map"."order", json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    JOIN "favgroup map" ON "favgroup map"."postID" = posts."postID"
                    GROUP BY posts."postID", "favgroup map"."order"
                )
                SELECT favgroups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "favgroup map"
                JOIN favgroups ON favgroups."slug" = "favgroup map"."slug"
                JOIN post_json ON post_json."postID" = "favgroup map"."postID"
                WHERE "favgroup map"."username" = $1
                GROUP BY favgroups."username", favgroups."slug"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Purge favgroup map. */
    public static purgeFavgroupMap = async (username: string, slug: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "favgroup map" WHERE "favgroup map"."username" = $1 AND "favgroup map"."slug" = $2`,
            values: [username, slug]
        }
        return SQLQuery.run(query)
    }

    /** Bulk insert favgroup mappings. */
    public static bulkInsertFavgroupMappings = async (username: string, slug: string, posts: any[]) => {
        let rawValues = [] as any
        let valueArray = [] as any 
        let i = 1 
        for (let j = 0; j < posts.length; j++) {
            valueArray.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`)
            rawValues.push(username)
            rawValues.push(slug)
            rawValues.push(posts[j].postID)
            rawValues.push(posts[j].order)
            i += 4
        }
        let valueQuery = `VALUES ${valueArray.join(", ")}`
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "favgroup map" ("username", "slug", "postID", "order") ${valueQuery}`,
            values: [...rawValues]
        }
        return SQLQuery.run(query)
    }
}