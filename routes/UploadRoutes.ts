import {Express, NextFunction, Request, Response} from "express"
import sql from "../sql/SQLQuery"
import fs from "fs"
import path from "path"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import rateLimit from "express-rate-limit"
import sharp from "sharp"
import phash from "sharp-phash"
import axios from "axios"
import {PostHistory, UploadParams, UploadImage, EditParams, BulkTag, UnverifiedUploadParams,
UnverifiedEditParams} from "../types/Types"

const uploadLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 60,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
  keyGenerator,
  handler
})

const editLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 60,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const modLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const validImages = (images: UploadImage[], skipMBCheck?: boolean) => {
  if (!images.length) return false
  for (let i = 0; i < images.length; i++) {
    if (functions.isModel(images[i].link) || functions.isLive2D(images[i].link)) {
      const MB = images[i].size / (1024*1024)
      const maxSize = 200
      if (skipMBCheck || MB <= maxSize) continue
      return false
    }
    const result = functions.bufferFileType(images[i].bytes)?.[0]
    const jpg = result?.mime === "image/jpeg"
    const png = result?.mime === "image/png"
    const webp = result?.mime === "image/webp"
    const avif = result?.mime === "image/avif"
    const gif = result?.mime === "image/gif"
    const mp4 = result?.mime === "video/mp4"
    const mp3 = result?.mime === "audio/mpeg"
    const wav = result?.mime === "audio/x-wav"
    const webm = (path.extname(images[i].link) === ".webm" && result?.typename === "mkv")
    if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav) {
      const MB = images[i].size / (1024*1024)
      const maxSize = jpg ? 10 :
                      avif ? 10 :
                      png ? 25 :
                      mp3 ? 25 :
                      wav ? 50 :
                      gif ? 100 :
                      webp ? 100 :
                      mp4 ? 300 :
                      webm ? 300 : 300
      let type = result.typename === "mkv" ? "webm" : result.typename
      if (images[i].ext !== type) return false
      if (skipMBCheck || MB <= maxSize) continue
    }
    return false
  }
  return true
}

const CreateRoutes = (app: Express) => {
    app.post("/api/post/upload", csrfProtection, uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {images, upscaledImages, type, rating, style, parentID, source, artists, characters, series,
        tags, newTags, unverifiedID, noImageUpdate} = req.body as UploadParams

        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isCurator(req.session)) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
        if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
            return res.status(400).send("Invalid characters in tags: , _ / \\")
        }

        artists = artists.filter(Boolean).map((a: any) => {
          if (a.tag) a.tag = a.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return a
        })

        characters = characters.filter(Boolean).map((c: any) => {
          if (c.tag) c.tag = c.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return c
        })

        series = series.filter(Boolean).map((s: any) => {
          if (s.tag) s.tag = s.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return s
        })

        newTags = newTags.filter(Boolean).map((t: any) => {
          if (t.tag) t.tag = t.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return t
        })

        tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))

        let skipMBCheck = (req.session.role === "admin" || req.session.role === "mod") ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const postID = await sql.post.insertPost()
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertChild(postID, parentID)

        if (type !== "comic") type = "image"

        if (images.length !== upscaledImages.length) {
          const maxLength = Math.max(images.length, upscaledImages.length)
          while (images.length < maxLength) {
            images.push(null as any)
          }
          while (upscaledImages.length < maxLength) {
            upscaledImages.push(null as any)
          }
        }

        let hasOriginal = false
        let hasUpscaled = false
        let r18 = functions.isR18(rating)

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let original = images[i] ? images : upscaledImages
          let upscaled = upscaledImages[i] ? upscaledImages : images
          const ext = original[i].ext
          let fileOrder = original.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          let filename = null as any
          let upscaledFilename = null as any
          if (images[i]) {
            filename = cleanTitle ? `${cleanTitle}.${images[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${images[i].ext}` :
            `${postID}.${images[i].ext}`
          }
          if (upscaledImages[i]) {
            upscaledFilename = cleanTitle ? `${cleanTitle}.${upscaledImages[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${upscaledImages[i].ext}` :
            `${postID}.${upscaledImages[i].ext}`
          }
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (functions.isWebP(`.${ext}`)) {
            const animated = functions.isAnimatedWebp(Buffer.from(original[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (functions.isImage(`.${ext}`)) {
            kind = "image"
          } else if (functions.isGIF(`.${ext}`)) {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (functions.isVideo(`.${ext}`)) {
            kind = "video"
            type = "video"
          } else if (functions.isAudio(`.${ext}`)) {
            kind = "audio"
            type = "audio"
          } else if (functions.isModel(`.${ext}`)) {
            kind = "model"
            type = "model"
          } else if (functions.isLive2D(`.${ext}`)) {
            kind = "live2d"
            type = "live2d"
          }

          if (images[i]) {
            let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(images[i].bytes) as any)
            await serverFunctions.uploadFile(imagePath, buffer, r18)
            hasOriginal = true
          }

          if (upscaledImages[i]) {
            let imagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), upscaledFilename)
            const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
            await serverFunctions.uploadFile(imagePath, buffer, r18)
            hasUpscaled = true
          }

          let dimensions = null as any
          let hash = ""
          if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
              const buffer = functions.base64ToBuffer(original[i].thumbnail)
              const upscaledBuffer = functions.base64ToBuffer(upscaled[i].thumbnail || original[i].thumbnail)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = await sharp(upscaledBuffer).metadata()
              if (kind === "live2d") {
                dimensions.width = upscaled[i].width
                dimensions.height = upscaled[i].height
              }
          } else {
              const buffer = Buffer.from(Object.values(original[i].bytes) as any)
              const upscaledBuffer = Buffer.from(Object.values(upscaled[i].bytes) as any)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = await sharp(upscaledBuffer).metadata()
          }
          await sql.post.insertImage(postID, filename, upscaledFilename, kind, order, hash, dimensions.width, dimensions.height, upscaled[i].size)
        }

        if (upscaledImages?.length > images?.length) hasOriginal = false
        if (images?.length > upscaledImages?.length) hasUpscaled = false

        let hidden = false 
        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const tag = await sql.tag.tag(artists[i].tag)
          if (tag?.banned) hidden = true
        }

        const uploadDate = new Date().toISOString()
        await sql.post.bulkUpdatePost(postID, {
          rating, 
          style, 
          parentID: parentID || null,
          title: source.title ? source.title : null,
          englishTitle: source.englishTitle ? source.englishTitle : null,
          artist: source.artist ? source.artist : null,
          posted: source.posted ? source.posted : null,
          source: source.source ? source.source : null,
          commentary: source.commentary ? source.commentary : null,
          englishCommentary: source.englishCommentary ? source.englishCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          buyLink: source.buyLink ? source.buyLink : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
          slug: functions.postSlug(source.title, source.englishTitle),
          type,
          uploadDate,
          updatedDate: uploadDate,
          uploader: req.session.username,
          updater: req.session.username,
          approver: req.session.username,
          approveDate: uploadDate,
          hasUpscaled,
          hasOriginal,
          hidden
        })

        let tagObjectMapping = await serverFunctions.tagMap()
        let tagMap = tags
        let bulkTagUpdate = [] as BulkTag[]

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: tagObjectMapping[newTags[i].tag]?.type, description: null, image: null, imageHash: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            const buffer = Buffer.from(Object.values(newTags[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null, imageHash: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            const buffer = Buffer.from(Object.values(artists[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null, imageHash: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            const buffer = Buffer.from(Object.values(characters[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null, imageHash: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            const buffer = Buffer.from(Object.values(series[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(series[i].tag)
        }
        await sql.cuteness.updateCuteness(postID, req.session.username, 500)

        for (let i = 0; i < tagMap.length; i++) {
          const implications = await sql.tag.implications(tagMap[i])
          if (implications?.[0]) {
            for (const i of implications) {
              tagMap.push(i.implication)
              const tag = await sql.tag.tag(i.implication)
              bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type, description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
            }
          }
        }

        tagMap = functions.removeDuplicates(tagMap).filter(Boolean)
        await sql.tag.bulkInsertTags(bulkTagUpdate, req.session.username, noImageUpdate ? true : false)
        await sql.tag.insertTagMap(postID, tagMap)

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(unverifiedID)
          for (let i = 0; i < unverifiedPost.images.length; i++) {
            const imgPath = functions.getImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].filename)
            const upscaledImgPath = functions.getUpscaledImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].upscaledFilename || unverifiedPost.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(imgPath)
            await serverFunctions.deleteUnverifiedFile(upscaledImgPath)
          }
          await sql.post.deleteUnverifiedPost(unverifiedID)
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit", csrfProtection, editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, images, upscaledImages, type, rating, style, parentID, source, artists, characters, series,
        tags, newTags, unverifiedID, reason, noImageUpdate, preserveChildren, updatedDate, silent} = req.body as EditParams

        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")
        if (!permissions.isMod(req.session)) noImageUpdate = true

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
        if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
            return res.status(400).send("Invalid characters in tags: , _ / \\")
        }

        artists = artists.filter(Boolean).map((a: any) => {
          if (a.tag) a.tag = a.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return a
        })

        characters = characters.filter(Boolean).map((c: any) => {
          if (c.tag) c.tag = c.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return c
        })

        series = series.filter(Boolean).map((s: any) => {
          if (s.tag) s.tag = s.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return s
        })

        newTags = newTags.filter(Boolean).map((t: any) => {
          if (t.tag) t.tag = t.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return t
        })

        tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))

        let skipMBCheck = (req.session.role === "admin" || req.session.role === "mod") ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const post = await sql.post.post(postID)
        if (!post) return res.status(400).send("Bad request")
        if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
        let oldR18 = functions.isR18(post.rating)
        let newR18 = functions.isR18(rating)
        let oldType = post.type
        let newType = type

        let imgChanged = await serverFunctions.imagesChanged(post.images, images, false, oldR18)
        if (!imgChanged) imgChanged = await serverFunctions.imagesChanged(post.images, upscaledImages, true, oldR18)

        let vanillaBuffers = [] as any
        let upscaledVanillaBuffers = [] as any
        for (let i = 0; i < post.images.length; i++) {
          const imagePath = functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename)
          const upscaledImagePath = functions.getUpscaledImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
          const oldImage = await serverFunctions.getFile(imagePath, false, oldR18) as Buffer
          const oldUpscaledImage = await serverFunctions.getFile(upscaledImagePath, false, oldR18) as Buffer
          vanillaBuffers.push(oldImage)
          upscaledVanillaBuffers.push(oldUpscaledImage)
          if (imgChanged) {
            if (!permissions.isMod(req.session)) return res.status(403).send("No permission to modify images")
            await sql.post.deleteImage(post.images[i].imageID)
            await serverFunctions.deleteFile(imagePath, oldR18)
            await serverFunctions.deleteFile(upscaledImagePath, oldR18)
          }
        }

        if (String(preserveChildren) !== "true") {
          await sql.post.deleteChild(postID)
          if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertChild(postID, parentID)
        }

        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false

        let imageFilenames = [] as any
        let upscaledImageFilenames = [] as any
        let imageOrders = [] as any
        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let original = images[i] ? images : upscaledImages
          let upscaled = upscaledImages[i] ? upscaledImages : images
          const ext = original[i].ext
          let fileOrder = original.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          let filename = null as any
          let upscaledFilename = null as any
          if (images[i]) {
            filename = cleanTitle ? `${cleanTitle}.${images[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${images[i].ext}` :
            `${postID}.${images[i].ext}`
          }
          if (upscaledImages[i]) {
            upscaledFilename = cleanTitle ? `${cleanTitle}.${upscaledImages[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${upscaledImages[i].ext}` :
            `${postID}.${upscaledImages[i].ext}`
          }
          imageFilenames.push(filename)
          upscaledImageFilenames.push(upscaledFilename)
          imageOrders.push(order)
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (functions.isWebP(`.${ext}`)) {
            const animated = functions.isAnimatedWebp(Buffer.from(original[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (functions.isImage(`.${ext}`)) {
            kind = "image"
          } else if (functions.isGIF(`.${ext}`)) {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (functions.isVideo(`.${ext}`)) {
            kind = "video"
            type = "video"
          } else if (functions.isAudio(`.${ext}`)) {
            kind = "audio"
            type = "audio"
          } else if (functions.isModel(`.${ext}`)) {
            kind = "model"
            type = "model"
          } else if (functions.isLive2D(`.${ext}`)) {
            kind = "live2d"
            type = "live2d"
          }
        if (imgChanged) {
            if (images[i]) {
              let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
              const buffer = Buffer.from(Object.values(images[i].bytes) as any)
              await serverFunctions.uploadFile(imagePath, buffer, oldR18)
              hasOriginal = true
            }
            
            if (upscaledImages[i]) {
              let upscaledImagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), upscaledFilename)
              const upscaledBuffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
              await serverFunctions.uploadFile(upscaledImagePath, upscaledBuffer, oldR18)
              hasUpscaled = true
            }

            let dimensions = null as any
            let hash = ""
            if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
              const buffer = functions.base64ToBuffer(original[i].thumbnail)
              const upscaledBuffer = functions.base64ToBuffer(upscaled[i].thumbnail || original[i].thumbnail)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = await sharp(upscaledBuffer).metadata()
              if (kind === "live2d") {
                dimensions.width = upscaled[i].width
                dimensions.height = upscaled[i].height
              }
            } else {
                const buffer = Buffer.from(Object.values(original[i].bytes) as any)
                const upscaledBuffer = Buffer.from(Object.values(upscaled[i].bytes) as any)
                hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
                dimensions = await sharp(upscaledBuffer).metadata()
            }
            await sql.post.insertImage(postID, filename, upscaledFilename, kind, order, hash, dimensions.width, dimensions.height, upscaled[i].size)
          }
        }
        if (upscaledImages?.length > images?.length) hasOriginal = false
        if (images?.length > upscaledImages?.length) hasUpscaled = false

        await sql.post.updatePost(postID, "type", type)
        if (!updatedDate) updatedDate = new Date().toISOString()
        await sql.post.bulkUpdatePost(postID, {
          type,
          rating, 
          style, 
          parentID: parentID || null,
          title: source.title ? source.title : null,
          englishTitle: source.englishTitle ? source.englishTitle : null,
          artist: source.artist ? source.artist : null,
          posted: source.posted ? source.posted : null,
          source: source.source ? source.source : null,
          commentary: source.commentary ? source.commentary : null,
          englishCommentary: source.englishCommentary ? source.englishCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          buyLink: source.buyLink ? source.buyLink : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
          slug: functions.postSlug(source.title, source.englishTitle),
          updatedDate,
          hasOriginal,
          hasUpscaled,
          updater: req.session.username
        })

        let combinedTags = [...artists.map((a: any) => a.tag), ...characters.map((c: any) => c.tag), 
        ...series.map((s: any) => s.tag), ...newTags.map((n: any) => n.tag), ...tags]
        let oldTagsSet = new Set<string>(post.tags)
        let newTagsSet = new Set<string>(combinedTags)
        let addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
        let removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)

        let bulkTagUpdate = [] as BulkTag[]
        let tagObjectMapping = await serverFunctions.tagMap()

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: tagObjectMapping[newTags[i].tag]?.type, description: null, image: null, imageHash: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            const buffer = Buffer.from(Object.values(newTags[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null, imageHash: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            const buffer = Buffer.from(Object.values(artists[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null, imageHash: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            const buffer = Buffer.from(Object.values(characters[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null, imageHash: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            const buffer = Buffer.from(Object.values(series[i].bytes!))
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < addedTags.length; i++) {
          const implications = await sql.tag.implications(addedTags[i])
          if (implications?.[0]) {
            for (const i of implications) {
              if (!oldTagsSet.has(i.implication)) addedTags.push(i.implication)
              const tag = await sql.tag.tag(i.implication)
              bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type, description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
            }
          }
        }

        addedTags = functions.removeDuplicates(addedTags).filter(Boolean)
        await sql.tag.bulkInsertTags(bulkTagUpdate, req.session.username, noImageUpdate ? true : false)
        await sql.tag.deleteTagMap(postID, removedTags)
        await sql.tag.insertTagMap(postID, addedTags)

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(unverifiedID)
          for (let i = 0; i < unverifiedPost.images.length; i++) {
            const imgPath = functions.getImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].filename)
            const upscaledImgPath = functions.getUpscaledImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].upscaledFilename || unverifiedPost.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(imgPath)
            await serverFunctions.deleteUnverifiedFile(upscaledImgPath)
          }
          await sql.post.deleteUnverifiedPost(unverifiedID)
        }

        await serverFunctions.migratePost(post, oldType, newType, oldR18, newR18)

        if (permissions.isMod(req.session)) {
          if (silent) return res.status(200).send("Success")
        }

        const artistsArr = artists.map((a: any) => a.tag)
        const charactersArr = characters.map((c: any) => c.tag)
        const seriesArr = series.map((s: any) => s.tag)


        const updated = await sql.post.post(postID)
        let r18 = functions.isR18(updated.rating)

        const changes = functions.parsePostChanges(post, updated)

        const postHistory = await sql.history.postHistory(postID)
        const nextKey = await serverFunctions.getNextKey("post", String(postID), r18)
        if (!postHistory.length || (imgChanged && nextKey === 1)) {
            const vanilla = JSON.parse(JSON.stringify(post))
            vanilla.date = vanilla.uploadDate 
            vanilla.user = vanilla.uploader
            const categories = await serverFunctions.tagCategories(vanilla.tags)
            vanilla.artists = categories.artists.map((a: any) => a.tag)
            vanilla.characters = categories.characters.map((c: any) => c.tag)
            vanilla.series = categories.series.map((s: any) => s.tag)
            vanilla.tags = categories.tags.map((t: any) => t.tag)
            let vanillaImages = [] as any
            for (let i = 0; i < vanilla.images.length; i++) {
                if (imgChanged) {
                  let newImagePath = ""
                  if (upscaledVanillaBuffers[i]) {
                    newImagePath = functions.getUpscaledImageHistoryPath(postID, 1, vanilla.images[i].order, vanilla.images[i].upscaledFilename || vanilla.images[i].filename)
                    await serverFunctions.uploadFile(newImagePath, upscaledVanillaBuffers[i], r18)
                  }
                  if (vanillaBuffers[i]) {
                    newImagePath = functions.getImageHistoryPath(postID, 1, vanilla.images[i].order, vanilla.images[i].filename)
                    await serverFunctions.uploadFile(newImagePath, vanillaBuffers[i], r18)
                  }
                  vanillaImages.push(newImagePath)
                } else {
                  vanillaImages.push(functions.getImagePath(vanilla.images[i].type, postID, vanilla.images[i].order, vanilla.images[i].filename))
                }
            }
            await sql.history.insertPostHistory({
              postID, username: vanilla.user, images: vanillaImages, uploader: vanilla.uploader, updater: vanilla.updater, 
              uploadDate: vanilla.uploadDate, updatedDate: vanilla.updatedDate, type: vanilla.type, rating: vanilla.rating, 
              style: vanilla.style, parentID: vanilla.parentID, title: vanilla.title, englishTitle: vanilla.englishTitle, slug: vanilla.slug,
              posted: vanilla.posted, artist: vanilla.artist, source: vanilla.source, commentary: vanilla.commentary, englishCommentary: vanilla.englishCommentary, 
              bookmarks: vanilla.bookmarks, buyLink: vanilla.buyLink, mirrors: vanilla.mirrors, hasOriginal: vanilla.hasOriginal, hasUpscaled: vanilla.hasUpscaled, 
              artists: vanilla.artists, characters: vanilla.characters, series: vanilla.series, tags: vanilla.tags, addedTags: [], removedTags: [],
              imageChanged: false, changes: null, reason})

            let newImages = [] as any
            for (let i = 0; i < images.length; i++) {
                if (imgChanged) {
                  let newImagePath = ""
                  if (upscaledImages[i]) {
                    const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
                    newImagePath = functions.getUpscaledImageHistoryPath(postID, 2, imageOrders[i], upscaledImageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, buffer, r18)
                  }
                  if (images[i]) {
                    const buffer = Buffer.from(Object.values(images[i].bytes) as any)
                    newImagePath = functions.getImageHistoryPath(postID, 2, imageOrders[i], imageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, buffer, r18)
                  }
                  newImages.push(newImagePath)
                } else {
                  newImages.push(functions.getImagePath(updated.images[i].type, postID, updated.images[i].order, updated.images[i].filename))
                }
            }
            await sql.history.insertPostHistory({
              postID, username: req.session.username, images: newImages, uploader: updated.uploader, updater: updated.updater, 
              uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, 
              style: updated.style, parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, 
              posted: updated.posted, artist: updated.artist, source: updated.source, commentary: updated.commentary, slug: updated.slug,
              englishCommentary: updated.englishCommentary, bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: JSON.stringify(updated.mirrors), 
              hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: artistsArr, characters: charactersArr, series: seriesArr, tags, 
              addedTags, removedTags, imageChanged: imgChanged, changes, reason})
        } else {
            let newImages = [] as any
            for (let i = 0; i < images.length; i++) {
              if (imgChanged) {
                let newImagePath = ""
                if (upscaledImages[i]) {
                  const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
                  newImagePath = functions.getUpscaledImageHistoryPath(postID, nextKey, imageOrders[i], upscaledImageFilenames[i])
                  await serverFunctions.uploadFile(newImagePath, buffer, r18)
                }
                if (images[i]) {
                  const buffer = Buffer.from(Object.values(images[i].bytes) as any)
                  newImagePath = functions.getImageHistoryPath(postID, nextKey, imageOrders[i], imageFilenames[i])
                  await serverFunctions.uploadFile(newImagePath, buffer, r18)
                }
                newImages.push(newImagePath)

                let result = await sql.history.postHistory(postID)
                if (result.length > 1) {
                    const lastResult = result[result.length - 1]
                    const penultResult = result[result.length - 2]
                    const lastImage = lastResult.images[0]
                    const penultImage = penultResult.images[0]
                    if (penultImage?.startsWith("history/post") && !lastImage?.startsWith("history/post")) {
                        await sql.history.updatePostHistory(lastResult.historyID, "images", penultResult.images)
                    }
                }
              } else {
                newImages.push(functions.getImagePath(updated.images[i].type, postID, updated.images[i].order, updated.images[i].filename))
              }
            }
            await sql.history.insertPostHistory({
              postID, username: req.session.username, images: newImages, uploader: updated.uploader, updater: updated.updater, 
              uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, 
              style: updated.style, parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, 
              posted: updated.posted, artist: updated.artist, source: updated.source, commentary: updated.commentary, slug: updated.slug,
              englishCommentary: updated.englishCommentary, bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: JSON.stringify(updated.mirrors), 
              hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: artistsArr, characters: charactersArr, series: seriesArr, tags, 
              addedTags, removedTags, imageChanged: imgChanged, changes, reason})
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/upload/unverified", csrfProtection, uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {images, upscaledImages, type, rating, style, parentID, source, artists, characters, series, 
        tags, newTags, duplicates} = req.body as UnverifiedUploadParams

        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
        if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
            return res.status(400).send("Invalid characters in tags: , _ / \\")
        }

        artists = artists.filter(Boolean).map((a: any) => {
          if (a.tag) a.tag = a.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return a
        })

        characters = characters.filter(Boolean).map((c: any) => {
          if (c.tag) c.tag = c.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return c
        })

        series = series.filter(Boolean).map((s: any) => {
          if (s.tag) s.tag = s.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return s
        })

        newTags = newTags.filter(Boolean).map((t: any) => {
          if (t.tag) t.tag = t.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return t
        })

        tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))

        let skipMBCheck = (req.session.role === "admin" || req.session.role === "mod") ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const postID = await sql.post.insertUnverifiedPost()
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertUnverifiedChild(postID, parentID)

        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let original = images[i] ? images : upscaledImages
          let upscaled = upscaledImages[i] ? upscaledImages : images
          const ext = original[i].ext
          let fileOrder = original.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          let filename = null as any
          let upscaledFilename = null as any
          if (images[i]) {
            filename = cleanTitle ? `${cleanTitle}.${images[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${images[i].ext}` :
            `${postID}.${images[i].ext}`
          }
          if (upscaledImages[i]) {
            upscaledFilename = cleanTitle ? `${cleanTitle}.${upscaledImages[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${upscaledImages[i].ext}` :
            `${postID}.${upscaledImages[i].ext}`
          }
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (functions.isWebP(`.${ext}`)) {
            const animated = functions.isAnimatedWebp(Buffer.from(original[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (functions.isImage(`.${ext}`)) {
            kind = "image"
          } else if (functions.isGIF(`.${ext}`)) {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (functions.isVideo(`.${ext}`)) {
            kind = "video"
            type = "video"
          } else if (functions.isAudio(`.${ext}`)) {
            kind = "audio"
            type = "audio"
          } else if (functions.isModel(`.${ext}`)) {
            kind = "model"
            type = "model"
          } else if (functions.isLive2D(`.${ext}`)) {
            kind = "live2d"
            type = "live2d"
          }
          if (images[i]) {
            let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(images[i].bytes) as any)
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            hasOriginal = true
          }

          if (upscaledImages[i]) {
            let imagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), upscaledFilename)
            const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            hasUpscaled = true
          }
          let dimensions = null as any
          let hash = ""
          if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
            const buffer = functions.base64ToBuffer(original[i].thumbnail)
            const upscaledBuffer = functions.base64ToBuffer(upscaled[i].thumbnail || original[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = await sharp(upscaledBuffer).metadata()
            if (kind === "live2d") {
              dimensions.width = upscaled[i].width
              dimensions.height = upscaled[i].height
            }
          } else {
            const buffer = Buffer.from(Object.values(original[i].bytes) as any)
            const upscaledBuffer = Buffer.from(Object.values(upscaled[i].bytes) as any)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = await sharp(upscaledBuffer).metadata()
          }
          await sql.post.insertUnverifiedImage(postID, filename, upscaledFilename, kind, order, hash, dimensions.width, dimensions.height, upscaled[i].size)
        }
        if (upscaledImages?.length > images?.length) hasOriginal = false
        if (images?.length > upscaledImages?.length) hasUpscaled = false

        let hidden = false 
        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const tag = await sql.tag.tag(artists[i].tag)
          if (tag?.banned) hidden = true
        }

        const uploadDate = new Date().toISOString()
        await sql.post.bulkUpdateUnverifiedPost(postID, {
          rating, 
          style, 
          parentID: parentID || null,
          title: source.title ? source.title : null,
          englishTitle: source.englishTitle ? source.englishTitle : null,
          artist: source.artist ? source.artist : null,
          posted: source.posted ? source.posted : null,
          source: source.source ? source.source : null,
          commentary: source.commentary ? source.commentary : null,
          englishCommentary: source.englishCommentary ? source.englishCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          buyLink: source.buyLink ? source.buyLink : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
          slug: functions.postSlug(source.title, source.englishTitle),
          type,
          uploadDate,
          updatedDate: uploadDate,
          uploader: req.session.username,
          updater: req.session.username,
          duplicates: duplicates ? true : false,
          newTags: newTags.length,
          hasOriginal,
          hasUpscaled,
          hidden
        })

        let tagMap = tags
        let bulkTagUpdate = [] as BulkTag[]
        let tagObjectMapping = await serverFunctions.tagMap()

        for (let i = 0; i < tagMap.length; i++) {
          bulkTagUpdate.push({tag: tagMap[i], type: tagObjectMapping[tagMap[i]]?.type, description: null, image: null, imageHash: null})
        }

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: tagObjectMapping[newTags[i].tag]?.type, description: null, image: null, imageHash: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            const buffer = Buffer.from(Object.values(newTags[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null, imageHash: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            const buffer = Buffer.from(Object.values(artists[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null, imageHash: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            const buffer = Buffer.from(Object.values(characters[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null, imageHash: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            const buffer = Buffer.from(Object.values(series[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(series[i].tag)
        }

        for (let i = 0; i < tagMap.length; i++) {
          const implications = await sql.tag.implications(tagMap[i])
          if (implications?.[0]) {
            for (const i of implications) {
              tagMap.push(i.implication)
              const tag = await sql.tag.tag(i.implication)
              bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type, description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
            }
          }
        }

        tagMap = functions.removeDuplicates(tagMap).filter(Boolean)
        await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate)
        await sql.tag.insertUnverifiedTagMap(postID, tagMap)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit/unverified", csrfProtection, editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, unverifiedID, images, upscaledImages, type, rating, style, parentID, source, artists, characters, series,
        tags, newTags, reason} = req.body as UnverifiedEditParams

        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (unverifiedID && Number.isNaN(unverifiedID)) return res.status(400).send("Bad unverifiedID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
        if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
            return res.status(400).send("Invalid characters in tags: , _ / \\")
        }

        artists = artists.filter(Boolean).map((a: any) => {
          if (a.tag) a.tag = a.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return a
        })

        characters = characters.filter(Boolean).map((c: any) => {
          if (c.tag) c.tag = c.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return c
        })

        series = series.filter(Boolean).map((s: any) => {
          if (s.tag) s.tag = s.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return s
        })

        newTags = newTags.filter(Boolean).map((t: any) => {
          if (t.tag) t.tag = t.tag.toLowerCase().replace(/[\n\r\s]+/g, "-")
          return t
        })

        tags = tags.filter(Boolean).map((t: string) => t.toLowerCase().replace(/[\n\r\s]+/g, "-"))

        let skipMBCheck = (req.session.role === "admin" || req.session.role === "mod") ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const originalPostID = postID as any
        postID = unverifiedID ? unverifiedID : await sql.post.insertUnverifiedPost()
        const unverifiedPost = await sql.post.unverifiedPost(postID)
        if (!unverifiedPost) return res.status(400).send("Bad unverifiedID")
        let oldR18 = functions.isR18(unverifiedPost.rating)
        let newR18 = functions.isR18(rating)

        let post = null as any
        if (originalPostID) {
          post = await sql.post.post(originalPostID)
          if (!post) return res.status(400).send("Bad postID")
        }

        let imgChanged = true
        if (unverifiedID) {
          imgChanged = await serverFunctions.imagesChangedUnverified(unverifiedPost.images, images, false, oldR18)
          if (!imgChanged) imgChanged = await serverFunctions.imagesChangedUnverified(unverifiedPost.images, upscaledImages, true, oldR18)
          if (imgChanged) {
            for (let i = 0; i < unverifiedPost.images.length; i++) {
              await sql.post.deleteUnverifiedImage(unverifiedPost.images[i].imageID)
              await serverFunctions.deleteUnverifiedFile(functions.getImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].filename))
              await serverFunctions.deleteUnverifiedFile(functions.getUpscaledImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].upscaledFilename || unverifiedPost.images[i].filename))
            }
          }
        }

        if (unverifiedID) await sql.post.deleteUnverifiedChild(postID)
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertUnverifiedChild(postID, parentID)

        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let original = images[i] ? images : upscaledImages
          let upscaled = upscaledImages[i] ? upscaledImages : images
          const ext = original[i].ext
          let fileOrder = original.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          let filename = null as any
          let upscaledFilename = null as any
          if (images[i]) {
            filename = cleanTitle ? `${cleanTitle}.${images[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${images[i].ext}` :
            `${postID}.${images[i].ext}`
          }
          if (upscaledImages[i]) {
            upscaledFilename = cleanTitle ? `${cleanTitle}.${upscaledImages[i].ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${upscaledImages[i].ext}` :
            `${postID}.${upscaledImages[i].ext}`
          }
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (functions.isWebP(`.${ext}`)) {
            const animated = functions.isAnimatedWebp(Buffer.from(original[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (functions.isImage(`.${ext}`)) {
            kind = "image"
          } else if (functions.isGIF(`.${ext}`)) {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (functions.isVideo(`.${ext}`)) {
            kind = "video"
            type = "video"
          } else if (functions.isAudio(`.${ext}`)) {
            kind = "audio"
            type = "audio"
          } else if (functions.isModel(`.${ext}`)) {
            kind = "model"
            type = "model"
          } else if (functions.isLive2D(`.${ext}`)) {
            kind = "live2d"
            type = "live2d"
          }
        if (imgChanged) {
            if (images[i]) {
              let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
              const buffer = Buffer.from(Object.values(images[i].bytes) as any)
              await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
              hasOriginal = true
            }
            if (upscaledImages[i]) {
              let imagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), upscaledFilename)
              const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
              await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
              hasUpscaled = true
            }
            let dimensions = null as any
            let hash = ""
            if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
              const buffer = functions.base64ToBuffer(original[i].thumbnail)
              const upscaledBuffer = functions.base64ToBuffer(upscaled[i].thumbnail || original[i].thumbnail)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = await sharp(upscaledBuffer).metadata()
              if (kind === "live2d") {
                dimensions.width = upscaled[i].width
                dimensions.height = upscaled[i].height
              }
            } else {
              const buffer = Buffer.from(Object.values(original[i].bytes) as any)
              const upscaledBuffer = Buffer.from(Object.values(upscaled[i].bytes) as any)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = await sharp(upscaledBuffer).metadata()
            }
            await sql.post.insertUnverifiedImage(postID, filename, upscaledFilename, kind, order, hash, dimensions.width, dimensions.height, upscaled[i].size)
          }
        }
        if (upscaledImages?.length > images?.length) hasOriginal = false
        if (images?.length > upscaledImages?.length) hasUpscaled = false

        const updatedDate = new Date().toISOString()
        await sql.post.bulkUpdateUnverifiedPost(postID, {
          originalID: originalPostID ? originalPostID : null,
          reason: reason ? reason : null,
          rating, 
          style, 
          parentID: parentID || null,
          title: source.title ? source.title : null,
          englishTitle: source.englishTitle ? source.englishTitle : null,
          artist: source.artist ? source.artist : null,
          posted: source.posted ? source.posted : null,
          source: source.source ? source.source : null,
          commentary: source.commentary ? source.commentary : null,
          englishCommentary: source.englishCommentary ? source.englishCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          buyLink: source.buyLink ? source.buyLink : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
          slug: functions.postSlug(source.title, source.englishTitle),
          type,
          updatedDate,
          hasOriginal,
          hasUpscaled,
          updater: req.session.username
        })

        if (originalPostID) {
          const updated = await sql.post.unverifiedPost(postID)
          let combinedTags = [...artists.map((a: any) => a.tag), ...characters.map((c: any) => c.tag), 
            ...series.map((s: any) => s.tag), ...newTags.map((n: any) => n.tag), ...tags]
          let oldTagsSet = new Set<string>(post.tags)
          let newTagsSet = new Set<string>(combinedTags)
          let addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
          let removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)
          const changes = functions.parsePostChanges(post, updated)
          
          await sql.post.bulkUpdateUnverifiedPost(postID, {
            uploader: post.uploader,
            uploadDate: post.uploadDate,
            addedTags,
            removedTags,
            imageChanged: imgChanged,
            changes
          })
        }

        let combinedTags = [...artists.map((a: any) => a.tag), ...characters.map((c: any) => c.tag), 
        ...series.map((s: any) => s.tag), ...newTags.map((n: any) => n.tag), ...tags]
        let oldTagsSet = new Set<string>(unverifiedPost.tags)
        let newTagsSet = new Set<string>(combinedTags)
        let addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
        let removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)

        let bulkTagUpdate = [] as BulkTag[]
        let tagObjectMapping = await serverFunctions.tagMap()
        
        for (let i = 0; i < tags.length; i++) {
          bulkTagUpdate.push({tag: tags[i], type: tagObjectMapping[tags[i]]?.type, description: null, image: null, imageHash: null})
        }

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: tagObjectMapping[newTags[i].tag]?.type, description: null, image: null, imageHash: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            const buffer = Buffer.from(Object.values(newTags[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null, imageHash: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            const buffer = Buffer.from(Object.values(artists[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null, imageHash: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            const buffer = Buffer.from(Object.values(characters[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null, imageHash: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            const buffer = Buffer.from(Object.values(series[i].bytes!))
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            bulkObj.image = filename
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < addedTags.length; i++) {
          const implications = await sql.tag.implications(addedTags[i])
          if (implications?.[0]) {
            for (const i of implications) {
              if (!oldTagsSet.has(i.implication)) addedTags.push(i.implication)
              const tag = await sql.tag.tag(i.implication)
              bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type, description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
            }
          }
        }

        addedTags = functions.removeDuplicates(addedTags).filter(Boolean)
        await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate)
        if (unverifiedID) await sql.tag.deleteUnverifiedTagMap(postID, removedTags)
        await sql.tag.insertUnverifiedTagMap(postID, addedTags)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/approve", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, reason} = req.body as {postID: string, reason: string}
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isMod(req.session)) return res.status(403).end()
        const unverified = await sql.post.unverifiedPost(postID)
        if (!unverified) return res.status(400).send("Bad request")

        const newPostID = unverified.originalID ? unverified.originalID : await sql.post.insertPost()

        let post = unverified.originalID ? await sql.post.post(unverified.originalID) : null
        let oldR18 = post ? functions.isR18(post.rating) : functions.isR18(unverified.rating)
        let newR18 = functions.isR18(unverified.rating)
        let oldType = post ? post.type : unverified.type
        let newType = unverified.type

        let imgChanged = true
        if (post && unverified.originalID) {
          imgChanged = await serverFunctions.imagesChangedUnverified(post.images, unverified.images, false, oldR18)
          if (!imgChanged) imgChanged = await serverFunctions.imagesChangedUnverified(post.images, unverified.images, true, oldR18)
        }

        let vanillaBuffers = [] as any
        let upscaledVanillaBuffers = [] as any
        if (unverified.originalID) {
          if (!post) return res.status(400).send("Bad postID")
          for (let i = 0; i < post.images.length; i++) {
            const imagePath = functions.getImagePath(post.images[i].type, newPostID, post.images[i].order, post.images[i].filename)
            const upscaledImagePath = functions.getUpscaledImagePath(post.images[i].type, newPostID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
            const buffer = await serverFunctions.getFile(imagePath, false, oldR18) as Buffer
            const upscaledBuffer = await serverFunctions.getFile(upscaledImagePath, false, oldR18) as Buffer
            vanillaBuffers.push(buffer)
            upscaledVanillaBuffers.push(upscaledBuffer)
            if (imgChanged) {
              await serverFunctions.deleteFile(functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename), oldR18)
              await serverFunctions.deleteFile(functions.getUpscaledImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename), oldR18)
              await sql.post.deleteImage(post.images[i].imageID)
            }
          }
        }

        if (unverified.parentID) {
          await sql.post.insertChild(newPostID, unverified.parentID)
        }

        const {artists, characters, series, tags} = await serverFunctions.unverifiedTagCategories(unverified.tags)

        let type = unverified.type
        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false
        let originalCheck = [] as string[]
        let upscaledCheck = [] as string[]

        let imageFilenames = [] as any
        let upscaledImageFilenames = [] as any
        let imageOrders = [] as any
        for (let i = 0; i < unverified.images.length; i++) {
          const imagePath = functions.getImagePath(unverified.images[i].type, postID, unverified.images[i].order, unverified.images[i].filename)
          let buffer = await serverFunctions.getUnverifiedFile(imagePath) as Buffer
          const upscaledImagePath = functions.getUpscaledImagePath(unverified.images[i].type, postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
          const upscaledBuffer = await serverFunctions.getUnverifiedFile(upscaledImagePath) as Buffer

          let original = buffer ? buffer : upscaledBuffer
          let upscaled = upscaledBuffer ? upscaledBuffer : buffer
          let order = i + 1
          const ext = path.extname(unverified.images[i].upscaledFilename || unverified.images[i].filename).replace(".", "")
          let fileOrder = unverified.images.length > 1 ? `${order}` : "1"
          let filename = null as any
          let upscaledFilename = null as any
          if (unverified.images[i].filename) {
            let ext = path.extname(unverified.images[i].filename).replace(".", "")
            filename = unverified.title ? `${unverified.title}.${ext}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
            `${postID}.${ext}`
          }
          if (unverified.images[i].upscaledFilename) {
            const upscaledExt = path.extname(unverified.images[i].upscaledFilename).replace(".", "")
            upscaledFilename = unverified.title ? `${unverified.title}.${upscaledExt}` : 
            characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${upscaledExt}` :
            `${newPostID}.${upscaledExt}`
          }
          imageFilenames.push(filename)
          upscaledImageFilenames.push(upscaledFilename)
          imageOrders.push(order)
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (functions.isWebP(`.${ext}`)) {
            const animated = functions.isAnimatedWebp(original)
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (functions.isImage(`.${ext}`)) {
            kind = "image"
          } else if (functions.isGIF(`.${ext}`)) {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (functions.isVideo(`.${ext}`)) {
            kind = "video"
            type = "video"
          } else if (functions.isAudio(`.${ext}`)) {
            kind = "audio"
            type = "audio"
          } else if (functions.isModel(`.${ext}`)) {
            kind = "model"
            type = "model"
          } else if (functions.isLive2D(`.${ext}`)) {
            kind = "live2d"
            type = "live2d"
          }
          if (imgChanged) {
            if (buffer.byteLength) {
              let newImagePath = functions.getImagePath(kind, newPostID, Number(fileOrder), filename)
              await serverFunctions.uploadFile(newImagePath, buffer, oldR18)
              hasOriginal = true
              originalCheck.push(newImagePath)
            }
            if (upscaledBuffer.byteLength) {
              let newImagePath = functions.getUpscaledImagePath(kind, newPostID, Number(fileOrder), upscaledFilename)
              await serverFunctions.uploadFile(newImagePath, upscaledBuffer, oldR18)
              hasUpscaled = true
              upscaledCheck.push(newImagePath)
            }

            let dimensions = null as any
            let hash = ""
            if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
              const buffer = functions.base64ToBuffer(unverified.thumbnail || "")
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = await sharp(upscaled).metadata()
              if (kind === "live2d") {
                dimensions.width = unverified.images[i].width
                dimensions.height = unverified.images[i].height
              }
            } else {
              hash = await phash(original).then((hash: string) => functions.binaryToHex(hash))
              dimensions = await sharp(upscaled).metadata()
            }
            await sql.post.insertImage(newPostID, filename, upscaledFilename, type, order, hash, dimensions.width, dimensions.height, upscaled.byteLength)
          }
        }
        if (upscaledCheck?.length > originalCheck?.length) hasOriginal = false
        if (originalCheck?.length > upscaledCheck?.length) hasUpscaled = false

        let hidden = false 
        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const tag = await sql.tag.tag(artists[i].tag)
          if (tag?.banned) hidden = true
        }

        await sql.post.bulkUpdatePost(newPostID, {
          rating: unverified.rating,
          style: unverified.style,
          parentID: unverified.parentID,
          title: unverified.title ? unverified.title : null,
          englishTitle: unverified.englishTitle ? unverified.englishTitle : null,
          artist: unverified.artist ? unverified.artist : null,
          posted: unverified.posted ? unverified.posted : null,
          source: unverified.source ? unverified.source : null,
          commentary: unverified.commentary ? unverified.commentary : null,
          englishCommentary: unverified.englishCommentary ? unverified.englishCommentary : null,
          bookmarks: unverified.bookmarks ? unverified.bookmarks : null,
          buyLink: unverified.buyLink ? unverified.buyLink : null,
          mirrors: unverified.mirrors ? JSON.stringify(unverified.mirrors) : null,
          slug: functions.postSlug(unverified.title, unverified.englishTitle),
          type,
          uploadDate: unverified.uploadDate,
          updatedDate: unverified.updatedDate,
          uploader: unverified.uploader,
          updater: unverified.updater,
          approver: req.session.username,
          approveDate: new Date().toISOString(),
          hasOriginal,
          hasUpscaled,
          hidden
        })

        let combinedTags = [...artists.map((a: any) => a.tag), ...characters.map((c: any) => c.tag), 
        ...series.map((s: any) => s.tag), ...tags.map((n: any) => n.tag), ...unverified.tags]
        let oldTagsSet = new Set<string>(post ? post.tags : [])
        let newTagsSet = new Set<string>(combinedTags)
        let addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
        let removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)
  
        let bulkTagUpdate = [] as BulkTag[]
        let tagObjectMapping = await serverFunctions.tagMap()

        for (let i = 0; i < tags.length; i++) {
          if (!tags[i].tag) continue
          let bulkObj = {tag: tags[i].tag, type: tagObjectMapping[tags[i].tag]?.type, description: tags[i].description, image: null, imageHash: null} as any
          if (tags[i].image) {
            const imagePath = functions.getTagPath("tag", tags[i].image!)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = tags[i].image
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null, imageHash: null} as any
          if (artists[i].image) {
            const imagePath = functions.getTagPath("artist", artists[i].image!)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = artists[i].image
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null, imageHash: null} as any
          if (characters[i].image) {
            const imagePath = functions.getTagPath("character", characters[i].image!)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = characters[i].image
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null, imageHash: null} as any
          if (series[i].image) {
            const imagePath = functions.getTagPath("series", series[i].image!)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = series[i].image
            bulkObj.imageHash = serverFunctions.md5(buffer)
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < addedTags.length; i++) {
          const implications = await sql.tag.implications(addedTags[i])
          if (implications?.[0]) {
            for (const i of implications) {
              if (!oldTagsSet.has(i.implication)) addedTags.push(i.implication)
              const tag = await sql.tag.tag(i.implication)
              bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type, description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
            }
          }
        }

        addedTags = functions.removeDuplicates(addedTags).filter(Boolean)
        await sql.tag.bulkInsertTags(bulkTagUpdate, unverified.uploader)
        if (unverified.originalID) await sql.tag.deleteTagMap(unverified.originalID, removedTags)
        await sql.tag.insertTagMap(newPostID, addedTags)

        await sql.post.deleteUnverifiedPost(postID)
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
            const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(file)
            await serverFunctions.deleteUnverifiedFile(upscaledFile)
        }

        if (post) {
          await serverFunctions.migratePost(post, oldType, newType, oldR18, newR18)
        }

        if (post && unverified.originalID) {
          const updated = await sql.post.post(unverified.originalID)
          let r18 = functions.isR18(updated.rating)

          const artistsArr = artists.map((a) => a.tag)
          const charactersArr = characters.map((c) => c.tag)
          const seriesArr = series.map((s) => s.tag)
          const tagsArr = tags.map((t) => t.tag)

          const changes = functions.parsePostChanges(post, updated)
          const postHistory = await sql.history.postHistory(newPostID)
          const nextKey = await serverFunctions.getNextKey("post", String(newPostID), r18)
          if (!postHistory.length || (imgChanged && nextKey === 1)) {
              const vanilla = structuredClone(post) as unknown as PostHistory
              vanilla.date = vanilla.uploadDate 
              vanilla.user = vanilla.uploader
              const categories = await serverFunctions.tagCategories(vanilla.tags)
              vanilla.artists = categories.artists.map((a: any) => a.tag)
              vanilla.characters = categories.characters.map((c: any) => c.tag)
              vanilla.series = categories.series.map((s: any) => s.tag)
              vanilla.tags = categories.tags.map((t: any) => t.tag)
              let vanillaImages = [] as any
              for (let i = 0; i < vanilla.images.length; i++) {
                  if (imgChanged) {
                    let newImagePath = ""
                    if (upscaledVanillaBuffers[i]) {
                      newImagePath = functions.getUpscaledImageHistoryPath(newPostID, 1, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
                      await serverFunctions.uploadFile(newImagePath, upscaledVanillaBuffers[i], r18)
                    }
                    if (vanillaBuffers[i]) {
                      newImagePath = functions.getImageHistoryPath(newPostID, 1, post.images[i].order, post.images[i].filename)
                      await serverFunctions.uploadFile(newImagePath, vanillaBuffers[i], r18)
                    }
                    vanillaImages.push(newImagePath)
                  } else {
                    vanillaImages.push(functions.getImagePath(post.images[i].type, newPostID, post.images[i].order, post.images[i].filename))
                  }
              }
              await sql.history.insertPostHistory({
                postID: newPostID, username: vanilla.user, images: vanillaImages, uploader: vanilla.uploader, updater: vanilla.updater, 
                uploadDate: vanilla.uploadDate, updatedDate: vanilla.updatedDate, type: vanilla.type, rating: vanilla.rating, 
                style: vanilla.style, parentID: vanilla.parentID, title: vanilla.title, englishTitle: vanilla.englishTitle, slug: vanilla.slug,
                posted: vanilla.posted, artist: vanilla.artist, source: vanilla.source, commentary: vanilla.commentary, englishCommentary: vanilla.englishCommentary, 
                bookmarks: vanilla.bookmarks, buyLink: vanilla.buyLink, mirrors: JSON.stringify(vanilla.mirrors), hasOriginal: vanilla.hasOriginal, hasUpscaled: vanilla.hasUpscaled, 
                artists: vanilla.artists, characters: vanilla.characters, series: vanilla.series, tags: vanilla.tags, addedTags: [], removedTags: [], imageChanged: false, 
                changes: null, reason})

              let newImages = [] as any
              for (let i = 0; i < unverified.images.length; i++) {
                if (imgChanged) {
                  let newImagePath = ""
                  const upscaledUnverifiedPath = functions.getUpscaledImagePath(unverified.images[i].type, unverified.images[i].postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
                  const upscaledBuffer = await serverFunctions.getUnverifiedFile(upscaledUnverifiedPath)
                  if (upscaledBuffer) {
                    newImagePath = functions.getUpscaledImageHistoryPath(newPostID, 2, imageOrders[i], upscaledImageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, upscaledBuffer, r18)
                  }
                  const unverifiedPath = functions.getImagePath(unverified.images[i].type, unverified.images[i].postID, unverified.images[i].order, unverified.images[i].filename)
                  const buffer = await serverFunctions.getUnverifiedFile(unverifiedPath)
                  if (buffer.byteLength) {
                    newImagePath = functions.getImageHistoryPath(newPostID, 2, imageOrders[i], imageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, buffer, r18)
                  }
                  newImages.push(newImagePath)
                } else {
                  newImages.push(functions.getImagePath(updated.images[i].type, newPostID, updated.images[i].order, updated.images[i].filename))
                }
              }
              await sql.history.insertPostHistory({
                postID: newPostID, username: req.session.username, images: newImages, uploader: updated.uploader, updater: updated.updater, 
                uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, 
                style: updated.style, parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, 
                posted: updated.posted, artist: updated.artist, source: updated.source, commentary: updated.commentary, slug: updated.slug,
                englishCommentary: updated.englishCommentary, bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: JSON.stringify(updated.mirrors), 
                hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: artistsArr, characters: charactersArr, 
                series: seriesArr, tags: tagsArr, addedTags, removedTags, imageChanged: imgChanged,
                changes, reason})
          } else {
              let newImages = [] as any
              for (let i = 0; i < unverified.images.length; i++) {
                if (imgChanged) {
                  let newImagePath = ""
                  const upscaledUnverifiedPath = functions.getUpscaledImagePath(unverified.images[i].type, unverified.images[i].postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
                  const upscaledBuffer = await serverFunctions.getUnverifiedFile(upscaledUnverifiedPath)
                  if (upscaledBuffer) {
                    newImagePath = functions.getUpscaledImageHistoryPath(newPostID, nextKey, imageOrders[i], upscaledImageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, upscaledBuffer, r18)
                  }
                  const unverifiedPath = functions.getImagePath(unverified.images[i].type, unverified.images[i].postID, unverified.images[i].order, unverified.images[i].filename)
                  const buffer = await serverFunctions.getUnverifiedFile(unverifiedPath)
                  if (buffer.byteLength) {
                    newImagePath = functions.getImageHistoryPath(newPostID, nextKey, imageOrders[i], imageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, buffer, r18)
                  }
                  newImages.push(newImagePath)

                  let result = await sql.history.postHistory(postID)
                  if (result.length > 1) {
                      const lastResult = result[result.length - 1]
                      const penultResult = result[result.length - 2]
                      const lastImage = lastResult.images[0]
                      const penultImage = penultResult.images[0]
                      if (penultImage?.startsWith("history/post") && !lastImage?.startsWith("history/post")) {
                          await sql.history.updatePostHistory(lastResult.historyID, "images", penultResult.images)
                      }
                  }
                } else {
                  newImages.push(functions.getImagePath(updated.images[i].type, newPostID, updated.images[i].order, updated.images[i].filename))
                }
              }
              await sql.history.insertPostHistory({
                postID, username: req.session.username, images: newImages, uploader: updated.uploader, updater: updated.updater, 
                uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, 
                style: updated.style, parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, 
                posted: updated.posted, artist: updated.artist, source: updated.source, commentary: updated.commentary, slug: updated.slug,
                englishCommentary: updated.englishCommentary, bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: JSON.stringify(updated.mirrors), 
                hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: artistsArr, characters: charactersArr, 
                series: seriesArr, tags: tagsArr, addedTags, removedTags, imageChanged: imgChanged,
                changes, reason})
          }
        }

        let subject = "Notice: Post has been approved"
        let message = `${functions.getDomain()}/post/${newPostID} has been approved. Thanks for the submission!`
        if (unverified.originalID) {
          subject = "Notice: Post edit request has been approved"
          message = `Post edit request on ${functions.getDomain()}/post/${newPostID} has been approved. Thanks for the contribution!`
        }
        await serverFunctions.systemMessage(unverified.uploader, subject, message)
        
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/reject", modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let postID = req.body.postID as string
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!permissions.isMod(req.session)) return res.status(403).end()
        const unverified = await sql.post.unverifiedPost(postID)
        if (!unverified) return res.status(400).send("Bad postID")
        await sql.post.deleteUnverifiedPost(postID)
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
            const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(file)
            await serverFunctions.deleteUnverifiedFile(upscaledFile)
        }

        let subject = "Notice: Post has been rejected"

        let rejectionText = "A post you submitted has been rejected."
        if (unverified.title) rejectionText = `Post ${unverified.title} ${unverified.source ? `(${unverified.source}) ` : ""}has been rejected.`
        let message = `${rejectionText}\n\nThe most common rejection reason is that the post is not "moe" enough. If you would like to upload something other than cute anime girls, a different imageboard would be better suited!`

        if (unverified.originalID) {
          subject = "Notice: Post edit request has been rejected"
          message = `Post edit request on ${functions.getDomain()}/post/${unverified.originalID} has been rejected.\n\nMake sure you go over the submission guidelines on ${functions.getDomain()}/help#uploading`
        }
        // await serverFunctions.systemMessage(unverified.uploader, subject, message)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })
}

export default CreateRoutes