import path from "path"
import cors from "cors"
import mime from "mime"
import {Readable} from "stream"
import {Pool} from "pg"
import fs from "fs"
import sharp from "sharp"
import express, {Request, NextFunction} from "express"
import session from "express-session"
import S3 from "aws-sdk/clients/s3"
import PGSession from "connect-pg-simple"
import webpack from "webpack"
import middleware from "webpack-dev-middleware"
import hot from "webpack-hot-middleware"
import config from "./webpack.config"
import dotenv from "dotenv"
import React from "react"
import App from "./App"
import {renderToString} from "react-dom/server"
import {StaticRouter as Router} from "react-router-dom"
import functions from "./structures/Functions"
import cryptoFunctions from "./structures/CryptoFunctions"
import serverFunctions from "./structures/ServerFunctions"
import sql from "./structures/SQLQuery"
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
const __dirname = path.resolve()

dotenv.config()
const app = express() as any
let compiler = webpack(config as any)
app.use(express.urlencoded({extended: true, limit: "1gb", parameterLimit: 50000}))
app.use(express.json({limit: "1gb"}))
app.use(cors({credentials: true, origin: true}))
app.disable("x-powered-by")
// app.set("trust proxy", true)

declare module "express-session" {
  interface SessionData {
      username: string
      email: string
      joinDate: string
      image: string 
      bio: string 
      emailVerified: boolean
      publicFavorites: boolean
      $2fa: boolean
      ip: string
      role: string
      captchaAmount: number 
      lastPostID: number
  }
}

const s3 = new S3({region: "us-east-1", credentials: {
  accessKeyId: process.env.AWS_ACCESS_KEY!,
  secretAccessKey: process.env.AWS_SECRET_KEY!
}})

const pgPool = new Pool({
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
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},
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

let folders = ["animation", "artist", "character", "comic", "image", "pfp", "series", "tag", "video", "audio", "model"]

for (let i = 0; i < folders.length; i++) {
  serverFunctions.uploadFile(`${folders[i]}/`, "")
  serverFunctions.uploadUnverifiedFile(`${folders[i]}/`, "")
  app.get(`/${folders[i]}/*`, async (req: Request, res, next: NextFunction) => {
    try {
      if (folders[i] === "tag") {
        if (!req.url.endsWith(".png") || !req.url.endsWith(".jpg") || !req.url.endsWith(".jpeg") ||
        !req.url.endsWith(".webp") || !req.url.endsWith(".gif")) return next()
      }
      res.setHeader("Content-Type", mime.getType(req.path) ?? "")
      const key = decodeURIComponent(req.path.slice(1))
      if (req.session.role !== "admin" && req.session.role !== "mod") {
        const postID = key.match(/(?<=\/)\d+(?=\/)/)?.[0]
        if (postID) {
          const post = await sql.post(Number(postID))
          if (post.restrict === "explicit") return res.status(403).send("No permission")
        }
      }
      const body = await s3.getObject({Key: key, Bucket: "moebooru"}).promise().then((r) => r.Body) as any
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
        return stream.pipe(res)
      }
      if (folders[i] === "image" || folders[i] === "comic") {
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
  app.get(`/unverified/${folders[i]}/*`, async (req, res, next) => {
    try {
      if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
      res.setHeader("Content-Type", mime.getType(req.path) ?? "")
      const key = decodeURIComponent(req.path.replace("/unverified/", ""))
      const body = await s3.getObject({Key: key, Bucket: "moebooru-unverified"}).promise().then((r) => r.Body) as any
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
  app.get(`/thumbnail/:size/${folders[i]}/*`, async (req, res, next) => {
    try {
      const mimeType = mime.getType(req.path)
      res.setHeader("Content-Type", mimeType ?? "")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, ""))
      if (req.session.role !== "admin" && req.session.role !== "mod") {
        const postID = key.match(/(?<=\/)\d+(?=\/)/)?.[0]
        if (postID) {
          const post = await sql.post(Number(postID))
          if (post.restrict === "explicit") return res.status(403).send("No permission")
        }
      }
      let body = await s3.getObject({Key: key, Bucket: "moebooru"}).promise().then((r) => r.Body) as any
      let contentLength = body.length
      if (mimeType?.includes("image")) {
        const metadata = await sharp(body).metadata()
        const ratio = metadata.height! / Number(req.params.size)
        body = await sharp(body, {animated: true, limitInputPixels: false})
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
      if (folders[i] === "image" || folders[i] === "comic") {
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

  app.get(`/thumbnail/:size/unverified/${folders[i]}/*`, async (req, res, next) => {
    try {
      if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
      const mimeType = mime.getType(req.path)
      res.setHeader("Content-Type", mimeType ?? "")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, "").replace("unverified/", ""))
      let body = await s3.getObject({Key: key, Bucket: "moebooru-unverified"}).promise().then((r) => r.Body) as any
      let contentLength = body.length
      if (mimeType?.includes("image")) {
        const metadata = await sharp(body).metadata()
        const ratio = metadata.height! / Number(req.params.size)
        body = await sharp(body, {animated: true, limitInputPixels: false})
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

app.get("/*", function(req, res) {
  /*
    if (!req.hostname.includes("moebooru") && !req.hostname.includes("localhost") && !req.hostname.includes("192.168.68") && !req.hostname.includes("mydomain")) {
      res.redirect(301, `https://moebooru.moe${req.path}`)
    }*/
    res.setHeader("Content-Type", mime.getType(req.path) ?? "")
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
    res.setHeader("Cross-Origin-Embedder-Policy", "unsafe-none")
    const document = fs.readFileSync(path.join(__dirname, "./dist/index.html"), {encoding: "utf-8"})
    const html = renderToString(<Router location={req.url}><App/></Router>)
    res.status(200).send(document?.replace(`<div id="root"></div>`, `<div id="root">${html}</div>`))
})

const run = async () => {
  await sql.createDB()

  /** Unverified tags */
  await sql.insertUnverifiedTag("unknown-artist", "artist")
  await sql.insertUnverifiedTag("unknown-character", "character")
  await sql.insertUnverifiedTag("unknown-series", "series")
  await sql.insertUnverifiedTag("needs-tags", "tag")

  /* Default artist tags */
  let exists = await sql.insertTag("unknown-artist", "artist")
  if (!exists) await sql.updateTag("unknown-artist", "description", "The artist is unknown.")
  exists = await sql.insertTag("original", "artist")
  if (!exists) await sql.updateTag("original", "description", "The character is an original creation, ie. this is not fanart.")
  exists = await sql.insertTag("official-art", "artist")
  if (!exists) await sql.updateTag("official-art", "description", "Art made by the official company of the series (where the original artist is unknown).")

  /* Default character tags */
  exists = await sql.insertTag("unknown-character", "character")
  if (!exists) await sql.updateTag("unknown-character", "description", "The character is unknown.")

  /* Default series tags */
  exists = await sql.insertTag("unknown-series", "series")
  if (!exists) await sql.updateTag("unknown-series", "description", "The series is unknown.")

  /* Default meta tags */
  exists = await sql.insertTag("needs-tags", "tag")
  if (!exists) await sql.updateTag("needs-tags", "description", "The post needs tags.")
  exists = await sql.insertTag("no-audio", "tag")
  if (!exists) await sql.updateTag("no-audio", "description", "The post is a video with no audio.")
  exists = await sql.insertTag("with-audio", "tag")
  if (!exists) await sql.updateTag("with-audio", "description", "The post is a video with audio.")
  exists = await sql.insertTag("self-post", "tag")
  if (!exists) await sql.updateTag("self-post", "description", "The artwork was posted by the original creator.")
  exists = await sql.insertTag("transparent", "tag")
  if (!exists) await sql.updateTag("transparent", "description", "The post has a transparent background.")
  exists = await sql.insertTag("commentary", "tag")
  if (!exists) await sql.updateTag("commentary", "description", "The post has artist commentary.")
  exists = await sql.insertTag("translated", "tag")
  if (!exists) await sql.updateTag("translated", "description", "The post contains complete translations.")
  exists = await sql.insertTag("partially-translated", "tag")
  if (!exists) await sql.updateTag("partially-translated", "description", "Post is only partially translated.")
  exists = await sql.insertTag("check-translation", "tag")
  if (!exists) await sql.updateTag("check-translation", "description", "Check the translations, because they might be incorrect.")

  /* Default software tags */
  exists = await sql.insertTag("photoshop", "tag")
  if (!exists) await sql.updateTag("photoshop", "description", "Photoshop is an image editing software primarily used for image editing, color correction, and drawing. It is developed by Adobe.")
  exists = await sql.insertTag("premiere-pro", "tag")
  if (!exists) await sql.updateTag("premiere-pro", "description", "Premiere Pro is a video editing software primarily used for video editing and color correction. It is developed by Adobe.")
  exists = await sql.insertTag("after-effects", "tag")
  if (!exists) await sql.updateTag("after-effects", "description", "After Effects is a video compositing software primarily used for video effects, motion graphics, and tween animation. It is developed by Adobe.")
  exists = await sql.insertTag("clip-studio-paint", "tag")
  if (!exists) await sql.updateTag("clip-studio-paint", "description", "Clip Studio Paint is a drawing software that allows the creation of illustrations, comics, and frame-by-frame animations. It is developed by CELSYS.")
  exists = await sql.insertTag("live2d", "tag")
  if (!exists) await sql.updateTag("live2d", "description", "Live2D is an animation software that allows the creation of 2D animation by using mesh deformations, warp/rotation deformers, and parameter keyframes. It is developed by Live2D.")
  exists = await sql.insertTag("blender", "tag")
  if (!exists) await sql.updateTag("blender", "description", "Blender is a 3D software primarily used for 3D modeling, 3D sculpting, 3D animation, and particle simulations. It is developed by the Blender Foundation.")
  exists = await sql.insertTag("krita", "tag")
  if (!exists) await sql.updateTag("krita", "description", "Krita is a drawing software primarily used for drawing and 2D animation. It is developed by the Krita Foundation.")
  exists = await sql.insertTag("sai", "tag")
  if (!exists) await sql.updateTag("sai", "description", "Sai is a lightweight drawing software developed by Systemax Software.")
  exists = await sql.insertTag("procreate", "tag")
  if (!exists) await sql.updateTag("procreate", "description", "Procreate is a drawing software for iPad developed by Savage Interactive.")
  exists = await sql.insertTag("mspaint", "tag")
  if (!exists) await sql.updateTag("mspaint", "description", "MS Paint is a basic image editing software included with Windows. It is developed by Microsoft.")
  exists = await sql.insertTag("gimp", "tag")
  if (!exists) await sql.updateTag("gimp", "description", "Gimp is a free image editing software developed by GIMP Development Team.")
  app.listen(process.env.PORT || 8080, () => console.log("Started the website server!"))
}

run()