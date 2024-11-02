import {QueryArrayConfig, QueryConfig} from "pg"
import SQLQuery from "./SQLQuery"
import functions from "../structures/Functions"

export default class SQLToken {
    /** Insert email token. */
    public static insertEmailToken = async (email: string, token: string) => {
        let now = new Date() as any
        now.setHours(now.getHours() + 1)
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "email tokens" ("email", "token", "expires") VALUES ($1, $2, $3)`,
        values: [email, token, now.toISOString()]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Updates email token. */
    public static updateEmailToken = async (email: string, token: string) => {
        let now = new Date() as any
        now.setHours(now.getHours() + 1)
        const query: QueryConfig = {
            text: /*sql*/`UPDATE "email tokens" SET "token" = $1, "expires" = $2 WHERE "email" = $3`,
            values: [token, now.toISOString(), email]
        }
        return SQLQuery.run(query)
    }

    /** Get email token. */
    public static emailToken = async (token: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "email tokens".*
            FROM "email tokens"
            WHERE "email tokens"."token" = $1
            GROUP BY "email tokens"."email"
            `),
            values: [token]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get email tokens. */
    public static emailTokens = async () => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "email tokens".*
            FROM "email tokens"
            GROUP BY "email tokens"."email"
            `)
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete email token. */
    public static deleteEmailToken = async (email: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "email tokens" WHERE "email tokens"."email" = $1`,
        values: [email]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get 2fa token. */
    public static $2faToken = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "2fa tokens".*
            FROM "2fa tokens"
            WHERE "2fa tokens"."username" = $1
            GROUP BY "2fa tokens"."username"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Insert 2fa token. */
    public static insert2faToken = async (username: string, token: string, qrcode: string) => {
        let now = new Date() as any
        now.setHours(now.getHours() + 1)
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "2fa tokens" ("username", "token", "qrcode") VALUES ($1, $2, $3)`,
        values: [username, token, qrcode]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete 2fa token. */
    public static delete2faToken = async (username: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "2fa tokens" WHERE "2fa tokens"."username" = $1`,
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert password token. */
    public static insertPasswordToken = async (username: string, token: string) => {
        let now = new Date() as any
        now.setHours(now.getHours() + 1)
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "password tokens" ("username", "token", "expires") VALUES ($1, $2, $3)`,
        values: [username, token, now.toISOString()]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Get password token. */
    public static passwordToken = async (username: string) => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "password tokens".*
            FROM "password tokens"
            WHERE "password tokens"."username" = $1
            GROUP BY "password tokens"."username"
            `),
            values: [username]
        }
        const result = await SQLQuery.run(query)
        return result[0]
    }

    /** Get password tokens. */
    public static passwordTokens = async () => {
        const query: QueryConfig = {
        text: functions.multiTrim(/*sql*/`
            SELECT "password tokens".*
            FROM "password tokens"
            GROUP BY "password tokens"."username"
            `)
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Delete password token. */
    public static deletePasswordToken = async (username: string) => {
        const query: QueryConfig = {
        text: /*sql*/`DELETE FROM "password tokens" WHERE "password tokens"."username" = $1`,
        values: [username]
        }
        const result = await SQLQuery.run(query)
        return result
    }

    /** Insert payment. */
    public static insertPayment = async (chargeID: string, username: string, email: string) => {
        const query: QueryConfig = {
        text: /*sql*/`INSERT INTO "payments" ("chargeID", "username", "email") VALUES ($1, $2, $3)`,
        values: [chargeID, username, email]
        }
        const result = await SQLQuery.run(query)
        return result
    }
}