import {Pool, QueryArrayConfig, QueryConfig} from "pg"
import * as Redis from "redis"
import CreateDB from "./CreateDB.sql"
import functions from "../structures/Functions"
import SQLPost from "./SQLPost"
import SQLTag from "./SQLTag"
import SQLSearch from "./SQLSearch"
import SQLUser from "./SQLUser"
import SQLToken from "./SQLToken"
import SQLComment from "./SQLComment"
import SQLTranslation from "./SQLTranslation"
import SQLFavorite from "./SQLFavorite"
import SQLCuteness from "./SQLCuteness"
import SQLHistory from "./SQLHistory"
import SQLRequest from "./SQLRequest"
import SQLReport from "./SQLReport"
import SQLThread from "./SQLThread"
import SQLMessage from "./SQLMessage"

const redis = Redis.createClient({
  url: process.env.REDIS_URL
})

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

if (process.env.REDIS === "on") redis.connect()

export default class SQLQuery {
  public static post = SQLPost
  public static tag = SQLTag
  public static search = SQLSearch
  public static user = SQLUser
  public static token = SQLToken
  public static comment = SQLComment
  public static favorite = SQLFavorite
  public static cuteness = SQLCuteness
  public static translation = SQLTranslation
  public static history = SQLHistory
  public static report = SQLReport
  public static request = SQLRequest
  public static thread = SQLThread
  public static message = SQLMessage

  /** Run an SQL Query */
  public static run = async (query: QueryConfig | QueryArrayConfig | string, cache?: boolean) => {
      let redisResult = null
      if (cache) {
        try {
          redisResult = await redis.get(JSON.stringify(query)) as any
          if (redisResult) return (JSON.parse(redisResult))
        } catch {
          // ignore
        }
      }
      const pgClient = await pgPool.connect()
      try {
            const result = await pgClient.query(query)
            if (cache) await redis.set(JSON.stringify(query), JSON.stringify(result.rows)).catch(() => null)
            return result.rows as any
        } catch (error) {
            return Promise.reject(error)
        } finally {
            pgClient.release(true)
        }
  }

  /** Create the Database. */
  public static createDB = async () => {
    return SQLQuery.run(CreateDB)
  }

  /** Flush redis db */
  public static flushDB = async (): Promise<void> => {
    await redis.flushDb().catch(() => null)
  }
}