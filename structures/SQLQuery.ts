import {Pool, QueryArrayConfig, QueryConfig} from "pg"

const pgPool = new Pool({
  connectionString: process.env.PG_URL,
  ssl: {rejectUnauthorized: false},
  max: 2
})

export default class SQLQuery {
  /** Run an SQL Query */
  public static run = async (query: QueryConfig | QueryArrayConfig | string) => {
      const pgClient = await pgPool.connect()
      try {
            const result = await pgClient.query(query)
            return result.rows as any
        } catch (error) {
            return Promise.reject(error)
        } finally {
            // @ts-ignore
            pgClient.release(true)
        }
    }

  /** Fetch a row */
  public static row = async (table: string, key: string, value: string | number | boolean) => {
    const query: QueryArrayConfig = {
      text: `SELECT * FROM "${table}" WHERE "${key}" = $1`,
      rowMode: "array",
      values: [value]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity) as string[]
  }

  /** Selects a column */
  public static column = async (table: string, column: string) => {
    const query: QueryArrayConfig = {
      text: `SELECT "${column}" FROM "${table}"`,
      rowMode: "array"
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity) as string[]
  }

  /** Fetches an entry */
  public static fetch = async (table: string, column: string, key: string, value: string | number | boolean) => {
    const query: QueryArrayConfig = {
      text: `SELECT "${column}" FROM "${table}" WHERE "${key}" = $1`,
      rowMode: "array",
      values: [value]
    }
    const result = await SQLQuery.run(query)
    return result.flat(Infinity) as string[]
  }

  /** Inserts a row into a table */
  public static insert = async (table: string, column: string, value: string | number | boolean) => {
      const query: QueryConfig = {
        text: `INSERT INTO "${table}" ("${column}") VALUES ($1)`,
        values: [value]
      }
      return SQLQuery.run(query)
  }

  /** Updates an entry */
  public static update = async (table: string, column: string, value: string | number | boolean, key: string, keyVal: string | number | boolean) => {
    const query: QueryConfig = {
        text: `UPDATE "${table}" SET "${column}" = $1 WHERE "${key}" = $2`,
        values: [value, keyVal]
    }
    return SQLQuery.run(query)
  }

  /** Deletes a row */
  public static delete = async (table: string, column: string, value: string | number | boolean) => {
    const query: QueryConfig = {
      text: `DELETE FROM "${table}" WHERE "${column}" = $1`,
      values: [value]
    }
    return SQLQuery.run(query)
  }

  /** Purges a table. */
  public static purgeTable = async (table: string) => {
    if (table === "points") return
    const query: QueryConfig = {
      text: `DELETE FROM "${table}"`
    }
    return SQLQuery.run(query)
  }

  /** Deletes duplicate records. */
  public static duplicates = async (table: string, column: string) => {
    const query: QueryConfig = {
      text: `DELETE FROM "${table}" T1 USING "${table}" T2
      WHERE T1.ctid < T2.ctid AND T1."${column}" = T2."${column}"`
    }
    return SQLQuery.run(query)
  }
}