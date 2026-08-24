/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import "dotenv/config"
import type {QueryArrayConfig, QueryConfig} from "pg"
import SSH2 from "ssh2-promise"
import type {Post} from "./types/PostTypes"
import pg from "pg"
const {Pool, types} = pg
import fs from "fs"

const jsonStringIDs = (json: string) => {
    const transformed = json.replace(/"(\w*ID)": (\d+)/g, (match, key, value) => `"${key}":"${value}"`)
    return JSON.parse(transformed)
}
types.setTypeParser(types.builtins.JSON, jsonStringIDs)
types.setTypeParser(types.builtins.JSONB, jsonStringIDs)

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

const pgPool = process.env.LOCAL_DATABASE === "yes" ? new Pool({
  user: process.env.PG_LOCAL_USER,
  host: process.env.PG_LOCAL_HOST,
  database: process.env.PG_LOCAL_DATABASE,
  password: process.env.PG_LOCAL_PASSWORD,
  port: tunnel ? tunnel.localPort : Number(process.env.PG_LOCAL_PORT)
}) : new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: tunnel ? tunnel.localPort : Number(process.env.PG_PORT)
})

const run = async (query: QueryConfig | QueryArrayConfig | string) => {
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

const posts = await run(`SELECT * FROM posts WHERE posts.rating = 'cute'`) as Post[]

ssh.close()

let urls = [
    "https://moepictures.com/",
    "https://moepictures.com/posts",
    "https://moepictures.com/comments",
    "https://moepictures.com/artists",
    "https://moepictures.com/characters",
    "https://moepictures.com/series",
    "https://moepictures.com/tags",
    "https://moepictures.com/help",
    "https://moepictures.com/terms",
    "https://moepictures.com/contact",
    "https://moepictures.com/upload",
    "https://moepictures.com/signup",
    "https://moepictures.com/login"
]

for (const post of posts) {
    urls.push(`https://moepictures.com/post/${post.postID}/${post.slug}`)
}

fs.writeFileSync("public/sitemap.txt", urls.join("\n"))

console.log(`Generated sitemap with ${urls.length} urls`)