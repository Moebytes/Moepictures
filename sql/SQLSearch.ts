import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLSearch {
    /** Search posts. */
    public static search = async (tags: string[], type: string, restrict: string, style: string, sort: string, offset?: string, limit?: string, withTags?: boolean, username?: string) => {
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
        if (sort === "thirdparty") sortQuery = `ORDER BY "hasThirdParty" DESC`
        if (sort === "reverse thirdparty") sortQuery = `ORDER BY "hasThirdParty" ASC`
        if (sort === "groups") sortQuery = `ORDER BY "isGrouped" DESC`
        if (sort === "reverse groups") sortQuery = `ORDER BY "isGrouped" ASC`
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
        if (sort === "favorites") sortQuery = `ORDER BY favorites."favoriteDate" DESC`
        if (sort === "reverse favorites") sortQuery = `ORDER BY favorites."favoriteDate" ASC`
        if (sort === "hidden") sortQuery = `ORDER BY posts.hidden DESC NULLS LAST`
        if (sort === "reverse hidden") sortQuery = `ORDER BY posts.hidden ASC NULLS LAST`
        if (sort === "locked") sortQuery = `ORDER BY posts.locked DESC NULLS LAST`
        if (sort === "reverse locked") sortQuery = `ORDER BY posts.locked ASC NULLS LAST`
        if (sort === "private") sortQuery = `ORDER BY posts.private DESC NULLS LAST`
        if (sort === "reverse private") sortQuery = `ORDER BY posts.private ASC NULLS LAST`
        let ANDtags = [] as string[]
        let ORtags = [] as string[]
        let NOTtags = [] as string[]
        let STARtags = [] as string[]
        tags?.forEach((tag) => {
            if (tag.startsWith("+")) {
                ORtags.push(tag.replace("+", ""))
            } else if (tag.startsWith("-")) {
                NOTtags.push(tag.replace("-", ""))
            } else if (tag.startsWith("*")) {
                STARtags.push(tag.replace("*", ""))
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
        if (STARtags.length) {
            for (const starTag of STARtags) {
                values.push(starTag)
                tagQueryArray.push(`EXISTS (SELECT 1 FROM unnest(tags) AS tag WHERE tag ~* $${i})`)
                i++
            }
        }
        let userValue = i
        if (username) {
            values.push(username)
            i++
        }
        let favoriteQuery = ""
        if (sort === "favorites" || sort=== "reverse favorites") {
            favoriteQuery = `favorites."username" = $${userValue}`
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = "100"
            values.push(limit)
            i++
        }
        if (offset) values.push(offset)
        let tagQuery = tagQueryArray.length ? "WHERE " + tagQueryArray.join(" AND ") : ""
        const whereQueries = [favoriteQuery, typeQuery, restrictQuery, styleQuery].filter(Boolean).join(" AND ")
        let includeTags = withTags || tagQuery
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
                ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness",
                CASE
                    WHEN COUNT("third party"."postID") > 0 
                    THEN true ELSE false
                END AS "hasThirdParty",
                CASE 
                    WHEN COUNT("group map"."groupID") > 0 
                    THEN true ELSE false 
                END AS "isGrouped" 
                ${username ? `,
                CASE 
                    WHEN COUNT(favorites."username") FILTER (WHERE favorites."username" = $${userValue}) > 0 
                    THEN true ELSE false
                END AS favorited,
                CASE
                    WHEN COUNT("favgroup map"."username") FILTER (WHERE "favgroup map"."username" = $${userValue}) > 0 
                    THEN true ELSE false
                END AS favgrouped` : ""}
                FROM posts
                JOIN images ON posts."postID" = images."postID"
                ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
                FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
                FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                LEFT JOIN "third party" ON posts."postID" = "third party"."parentID"
                LEFT JOIN "group map" ON posts."postID" = "group map"."postID"
                ${username ? `LEFT JOIN "favgroup map" ON posts."postID" = "favgroup map"."postID"` : ""}
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
                GROUP BY posts."postID"${favoriteQuery ? `, favorites."postID", favorites."username"` : ""}
                ${sortQuery}
            )
            SELECT post_json.*,
            COUNT(*) OVER() AS "postCount"
            FROM post_json
            ${tagQuery}
            ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
        `)
        }
        if (values?.[0]) query.values = values
        if (sort === "random" || sort === "favorites" || sort === "reverse favorites") {
            return SQLQuery.run(query)
        } else {
            return SQLQuery.run(query, true)
        }
    }

    /** Search pixiv id. */
    public static searchPixivID = async (pixivID: number, includeTags?: boolean) => {
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
                ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                FROM posts
                JOIN images ON posts."postID" = images."postID"
                ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
                FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
                FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                WHERE posts."link" LIKE 'https://%pixiv.net/%/' || $1 OR posts."mirrors"::text LIKE 'https://%pixiv.net/%/' || $1
                GROUP BY posts."postID"
            )
            SELECT post_json.*,
            COUNT(*) OVER() AS "postCount"
            FROM post_json
            LIMIT 1
        `),
        values: [pixivID]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Search twitter id. */
    public static searchTwitterID = async (twitterID: string, includeTags?: boolean) => {
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
                ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                FROM posts
                JOIN images ON posts."postID" = images."postID"
                ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
                FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
                FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                WHERE posts."link" LIKE 'https://%x.com/%/status/' || $1 OR posts."link" LIKE 'https://%twitter.com/%/status/' || $1 OR 
                posts."mirrors"::text LIKE 'https://%x.com/%/status/' || $1 OR posts."mirrors"::text LIKE 'https://%twitter.com/%/status/' || $1 
                GROUP BY posts."postID"
            )
            SELECT post_json.*,
            COUNT(*) OVER() AS "postCount"
            FROM post_json
            LIMIT 1
        `),
        values: [twitterID]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Search search. */
    public static searchSource = async (source: string, includeTags?: boolean) => {
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
                ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
                FROM posts
                JOIN images ON posts."postID" = images."postID"
                ${includeTags ? `JOIN "tag map" ON posts."postID" = "tag map"."postID"` : ""}
                FULL JOIN "favorites" ON posts."postID" = "favorites"."postID"
                FULL JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                WHERE posts."link" LIKE '%' || $1 || '%' OR posts."mirrors"::text LIKE '%' || $1 || '%'
                GROUP BY posts."postID"
            )
            SELECT post_json.*,
            COUNT(*) OVER() AS "postCount"
            FROM post_json
            LIMIT 1
        `),
        values: [source]
        }
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get posts. */
    public static posts = async (postIDs?: number[]) => {
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
            ${postIDs ? "WHERE posts.\"postID\" = ANY ($1)" : ""}
            GROUP BY posts."postID"
            `)
        }
        if (postIDs) query.values = [postIDs]
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Get posts (unverified). */
    public static unverifiedPosts = async (offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "originalID" IS NULL
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get posts by user (unverified). */
    public static unverifiedUserPosts = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "originalID" IS NULL AND "unverified posts"."uploader" = $1
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get post edits (unverified). */
    public static unverifiedPostEdits = async (offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "originalID" IS NOT NULL AND "isTranslation" IS NULL
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get post edits by user (unverified). */
    public static unverifiedUserPostEdits = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "originalID" IS NOT NULL AND "isTranslation" IS NULL AND "unverified posts"."updater" = $1
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Tag category search */
    public static tagCategory = async (category: string, sort: string, search?: string, limit?: string, offset?: string) => {
        let whereQueries = [] as string[]
        let values = [] as any
        if (category === "artists") whereQueries.push(`tags.type = 'artist'`)
        if (category === "characters") whereQueries.push(`tags.type = 'character'`)
        if (category === "series") whereQueries.push(`tags.type = 'series'`)
        if (category === "tags") whereQueries.push(`tags.type = 'tag'`)
        let i = 1
        if (search) {
            whereQueries.push(`lower(tags.tag) LIKE $${i} || '%'`)
            values.push(search.toLowerCase())
            i++
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 25) limit = "25"
            values.push(limit)
            i++
        }
        let whereQuery = whereQueries.length ? `AND ${whereQueries.join(" AND ")}` : ""
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "cuteness") sortQuery = `ORDER BY "cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY "cuteness" ASC`
        if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
        if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
        if (sort === "alphabetic") sortQuery = `ORDER BY tags.tag ASC`
        if (sort === "reverse alphabetic") sortQuery = `ORDER BY tags.tag DESC`
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
                    SELECT tags.*, json_agg(post_json.*) AS posts,
                    COUNT(*) OVER() AS "tagCount",
                    COUNT(DISTINCT post_json."postID") AS "postCount",
                    ROUND(AVG(DISTINCT post_json."cuteness")) AS "cuteness"
                    FROM tags
                    JOIN "tag map" ON "tag map"."tag" = tags."tag" ${whereQuery}
                    JOIN post_json ON post_json."postID" = "tag map"."postID"
                    GROUP BY "tags".tag
                    ${sortQuery}
                    ${limit ? `LIMIT $${limitValue}` : "LIMIT 25"} ${offset ? `OFFSET $${i}` : ""}
            `)
        }
        if (offset) values.push(offset)
        if (values?.[0]) query.values = values
        if (sort === "random") {
            return SQLQuery.run(query)
        } else {
            return SQLQuery.run(query, true)
        }
    }

    /** Tag search */
    public static tagSearch = async (search: string, sort: string, type?: string, limit?: string, offset?: string) => {
        let whereArray = [] as string[]
        let values = [] as any
        let i = 1
        if (search) {
            whereArray.push( 
            `(lower(tags.tag) LIKE '%' || $${i} || '%'
            OR EXISTS (
            SELECT 1 
            FROM aliases
            WHERE aliases.tag = "tags".tag 
            AND lower(aliases.alias) LIKE '%' || $1 || '%'
            ))`)
            values.push(search.toLowerCase())
            i++
        }
        if (type === "all") type = undefined
        if (type) {
            whereArray.push(`tags.type = $${i}`)
            values.push(type)
            i++
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 200) limit = "200"
            values.push(limit)
            i++
        }
        let whereQuery = whereArray.length ? `AND ${whereArray.join(" AND ")}` : ""
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY tags."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY tags."updatedDate" ASC`
        if (sort === "alphabetic") sortQuery = `ORDER BY tags.tag ASC`
        if (sort === "reverse alphabetic") sortQuery = `ORDER BY tags.tag DESC`
        if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
        if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
        if (sort === "image") sortQuery = `ORDER BY "imageCount" DESC`
        if (sort === "reverse image") sortQuery = `ORDER BY "imageCount" ASC`
        if (sort === "aliases") sortQuery = `ORDER BY "aliasCount" DESC`
        if (sort === "reverse aliases") sortQuery = `ORDER BY "aliasCount" ASC`
        if (sort === "length") sortQuery = `ORDER BY LENGTH(tags.tag) ASC`
        if (sort === "reverse length") sortQuery = `ORDER BY LENGTH(tags.tag) DESC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT implications.*) AS implications,
                    COUNT(*) OVER() AS "tagCount",
                    COUNT(DISTINCT posts."postID") AS "postCount", 
                    COUNT(DISTINCT tags."image") AS "imageCount", 
                    COUNT(DISTINCT aliases."alias") AS "aliasCount"
                    FROM tags
                    FULL JOIN aliases ON aliases."tag" = tags."tag"
                    FULL JOIN implications ON implications."tag" = tags."tag"
                    JOIN "tag map" ON "tag map"."tag" = tags."tag" ${whereQuery}
                    JOIN posts ON posts."postID" = "tag map"."postID"
                    GROUP BY "tags".tag
                    ${sortQuery}
                    ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `)
        }
        if (offset) values.push(offset)
        if (values?.[0]) query.values = values
        if (sort === "random") {
            return SQLQuery.run(query)
        } else {
            return SQLQuery.run(query, true)
        }
    }

    /** Tag social search */
    public static tagSocialSearch = async (social: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT implications.*) AS implications,
                    COUNT(*) OVER() AS "tagCount",
                    COUNT(DISTINCT posts."postID") AS "postCount", 
                    COUNT(DISTINCT tags."image") AS "imageCount", 
                    COUNT(DISTINCT aliases."alias") AS "aliasCount"
                    FROM tags
                    FULL JOIN aliases ON aliases."tag" = tags."tag"
                    FULL JOIN implications ON implications."tag" = tags."tag"
                    JOIN "tag map" ON "tag map"."tag" = tags."tag"
                    AND (tags.social LIKE '%' || $1 || '%' OR tags.twitter LIKE '%' || $1 || '%'
                    OR tags.website LIKE '%' || $1 || '%' OR tags.fandom LIKE '%' || $1 || '%')
                    JOIN posts ON posts."postID" = "tag map"."postID"
                    GROUP BY "tags".tag
            `),
            values: [social]
        }
        return SQLQuery.run(query, true)
    }

    /** Group search. */
    public static groupSearch = async (search: string, sort: string, limit?: string, offset?: string) => {
        let whereQuery = ""
        let values = [] as any
        let i = 1
        let searchValue = i
        if (search) {
            whereQuery = `WHERE lower(groups."name") LIKE '%' || $${searchValue} || '%'`
            values.push(search.toLowerCase())
            i++
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = "100"
            values.push(limit)
            i++
        }
        if (offset) values.push(offset)
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY groups."createDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY groups."createDate" ASC`
        if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
        if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                WITH post_json AS (
                    SELECT posts.*, "group map"."order", json_agg(DISTINCT images.*) AS images
                    FROM posts
                    JOIN images ON images."postID" = posts."postID"
                    JOIN "group map" ON "group map"."postID" = posts."postID"
                    GROUP BY posts."postID", "group map"."order"
                )
                SELECT groups.*, json_agg(post_json.* ORDER BY post_json."order" ASC) AS posts,
                COUNT(*) OVER() AS "groupCount",
                COUNT(DISTINCT post_json."postID") AS "postCount"
                FROM "group map"
                JOIN groups ON groups."groupID" = "group map"."groupID"
                JOIN post_json ON post_json."postID" = "group map"."postID"
                ${whereQuery}
                GROUP BY groups."groupID"
                ${sortQuery}
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query)
        return result
    }
}