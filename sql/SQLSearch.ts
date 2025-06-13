import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {DeletedPost, PostSearch, PostFull, UnverifiedPost, TagCategorySearch, TagSearch, GroupSearch} from "../types/Types"

export default class SQLSearch {
    public static boilerplate = (options: {i?: number, tags?: string[], type?: string, rating?: string, style?: string, sort?: string, offset?: number, 
        limit?: number, username?: string, showChildren?: boolean, withTags?: boolean, search?: string, favgroupOrder?: boolean, outerSort?: boolean,
        format?: string, condition?: string, intermLimit?: boolean}) => {
        let {i, tags, search, type, rating, style, sort, offset, limit, username, withTags, showChildren, favgroupOrder, outerSort, format, condition, intermLimit} = options
        if (!i) i = 1
        let typeQuery = ""
        if (type === "image") typeQuery = `posts.type = 'image'`
        if (type === "animation") typeQuery = `posts.type = 'animation'`
        if (type === "video") typeQuery = `posts.type = 'video'`
        if (type === "comic") typeQuery = `posts.type = 'comic'`
        if (type === "audio") typeQuery = `posts.type = 'audio'`
        if (type === "model") typeQuery = `posts.type = 'model'`
        if (type === "live2d") typeQuery = `posts.type = 'live2d'`
        let ratingQuery = ""
        if (rating === "cute") ratingQuery = `posts.rating = 'cute'`
        if (rating === "sexy") ratingQuery = `posts.rating = 'sexy'`
        if (rating === "ecchi") ratingQuery = `posts.rating = 'ecchi'`
        if (rating === "hentai") ratingQuery = `posts.rating = 'hentai'`
        if (rating === "all") ratingQuery = `(posts.rating = 'cute' OR posts.rating = 'sexy' OR posts.rating = 'ecchi')`
        if (rating === "all+h") ratingQuery = ``
        if (rating === "all" && !username) ratingQuery = `posts.rating = 'cute'`
        let styleQuery = ""
        if (style === "2d") styleQuery = `lower(posts.style) = '2d'`
        if (style === "3d") styleQuery = `lower(posts.style) = '3d'`
        if (style === "pixel") styleQuery = `posts.style = 'pixel'`
        if (style === "chibi") styleQuery = `posts.style = 'chibi'`
        if (style === "daki") styleQuery = `posts.style = 'daki'`
        if (style === "sketch") styleQuery = `posts.style = 'sketch'`
        if (style === "lineart") styleQuery = `posts.style = 'lineart'`
        if (style === "promo") styleQuery = `posts.style = 'promo'`
        if (style === "all") styleQuery = `NOT (posts.style = 'sketch' OR posts.style = 'lineart')`
        if (style === "all+s") styleQuery = ``
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (!sort || sort === "date") sortQuery = `ORDER BY posts."uploadDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY posts."uploadDate" ASC`
        if (sort === "viewDate") sortQuery = `ORDER BY "history"."viewDate" DESC`
        if (sort === "reverse viewDate") sortQuery = `ORDER BY "history"."viewDate" ASC`
        if (sort === "posted") sortQuery = `ORDER BY posts.posted DESC NULLS LAST`
        if (sort === "reverse posted") sortQuery = `ORDER BY posts.posted ASC NULLS LAST`
        if (sort === "cuteness") sortQuery = `ORDER BY "cuteness" DESC`
        if (sort === "reverse cuteness") sortQuery = `ORDER BY "cuteness" ASC`
        if (sort === "popularity") sortQuery = `ORDER BY "favoriteCount" DESC`
        if (sort === "reverse popularity") sortQuery = `ORDER BY "favoriteCount" ASC`
        if (sort === "variations") sortQuery = `ORDER BY "variationCount" DESC`
        if (sort === "reverse variations") sortQuery = `ORDER BY "variationCount" ASC`
        if (sort === "parent") sortQuery = `ORDER BY "hasChildren" DESC`
        if (sort === "reverse parent") sortQuery = `ORDER BY "hasChildren" ASC`
        if (sort === "child") sortQuery = `ORDER BY posts."parentID" DESC NULLS LAST`
        if (sort === "reverse child") sortQuery = `ORDER BY posts."parentID" ASC NULLS LAST`
        if (sort === "groups") sortQuery = `ORDER BY "isGrouped" DESC`
        if (sort === "reverse groups") sortQuery = `ORDER BY "isGrouped" ASC`
        if (sort === "tagcount") sortQuery = `ORDER BY "tagCount" DESC`
        if (sort === "reverse tagcount") sortQuery = `ORDER BY "tagCount" ASC`
        if (sort === "filesize") sortQuery = `ORDER BY "fileSize" DESC`
        if (sort === "reverse filesize") sortQuery = `ORDER BY "fileSize" ASC`
        if (sort === "aspectRatio") sortQuery = `ORDER BY "aspectRatio" DESC`
        if (sort === "reverse aspectRatio") sortQuery = `ORDER BY "aspectRatio" ASC`
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
        let childQuery = showChildren ? "" : `posts."parentID" IS NULL`
        let ANDtags = [] as string[]
        let ORtags = [] as string[]
        let NOTtags = [] as string[]
        let NOTORtags = [] as string[]
        let STARtags = [] as string[]
        tags?.forEach((tag) => {
            if (tag.startsWith("+-")) {
                NOTORtags.push(tag.replace("+-", ""))
            } else if (tag.startsWith("+")) {
                ORtags.push(tag.replace("+", ""))
            } else if (tag.startsWith("-")) {
                NOTtags.push(tag.replace("-", ""))
            } else if (tag.startsWith("*")) {
                STARtags.push(tag.replace("*", ""))
            } else {
                ANDtags.push(tag)
            }
        })
        let values = [] as any
        let tagQueryArray = [] as any
        if (ANDtags.length) {
            values.push(ANDtags)
            tagQueryArray.push(`"tag map tags".tags @> $${i}`)
            i++ 
        }
        if (ORtags.length) {
            values.push(ORtags)
            tagQueryArray.push(`"tag map tags".tags && $${i}`)
            i++ 
        }
        if (NOTtags.length) {
            values.push(NOTtags)
            tagQueryArray.push(`NOT "tag map tags".tags @> $${i}`)
            i++
        }
        if (NOTORtags.length) {
            values.push(NOTORtags)
            tagQueryArray.push(`NOT "tag map tags".tags && $${i}`)
            i++ 
        }
        if (STARtags.length) {
            for (const starTag of STARtags) {
                values.push(starTag)
                tagQueryArray.push(`EXISTS (SELECT 1 FROM unnest("tag map tags".tags) AS tag WHERE tag ~* $${i})`)
                i++
            }
        }
        let searchValue = i
        if (search) {
            values.push(search)
            i++
        }
        let countValues = structuredClone(values)
        let userValue = i
        if (username) {
            values.push(username)
            i++
        }
        let favoriteQuery = ""
        if (sort === "favorites" || sort === "reverse favorites") {
            favoriteQuery = `favorites."username" = $${userValue}`
            countValues.push(username)
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = 100
            values.push(limit)
            i++
        }
        let offsetValue = i
        if (offset) {
            values.push(offset)
            i++
        }
        let formatValue = i
        if (format) {
            values.push(format)
            i++
        }
        let tagQuery = tagQueryArray.length ? tagQueryArray.join(" AND ") : ""
        const whereQueries = [tagQuery, typeQuery, ratingQuery, styleQuery, childQuery, favoriteQuery, condition].filter(Boolean).join(" AND ")
        let includeTags = withTags || tagQuery || sort === "tagcount" || sort === "reverse tagcount"

        let hasFavorites = favoriteQuery || condition?.includes("favorites.")
        let countJSON = functions.multiTrim(/*sql*/`
            WITH post_json AS (
                SELECT posts.*
                FROM posts
                ${includeTags ? `JOIN "tag map tags" ON posts."postID" = "tag map tags"."postID"` : ""}
                ${hasFavorites ? `LEFT JOIN "favorites" ON posts."postID" = "favorites"."postID"` : ""}
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
                GROUP BY posts."postID"
                ${hasFavorites ? `, favorites."favoriteID"` : ""}
            )`)

        let postJSON = functions.multiTrim(/*sql*/`
            WITH image_json AS (
                SELECT *
                FROM images
                ${format ? `WHERE images."filename" LIKE '%' || $${formatValue}` : ""}
            ),
            post_json AS (
                SELECT posts.*, json_agg(DISTINCT image_json.*) AS images, 
                ${includeTags ? `"tag map tags"."tags",` : ""}
                ${includeTags ? `array_length("tag map tags"."tags", 1) AS "tagCount",` : ""}
                ${favgroupOrder ? `"favgroup map"."order",` : ""} 
                MAX(DISTINCT COALESCE(image_json."size", 0) + COALESCE(image_json."upscaledSize", 0)) AS "fileSize",
                MAX(DISTINCT image_json."width")::float / MAX(DISTINCT image_json."height")::float AS "aspectRatio",
                COUNT(DISTINCT image_json."imageID") AS "variationCount",
                COUNT(DISTINCT favorites."username") AS "favoriteCount",
                ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness",
                CASE
                    WHEN COUNT("child posts"."childID") > 0 
                    THEN true ELSE false
                END AS "hasChildren",
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
                    WHEN COUNT("favgroup map"."favgroupID") FILTER (WHERE "favgroup map"."favgroupID" IN 
                    (SELECT "favgroupID" FROM "favgroups" WHERE "favgroups"."username" = $${userValue})) > 0 
                    THEN true ELSE false
                END AS favgrouped` : ""}
                FROM posts
                JOIN image_json ON posts."postID" = image_json."postID"
                ${includeTags ? `JOIN "tag map tags" ON posts."postID" = "tag map tags"."postID"` : ""}
                LEFT JOIN "favorites" ON posts."postID" = "favorites"."postID"
                LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                LEFT JOIN "child posts" ON posts."postID" = "child posts"."parentID"
                LEFT JOIN "group map" ON posts."postID" = "group map"."postID"
                ${username || favgroupOrder ? `LEFT JOIN "favgroup map" ON posts."postID" = "favgroup map"."postID"` : ""}
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
                GROUP BY posts."postID"
                ${includeTags ? `, "tag map tags"."tags"` : ""}
                ${favoriteQuery ? `, favorites."favoriteID"` : ""}
                ${favgroupOrder ? `, "favgroup map"."order"` : ""}
                ${!outerSort ? sortQuery : ""}
                ${intermLimit ? `${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${offsetValue}` : ""}` : ""}
            )`)

        return {postJSON, countJSON, values, countValues, searchValue, tagQuery, sortQuery, includeTags, limitValue, offsetValue, i}
    }

    /** Get result count */
    public static count = async (countJSON: string, countValues: string[]) => {
        const query: QueryArrayConfig = {
            text: functions.multiTrim(/*sql*/`
                ${countJSON}
                SELECT COUNT(*) OVER() AS "postCount"
                FROM post_json
                LIMIT 1
            `),
            rowMode: "array"
            }
        if (countValues?.[0]) query.values = countValues
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Search posts. */
    public static search = async (tags: string[], type: string, rating: string, style: string, sort: string, offset?: number, 
        limit?: number, withTags?: boolean, showChildren?: boolean, username?: string) => {
        const {postJSON, countJSON, values, countValues} = 
        SQLQuery.search.boilerplate({tags, type, rating, style, sort, offset, 
        limit, username, withTags, showChildren, intermLimit: true})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            ${postJSON}
            SELECT post_json.*,
            COUNT(*) OVER() AS "postCount"
            FROM post_json
        `)
        }
        if (values?.[0]) query.values = values
        let result = [] as PostSearch[]
        if (sort === "random" || sort === "favorites" || sort === "reverse favorites") {
            result = await SQLQuery.run(query)
        } else {
            result = await SQLQuery.run(query, `search/posts`)
        }
        const count = await SQLQuery.search.count(countJSON, countValues)
        result.forEach((r) => r.postCount = count)
        return result
    }

    /** Search pixiv id. */
    public static searchPixivID = async (pixivID: string, type: string, rating: string, style: string, sort: string, 
        offset?: number, limit?: number, withTags?: boolean, showChildren?: boolean, username?: string) => {
        let condition = `(posts."source" LIKE 'https://%pixiv.net/%/' || $1 OR posts."mirrors"::text LIKE 'https://%pixiv.net/%/' || $1)`
        const {postJSON, values} = 
        SQLQuery.search.boilerplate({condition, i: 2, type, rating, style, sort, offset, 
        limit, username, withTags, showChildren, intermLimit: true})
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT post_json.*,
                COUNT(*) OVER() AS "postCount"
                FROM post_json
            `),
            values: [pixivID]
        }
        if (values?.[0]) query.values?.push(...values)
        if (sort === "random" || sort === "favorites" || sort === "reverse favorites") {
            return SQLQuery.run(query) as Promise<PostSearch[]>
        } else {
            return SQLQuery.run(query, `search/pixiv-id/${pixivID}`) as Promise<PostSearch[]>
        }
    }

    /** Search twitter id. */
    public static searchTwitterID = async (twitterID: string, type: string, rating: string, style: string, sort: string, 
        offset?: number, limit?: number, withTags?: boolean, showChildren?: boolean, username?: string) => {
        let condition = `(posts."source" LIKE 'https://%x.com/%/status/' || $1 OR posts."source" LIKE 'https://%twitter.com/%/status/' || $1 
        OR posts."mirrors"::text LIKE 'https://%x.com/%/status/' || $1 OR posts."mirrors"::text LIKE 'https://%twitter.com/%/status/' || $1)`
        const {postJSON, values} = 
        SQLQuery.search.boilerplate({condition, i: 2, type, rating, style, sort, offset, 
        limit, username, withTags, showChildren, intermLimit: true})
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT post_json.*,
                COUNT(*) OVER() AS "postCount"
                FROM post_json
            `),
            values: [twitterID]
        }
        if (values?.[0]) query.values?.push(...values)
        if (sort === "random" || sort === "favorites" || sort === "reverse favorites") {
            return SQLQuery.run(query) as Promise<PostSearch[]>
        } else {
            return SQLQuery.run(query, `search/twitter-id/${twitterID}`) as Promise<PostSearch[]>
        }
    }

    /** Search search. */
    public static searchSource = async (source: string, type: string, rating: string, style: string, sort: string, 
        offset?: number, limit?: number, withTags?: boolean, showChildren?: boolean, username?: string) => {
        let condition = `(posts."source" LIKE '%' || $1 || '%' OR posts."mirrors"::text LIKE '%' || $1 || '%')`
        const {postJSON, values} = 
        SQLQuery.search.boilerplate({condition, i: 2, type, rating, style, sort, offset, 
        limit, username, withTags, showChildren, intermLimit: true})
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                ${postJSON}
                SELECT post_json.*,
                COUNT(*) OVER() AS "postCount"
                FROM post_json
            `),
            values: [source]
        }
        if (values?.[0]) query.values?.push(...values)
        if (sort === "random" || sort === "favorites" || sort === "reverse favorites") {
            return SQLQuery.run(query) as Promise<PostSearch[]>
        } else {
            return SQLQuery.run(query, `search/source/${source}`) as Promise<PostSearch[]>
        }
    }

    /** Search format. */
    public static searchFormat = async (format: string, type: string, rating: string, style: string, sort: string, 
        offset?: number, limit?: number, withTags?: boolean, showChildren?: boolean, username?: string) => {
        const {postJSON, countJSON, values, countValues} = 
        SQLQuery.search.boilerplate({format, type, rating, style, sort, offset, 
        limit, username, withTags, showChildren, intermLimit: true})

        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            ${postJSON}
            SELECT post_json.*,
            COUNT(*) OVER() AS "postCount"
            FROM post_json
        `)
        }
        if (values?.[0]) query.values = values
        let result = [] as PostSearch[]
        if (sort === "random" || sort === "favorites" || sort === "reverse favorites") {
            result = await SQLQuery.run(query)
        } else {
            result = await SQLQuery.run(query, `search/format/${format}`)
        }
        const count = await SQLQuery.search.count(countJSON, countValues)
        result.forEach((r) => r.postCount = count)
        return result
    }

    /** Get posts. */
    public static posts = async (postIDs?: string[]) => {
        postIDs = postIDs?.filter(id => String(id) !== "undefined")
        if (!postIDs?.length) return []
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT posts.*, json_agg(DISTINCT images.*) AS images, 
            json_agg(DISTINCT "tag map".tag) AS tags,
            COUNT(DISTINCT favorites."username") AS "favoriteCount",
            ROUND(AVG(DISTINCT cuteness."cuteness")) AS "cuteness"
            FROM posts
            JOIN images ON posts."postID" = images."postID"
            JOIN "tag map" ON posts."postID" = "tag map"."postID"
            LEFT JOIN "favorites" ON posts."postID" = "favorites"."postID"
            LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
            ${postIDs ? "WHERE posts.\"postID\" = ANY ($1)" : ""}
            GROUP BY posts."postID"
            `)
        }
        if (postIDs) query.values = [postIDs]
        const result = await SQLQuery.run(query, `search/posts/${postIDs.join("-")}`)
        return result as Promise<PostFull[]>
    }

    /** Get deleted posts. */
    public static deletedPosts = async (search?: string, offset?: number) => {
        let whereQuery = `posts."deleted" IS TRUE`
        let i = 1
        if (search) {
            whereQuery += `AND (posts.title ILIKE '%' || $${i} || '%' OR posts."englishTitle" ILIKE '%' || $${i} || '%')`
            i++
        }
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                SELECT posts.*, json_agg(DISTINCT images.*) AS images, 
                COUNT(*) OVER() AS "historyCount"
                FROM posts
                JOIN images ON posts."postID" = images."postID"
                WHERE ${whereQuery}
                GROUP BY posts."postID"
                ${offset ? `LIMIT 100 OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (search) query.values?.push(search.toLowerCase())
        if (offset) query.values?.push(offset)
        const result = await SQLQuery.run(query, `search/posts/deleted`)
        return result as Promise<DeletedPost[]>
    }

    /** Get posts (unverified). */
    public static unverifiedPosts = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "unverified posts"."originalID" IS NULL AND "unverified posts"."deleted" IS NOT TRUE
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedPost[]>
    }

    /** Get deleted posts (unverified). */
    public static deletedUnverifiedPosts = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "unverified posts"."deleted" IS TRUE
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            ${offset ? `LIMIT 100 OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedPost[]>
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
            WHERE "originalID" IS NULL AND "unverified posts"."uploader" = $1 AND "unverified posts"."deleted" IS NOT TRUE
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedPost[]>
    }

    /** Get deleted posts by user (unverified). */
    public static deletedUnverifiedUserPosts = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "originalID" IS NULL AND "unverified posts"."uploader" = $1 AND "unverified posts"."deleted" IS TRUE
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedPost[]>
    }

    /** Get post edits (unverified). */
    public static unverifiedPostEdits = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "unverified posts".*, json_agg(DISTINCT "unverified images".*) AS images, 
            json_agg(DISTINCT "unverified tag map".tag) AS tags,
            COUNT(*) OVER() AS "postCount"
            FROM "unverified posts"
            JOIN "unverified images" ON "unverified posts"."postID" = "unverified images"."postID"
            JOIN "unverified tag map" ON "unverified posts"."postID" = "unverified tag map"."postID"
            WHERE "originalID" IS NOT NULL AND "isNote" IS NOT TRUE
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
            `)
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedPost[]>
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
            WHERE "originalID" IS NOT NULL AND "isNote" IS NOT TRUE AND "unverified posts"."updater" = $1
            GROUP BY "unverified posts"."postID"
            ORDER BY "unverified posts"."uploadDate" DESC
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<UnverifiedPost[]>
    }

    /** Tag category search */
    public static tagCategory = async (category: string, sort: string, search?: string, limit?: number, offset?: number) => {
        let whereQueries = [] as string[]
        let values = [] as any
        if (category === "artists") whereQueries.push(`tags.type = 'artist'`)
        if (category === "characters") whereQueries.push(`tags.type = 'character'`)
        if (category === "series") whereQueries.push(`tags.type = 'series'`)
        let i = 1
        if (search) {
            whereQueries.push(`lower(tags.tag) LIKE $${i} || '%'`)
            values.push(search.toLowerCase())
            i++
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 25) limit = 25
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
                        TABLESAMPLE SYSTEM(5)
                        JOIN images ON images."postID" = posts."postID"
                        LEFT JOIN "cuteness" ON posts."postID" = "cuteness"."postID"
                        WHERE NOT (posts.style = 'sketch' OR posts.style = 'lineart')
                        GROUP BY posts."postID"
                    )
                    SELECT tags.*, json_agg(DISTINCT post_json.*) AS posts,
                    COUNT(*) OVER() AS "tagCount",
                    array_length("tag map posts"."posts", 1) AS "postCount",
                    ROUND(AVG(DISTINCT post_json."cuteness")) AS "cuteness"
                    FROM tags
                    JOIN "tag map" ON "tag map"."tag" = tags."tag" ${whereQuery}
                    JOIN post_json ON post_json."postID" = "tag map"."postID"
                    JOIN "tag map posts" ON "tag map posts"."tag" = tags."tag"
                    GROUP BY "tags"."tagID", "tag map posts"."posts"
                    ${sortQuery}
                    ${limit ? `LIMIT $${limitValue}` : "LIMIT 25"} ${offset ? `OFFSET $${i}` : ""}
            `)
        }
        if (offset) values.push(offset)
        if (values?.[0]) query.values = values
        if (sort === "random") {
            return SQLQuery.run(query) as Promise<TagCategorySearch[]>
        } else {
            return SQLQuery.run(query) as Promise<TagCategorySearch[]>
        }
    }

    /** Tag search */
    public static tagSearch = async (search: string, sort: string, type?: string, limit?: number, offset?: number) => {
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
            if (type === "tags") {
                whereArray.push(`(tags.type = 'appearance' OR tags.type = 'outfit' OR 
                tags.type = 'accessory' OR tags.type = 'scenery' OR tags.type = 'action' 
                OR tags.type = 'tag')`)
            } else {
                whereArray.push(`tags.type = $${i}`)
                values.push(type)
                i++
            }
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 200) limit = 200
            values.push(limit)
            i++
        }
        let whereQuery = whereArray.length ? `WHERE ${whereArray.join(" AND ")}` : ""
        let sortQuery = ""
        if (sort === "random") sortQuery = `ORDER BY random()`
        if (sort === "date") sortQuery = `ORDER BY tags."updatedDate" DESC`
        if (sort === "reverse date") sortQuery = `ORDER BY tags."updatedDate" ASC`
        if (sort === "alphabetic") sortQuery = `ORDER BY tags.tag ASC`
        if (sort === "reverse alphabetic") sortQuery = `ORDER BY tags.tag DESC`
        if (sort === "posts") sortQuery = `ORDER BY "postCount" DESC`
        if (sort === "reverse posts") sortQuery = `ORDER BY "postCount" ASC`
        if (sort === "image") sortQuery = `ORDER BY "variationCount" DESC`
        if (sort === "reverse image") sortQuery = `ORDER BY "variationCount" ASC`
        if (sort === "aliases") sortQuery = `ORDER BY "aliasCount" DESC`
        if (sort === "reverse aliases") sortQuery = `ORDER BY "aliasCount" ASC`
        if (sort === "length") sortQuery = `ORDER BY LENGTH(tags.tag) ASC`
        if (sort === "reverse length") sortQuery = `ORDER BY LENGTH(tags.tag) DESC`
        // COUNT(DISTINCT posts."postID") AS "postCount", 
        // JOIN "tag map" ON "tag map"."tag" = tags."tag" 
        // JOIN posts ON posts."postID" = "tag map"."postID"
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT implications.*) AS implications,
                    COUNT(*) OVER() AS "tagCount",
                    array_length("tag map posts"."posts", 1) AS "postCount",
                    COUNT(DISTINCT tags."image") AS "variationCount", 
                    COUNT(DISTINCT aliases."alias") AS "aliasCount"
                    FROM tags
                    LEFT JOIN aliases ON aliases."tag" = tags."tag"
                    LEFT JOIN implications ON implications."tag" = tags."tag"
                    JOIN "tag map posts" ON "tag map posts"."tag" = tags."tag"
                    ${whereQuery}
                    GROUP BY "tags"."tagID", "tag map posts"."posts"
                    ${sortQuery}
                    ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `)
        }
        if (offset) values.push(offset)
        if (values?.[0]) query.values = values
        if (sort === "random") {
            return SQLQuery.run(query) as Promise<TagSearch[]>
        } else {
            return SQLQuery.run(query, `search/tags`) as Promise<TagSearch[]>
        }
    }

    /** Tag social search */
    public static tagSocialSearch = async (social: string) => {
        const query: QueryConfig = {
            text: functions.multiTrim(/*sql*/`
                    SELECT tags.*, json_agg(DISTINCT aliases.*) AS aliases, json_agg(DISTINCT implications.*) AS implications,
                    COUNT(*) OVER() AS "tagCount",
                    COUNT(DISTINCT posts."postID") AS "postCount", 
                    COUNT(DISTINCT tags."image") AS "variationCount", 
                    COUNT(DISTINCT aliases."alias") AS "aliasCount"
                    FROM tags
                    LEFT JOIN aliases ON aliases."tag" = tags."tag"
                    LEFT JOIN implications ON implications."tag" = tags."tag"
                    JOIN "tag map" ON "tag map"."tag" = tags."tag"
                    AND (tags.social LIKE '%' || $1 || '%' OR tags.twitter LIKE '%' || $1 || '%'
                    OR tags.website LIKE '%' || $1 || '%' OR tags.fandom LIKE '%' || $1 || '%'
                    OR tags.wikipedia LIKE '%' || $1 || '%')
                    JOIN posts ON posts."postID" = "tag map"."postID"
                    GROUP BY "tags"."tagID"
            `),
            values: [social]
        }
        return SQLQuery.run(query, `search/tags/social`) as Promise<TagSearch[]>
    }

    /** Group search. */
    public static groupSearch = async (search: string, sort: string, rating: string, limit?: number, offset?: number, username?: string) => {
        let ratingQuery = ""
        if (rating === "cute") ratingQuery = `groups.rating = 'cute'`
        if (rating === "sexy") ratingQuery = `groups.rating = 'sexy'`
        if (rating === "ecchi") ratingQuery = `groups.rating = 'ecchi'`
        if (rating === "hentai") ratingQuery = `groups.rating = 'hentai'`
        if (rating === "all") ratingQuery = `(groups.rating = 'cute' OR groups.rating = 'sexy' OR groups.rating = 'ecchi')`
        if (rating === "all" && !username) ratingQuery = `groups.rating = 'cute'`
        let searchQuery = ""
        let values = [] as any
        let i = 1
        let searchValue = i
        if (search) {
            searchQuery = `lower(groups."name") LIKE '%' || $${searchValue} || '%'`
            values.push(search.toLowerCase())
            i++
        }
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = 100
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
        const whereQueries = [ratingQuery, searchQuery].filter(Boolean).join(" AND ")
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
                ${whereQueries ? `WHERE ${whereQueries}` : ""}
                GROUP BY groups."groupID"
                ${sortQuery}
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: []
        }
        if (values?.[0]) query.values = values
        const result = await SQLQuery.run(query)
        return result as Promise<GroupSearch[]>
    }
}