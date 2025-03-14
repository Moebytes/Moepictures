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
          pgClient.release(true)
      }
}

const posts = await run(`SELECT * FROM posts WHERE posts.rating = 'cute'`) as Post[]

ssh.close()

let urls = [
    "https://moepictures.moe/",
    "https://moepictures.moe/posts",
    "https://moepictures.moe/comments",
    "https://moepictures.moe/artists",
    "https://moepictures.moe/characters",
    "https://moepictures.moe/series",
    "https://moepictures.moe/tags",
    "https://moepictures.moe/help",
    "https://moepictures.moe/terms",
    "https://moepictures.moe/contact",
    "https://moepictures.moe/upload",
    "https://moepictures.moe/signup",
    "https://moepictures.moe/login"
]

for (const post of posts) {
    urls.push(`https://moepictures.moe/post/${post.postID}/${post.slug}`)
}

fs.writeFileSync("public/sitemap.txt", urls.join("\n"))

console.log(`Generated sitemap with ${urls.length} urls`)