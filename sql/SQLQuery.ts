/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Pool, QueryArrayConfig, QueryConfig, types} from "pg"
import {pgDump} from "pg-dump-restore"
import SSH2 from "ssh2-promise"
import * as Redis from "redis"
import functions from "../functions/Functions"
import serverFunctions from "../server/ServerFunctions"
import path from "path"
import fs from "fs"
import {createHash} from "crypto"
import {serialize, deserialize} from "v8"
import CacheInvalidation from "./CacheInvalidation.sql"
import CreateDB from "./CreateDB.sql"
import DBTriggers from "./DBTriggers.sql"
import SQLPost from "./SQLPost"
import SQLTag from "./SQLTag"
import SQLSearch from "./SQLSearch"
import SQLUser from "./SQLUser"
import SQLToken from "./SQLToken"
import SQLComment from "./SQLComment"
import SQLNote from "./SQLNote"
import SQLFavorite from "./SQLFavorite"
import SQLCuteness from "./SQLCuteness"
import SQLHistory from "./SQLHistory"
import SQLRequest from "./SQLRequest"
import SQLReport from "./SQLReport"
import SQLThread from "./SQLThread"
import SQLMessage from "./SQLMessage"
import SQLGroup from "./SQLGroup"

const jsonStringIDs = (json: string) => {
  const transformed = json.replace(/"(\w*ID)": (\d+)/g, (match, key, value) => `"${key}":"${value}"`)
  return JSON.parse(transformed)
}
types.setTypeParser(types.builtins.JSON, jsonStringIDs)
types.setTypeParser(types.builtins.JSONB, jsonStringIDs)

if (!process.env.PG_USER || !process.env.PG_HOST ||
    !process.env.PG_DATABASE || !process.env.PG_PASSWORD ||
    !process.env.PG_PORT) {
  throw new Error("Database credentials PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD, and PG_PORT required.")
}

let localPort = process.env.PG_PORT

if (!functions.config.useLocalDB()) {
  let ssh = new SSH2({
      host: process.env.SSH_HOST,
      username: process.env.SSH_USER,
      port: 22,
      identity: process.env.SSH_KEY_PATH
  } as any)

  await ssh.connect()

  let tunnel = await ssh.addTunnel({
      remoteAddr: process.env.PG_HOST,
      remotePort: Number(process.env.PG_PORT)
  })

  localPort = tunnel.localPort
}

const pgPool = functions.config.useLocalDB() ? new Pool({
  user: process.env.PG_LOCAL_USER,
  host: process.env.PG_LOCAL_HOST,
  database: process.env.PG_LOCAL_DATABASE,
  password: process.env.PG_LOCAL_PASSWORD,
  port: Number(process.env.PG_LOCAL_PORT)
}) : new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number(localPort)
})

await pgPool.query(CacheInvalidation)

const redis = Redis.createClient({
  url: functions.config.useLocalDB() ? process.env.LOCAL_REDIS_URL : process.env.REDIS_URL,
  disableOfflineQueue: true,
  commandOptions: {timeout: 1000},
  socket: {connectTimeout: 1000}
})

redis.on("error", (error) => console.error("Redis error:", error.message))
if (process.env.REDIS !== "off") redis.connect()

let resourceTables = await pgPool.query(functions.multiTrim(/*sql*/`
    SELECT tablename
    FROM pg_tables WHERE schemaname = 'public'
    AND tablename NOT IN ('server cache', 'sessions')
`)).then((result) => result.rows.map((row) => row.tablename as string))

export default class SQLQuery {
  public static post = SQLPost
  public static tag = SQLTag
  public static search = SQLSearch
  public static user = SQLUser
  public static token = SQLToken
  public static comment = SQLComment
  public static favorite = SQLFavorite
  public static cuteness = SQLCuteness
  public static note = SQLNote
  public static history = SQLHistory
  public static report = SQLReport
  public static request = SQLRequest
  public static thread = SQLThread
  public static message = SQLMessage
  public static group = SQLGroup

  /** Run an SQL Query */
  public static run = async (query: QueryConfig | QueryArrayConfig | string, cacheEndpoint?: string) => {
      const queryText = typeof query === "string" ? query : query.text ?? ""
      if (cacheEndpoint && SQLQuery.isCacheableRead(queryText)) {
        const dependencies = SQLQuery.getQueryTables(queryText)
        if (dependencies.length > 0) {
          const loadFromDatabase = () => SQLQuery.run(query)
          return SQLQuery.cacheRead(cacheEndpoint, query, loadFromDatabase, 300, dependencies)
        }
      }
      const pgClient = await pgPool.connect()
      try {
          const result = await pgClient.query(query)
          return result.rows as any
      } catch (error) {
          console.log(query)
          return Promise.reject(error)
      } finally {
          pgClient.release()
      }
  }

  /** Create the Database. */
  public static createDB = async () => {
    await SQLQuery.run(CreateDB)
    await SQLQuery.run(DBTriggers)
  }

  private static pendingCacheReads = new Map<string, Promise<string>>()

  private static isCacheableRead = (queryText: string) => {
    const startsWithRead = /^\s*(SELECT|WITH)\b/i.test(queryText)
    const containsWrite = /\b(INSERT|UPDATE|DELETE|MERGE|CALL|INTO)\b/i.test(queryText)
    const usesRandomOrSequence = /\b(random|nextval|setval)\s*\(/i.test(queryText)
    return startsWithRead && !containsWrite && !usesRandomOrSequence
  }

  private static getQueryTables = (queryText: string) => {
    const quotedOrPlainIdentifier = /"[^"]+"|[a-zA-Z_][a-zA-Z_0-9]*/g
    const identifiers = queryText.match(quotedOrPlainIdentifier) ?? []
    const normalized = new Set(identifiers.map((identifier) => {
      return identifier.replaceAll('"', "").toLowerCase()
    }))
    return resourceTables.filter((table) => normalized.has(table.toLowerCase()))
  }

  private static getCacheRevision = async (dependencies: string[]) => {
    const result = await pgPool.query(functions.multiTrim(/*sql*/`
      SELECT "resource", "revision" 
      FROM "server cache"
      WHERE "resource" = ANY($1::text[]) 
      ORDER BY "resource"
    `), [["*", ...dependencies]])
    return JSON.stringify(result.rows)
  }

  /** Prioritize a read from the cache. */
  public static cacheRead = async <T>(endpoint: string, params: unknown, load: () => Promise<T>, ttl = 300,
      dependencies = resourceTables) => {
    if (!redis.isReady) return load()
    const revision = await SQLQuery.getCacheRevision(dependencies)
    const versionHash = createHash("sha256").update(revision).digest("hex")
    const queryHash = createHash("sha256").update(JSON.stringify([endpoint, params])).digest("hex")
    const cacheKey = `moepictures:resources:v1:${versionHash}:${queryHash}`

    try {
      const cached = await redis.get(cacheKey)
      if (cached !== null) return deserialize(Buffer.from(cached, "base64")) as T
    } catch {
      return load()
    }

    let pending = SQLQuery.pendingCacheReads.get(cacheKey)
    if (!pending) {
      pending = (async () => {
        const value = serialize(await load()).toString("base64")
        try { 
          await redis.set(cacheKey, value, {EX: ttl}) 
        } catch {}
        return value
      })()
      SQLQuery.pendingCacheReads.set(cacheKey, pending)
    }
    try {
      return deserialize(Buffer.from(await pending, "base64")) as T
    } finally {
      if (SQLQuery.pendingCacheReads.get(cacheKey) === pending) SQLQuery.pendingCacheReads.delete(cacheKey)
    }
  }

  /** Set redis cache. */
  public static setCache = async (cacheKey: string, value: any, EX = 3600) => {
    if (!redis.isReady) return
    await redis.set(cacheKey, JSON.stringify(value), {EX}).catch(() => null)
  }

  /** Get redis cache. */
  public static getCache = async (cacheKey: string) => {
    if (!redis.isReady) return null
    const result = await redis.get(cacheKey).catch(() => null)
    return result ? JSON.parse(result) : null
  }

  /** Remove redis cache. */
  public static removeCache = async (cacheKey: string) => {
    if (!redis.isReady) return
    await redis.del(cacheKey).catch(() => null)
  }

  /** Invalidate cache. */
  public static flushCache = async () => {
    await pgPool.query(/*sql*/`UPDATE "server cache" SET "revision" = gen_random_uuid()::text WHERE "resource" = '*'`)
  }

  /** Backup the database */
  public static backupDB = async () => {
    if (!functions.config.backupsEnabled()) return
    const folder = path.join(__dirname, "./dump")
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `Moepictures-${timestamp}.dump`
    const backupPath = path.join(folder, filename)

    let connection = functions.config.useLocalDB() ? {
        username: process.env.PG_LOCAL_USER!,
        host: process.env.PG_LOCAL_HOST!,
        database: process.env.PG_LOCAL_DATABASE!,
        password: process.env.PG_LOCAL_PASSWORD!,
        port: Number(process.env.PG_LOCAL_PORT)
    } : {
        username: process.env.PG_USER!,
        host: process.env.PG_HOST!,
        database: process.env.PG_DATABASE!,
        password: process.env.PG_PASSWORD!,
        port: Number(process.env.PG_PORT)
    }
    await pgDump(connection, {
        filePath: backupPath,
        noOwner: true
    })

    const backupData = fs.readFileSync(backupPath)
    await serverFunctions.files.uploadBackup(filename, backupData)
    fs.unlinkSync(backupPath)
  }
}