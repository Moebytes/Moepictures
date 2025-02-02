import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"
import {PostDeleteRequest, TagDeleteRequest, GroupDeleteRequest, AliasRequest, 
TagEditRequest, GroupRequest, GroupEditRequest} from "../types/Types"

export default class SQLRequest {
    /** Insert pending post delete. */
    public static insertPostDeleteRequest = async (username: string, postID: string, reason: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "delete requests" ("username", "postID", "reason") VALUES ($1, $2, $3) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, postID, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete pending post delete. */
    public static deletePostDeleteRequest = async (username: string, postID: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."postID" = $2`,
            values: [username, postID]
        }
        await SQLQuery.run(query)
    }

    /** Get post delete requests. */
    public static postDeleteRequests = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
            )
            SELECT "delete requests".*, 
            COUNT(*) OVER() AS "requestCount",
            to_json((array_agg(post_json.*))[1]) AS post
            FROM "delete requests"
            JOIN post_json ON post_json."postID" = "delete requests"."postID"
            WHERE "delete requests"."postID" IS NOT NULL
            GROUP BY "delete requests"."requestID"
            ORDER BY "delete requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<PostDeleteRequest[]>
    }

    /** Get user post delete requests */
    public static userPostDeleteRequests = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
            )
            SELECT "delete requests".*, 
            COUNT(*) OVER() AS "requestCount",
            to_json((array_agg(post_json.*))[1]) AS post
            FROM "delete requests"
            JOIN post_json ON post_json."postID" = "delete requests"."postID"
            WHERE "delete requests"."postID" IS NOT NULL AND "delete requests".username = $1
            GROUP BY "delete requests"."requestID"
            ORDER BY "delete requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<PostDeleteRequest[]>
    }

    /** Insert pending tag delete. */
    public static insertTagDeleteRequest = async (username: string, tag: string, reason: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "delete requests" ("username", "tag", "reason") VALUES ($1, $2, $3) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, tag, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete pending post delete. */
    public static deleteTagDeleteRequest = async (username: string, tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."tag" = $2`,
        values: [username, tag]
        }
        await SQLQuery.run(query)
    }

    /** Get tag delete requests */
    public static tagDeleteRequests = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "delete requests".*, tags.*,
            COUNT(*) OVER() AS "requestCount"
            FROM "delete requests"
            JOIN tags ON tags.tag = "delete requests".tag
            WHERE "delete requests"."tag" IS NOT NULL
            GROUP BY "delete requests"."requestID", tags."tagID"
            ORDER BY "delete requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<TagDeleteRequest[]>
    }

    /** Get user tag delete requests */
    public static userTagDeleteRequests = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "delete requests".*, tags.*,
            COUNT(*) OVER() AS "requestCount"
            FROM "delete requests"
            JOIN tags ON tags.tag = "delete requests".tag
            WHERE "delete requests"."tag" IS NOT NULL AND "delete requests".username = $1
            GROUP BY "delete requests"."requestID", tags."tagID"
            ORDER BY "delete requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<TagDeleteRequest[]>
    }

    /** Insert alias request. */
    public static insertAliasRequest = async (username: string, tag: string, aliasTo: string, reason: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "alias requests" ("username", "tag", "aliasTo", "reason") VALUES ($1, $2, $3, $4) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, tag, aliasTo, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete alias request. */
    public static deleteAliasRequest = async (username: string, tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "alias requests" WHERE "alias requests"."username" = $1 AND "alias requests"."tag" = $2`,
        values: [username, tag]
        }
        await SQLQuery.run(query)
    }

    /** Get alias requests */
    public static aliasRequests = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "alias requests".*, tags.*,
            COUNT(*) OVER() AS "requestCount"
            FROM "alias requests"
            JOIN tags ON tags.tag = "alias requests".tag
            WHERE "alias requests"."tag" IS NOT NULL
            GROUP BY "alias requests"."requestID", tags."tagID"
            ORDER BY "alias requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<AliasRequest[]>
    }

    /** Get user alias requests */
    public static userAliasRequests = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "alias requests".*, tags.*,
            COUNT(*) OVER() AS "requestCount"
            FROM "alias requests"
            JOIN tags ON tags.tag = "alias requests".tag
            WHERE "alias requests"."tag" IS NOT NULL AND "alias requests".username = $1
            GROUP BY "alias requests"."requestID", tags."tagID"
            ORDER BY "alias requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<AliasRequest[]>
    }

    /** Insert tag edit request. */
    public static insertTagEditRequest = async (username: string, tag: string, key: string, type: string, description: string, 
        image: string | null, imageHash: string | null, aliases: string[], implications: string[], pixivTags: string[], social: string | null, 
        twitter: string | null, website: string | null, fandom: string | null, r18: boolean, featuredPost: string | undefined | null, imageChanged: boolean, changes: any, 
        reason?: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "tag edit requests" ("username", "tag", "key", "type", "description", "image", "imageHash", "aliases", 
            "implications", "pixivTags", "social", "twitter", "website", "fandom", "r18", "featuredPost", "imageChanged", "changes", "reason") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, tag, key, type, description, image, imageHash, aliases, implications, pixivTags, social, twitter, website, 
            fandom, r18, featuredPost, imageChanged, changes, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete tag edit request. */
    public static deleteTagEditRequest = async (username: string, tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "tag edit requests" WHERE "tag edit requests"."username" = $1 AND "tag edit requests"."tag" = $2`,
        values: [username, tag]
        }
        await SQLQuery.run(query)
    }

    /** Get tag edit requests */
    public static tagEditRequests = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT tags.type, "tag edit requests".*,
            COUNT(*) OVER() AS "requestCount"
            FROM "tag edit requests"
            JOIN tags ON tags.tag = "tag edit requests".tag
            GROUP BY "tag edit requests"."requestID", tags.type
            ORDER BY "tag edit requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<TagEditRequest[]>
    }

    /** Get user tag edit requests */
    public static userTagEditRequests = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT tags.type, "tag edit requests".*,
            COUNT(*) OVER() AS "requestCount"
            FROM "tag edit requests"
            JOIN tags ON tags.tag = "tag edit requests".tag
            WHERE "tag edit requests"."username" = $1
            GROUP BY "tag edit requests"."requestID", tags.type
            ORDER BY "tag edit requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<TagEditRequest[]>
    }

    /** Insert group request. */
    public static insertGroupRequest = async (username: string, slug: string, name: string, postID: string, reason: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "group requests" ("username", "slug", "name", "postID", "reason") 
            VALUES ($1, $2, $3, $4, $5) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, slug, name, postID, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete group request. */
    public static deleteGroupRequest = async (username: string, slug: string, postID: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "group requests" WHERE "group requests"."username" = $1 AND "group requests"."slug" = $2 AND "group requests"."postID" = $3`,
            values: [username, slug, postID]
        }
        await SQLQuery.run(query)
    }

    /** Get group requests */
    public static groupRequests = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
            )
            SELECT "group requests".*, 
            COUNT(*) OVER() AS "requestCount",
            to_json((array_agg(post_json.*))[1]) AS post,
            CASE WHEN groups."groupID" IS NOT NULL THEN true ELSE false END AS "exists"
            FROM "group requests"
            JOIN post_json ON post_json."postID" = "group requests"."postID"
            LEFT JOIN groups ON groups.slug = "group requests".slug
            GROUP BY "group requests"."requestID", groups."groupID"
            ORDER BY "group requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<GroupRequest[]>
    }

    /** Get user group requests */
    public static userGroupRequests = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
            )
            SELECT "group requests".*, 
            COUNT(*) OVER() AS "requestCount",
            to_json((array_agg(post_json.*))[1]) AS post,
            CASE WHEN groups."groupID" IS NOT NULL THEN true ELSE false END AS "exists"
            FROM "group requests"
            JOIN post_json ON post_json."postID" = "group requests"."postID"
            LEFT JOIN groups ON groups.slug = "group requests".slug
            WHERE "group requests"."username" = $1
            GROUP BY "group requests"."requestID", groups."groupID"
            ORDER BY "group requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<GroupRequest[]>
    }

    /** Insert pending group delete. */
    public static insertGroupDeleteRequest = async (username: string, slug: string, reason: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "delete requests" ("username", "group", "reason") VALUES ($1, $2, $3) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, slug, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete pending group delete. */
    public static deleteGroupDeleteRequest = async (username: string, slug: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."group" = $2 AND "delete requests"."groupPost" IS NULL`,
        values: [username, slug]
        }
        await SQLQuery.run(query)
    }

    /** Insert pending group delete. */
    public static insertGroupPostDeleteRequest = async (username: string, slug: string, postID: string, reason: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "delete requests" ("username", "group", "groupPost", "reason") VALUES ($1, $2, $3, $4) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, slug, postID, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete pending group delete. */
    public static deleteGroupPostDeleteRequest = async (username: string, slug: string, postID: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."group" = $2 AND "delete requests"."groupPost" = $3`,
        values: [username, slug, postID]
        }
        await SQLQuery.run(query)
    }

    /** Get group delete requests */
    public static groupDeleteRequests = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
            )
            SELECT "delete requests".*, groups.*,
            COUNT(*) OVER() AS "requestCount",
            to_json((array_agg(post_json.*))[1]) AS post
            FROM "delete requests"
            JOIN groups ON groups.slug = "delete requests".group
            LEFT JOIN post_json ON post_json."postID" = "delete requests"."groupPost"
            WHERE "delete requests"."group" IS NOT NULL
            GROUP BY "delete requests"."requestID", groups."groupID"
            ORDER BY "delete requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<GroupDeleteRequest[]>
    }

    /** Get user group delete requests */
    public static userGroupDeleteRequests = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            WITH post_json AS (
                SELECT posts.*, json_agg(DISTINCT images.*) AS images
                FROM posts
                JOIN images ON images."postID" = posts."postID"
                GROUP BY posts."postID"
            )
            SELECT "delete requests".*, groups.*,
            COUNT(*) OVER() AS "requestCount",
            to_json((array_agg(post_json.*))[1]) AS post
            FROM "delete requests"
            JOIN groups ON groups.slug = "delete requests".group
            LEFT JOIN post_json ON post_json."postID" = "delete requests"."groupPost"
            WHERE "delete requests"."group" IS NOT NULL AND "delete requests"."username" = $1
            GROUP BY "delete requests"."requestID", groups."groupID"
            ORDER BY "delete requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<GroupDeleteRequest[]>
    }

    /** Insert group edit request. */
    public static insertGroupEditRequest = async (username: string, slug: string, name: string, description: string, addedPosts: string[], 
        removedPosts: string[], orderChanged: boolean, changes: any, reason: string | null) => {
        const query: QueryArrayConfig = {
            text: /*sql*/`INSERT INTO "group edit requests" ("username", "group", "name", "description", "addedPosts", 
            "removedPosts", "orderChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING "requestID"`,
            rowMode: "array",
            values: [username, slug, name, description, addedPosts, removedPosts, orderChanged, changes, reason]
        }
        const result = await SQLQuery.run(query)
        return String(result.flat(Infinity)[0])
    }

    /** Delete group edit request. */
    public static deleteGroupEditRequest = async (username: string, slug: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "group edit requests" WHERE "group edit requests"."username" = $1 AND "group edit requests"."group" = $2`,
        values: [username, slug]
        }
        await SQLQuery.run(query)
    }

    /** Get group edit requests */
    public static groupEditRequests = async (offset?: number) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "group edit requests".*,
            COUNT(*) OVER() AS "requestCount"
            FROM "group edit requests"
            JOIN groups ON groups.slug = "group edit requests".group
            GROUP BY "group edit requests"."requestID"
            ORDER BY "group edit requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result as Promise<GroupEditRequest[]>
    }

    /** Get user group edit requests */
    public static userGroupEditRequests = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "group edit requests".*,
            COUNT(*) OVER() AS "requestCount"
            FROM "group edit requests"
            JOIN groups ON groups.slug = "group edit requests".group
            WHERE "group edit requests"."username" = $1
            GROUP BY "group edit requests"."requestID"
            ORDER BY "group edit requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result as Promise<GroupEditRequest[]>
    }
}