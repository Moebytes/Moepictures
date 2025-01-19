import {Pool, QueryArrayConfig, QueryConfig, types} from "pg"
import * as Redis from "redis"
import crypto from "crypto"
import CreateDB from "./CreateDB.sql"
import functions from "../structures/Functions"
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

const pgPool = functions.isLocalHost() ? new Pool({
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
  port: Number(process.env.PG_PORT)
})

const redis = Redis.createClient({
  url: process.env.REDIS_URL
})

if (process.env.REDIS === "on") redis.connect()

const hashQuery = (query: QueryConfig | QueryArrayConfig | string): string => {
  return crypto.createHash("sha256").update(typeof query === "string" ? query : JSON.stringify(query)).digest("hex")
}

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
      let cacheKey: string | null = null
      let redisResult: string | null = null
      if (cacheEndpoint) {
        try {
          cacheKey = `${cacheEndpoint}_${hashQuery(query)}`
          redisResult = await redis.get(cacheKey)
          if (redisResult) return JSON.parse(redisResult)
        } catch (error) {
          // ignore
        }
      }
      const pgClient = await pgPool.connect()
      const startTime = Date.now()
      try {
          const result = await pgClient.query(query)
          const endTime = Date.now()
          const executionTime = endTime - startTime
          if (cacheKey) {
            await redis.set(cacheKey, JSON.stringify(result.rows), {EX: 3600}).catch(() => null)
          }
          return result.rows as any
      } catch (error) {
          console.log(query)
          return Promise.reject(error)
      } finally {
          pgClient.release(true)
      }
  }

  /** Create the Database. */
  public static createDB = async () => {
    return SQLQuery.run(CreateDB)
  }

  /** Set cache */
  public static setCache = async (cacheKey: string, value: any) => {
    await redis.set(cacheKey, JSON.stringify(value), {EX: 3600}).catch(() => null)
  }

  /** Get cache */
  public static getCache = async (cacheKey: string) => {
    const result = await redis.get(cacheKey).catch(() => null)
    return result ? JSON.parse(result) : null
  }

  /** Invalidate cache */
  public static invalidateCache = async (cacheEndpoint: string) => {
    try {
      for await (const key of redis.scanIterator({MATCH: `${cacheEndpoint}*`})) {
        await redis.del(key).catch(() => null)
      }
    } catch {
      // ignore
    }
  }
}