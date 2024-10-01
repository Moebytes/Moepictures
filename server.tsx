import path from "path"
import cors from "cors"
import mime from "mime"
import {Readable} from "stream"
import {Pool} from "pg"
import fs from "fs"
import sharp from "sharp"
import express, {Request, Response, NextFunction} from "express"
import session from "express-session"
import S3 from "aws-sdk/clients/s3"
import PGSession from "connect-pg-simple"
import webpack from "webpack"
import middleware from "webpack-dev-middleware"
import hot from "webpack-hot-middleware"
import config from "./webpack.config"
import dotenv from "dotenv"
import App from "./App"
import {renderToString} from "react-dom/server"
import {StaticRouter as Router} from "react-router-dom"
import functions from "./structures/Functions"
import cryptoFunctions from "./structures/CryptoFunctions"
import serverFunctions from "./structures/ServerFunctions"
import sql from "./sql/SQLQuery"
import $2FARoutes from "./routes/2FARoutes"
import CommentRoutes from "./routes/CommentRoutes"
import CutenessRoutes from "./routes/CutenessRoutes"
import FavoriteRoutes from "./routes/FavoriteRoutes"
import MiscRoutes from "./routes/MiscRoutes"
import PostRoutes from "./routes/PostRoutes"
import SearchRoutes from "./routes/SearchRoutes"
import TagRoutes from "./routes/TagRoutes"
import UploadRoutes from "./routes/UploadRoutes"
import UserRoutes from "./routes/UserRoutes"
import TranslationRoutes from "./routes/TranslationRoutes"
import ThreadRoutes from "./routes/ThreadRoutes"
import MessageRoutes from "./routes/MessageRoutes"
const __dirname = path.resolve()

dotenv.config()
const app = express() as any
let compiler = webpack(config as any)
app.use(express.urlencoded({extended: true, limit: "1gb", parameterLimit: 50000}))
app.use(express.json({limit: "1gb"}))
app.use(cors({credentials: true, origin: true}))
app.disable("x-powered-by")

declare module "express-session" {
  interface SessionData {
      username: string
      email: string
      joinDate: string
      image: string 
      imagePost: string
      bio: string 
      emailVerified: boolean
      publicFavorites: boolean
      showRelated: boolean
      showTooltips: boolean
      showTagBanner: boolean
      downloadPixivID: boolean
      autosearchInterval: number
      upscaledImages: boolean
      $2fa: boolean
      ip: string
      role: string
      captchaAmount: number 
      lastPostID: number
      csrfSecret: string
      csrfToken: string
      captchaAnswer: string
      banned: boolean
  }
}

const s3 = new S3({region: "us-east-1", credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY!,
  secretAccessKey: process.env.AWS_SECRET_KEY!
}})

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

const pgSession = PGSession(session)
app.use(session({
  store: new pgSession({
    pool: pgPool,
    sidColumnName: "sessionID",
    sessColumnName: "session",
    expireColumnName: "expires"
  }),
  secret: process.env.COOKIE_SECRET!,
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "strict", secure: "auto"},
  rolling: true,
  resave: false,
  saveUninitialized: false
}))

$2FARoutes(app)
CommentRoutes(app)
CutenessRoutes(app)
FavoriteRoutes(app)
MiscRoutes(app)
PostRoutes(app)
SearchRoutes(app)
TagRoutes(app)
UploadRoutes(app)
UserRoutes(app)
TranslationRoutes(app)
ThreadRoutes(app)
MessageRoutes(app)

if (process.env.TESTING === "yes") {
  app.use(middleware(compiler, {
    index: false,
    serverSideRender: false,
    writeToDisk: false,
  }))
  app.use(hot(compiler))
}

app.use(express.static(path.join(__dirname, "./public")))
app.use(express.static(path.join(__dirname, "./dist"), {index: false}))
app.use("/assets", express.static(path.join(__dirname, "./assets")))

let folders = ["animation", "artist", "character", "comic", "image", "pfp", "series", "tag", "video", "audio", "model", "history"]
let noCache = ["artist", "character", "series", "pfp", "tag"]
let encrypted = ["image", "comic"]

for (let i = 0; i < folders.length; i++) {
  app.get(`/${folders[i]}/*`, async (req: Request, res: Response, next: NextFunction) => {
    let url = req.url.replace(/\?.*$/, "")
    const mimeType = mime.getType(req.path)
    try {
      if (folders[i] === "tag") {
        if (!url.endsWith(".png") && !url.endsWith(".jpg") && !url.endsWith(".jpeg") &&
        !url.endsWith(".webp") && !url.endsWith(".gif")) return next()
      }
      res.setHeader("Content-Type", mimeType ?? "")
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2592000")
      const key = decodeURIComponent(req.path.slice(1))
      if (req.session.role !== "admin" && req.session.role !== "mod") {
        const postID = key.match(/(?<=\/)\d+(?=\/)/)?.[0]
        if (postID) {
          const post = await sql.post.post(Number(postID))
          if (post.restrict === "explicit") return res.status(403).send("No permission")
        }
      }
      let upscaled = false
      if (folders[i] === "image" || folders[i] === "comic" || folders[i] === "animation") {
        upscaled = req.session.upscaledImages as boolean
        if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
      }
      let body = await serverFunctions.getFile(key, upscaled)
      let contentLength = body.length
      if (!contentLength) return res.status(200).send(body)
      if (req.headers.range) {
        const parts = req.headers.range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0])
        const end = parts[1] ? parseInt(parts[1]) : contentLength - 1
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1
        })
        const stream = Readable.from(body.slice(start, end + 1))
        return stream.pipe(res)
      }
      if (encrypted.includes(folders[i]) || req.path.includes("history/post")) {
        const encrypted = cryptoFunctions.encrypt(body)
        res.setHeader("Content-Length", encrypted.length)
        return res.status(200).end(encrypted)
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).end(body)
    } catch {
      res.status(400).end()
    }
  })
  
  app.get(`/unverified/${folders[i]}/*`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
      res.setHeader("Content-Type", mime.getType(req.path) ?? "")
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2592000")
      const key = decodeURIComponent(req.path.replace("/unverified/", ""))
      let upscaled = false
      if (folders[i] === "image" || folders[i] === "comic" || folders[i] === "animation") {
        upscaled = req.session.upscaledImages as boolean
        if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
      }
      const body = await serverFunctions.getUnverifiedFile(key, upscaled)
      const contentLength = body.length
      if (req.headers.range) {
        const parts = req.headers.range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0])
        const end = parts[1] ? parseInt(parts[1]) : contentLength - 1
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1
        })
        const stream = Readable.from(body.slice(start, end + 1))
        stream.pipe(res)
        return
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).end(body)
    } catch (e) {
      console.log(e)
      res.status(400).end()
    }
  })

  app.get(`/thumbnail/:size/${folders[i]}/*`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mimeType = mime.getType(req.path)
      res.setHeader("Content-Type", mimeType ?? "")
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2592000")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, ""))
      if (req.session.role !== "admin" && req.session.role !== "mod") {
        const postID = key.match(/(?<=\/)\d+(?=\/)/)?.[0]
        if (postID) {
          const post = await sql.post.post(Number(postID))
          if (post.restrict === "explicit") return res.status(403).send("No permission")
        }
      }
      let body = await serverFunctions.getFile(key, false)
      let contentLength = body.length
      if (!contentLength) return res.status(200).send(body)
      if (mimeType?.includes("image")) {
        const metadata = await sharp(body).metadata()
        if (metadata.pages === 1) {
          const ratio = metadata.height! / Number(req.params.size)
          body = await sharp(body, {animated: false, limitInputPixels: false})
          .resize(Math.round(metadata.width! / ratio), Number(req.params.size), {fit: "fill", kernel: "cubic"})
          .toBuffer()
          contentLength = body.length
        }
      }
      if (req.headers.range) {
        const parts = req.headers.range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0])
        const end = parts[1] ? parseInt(parts[1]) : contentLength - 1
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1
        })
        const stream = Readable.from(body.slice(start, end + 1))
        return stream.pipe(res)
      }
      if (encrypted.includes(folders[i]) || req.path.includes("history/post")) {
        const encrypted = cryptoFunctions.encrypt(body)
        res.setHeader("Content-Length", encrypted.length)
        return res.status(200).end(encrypted)
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).end(body)
    } catch (e) {
      console.log(e)
      res.status(400).end()
    }
  })

  app.get(`/thumbnail/:size/unverified/${folders[i]}/*`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
      const mimeType = mime.getType(req.path)
      res.setHeader("Content-Type", mimeType ?? "")
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2592000")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, "").replace("unverified/", ""))
      let body = await serverFunctions.getUnverifiedFile(key, false)
      let contentLength = body.length
      if (mimeType?.includes("image")) {
        const metadata = await sharp(body).metadata()
        const ratio = metadata.height! / Number(req.params.size)
        body = await sharp(body, {animated: false, limitInputPixels: false})
        .resize(Math.round(metadata.width! / ratio), Number(req.params.size), {fit: "fill", kernel: "cubic"})
        .toBuffer()
        contentLength = body.length
      }
      if (req.headers.range) {
        const parts = req.headers.range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0])
        const end = parts[1] ? parseInt(parts[1]) : contentLength - 1
        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${contentLength}`,
          "Accept-Ranges": "bytes",
          "Content-Length": end - start + 1
        })
        const stream = Readable.from(body.slice(start, end + 1))
        return stream.pipe(res)
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).end(body)
    } catch {
      res.status(400).end()
    }
  })
}

app.get("/*", (req: Request, res: Response) => {
  if (!req.hostname.includes("moepictures") && !req.hostname.includes("localhost") && !req.hostname.includes("192.168.68")) {
    res.redirect(301, `https://moepictures.moe${req.path}`)
  }
  if (!req.session.csrfToken) {
    const {secret, token} = serverFunctions.generateCSRF()
    req.session.csrfSecret = secret
    req.session.csrfToken = token
  }
  res.setHeader("Content-Type", mime.getType(req.path) ?? "")
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
  const document = fs.readFileSync(path.join(__dirname, "./dist/index.html"), {encoding: "utf-8"})
  const html = renderToString(<Router location={req.url}><App/></Router>)
  res.status(200).send(document?.replace(`<div id="root"></div>`, `<div id="root">${html}</div>`))
})

const run = async () => {
  await sql.createDB()

  /** Unverified tags */
  await sql.tag.insertUnverifiedTag("unknown-artist", "artist")
  await sql.tag.insertUnverifiedTag("unknown-character", "character")
  await sql.tag.insertUnverifiedTag("unknown-series", "series")
  await sql.tag.insertUnverifiedTag("needs-tags", "meta")

  /* Default artist tags */
  let exists = await sql.tag.insertTag("unknown-artist", "artist")
  if (!exists) await sql.tag.updateTag("unknown-artist", "description", "The artist is unknown.")
  exists = await sql.tag.insertTag("original", "artist")
  if (!exists) await sql.tag.updateTag("original", "description", "The character is an original creation, ie. this is not fanart.")
  exists = await sql.tag.insertTag("official-art", "artist")
  if (!exists) await sql.tag.updateTag("official-art", "description", "Art made by the official company of the series (where the original artist is unknown).")

  /* Default character tags */
  exists = await sql.tag.insertTag("unknown-character", "character")
  if (!exists) await sql.tag.updateTag("unknown-character", "description", "The character is unknown.")
  exists = await sql.tag.insertTag("no-character", "character")
  if (!exists) await sql.tag.updateTag("no-character", "description", "The character is not applicable.")

  /* Default series tags */
  exists = await sql.tag.insertTag("unknown-series", "series")
  if (!exists) await sql.tag.updateTag("unknown-series", "description", "The series is unknown.")
  exists = await sql.tag.insertTag("no-series", "series")
  if (!exists) await sql.tag.updateTag("no-series", "description", "The series is not applicable.")

  /* Default meta tags */
  exists = await sql.tag.insertTag("needs-tags", "meta")
  if (!exists) await sql.tag.updateTag("needs-tags", "description", "The post needs tags.")
  exists = await sql.tag.insertTag("no-audio", "meta")
  if (!exists) await sql.tag.updateTag("no-audio", "description", "The post is a video with no audio.")
  exists = await sql.tag.insertTag("with-audio", "meta")
  if (!exists) await sql.tag.updateTag("with-audio", "description", "The post is a video with audio.")
  exists = await sql.tag.insertTag("self-post", "meta")
  if (!exists) await sql.tag.updateTag("self-post", "description", "The artwork was posted by the original creator.")
  exists = await sql.tag.insertTag("transparent", "meta")
  if (!exists) await sql.tag.updateTag("transparent", "description", "The post has a transparent background.")
  exists = await sql.tag.insertTag("commentary", "meta")
  if (!exists) await sql.tag.updateTag("commentary", "description", "The post has artist commentary.")
  exists = await sql.tag.insertTag("translated", "meta")
  if (!exists) await sql.tag.updateTag("translated", "description", "The post contains complete translations.")
  exists = await sql.tag.insertTag("untranslated", "meta")
  if (!exists) await sql.tag.updateTag("untranslated", "description", "The post is untranslated.")
  exists = await sql.tag.insertTag("partially-translated", "meta")
  if (!exists) await sql.tag.updateTag("partially-translated", "description", "Post is only partially translated.")
  exists = await sql.tag.insertTag("check-translation", "meta")
  if (!exists) await sql.tag.updateTag("check-translation", "description", "Check the translations, because they might be incorrect.")
  exists = await sql.tag.insertTag("multiple-artists", "meta")
  if (!exists) await sql.tag.updateTag("multiple-artists", "description", "The post has multiple artists.")
  exists = await sql.tag.insertTag("bad-pixiv-id", "meta")
  if (!exists) await sql.tag.updateTag("bad-pixiv-id", "description", "The pixiv id was deleted.")

  app.listen(process.env.PORT || 8082, () => console.log("Started the website server!"))
}

run()