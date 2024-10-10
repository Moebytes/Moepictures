import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLUser {
    /** Get uploads. */
    public static uploads = async (username: string, limit?: string, offset?: string) => {
        let i = 2
        let values = [] as any
        let limitValue = i
        if (limit) {
            if (Number(limit) > 100) limit = "100"
            values.push(limit)
            i++
        }
        if (offset) values.push(offset)
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
                SELECT posts.*, json_agg(DISTINCT images.*) AS images, json_agg(DISTINCT "tag map".tag) AS tags,
                COUNT(*) OVER() AS "uploadCount"
                FROM posts
                JOIN images ON posts."postID" = images."postID"
                JOIN "tag map" ON posts."postID" = "tag map"."postID"
                WHERE posts."uploader" = $1
                GROUP BY posts."postID"
                ${limit ? `LIMIT $${limitValue}` : "LIMIT 100"} ${offset ? `OFFSET $${i}` : ""}
            `),
            values: [username]
        }
        if (values?.[0]) query.values?.push(...values)
        const result = await SQLQuery.run(query, true)
        return result
    }

    /** Create a new user. */
    public static insertUser = async (username: string, email: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "users" ("username", "email") VALUES ($1, $2)`,
        values: [username, email]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates a user */
    public static updateUser = async (username: string, column: string, value: string | number | boolean | null) => {
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "users" SET "${column}" = $1 WHERE "username" = $2`,
            values: [value, username]
        }
        return SQLQuery.run(query)
    }

    /** Get user. */
    public static user = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT users.*
            FROM users
            WHERE users."username" = $1
            GROUP BY users."username"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get user by email. */
    public static userByEmail = async (email: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT users.*
            FROM users
            WHERE users."email" = $1
            GROUP BY users."username"
            `),
            values: [email]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Delete user. */
    public static deleteUser = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`DELETE FROM users WHERE users."username" = $1`),
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get all admins. */
    public static admins = async () => {
        const query: QueryConfig = {
            text: `SELECT * FROM users WHERE users."role" = 'admin'`
        }
        const result = await SQLQuery.run(query)
        return result
    }
}