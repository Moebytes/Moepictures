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
            SELECT "delete requests".*, json_build_object(
            'type', post_json."type",
            'restrict', post_json."restrict",
            'style', post_json."style",
            'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "delete requests"
            JOIN post_json ON post_json."postID" = "delete requests"."postID"
            WHERE "delete requests"."postID" IS NOT NULL
            GROUP BY "delete requests"."deleteRequestID", post_json."type", post_json."restrict", post_json."style"
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
            SELECT "delete requests".*, json_build_object(
            'type', post_json."type",
            'restrict', post_json."restrict",
            'style', post_json."style",
            'images', (array_agg(post_json."images"))[1]
            ) AS post
            FROM "delete requests"
            JOIN post_json ON post_json."postID" = "delete requests"."postID"
            WHERE "delete requests"."postID" IS NOT NULL AND "delete requests".username = $1
            GROUP BY "delete requests"."deleteRequestID", post_json."type", post_json."restrict", post_json."style"
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
            SELECT "delete requests".*, tags.*
            FROM "delete requests"
            JOIN tags ON tags.tag = "delete requests".tag
            WHERE "delete requests"."tag" IS NOT NULL
            GROUP BY "delete requests"."deleteRequestID", tags.tag
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
            SELECT "delete requests".*, tags.*
            FROM "delete requests"
            JOIN tags ON tags.tag = "delete requests".tag
            WHERE "delete requests"."tag" IS NOT NULL AND "delete requests".username = $1
            GROUP BY "delete requests"."deleteRequestID", tags.tag
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
            SELECT "alias requests".*, tags.*
            FROM "alias requests"
            JOIN tags ON tags.tag = "alias requests".tag
            WHERE "alias requests"."tag" IS NOT NULL
            GROUP BY "alias requests"."aliasRequestID", tags.tag
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
            SELECT "alias requests".*, tags.*
            FROM "alias requests"
            JOIN tags ON tags.tag = "alias requests".tag
            WHERE "alias requests"."tag" IS NOT NULL AND "alias requests".username = $1
            GROUP BY "alias requests"."aliasRequestID", tags.tag
        `),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert tag edit request. */
    public static insertTagEditRequest = async (username: string, tag: string, key: string, description: string, image: string, aliases: string[], implications: string[], pixivTags: string[], social: string, twitter: string, website: string, fandom: string, reason: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "tag edit requests" ("username", "tag", "key", "description", "image", "aliases", "implications", "pixivTags", "social", "twitter", "website", "fandom", "reason") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        values: [username, tag, key, description, image, aliases, implications, pixivTags, social, twitter, website, fandom, reason]
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
            SELECT tags.type, "tag edit requests".*
            FROM "tag edit requests"
            JOIN tags ON tags.tag = "tag edit requests".tag
            GROUP BY "tag edit requests"."tagEditRequestID", tags.type
            LIMIT 100 ${offset ? `OFFSET $1` : ""}
        `),
        }
        if (offset) query.values = [offset]
        const result = await SQLQuery.run(query)
        return result
    }
}