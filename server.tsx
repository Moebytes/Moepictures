/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import "dotenv/config"
import path from "path"
import cors from "cors"
import mime from "mime"
import {Readable} from "stream"
import {Pool} from "pg"
import fs from "fs"
import express, {Request, Response, NextFunction} from "express"
import session from "express-session"
import PGSession from "connect-pg-simple"
import rateLimit from "express-rate-limit"
import {renderToString} from "react-dom/server"
import {StaticRouter as Router} from "react-router-dom"
import {Provider} from "react-redux"
import {createRsbuild} from "@rsbuild/core"
import rsbuildConfig from "./rsbuild.client.ts"
import store from "./store"
import permissions from "./structures/Permissions"
import functions from "./functions/Functions"
import encryption from "./structures/Encryption"
import serverFunctions, {keyGenerator, handler, apiKeyLogin, csrfGenerator, csrfProtection} from "./server/ServerFunctions"
import sql from "./sql/SQLQuery"
import $2FARoutes from "./routes/2FARoutes"
import CommentRoutes from "./routes/CommentRoutes"
import CutenessRoutes from "./routes/CutenessRoutes"
import FavoriteRoutes from "./routes/FavoriteRoutes"
import MiscRoutes from "./routes/MiscRoutes"
import PaymentRoutes from "./routes/PaymentRoutes.ts"
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
app.use(express.urlencoded({extended: true, limit: "300mb", parameterLimit: 10000}))
app.use(express.json({limit: "300mb"}))
app.use(cors({credentials: true, origin: true}))
app.disable("x-powered-by")
app.set("trust proxy", "loopback")

declare module "express-session" {
  interface SessionData extends ServerSession {}
}

const pgPool = functions.config.isLocalHost() ? new Pool({
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
app.use(express.static(path.join(__dirname, "./dist/client"), {index: false}))
app.use("/emojis", express.static(path.join(__dirname, "./assets/emojis"), {maxAge: 2678400}))

app.use(apiKeyLogin)
app.use(csrfGenerator)

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
  let ip = serverFunctions.util.ip(req)
  if (["127.0.0.1", "::1", "0.0.0.0"].includes(ip)) return next()

  if (!req.session.username) {
    const sessionCount = await sql.user.countIPSessions(ip)
    if (sessionCount > 300) {
      const allowedBot = await serverFunctions.util.isAllowedBot(ip)
      if (!allowedBot) {
        // Created over 300 sessions in a 24 hour period, spam bot?
        // await sql.report.insertBlacklist(ip, "automatic")
        // await sql.user.pruneIPSessions(ip)
        // blacklist.add(ip)
        await sql.user.destroyOtherIPSessions(ip, req.sessionID)
      } else {
        await sql.user.destroyOtherIPSessions(ip, req.sessionID)
      }
    }
  }

  if (blacklist.has(ip)) {
    return res.status(403).json({message: "Your IP address has been blocked."})
  }
  if (ip !== req.session.ip) req.session.ip = ip
  req.session.url = req.originalUrl || req.url || ""
  next()
})

$2FARoutes(app)
CommentRoutes(app)
CutenessRoutes(app)
FavoriteRoutes(app)
MiscRoutes(app)
PaymentRoutes(app)
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
  if (!req.session.username || !req.session.emailVerified) return res.status(403).send("Unauthorized")
  if (!permissions.isAdmin(req.session)) return res.status(403).end()
  if (!ip) return res.status(400).send("Bad ip")
  await sql.report.insertBlacklist(ip, reason)
  await sql.user.pruneIPSessions(ip)
  blacklist = null as any
  res.status(200).send("Success")
})

app.delete("/api/misc/unblacklistip", imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
  const {ip} = req.query as {ip: string}
  if (!req.session.username || !req.session.emailVerified) return res.status(403).send("Unauthorized")
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
  app.get(`/${folders[i]}/{*page}`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referer = req.headers.referer || req.headers.referrer as string
      if (!serverFunctions.util.isAllowedReferer(referer)) return res.status(403).end()
      const pixelHash = new URL(`${functions.config.getDomain()}${req.originalUrl}`).searchParams.get("hash") ?? ""
      const upscaleParam = new URL(`${functions.config.getDomain()}${req.originalUrl}`).searchParams.get("upscaled") ?? ""
      let url = req.url.replace(/\?.*$/, "")
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      if (folders[i] === "tag") {
        if (!url.endsWith(".png") && !url.endsWith(".jpg") && !url.endsWith(".jpeg") &&
        !url.endsWith(".webp") && !url.endsWith(".gif")) return next()
      }
      res.setHeader("Last-Modified", lastModified)
      res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.slice(1))
      let upscaled = req.session.upscaledImages ?? false
      if (upscaleParam) upscaled = upscaleParam === "true"
      if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
      if (req.session.captchaNeeded) upscaled = false
      let r18 = false
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (!noCache.includes(folders[i]) && postID) {
        let post = await sql.getCache(`cached-post/${postID}`) as PostFull | undefined
        if (!post) {
          post = await sql.post.post(postID)
          await sql.setCache(`cached-post/${postID}`, post)
        }
        if (post && functions.post.isR18(post.rating)) {
          if (!req.session.showR18) return res.status(404).end()
          r18 = true
        }
        if (post && post.hidden) {
          if (!permissions.isMod(req.session)) return res.status(404).end()
        }
        if (post) {
          let matches = req.path.includes("history/post")
          for (const image of post.images) {
            if (image.pixelHash === pixelHash) matches = true
          }
          if (!matches) return res.status(404).end()
        }
      }
      let body = await serverFunctions.files.getFile(key, upscaled, r18, pixelHash)
      if (!body.byteLength) body = await serverFunctions.files.getFile(key, false, r18, pixelHash)
      let contentLength = body.byteLength
      if (!contentLength) return res.status(404).end()
      if (!noCache.includes(folders[i]) && req.session.captchaNeeded) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        body = await imageLock(body, false)
        return res.status(200).send(body)
      }
      if (encrypted.includes(folders[i]) || req.path.includes("history/post")) {
        if (!permissions.noEncryption(req.session) && !req.session.publicKey) return res.status(401).end()
        body = encryption.encrypt(body, req.session.publicKey!, req.session)
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

  app.get(`/thumbnail/${folders[i]}/{*page}`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referer = req.headers.referer || req.headers.referrer as string
      if (!serverFunctions.util.isAllowedReferer(referer)) return res.status(403).end()
      const pixelHash = new URL(`${functions.config.getDomain()}${req.originalUrl}`).searchParams.get("hash") ?? ""
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      res.setHeader("Last-Modified", lastModified)
      res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/`, ""))
      let r18 = false
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (!noCache.includes(folders[i]) && postID) {
        let post = await sql.getCache(`cached-post/${postID}`) as PostFull | undefined
        if (!post) {
          post = await sql.post.post(postID)
          await sql.setCache(`cached-post/${postID}`, post)
        }
        if (post && functions.post.isR18(post.rating)) {
          if (!req.session.showR18) return res.status(404).end()
          r18 = true
        }
        if (post && post.hidden) {
          if (!permissions.isMod(req.session)) return res.status(404).end()
        }
        if (post) {
          let matches = req.path.includes("history/post")
          for (const image of post.images) {
            if (image.pixelHash === pixelHash) matches = true
          }
          if (!matches) return res.status(404).end()
        }
      }
      let thumbKey = `thumbnail/${key}`
      if (req.path.includes("history/post")) thumbKey = key
      let body = await serverFunctions.files.getFile(thumbKey, false, r18, pixelHash)
      if (!body.byteLength) body = await serverFunctions.files.getFile(key, false, r18, pixelHash)
      let contentLength = body.byteLength
      if (!contentLength) return res.status(404).end()
      if (!noCache.includes(folders[i]) && req.session.captchaNeeded) {
        res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
        body = await imageLock(body)
        return res.status(200).send(body)
      }
      if (encrypted.includes(folders[i]) || req.path.includes("history/post")) {
        if (!permissions.noEncryption(req.session) && !req.session.publicKey) return res.status(401).end()
        body = encryption.encrypt(body, req.session.publicKey!, req.session)
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
  
  app.get(`/unverified/${folders[i]}/{*page}`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referer = req.headers.referer || req.headers.referrer as string
      if (!serverFunctions.util.isAllowedReferer(referer)) return res.status(403).end()
      const upscaleParam = new URL(`${functions.config.getDomain()}${req.originalUrl}`).searchParams.get("upscaled") ?? ""
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.replace("/unverified/", ""))
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (!noCache.includes(folders[i]) && postID) {
        const post = await sql.post.unverifiedPost(postID)
        if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(404).end()
      } else {
        if (!permissions.isMod(req.session)) return res.status(404).end()
      }
      let upscaled = false
      if (folders[i] === "image" || folders[i] === "comic" || folders[i] === "animation") {
        upscaled = req.session.upscaledImages ?? false
        if (upscaleParam) upscaled = upscaleParam === "true"
        if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
      }
      const body = await serverFunctions.files.getUnverifiedFile(key, upscaled)
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

  app.get(`/thumbnail/unverified/${folders[i]}/{*page}`, imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const referer = req.headers.referer || req.headers.referrer as string
      if (!serverFunctions.util.isAllowedReferer(referer)) return res.status(403).end()
      const mimeType = mime.getType(req.path)
      if (mimeType) res.setHeader("Content-Type", mimeType)
      res.setHeader("Cache-Control", "public, max-age=2678400")
      const key = decodeURIComponent(req.path.replace(`/thumbnail/unverified/`, ""))
      const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
      if (!noCache.includes(folders[i]) && postID) {
        const post = await sql.post.unverifiedPost(postID)
        if (post?.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(404).end()
      } else {
        if (!permissions.isMod(req.session)) return res.status(404).end()
      }
      let thumbKey = `thumbnail/${key}`
      if (req.path.includes("history/post")) thumbKey = key
      let body = await serverFunctions.files.getUnverifiedFile(thumbKey, false)
      if (!body.byteLength) body = await serverFunctions.files.getUnverifiedFile(key, false)
      let contentLength = body.byteLength
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
    } catch {
      res.status(400).end()
    }
  })
}

const storageMap = new Map<string, Storage>()

app.post("/storage", imageUpdateLimiter, csrfProtection, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const upscaleParam = new URL(`${functions.config.getDomain()}${req.originalUrl}`).searchParams.get("upscaled") ?? ""
    const {link, songCover} = req.body as {link: string, songCover?: boolean}
    let ip = serverFunctions.util.ip(req)
    let userKey = req.session.username ? req.session.username : ip
    const pixelHash = new URL(link).searchParams.get("hash") ?? ""
    const key = decodeURIComponent(link.replace(/\?.*$/, "").split("/").slice(3).join("/"))
    let upscaled = req.session.upscaledImages ?? false
    if (upscaleParam) upscaled = upscaleParam === "true"
    if (req.headers["x-force-upscale"]) upscaled = req.headers["x-force-upscale"] === "true"
    if (req.session.captchaNeeded) {
      storageMap.delete(userKey)
      return res.status(403).end()
    }
    const postID = key.match(/(?<=\/)\d+(?=-)/)?.[0]
    let r18 = false
    if (postID) {
      let post = await sql.getCache(`cached-post/${postID}`) as PostFull | undefined
      if (!post) {
        post = await sql.post.post(postID)
        await sql.setCache(`cached-post/${postID}`, post)
      }
      if (post && functions.post.isR18(post.rating)) {
        if (!req.session.showR18) return res.status(404).end()
        r18 = true
      }
      if (post && post.hidden) {
        if (!permissions.isMod(req.session)) return res.status(404).end()
      }
      if (post) {
        let matches = req.path.includes("history/post")
        for (const image of post.images) {
          if (image.pixelHash === pixelHash) matches = true
        }
        if (!matches) return res.status(404).end()
      }
    }
    const secret = encryption.generateAPIKey(16)
    storageMap.set(userKey, {secret, key, upscaled, r18, pixelHash, songCover})
    let ext = songCover ? ".jpg" : path.extname(key)
    const url = `${functions.config.getDomain()}/storage/${userKey}${ext}?secret=${secret}`
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
    
    let body = await serverFunctions.files.getFile(storage.key, storage.upscaled, storage.r18, storage.pixelHash)
    if (!body.byteLength) body = await serverFunctions.files.getFile(storage.key, false, storage.r18, storage.pixelHash)

    if (storage.songCover) body = await serverFunctions.util.songCover(body)
  
    const mimeType = mime.getType(req.path)
    if (mimeType) res.setHeader("Content-Type", mimeType)
    res.setHeader("Content-Length", body.byteLength)
    res.status(200).send(body)
  } catch (e) {
    console.log(e)
    res.status(400).end()
  }
})

app.get("/social-preview/:id", imageLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session.captchaNeeded) return void res.status(403).end()

    const pixelHash = new URL(`${functions.config.getDomain()}${req.originalUrl}`).searchParams.get("hash") ?? ""
    const postID = path.basename(req.params.id, path.extname(req.params.id))
    let body = Buffer.from("")

    let r18 = false
    if (postID) {
      let post = await sql.getCache(`cached-post/${postID}`) as PostFull | undefined
      if (!post) {
        post = await sql.post.post(postID)
        await sql.setCache(`cached-post/${postID}`, post)
      }
      if (post && functions.post.isR18(post.rating)) {
        if (!req.session.showR18) return void res.status(404).end()
        r18 = true
      }
      if (post && post.hidden) {
        if (!permissions.isMod(req.session)) return void res.status(404).end()
      }
      if (post) {
        let matches = req.path.includes("history/post")
        for (const image of post.images) {
          if (image.pixelHash === pixelHash) matches = true
        }
        if (!matches) return res.status(404).end()
      }
      if (post) {
        const img = post.images[0]
        const imagePath = img.thumbnail ? functions.link.getThumbnailImagePath(img.type, img.thumbnail)
        : functions.link.getImagePath(img.type, img.postID, img.order, img.filename)
        
        const imageBuffer = await serverFunctions.files.getFile(imagePath, false, r18, post.images[0].pixelHash)
        body = await serverFunctions.util.squareCrop(imageBuffer, 500)
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

app.get("/{*page}", async (req: Request, res: Response) => {
  try {
    if (/\.\w+$/.test(req.path) && process.env.TESTING !== "yes") {
      return res.status(404).json({message: "Path not found."})
    }
    const mimeType = mime.getType(req.path)
    if (mimeType) res.setHeader("Content-Type", mimeType)
    //res.setHeader("Cross-Origin-Opener-Policy", "same-origin")
    //res.setHeader("Cross-Origin-Embedder-Policy", "require-corp")
    const document = fs.readFileSync(path.join(__dirname, "./dist/client/index.html"), {encoding: "utf-8"})

    let title = "Moepictures: Cute Anime Girl Art"
    let description = "Search for cute and moe anime girl artwork. With our detailed tagging system you can easily find your favorite characters and artists."
    let image = "/assets/images/mainimg.png"
    let url = "https://moepictures.net"

    const key = decodeURIComponent(req.path.slice(1))
    const postID = key.match(/(?<=post\/)\d+(?=\/)/)?.[0]
    if (postID) {
        let post = await sql.getCache(`cached-post/${postID}`) as PostFull | undefined
        if (!post) {
          post = await sql.post.post(postID)
          await sql.setCache(`cached-post/${postID}`, post)
        }
        if (post && functions.post.isR18(post.rating)) {
          if (!req.session.showR18) post = undefined
        }
        if (post && post.hidden) {
          if (!permissions.isMod(req.session)) post = undefined
        }
        if (post) {
          title = `${post.englishTitle || post.title} by ${post.artist}`
          description = post.englishCommentary || post.commentary || ""
          const img = post.images[0]
          image = `${functions.config.getDomain()}/social-preview/${post.postID}${path.extname(img.filename)}?hash=${img.pixelHash}`
          url = `${functions.config.getDomain()}/post/${post.postID}/${post.slug}`
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
        await serverFunctions.posts.deletePost(post)
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
        await serverFunctions.posts.deleteUnverifiedPost(unverified)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

const deleteQueuedUsers = async () => {
  const deleted = await sql.user.deletedUsers()
  const now = new Date()
  for (const user of deleted) {
    if (!user.deletionDate) continue
    if (user.role === "deleted") continue 
    const deletionDate = new Date(user.deletionDate)
    if (now > deletionDate) {
      try {
        await serverFunctions.users.deleteUser(user)
      } catch (e) {
        console.log(e)
      }
    }
  }
}

const pruneEmptyTags = async () => {
  let tagCounts = await sql.tag.tagCounts([])
  let empty = tagCounts.filter((c) => Number(c.count) === 0)
  if (empty.length) {
    for (const tag of empty) {
      if (tag.type !== "meta") await sql.tag.deleteTag(tag.tag)
    }
  }
}

const backupDatabase = async () => {
  await sql.backupDB()
}

const runOnce = async () => {
  await sql.createDB()
  await sql.flushCache()
  await serverFunctions.util.downloadTextDetector()
  await serverFunctions.util.downloadAnimeDetector()
  await serverFunctions.util.downloadWDTagger()
  await serverFunctions.util.downloadImageRater()
  await serverFunctions.util.downloadSegmentator()
  await serverFunctions.util.downloadLineartExtractor()
}

const runDaily = async () => {
  await backupDatabase()
  await deleteExpiredTokens()
  await deleteQueuedPosts()
  await deleteQueuedUnverifiedPosts()
  await deleteQueuedUsers()
  await pruneEmptyTags()
  await sql.user.pruneAnonSessions().catch(() => null)
  await sql.user.pruneExpiredSessions().catch(() => null)
}

const run = async () => {
  runOnce()
  runDaily()
  setInterval(runDaily, 24 * 60 * 60 * 1000)
  let port = process.env.PORT || 8082

  if (process.env.TESTING === "yes") {
    const rsbuild = await createRsbuild({rsbuildConfig})
    const rsbuildServer = await rsbuild.createDevServer()
    app.use(rsbuildServer.middlewares)

    app.listen(port, async () => {
      console.log(`Started the dev server! http://localhost:${port}`)
      await rsbuildServer.afterListen()
    })
  } else {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Started the web server! http://localhost:${port}`)
    })
  }
}

run()