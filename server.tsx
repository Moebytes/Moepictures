import "dotenv/config"
import path from "path"
import cors from "cors"
import mime from "mime"
import {Readable} from "stream"
import {Pool} from "pg"
import fs from "fs"
import sharp from "sharp"
import express, {Request, Response, NextFunction} from "express"
import session from "express-session"
import PGSession from "connect-pg-simple"
import rateLimit from "express-rate-limit"
import {renderToString} from "react-dom/server"
import {StaticRouter as Router} from "react-router-dom"
import {Provider} from "react-redux"
import store from "./store"
import permissions from "./structures/Permissions"
import functions from "./structures/Functions"
import encryptFunctions from "./structures/EncryptFunctions"
import serverFunctions, {keyGenerator, handler, apiKeyLogin, csrfProtection} from "./structures/ServerFunctions"
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
import NoteRoutes from "./routes/NoteRoutes"
import ThreadRoutes from "./routes/ThreadRoutes"
import MessageRoutes from "./routes/MessageRoutes"
import GroupRoutes from "./routes/GroupRoutes"
import App from "./App"
import torIPs from "./assets/json/tor-ip.json"
import {imageLock, imageMissing} from "./structures/ImageLock"
import {ServerSession, Storage, PostFull} from "./types/Types"
const __dirname = path.resolve()

const app = express() as any
app.use(express.urlencoded({extended: true, limit: "1gb", parameterLimit: 50000}))
app.use(express.json({limit: "1gb"}))
app.use(cors({credentials: true, origin: true}))
app.disable("x-powered-by")
app.set("trust proxy", "loopback")

declare module "express-session" {
  interface SessionData extends ServerSession {}
}

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
    tableName: "sessions",
    sidColumnName: "sessionID",
    sessColumnName: "session",
    expireColumnName: "expires"
  }),
  secret: process.env.COOKIE_SECRET!,
  cookie: {maxAge: 30 * 24 * 60 * 60 * 1000, sameSite: "lax", secure: process.env.TESTING === "no"},
  rolling: true,
  resave: false,
  saveUninitialized: false
}))

app.use(express.static(path.join(__dirname, "./public")))
app.use("/assets", express.static(path.join(__dirname, "./dist/client/assets")))
app.use(express.static(path.join(__dirname, "./dist/client"), {index: false}))

let blacklist = null as unknown as Set<string>

app.use(async (req: Request, res: Response, next: NextFunction) => {
  if (!blacklist) {
    const blacklistObj = await sql.report.blacklist()
    const blacklistSet = new Set(torIPs)
    for (const entry of blacklistObj) {
      blacklistSet.add(entry.ip?.trim())
    }
    blacklist = blacklistSet
  }
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
  ip = ip?.toString().replace("::ffff:", "") || ""
  if (blacklist.has(ip)) {
    return res.status(403).json({message: "Your IP address has been blocked."})
  }
  next()
})

app.use(apiKeyLogin)

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
NoteRoutes(app)
ThreadRoutes(app)
MessageRoutes(app)
GroupRoutes(app)

const imageLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 2000,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const imageUpdateLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 100,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

app.post("/api/misc/blacklistip", imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
  const {ip, reason} = req.body as {ip: string, reason: string}
  if (!req.session.username) return res.status(403).send("Unauthorized")
  if (!permissions.isAdmin(req.session)) return res.status(403).end()
  if (!ip) return res.status(400).send("Bad ip")
  await sql.report.insertBlacklist(ip, reason)
  blacklist = null as any
  res.status(200).send("Success")
})

app.delete("/api/misc/unblacklistip", imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
  const {ip} = req.query as {ip: string}
  if (!req.session.username) return res.status(403).send("Unauthorized")
  if (!permissions.isAdmin(req.session)) return res.status(403).end()
  if (!ip) return res.status(400).send("Bad ip")
  await sql.report.deleteBlacklist(ip)
  blacklist = null as any
  res.status(200).send("Success")
})

let originalFolders = ["image", "comic", "animation", "video", "audio", "model", "live2d"]
let originalEncrypted = ["image", "comic", "animation", "audio", "model", "live2d"]
let noCache = ["artist", "character", "series", "pfp", "tag", "history"]
let folders = [...originalFolders, ...originalFolders.map((folder) => `${folder}-upscaled`), ...noCache]
let encrypted = [...originalEncrypted, ...originalEncrypted.map((folder) => `${folder}-upscaled`)]

const lastModified = new Date().toUTCString()

for (let i = 0; i < folders.length; i++) {
  app.get(`/${folders[i]}/*`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pixelHash = new URL(`${functions.getDomain()}${req.originalUrl}`).searchParams.get("hash") ?? ""
      const upscaleParam = new URL(`${functions.getDomain()}${req.originalUrl}`).searchParams.get("upscaled") ?? ""
      let url = req.url.replace(/\?.*$/, "")
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      if (folders[i] === "tag") {
        if (!url.endsWith(".png") && !url.endsWith(".jpg") && !url.endsWith(".jpeg") &&
        !url.endsWith(".webp") && !url.endsWith(".gif")) return next()
      }
      res.setHeader("Last-Modified", lastModified)
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.slice(1))
      let upscaled = req.session.upscaledImages || upscaleParam === "true"
      if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
      if (req.session.captchaNeeded) upscaled = false
      let r18 = false
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (postID) {
        let post = await sql.getCache(`cached-post/${postID}`)
        if (!post) {
          post = await sql.post.post(postID)
          await sql.setCache(`cached-post/${postID}`, post)
        }
        if (post && functions.isR18(post.rating)) {
          if (!req.session.showR18) return res.status(403).end()
          r18 = true
        }
        if (post && post.hidden) {
          if (!permissions.isMod(req.session)) return res.status(403).end()
        }
      }
      let body = await serverFunctions.getFile(key, upscaled, r18, pixelHash)
      if (!body.byteLength) body = await serverFunctions.getFile(key, false, r18, pixelHash)
      let contentLength = body.byteLength
      if (!contentLength) return res.status(200).send(body)
      if (!noCache.includes(folders[i]) && req.session.captchaNeeded) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        body = await imageLock(body, false)
        return res.status(200).send(body)
      }
      if (encrypted.includes(folders[i]) || req.path.includes("history/post")) {
        if (!req.session.publicKey) return res.status(401).end()
        body = encryptFunctions.encrypt(body, req.session.publicKey, req.session)
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
        const stream = Readable.from(body.subarray(start, end + 1))
        return stream.pipe(res)
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).send(body)
    } catch {
      res.status(400).end()
    }
  })

  app.get(`/thumbnail/:size/${folders[i]}/*`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pixelHash = new URL(`${functions.getDomain()}${req.originalUrl}`).searchParams.get("hash") ?? ""
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      res.setHeader("Last-Modified", lastModified)
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, ""))
      let r18 = false
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (postID) {
        let post = await sql.getCache(`cached-post/${postID}`)
        if (!post) {
          post = await sql.post.post(postID)
          await sql.setCache(`cached-post/${postID}`, post)
        }
        if (post && functions.isR18(post.rating)) {
          if (!req.session.showR18) return res.status(403).end()
          r18 = true
        }
        if (post && post.hidden) {
          if (!permissions.isMod(req.session)) return res.status(403).end()
        }
      }
      const [id, order, name] = path.basename(key, path.extname(key)).split("-")
      let thumbKey = `thumbnail/${folders[i]}/${id}-${order}${path.extname(key)}`
      if (req.path.includes("history/post")) thumbKey = key
      let body = await serverFunctions.getFile(thumbKey, false, r18, pixelHash)
      if (!body.byteLength) body = await serverFunctions.getFile(key, false, r18, pixelHash)
      let contentLength = body.byteLength
      if (!contentLength) return res.status(200).send(body)
      if (!noCache.includes(folders[i]) && req.session.captchaNeeded) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        body = await imageLock(body)
        return res.status(200).send(body)
      }
      if (mimeType?.includes("image")) {
        const metadata = await sharp(body).metadata()
        if (metadata.pages === 1) {
          const ratio = metadata.height! / Number(req.params.size)
          body = await sharp(body, {animated: false, limitInputPixels: false})
          .resize(Math.round(metadata.width! / ratio), Number(req.params.size), {fit: "fill", kernel: "cubic"})
          .toBuffer()
          contentLength = body.byteLength
        }
      }
      if (encrypted.includes(folders[i]) || req.path.includes("history/post")) {
        if (!req.session.publicKey) return res.status(401).end()
        body = encryptFunctions.encrypt(body, req.session.publicKey, req.session)
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
        const stream = Readable.from(body.subarray(start, end + 1))
        return stream.pipe(res)
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).send(body)
    } catch (e) {
      console.log(e)
      res.status(400).end()
    }
  })
  
  app.get(`/unverified/${folders[i]}/*`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const upscaleParam = new URL(`${functions.getDomain()}${req.originalUrl}`).searchParams.get("upscaled") ?? ""
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.replace("/unverified/", ""))
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (postID) {
        const post = await sql.post.unverifiedPost(postID)
        if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
      } else {
        if (!permissions.isMod(req.session)) return res.status(403).end()
      }
      let upscaled = false
      if (folders[i] === "image" || folders[i] === "comic" || folders[i] === "animation") {
        upscaled = req.session.upscaledImages || upscaleParam === "true"
        if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
      }
      const body = await serverFunctions.getUnverifiedFile(key, upscaled)
      const contentLength = body.byteLength
      if (!contentLength) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        const noImg = await imageMissing()
        return res.status(200).send(noImg)
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
        const stream = Readable.from(body.subarray(start, end + 1))
        return stream.pipe(res)
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).send(body)
    } catch (e) {
      console.log(e)
      res.status(400).end()
    }
  })

  app.get(`/thumbnail/:size/unverified/${folders[i]}/*`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      if (!noCache.includes(folders[i])) res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/${req.params.size}/`, "").replace("unverified/", ""))
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (postID) {
        const post = await sql.post.unverifiedPost(postID)
        if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).end()
      } else {
        if (!permissions.isMod(req.session)) return res.status(403).end()
      }
      const [id, order, name] = path.basename(key, path.extname(key)).split("-")
      let thumbKey = `thumbnail/${folders[i]}/${id}-${order}${path.extname(key)}`
      if (req.path.includes("history/post")) thumbKey = key
      let body = await serverFunctions.getUnverifiedFile(thumbKey, false)
      if (!body.byteLength) body = await serverFunctions.getUnverifiedFile(key, false)
      let contentLength = body.byteLength
      if (!contentLength) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        const noImg = await imageMissing()
        return res.status(200).send(noImg)
      }
      if (mimeType?.includes("image")) {
        const metadata = await sharp(body).metadata()
        const ratio = metadata.height! / Number(req.params.size)
        body = await sharp(body, {animated: false, limitInputPixels: false})
        .resize(Math.round(metadata.width! / ratio), Number(req.params.size), {fit: "fill", kernel: "cubic"})
        .toBuffer()
        contentLength = body.byteLength
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
        const stream = Readable.from(body.subarray(start, end + 1))
        return stream.pipe(res)
      }
      res.setHeader("Content-Length", contentLength)
      res.status(200).send(body)
    } catch {
      res.status(400).end()
    }
  })
}

const storageMap = new Map<string, Storage>()

app.post("/storage", imageUpdateLimiter, csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const upscaleParam = new URL(`${functions.getDomain()}${req.originalUrl}`).searchParams.get("upscaled") ?? ""
    const {link, songCover} = req.body as {link: string, songCover?: boolean}
    let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
    ip = ip?.toString().replace("::ffff:", "") || ""
    let userKey = req.session.username ? req.session.username : ip
    const pixelHash = new URL(link).searchParams.get("hash") ?? ""
    const key = decodeURIComponent(link.replace(/\?.*$/, "").split("/").slice(3).join("/"))
    let upscaled = req.session.upscaledImages || upscaleParam === "true"
    if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
    if (req.session.captchaNeeded) {
      storageMap.delete(userKey)
      return res.status(403).end()
    }
    const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
    let r18 = false
    if (postID) {
      let post = await sql.getCache(`cached-post/${postID}`)
      if (!post) {
        post = await sql.post.post(postID)
        await sql.setCache(`cached-post/${postID}`, post)
      }
      if (post && functions.isR18(post.rating)) {
        if (!req.session.showR18) return res.status(403).end()
        r18 = true
      }
      if (post && post.hidden) {
        if (!permissions.isMod(req.session)) return res.status(403).end()
      }
    }
    const secret = encryptFunctions.generateAPIKey(16)
    storageMap.set(userKey, {secret, key, upscaled, r18, pixelHash, songCover})
    let ext = songCover ? ".jpg" : path.extname(key)
    const url = `${functions.getDomain()}/storage/${userKey}${ext}?secret=${secret}`
    res.status(200).send(url)
  } catch {
    res.status(400).end()
  }
})

app.get("/storage/:username", imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const secret = req.query.secret
    const storage = storageMap.get(path.basename(req.params.username, path.extname(req.params.username)))
    if (!storage) return res.status(404).json({message: "Not found"})
    if (secret !== storage.secret) return res.status(403).json({message: "Unauthorized"})
    
    let body = await serverFunctions.getFile(storage.key, storage.upscaled, storage.r18, storage.pixelHash)
    if (!body.byteLength) body = await serverFunctions.getFile(storage.key, false, storage.r18, storage.pixelHash)

    if (storage.songCover) body = await serverFunctions.songCover(body)
  
    const mimeType = mime.getType(req.path)
    if (mimeType) res.setHeader("Content-Type", mimeType)
    res.setHeader("Content-Length", body.byteLength)
    res.status(200).send(body)
  } catch {
    res.status(400).end()
  }
})

app.get("/social-preview/:id", imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session.captchaNeeded) return void res.status(403).end()

    const postID = path.basename(req.params.id, path.extname(req.params.id))
    let body = Buffer.from("")

    let r18 = false
    if (postID) {
      let post = await sql.getCache(`cached-post/${postID}`) as PostFull | undefined
      if (!post) {
        post = await sql.post.post(postID)
        await sql.setCache(`cached-post/${postID}`, post)
      }
      if (post && functions.isR18(post.rating)) {
        if (!req.session.showR18) return void res.status(403).end()
        r18 = true
      }
      if (post && post.hidden) {
        if (!permissions.isMod(req.session)) return void res.status(403).end()
      }
      if (post) {
        const img = post.images[0]
        const imagePath = img.thumbnail ? functions.getThumbnailImagePath(img.type, img.thumbnail)
        : functions.getImagePath(img.type, img.postID, img.order, img.filename)
        
        const imageBuffer = await serverFunctions.getFile(imagePath, false, r18, post.images[0].pixelHash)
        body = await serverFunctions.squareCrop(imageBuffer, 200)
      }
    }
  
    const mimeType = mime.getType(req.path)
    if (mimeType) res.setHeader("Content-Type", mimeType)
    res.setHeader("Content-Length", body.byteLength)
    res.status(200).send(body)
  } catch {
    res.status(400).end()
  }
})

app.get("/*", async (req: Request, res: Response) => {
  try {
    if (/\.\w+$/.test(req.path) && process.env.TESTING !== "yes") {
      return res.status(404).json({message: "Path not found."})
    }
    if (!req.session.csrfToken) {
      const {secret, token} = serverFunctions.generateCSRF()
      req.session.csrfSecret = secret
      req.session.csrfToken = token
    }
    const mimeType = mime.getType(req.path)
    if (mimeType) res.setHeader("Content-Type", mimeType)
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
    const document = fs.readFileSync(path.join(__dirname, "./dist/client/index.html"), {encoding: "utf-8"})

    let title = "Moepictures: Anime Art Image Board"
    let description = "Moepictures is an anime image board focusing on cute and moe content. Search for the cutest art, comics, animations, music, and 3d models with comprehensive tags."
    let image = "/assets/images/mainimg.png"
    let url = "https://moepictures.moe"

    const key = decodeURIComponent(req.path.slice(1))
    const postID = key.match(/(?<=post\/)\d+(?=\/)/)?.[0]
    if (postID) {
        let post = await sql.getCache(`cached-post/${postID}`) as PostFull | undefined
        if (!post) {
          post = await sql.post.post(postID)
          await sql.setCache(`cached-post/${postID}`, post)
        }
        if (post && functions.isR18(post.rating)) {
          if (!req.session.showR18) post = undefined
        }
        if (post && post.hidden) {
          if (!permissions.isMod(req.session)) post = undefined
        }
        if (post) {
          title = `Moepictures: ${post.englishTitle || post.title}`
          description = post.englishCommentary || post.commentary || `${post.englishTitle} (${post.title}) by ${post.artist}`
          const img = post.images[0]
          image = `${functions.getDomain()}/social-preview/${post.postID}${path.extname(img.filename)}`
          url = `${functions.getDomain()}/post/${post.postID}/${post.slug}`
        }
    }

    const newDocument = document
      .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`)
      .replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${title}">`)
      .replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${description}">`)
      .replace(/<meta property="og:image" content=".*?">/, `<meta property="og:image" content="${image}">`)
      .replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${url}">`)

    const html = renderToString(<Router location={req.url}><Provider store={store}><App/></Provider></Router>)
    res.status(200).send(newDocument.replace(`<div id="root"></div>`, `<div id="root">${html}</div>`))
  } catch (e) {
    console.log(e)
    return res.status(500).json({message: "Internal server error."})
  }
})

const defaultTagInserts = async () => {
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
  exists = await sql.tag.insertTag("self-upload", "meta")
  if (!exists) await sql.tag.updateTag("self-upload", "description", "The artwork was posted by the original creator.")
  exists = await sql.tag.insertTag("transparent", "meta")
  if (!exists) await sql.tag.updateTag("transparent", "description", "The post has a transparent background.")
  exists = await sql.tag.insertTag("text", "meta")
  if (!exists) await sql.tag.updateTag("text", "description", "The post has contains text.")
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
  exists = await sql.tag.insertTag("paid-reward-available", "meta")
  if (!exists) await sql.tag.updateTag("paid-reward-available", "description", "The artist offers a paid reward for this post.")
  exists = await sql.tag.insertTag("third-party-edit", "meta")
  if (!exists) await sql.tag.updateTag("third-party-edit", "description", "The post is a third party edit.")
  exists = await sql.tag.insertTag("third-party-source", "meta")
  if (!exists) await sql.tag.updateTag("third-party-source", "description", "The source of the post is a repost (not posted by the original artist).")
}

const deleteExpiredTokens = async () => {
  const emailTokens = await sql.token.emailTokens()
  const now = new Date()
  for (const tokenData of emailTokens) {
    const expireDate = new Date(tokenData.expires)
    if (now > expireDate) {
      await sql.token.deleteEmailToken(tokenData.email)
    }
  }
  const passwordTokens = await sql.token.passwordTokens()
  for (const tokenData of passwordTokens) {
    const expireDate = new Date(tokenData.expires)
    if (now > expireDate) {
      await sql.token.deletePasswordToken(tokenData.username)
    }
  }
  const ipTokens = await sql.token.ipTokens()
  for (const tokenData of ipTokens) {
    const expireDate = new Date(tokenData.expires)
    if (now > expireDate) {
      await sql.token.deleteIPToken(tokenData.username)
    }
  }
}

const deleteQueuedPosts = async () => {
  const deleted = await sql.search.deletedPosts()
  const now = new Date()
  for (const post of deleted) {
    if (!post.deletionDate) continue
    const deletionDate = new Date(post.deletionDate)
    if (now > deletionDate) {
      try {
        await serverFunctions.deletePost(post)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

const deleteQueuedUnverifiedPosts = async () => {
  const deletedUnverified = await sql.search.deletedUnverifiedPosts()
  const now = new Date()
  for (const unverified of deletedUnverified) {
    if (!unverified.deletionDate) continue
    const deletionDate = new Date(unverified.deletionDate)
    if (now > deletionDate) {
      try {
        await serverFunctions.deleteUnverifiedPost(unverified)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

const backupDatabase = async () => {
  await sql.backupDB()
}

const runDaily = async () => {
  await backupDatabase()
  await deleteExpiredTokens()
  await deleteQueuedPosts()
  await deleteQueuedUnverifiedPosts()
}

const run = async () => {
  await sql.createDB()
  await serverFunctions.downloadWDTagger()
  runDaily()
  setInterval(runDaily, 24 * 60 * 60 * 1000)
  app.listen(process.env.PORT || 8082, "0.0.0.0", () => console.log("Started the website server!"))
}

run()