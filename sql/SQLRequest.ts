import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLRequest {
    /** Insert pending post delete. */
    public static insertPostDeleteRequest = async (username: string, postID: number, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "delete requests" ("username", "postID", "reason") VALUES ($1, $2, $3)`,
        values: [username, postID, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete pending post delete. */
    public static deletePostDeleteRequest = async (username: string, postID: number) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."postID" = $2`,
        values: [username, postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get post delete requests. */
    public static postDeleteRequests = async (offset?: string) => {
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
        return result
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
        return result
    }

    /** Insert pending tag delete. */
    public static insertTagDeleteRequest = async (username: string, tag: string, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "delete requests" ("username", "tag", "reason") VALUES ($1, $2, $3)`,
        values: [username, tag, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete pending post delete. */
    public static deleteTagDeleteRequest = async (username: string, tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."tag" = $2`,
        values: [username, tag]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get tag delete requests */
    public static tagDeleteRequests = async (offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "delete requests".*, tags.*,
            COUNT(*) OVER() AS "requestCount"
            FROM "delete requests"
            JOIN tags ON tags.tag = "delete requests".tag
            WHERE "delete requests"."tag" IS NOT NULL
            GROUP BY "delete requests"."requestID", tags.tag
            ORDER BY "delete requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result
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
            GROUP BY "delete requests"."requestID", tags.tag
            ORDER BY "delete requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert alias request. */
    public static insertAliasRequest = async (username: string, tag: string, aliasTo: string, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "alias requests" ("username", "tag", "aliasTo", "reason") VALUES ($1, $2, $3, $4)`,
        values: [username, tag, aliasTo, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete alias request. */
    public static deleteAliasRequest = async (username: string, tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "alias requests" WHERE "alias requests"."username" = $1 AND "alias requests"."tag" = $2`,
        values: [username, tag]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get alias requests */
    public static aliasRequests = async (offset?: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "alias requests".*, tags.*,
            COUNT(*) OVER() AS "requestCount"
            FROM "alias requests"
            JOIN tags ON tags.tag = "alias requests".tag
            WHERE "alias requests"."tag" IS NOT NULL
            GROUP BY "alias requests"."requestID", tags.tag
            ORDER BY "alias requests"."requestID" DESC
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result
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
            GROUP BY "alias requests"."requestID", tags.tag
            ORDER BY "alias requests"."requestID" DESC
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert tag edit request. */
    public static insertTagEditRequest = async (username: string, tag: string, key: string, description: string, image: string, aliases: string[], 
        implications: string[], pixivTags: string[], social: string, twitter: string, website: string, fandom: string, imageChanged: boolean, 
        changes: any, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tag edit requests" ("username", "tag", "key", "description", "image", "aliases", "implications", "pixivTags", 
        "social", "twitter", "website", "fandom", "imageChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        values: [username, tag, key, description, image, aliases, implications, pixivTags, social, twitter, website, fandom, imageChanged, changes, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete tag edit request. */
    public static deleteTagEditRequest = async (username: string, tag: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "tag edit requests" WHERE "tag edit requests"."username" = $1 AND "tag edit requests"."tag" = $2`,
        values: [username, tag]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get tag edit requests */
    public static tagEditRequests = async (offset?: string) => {
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
        return result
    }

    /** Insert group request. */
    public static insertGroupRequest = async (username: string, slug: string, name: string, postID: string, reason: string) => {
        const query: QueryConfig = {
            text: /*sql*/`INSERT INTO "group requests" ("username", "slug", "name", "postID", "reason") VALUES ($1, $2, $3, $4, $5)`,
            values: [username, slug, name, postID, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete group request. */
    public static deleteGroupRequest = async (username: string, slug: string, postID: string) => {
        const query: QueryConfig = {
            text: /*sql*/`DELETE FROM "group requests" WHERE "group requests"."username" = $1 AND "group requests"."slug" = $2 AND "group requests"."postID" = $3`,
            values: [username, slug, postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get group requests */
    public static groupRequests = async (offset?: string) => {
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
        return result
    }

    /** Insert pending group delete. */
    public static insertGroupDeleteRequest = async (username: string, slug: string, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "delete requests" ("username", "group", "reason") VALUES ($1, $2, $3)`,
        values: [username, slug, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete pending group delete. */
    public static deleteGroupDeleteRequest = async (username: string, slug: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."group" = $2 AND "delete requests"."groupPost" IS NULL`,
        values: [username, slug]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert pending group delete. */
    public static insertGroupPostDeleteRequest = async (username: string, slug: string, postID: string, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "delete requests" ("username", "group", "groupPost", "reason") VALUES ($1, $2, $3, $4)`,
        values: [username, slug, postID, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete pending group delete. */
    public static deleteGroupPostDeleteRequest = async (username: string, slug: string, postID: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "delete requests" WHERE "delete requests"."username" = $1 AND "delete requests"."group" = $2 AND "delete requests"."groupPost" = $3`,
        values: [username, slug, postID]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get group delete requests */
    public static groupDeleteRequests = async (offset?: string) => {
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
        return result
    }

    /** Insert group edit request. */
    public static insertGroupEditRequest = async (username: string, slug: string, name: string, description: string, addedPosts: string[], 
        removedPosts: string[], orderChanged: boolean, changes: any, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "group edit requests" ("username", "group", "name", "description", "addedPosts", 
        "removedPosts", "orderChanged", "changes", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        values: [username, slug, name, description, addedPosts, removedPosts, orderChanged, changes, reason]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete group edit request. */
    public static deleteGroupEditRequest = async (username: string, slug: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "group edit requests" WHERE "group edit requests"."username" = $1 AND "group edit requests"."group" = $2`,
        values: [username, slug]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get group edit requests */
    public static groupEditRequests = async (offset?: string) => {
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
        return result
    }
}