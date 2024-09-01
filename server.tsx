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
import {render} from "@react-email/components"
import Email from "./emails/VerifyEmail"
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
      imagePost: string
      bio: string 
      emailVerified: boolean
      publicFavorites: boolean
      showRelated: boolean
      showTooltips: boolean
      showTagBanner: boolean
      downloadPixivID: boolean
      autosearchInterval: number
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
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: "lax"},
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

for (let i = 0; i < folders.length; i++) {
  //serverFunctions.uploadFile(`${folders[i]}/`, "")
  //serverFunctions.uploadUnverifiedFile(`${folders[i]}/`, "")
  app.get(`/${folders[i]}/*`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (folders[i] === "tag") {
        if (!req.url.endsWith(".png") && !req.url.endsWith(".jpg") && !req.url.endsWith(".jpeg") &&
        !req.url.endsWith(".webp") && !req.url.endsWith(".gif")) return next()
      }
      res.setHeader("Content-Type", mime.getType(req.path) ?? "")
      const key = decodeURIComponent(req.path.slice(1))
      if (req.session.role !== "admin" && req.session.role !== "mod") {
        const postID = key.match(/(?<=\/)\d+(?=\/)/)?.[0]
        if (postID) {
          const post = await sql.post.post(Number(postID))
          if (post.restrict === "explicit") return res.status(403).send("No permission")
        }
      }
      const body = await serverFunctions.getFile(key)
      const contentLength = body.length
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
      if (folders[i] === "image" || folders[i] === "comic" || req.path.includes("history/post")) {
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
      const key = decodeURIComponent(req.path.replace("/unverified/", ""))
      const body = await serverFunctions.getUnverifiedFile(key)
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
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, ""))
      if (req.session.role !== "admin" && req.session.role !== "mod") {
        const postID = key.match(/(?<=\/)\d+(?=\/)/)?.[0]
        if (postID) {
          const post = await sql.post.post(Number(postID))
          if (post.restrict === "explicit") return res.status(403).send("No permission")
        }
      }
      let body = await serverFunctions.getFile(key)
      let contentLength = body.length
      if (!contentLength) return res.status(200).send(body)
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
      if (folders[i] === "image" || folders[i] === "comic" || req.path.includes("history/post")) {
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
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, "").replace("unverified/", ""))
      let body = await serverFunctions.getUnverifiedFile(key)
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

app.get("/test", async (req: Request, res: Response) => {
  const html = await render(<Email username="moepi" link="https://google.com"/>)
  res.status(200).send(html)
})

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
  exists = await sql.tag.insertTag("partially-translated", "meta")
  if (!exists) await sql.tag.updateTag("partially-translated", "description", "Post is only partially translated.")
  exists = await sql.tag.insertTag("check-translation", "meta")
  if (!exists) await sql.tag.updateTag("check-translation", "description", "Check the translations, because they might be incorrect.")
  exists = await sql.tag.insertTag("multiple-artists", "meta")
  if (!exists) await sql.tag.updateTag("multiple-artists", "description", "The post has multiple artists.")
  exists = await sql.tag.insertTag("bad-pixiv-id", "meta")
  if (!exists) await sql.tag.updateTag("bad-pixiv-id", "description", "The pixiv id was deleted.")

  /* Default software tags */
  exists = await sql.tag.insertTag("photoshop", "tag")
  if (!exists) await sql.tag.updateTag("photoshop", "description", "Photoshop is an image editing software primarily used for image editing, color correction, and drawing. It is developed by Adobe.")
  exists = await sql.tag.insertTag("premiere-pro", "tag")
  if (!exists) await sql.tag.updateTag("premiere-pro", "description", "Premiere Pro is a video editing software primarily used for video editing and color correction. It is developed by Adobe.")
  exists = await sql.tag.insertTag("after-effects", "tag")
  if (!exists) await sql.tag.updateTag("after-effects", "description", "After Effects is a video compositing software primarily used for video effects, motion graphics, and tween animation. It is developed by Adobe.")
  exists = await sql.tag.insertTag("clip-studio-paint", "tag")
  if (!exists) await sql.tag.updateTag("clip-studio-paint", "description", "Clip Studio Paint is a drawing software that allows the creation of illustrations, comics, and frame-by-frame animations. It is developed by CELSYS.")
  exists = await sql.tag.insertTag("live2d", "tag")
  if (!exists) await sql.tag.updateTag("live2d", "description", "Live2D is an animation software that allows the creation of 2D animation by using mesh deformations, warp/rotation deformers, and parameter keyframes. It is developed by Live2D.")
  exists = await sql.tag.insertTag("blender", "tag")
  if (!exists) await sql.tag.updateTag("blender", "description", "Blender is a 3D software primarily used for 3D modeling, 3D sculpting, 3D animation, and particle simulations. It is developed by the Blender Foundation.")
  exists = await sql.tag.insertTag("krita", "tag")
  if (!exists) await sql.tag.updateTag("krita", "description", "Krita is a drawing software primarily used for drawing and 2D animation. It is developed by the Krita Foundation.")
  exists = await sql.tag.insertTag("sai", "tag")
  if (!exists) await sql.tag.updateTag("sai", "description", "Sai is a lightweight drawing software developed by Systemax Software.")
  exists = await sql.tag.insertTag("procreate", "tag")
  if (!exists) await sql.tag.updateTag("procreate", "description", "Procreate is a drawing software for iPad developed by Savage Interactive.")
  exists = await sql.tag.insertTag("mspaint", "tag")
  if (!exists) await sql.tag.updateTag("mspaint", "description", "MS Paint is a basic image editing software included with Windows. It is developed by Microsoft.")
  exists = await sql.tag.insertTag("gimp", "tag")
  if (!exists) await sql.tag.updateTag("gimp", "description", "Gimp is a free image editing software developed by GIMP Development Team.")
  app.listen(process.env.PORT || 8082, () => console.log("Started the website server!"))
}

run()