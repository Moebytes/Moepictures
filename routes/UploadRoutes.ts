import {Express, NextFunction, Request, Response} from "express"
import sql from "../sql/SQLQuery"
import fs from "fs"
import path from "path"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import rateLimit from "express-rate-limit"
import phash from "sharp-phash"
import imageSize from "image-size"
import axios from "axios"

const uploadLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 10,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
  keyGenerator,
  handler
})

const editLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 20,
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

const validImages = (images: any[], skipMBCheck?: boolean) => {
  if (!images.length) return false
  for (let i = 0; i < images.length; i++) {
    if (functions.isModel(images[i].link)) {
      const MB = images[i].size / (1024*1024)
      const maxSize = 100
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
        const images = req.body.images 
        const upscaledImages = req.body.upscaledImages
        let type = req.body.type 
        const restrict = req.body.restrict 
        const style = req.body.style
        const thirdPartyID = req.body.thirdPartyID 
        const source = req.body.source 
        let artists = req.body.artists
        let characters = req.body.characters
        let series = req.body.series
        let tags = req.body.tags
        let newTags = req.body.newTags
        let unverifiedID = req.body.unverifiedID
        const noImageUpdate = req.body.noImageUpdate

        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isMod(req.session)) return res.status(403).end()
        if (req.session.banned) return res.status(403).send("You are banned")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${artists.join(" ")} ${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
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
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const postID = await sql.post.insertPost()
        if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.post.insertThirdParty(postID, Number(thirdPartyID))

        if (type !== "comic") type = "image"

        if (images.length !== upscaledImages.length) {
          const maxLength = Math.max(images.length, upscaledImages.length)
          while (images.length < maxLength) {
            images.push(null)
          }
          while (upscaledImages.length < maxLength) {
            upscaledImages.push(null)
          }
        }

        let hasOriginal = false
        let hasUpscaled = false
        let r18 = restrict === "explicit"

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let current = upscaledImages[i] ? upscaledImages : images
          const ext = current[i].ext
          let fileOrder = current.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          const filename = cleanTitle ? `${cleanTitle}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
          `${postID}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png" || ext === "avif") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(current[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (ext === "gif") {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (ext === "mp4" || ext === "webm") {
            kind = "video"
            type = "video"
          } else if (ext === "mp3" || ext === "wav") {
            kind = "audio"
            type = "audio"
          } else if (ext === "glb" || ext === "obj" || ext === "fbx") {
            kind = "model"
            type = "model"
          }

          if (images[i]) {
            let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(images[i].bytes) as any)
            await serverFunctions.uploadFile(imagePath, buffer, r18)
            hasOriginal = true
          }

          if (upscaledImages[i]) {
            let imagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
            await serverFunctions.uploadFile(imagePath, buffer, r18)
            hasUpscaled = true
          }

          let dimensions = null as any
          let hash = ""
          if (kind === "video" || kind === "audio" || kind === "model") {
              const buffer = functions.base64ToBuffer(current[i].thumbnail)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = imageSize(buffer)
          } else {
              const buffer = Buffer.from(Object.values(current[i].bytes) as any)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = imageSize(buffer)
          }
          await sql.post.insertImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, current[i].size)
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
          restrict, 
          style, 
          thirdParty: thirdPartyID ? true : false,
          title: source.title ? source.title : null,
          translatedTitle: source.translatedTitle ? source.translatedTitle : null,
          artist: source.artist ? source.artist : null,
          drawn: source.date ? source.date : null,
          link: source.link ? source.link : null,
          commentary: source.commentary ? source.commentary : null,
          translatedCommentary: source.translatedCommentary ? source.translatedCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
          type,
          uploadDate,
          updatedDate: uploadDate,
          uploader: req.session.username,
          updater: req.session.username,
          approver: req.session.username,
          hasUpscaled,
          hasOriginal,
          hidden
        })

        let tagMap = tags

        let bulkTagUpdate = [] as any

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: functions.tagType(newTags[i].tag), description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(newTags[i].bytes) as any), false)
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(artists[i].bytes) as any), false)
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(characters[i].bytes) as any), false)
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(series[i].bytes) as any), false)
            bulkObj.image = filename
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
              bulkTagUpdate.push({tag: i.implication, type: functions.tagType(i.implication), description: tag?.description || null, image: tag?.image || null})
            }
          }
        }

        tagMap = functions.removeDuplicates(tagMap)

        await sql.tag.bulkInsertTags(bulkTagUpdate, req.session.username, noImageUpdate ? true : false)
        await sql.tag.insertTagMap(postID, tagMap)

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(Number(unverifiedID))
          for (let i = 0; i < unverifiedPost.images.length; i++) {
            const imgPath = functions.getImagePath(unverifiedPost.images[i].type, Number(unverifiedID), unverifiedPost.images[i].order, unverifiedPost.images[i].filename)
            const upscaledImgPath = functions.getUpscaledImagePath(unverifiedPost.images[i].type, Number(unverifiedID), unverifiedPost.images[i].order, unverifiedPost.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(imgPath)
            await serverFunctions.deleteUnverifiedFile(upscaledImgPath)
          }
          await sql.post.deleteUnverifiedPost(Number(unverifiedID))
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit", csrfProtection, editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const postID = Number(req.body.postID)
        const images = req.body.images 
        const upscaledImages = req.body.upscaledImages
        let type = req.body.type 
        const restrict = req.body.restrict 
        const style = req.body.style
        const thirdPartyID = req.body.thirdPartyID 
        const source = req.body.source 
        let artists = req.body.artists
        let characters = req.body.characters
        let series = req.body.series
        let tags = req.body.tags
        let newTags = req.body.newTags
        let unverifiedID = req.body.unverifiedID
        let reason = req.body.reason
        let noImageUpdate = req.body.noImageUpdate
        let preserveThirdParty = req.body.preserveThirdParty
        let updatedDate = req.body.updatedDate
        let silent = req.body.silent

        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")
        if (!permissions.isMod(req.session)) noImageUpdate = true

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${artists.join(" ")} ${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
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
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const post = await sql.post.post(postID)
        if (!post) return res.status(400).send("Bad request")
        let oldR18 = post.restrict === "explicit"
        let newR18 = restrict === "explicit"

        let imgChanged = await serverFunctions.imagesChanged(post.images, images, false, oldR18)
        if (!imgChanged) imgChanged = await serverFunctions.imagesChanged(post.images, upscaledImages, true, oldR18)

        let vanillaBuffers = [] as any
        let upscaledVanillaBuffers = [] as any
        for (let i = 0; i < post.images.length; i++) {
          const imagePath = functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename)
          const upscaledImagePath = functions.getUpscaledImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename)
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

        if (String(preserveThirdParty) !== "true") {
          await sql.post.deleteThirdParty(postID)
          if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.post.insertThirdParty(postID, Number(thirdPartyID))
        }

        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false

        let imageFilenames = [] as any
        let imageOrders = [] as any
        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let current = upscaledImages[i] ? upscaledImages : images
          const ext = current[i].ext
          let fileOrder = current.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          const filename = cleanTitle ? `${cleanTitle}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
          `${postID}.${ext}`
          imageFilenames.push(filename)
          imageOrders.push(order)
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png" || ext === "avif") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(current[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (ext === "gif") {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (ext === "mp4" || ext === "webm") {
            kind = "video"
            type = "video"
          } else if (ext === "mp3" || ext === "wav") {
            kind = "audio"
            type = "audio"
        } else if (ext === "glb" || ext === "obj" || ext === "fbx") {
            kind = "model"
            type = "model"
        }
        if (imgChanged) {
            if (images[i]) {
              let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
              const buffer = Buffer.from(Object.values(images[i].bytes) as any)
              await serverFunctions.uploadFile(imagePath, buffer, oldR18)
              hasOriginal = true
            }
            
            if (upscaledImages[i]) {
              let upscaledImagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), filename)
              const upscaledBuffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
              await serverFunctions.uploadFile(upscaledImagePath, upscaledBuffer, oldR18)
              hasUpscaled = true
            }

            let dimensions = null as any
            let hash = ""
            if (kind === "video" || kind === "audio" || kind === "model") {
              const buffer = functions.base64ToBuffer(current[i].thumbnail)
              hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
              dimensions = imageSize(buffer)
            } else {
                const buffer = Buffer.from(Object.values(current[i].bytes) as any)
                hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
                dimensions = imageSize(buffer)
            }
            await sql.post.insertImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, current[i].size)
          }
        }
        if (upscaledImages?.length > images?.length) hasOriginal = false
        if (images?.length > upscaledImages?.length) hasUpscaled = false

        await sql.post.updatePost(postID, "type", type)
        if (!updatedDate) updatedDate = new Date().toISOString()
        await sql.post.bulkUpdatePost(postID, {
          type,
          restrict, 
          style, 
          thirdParty: thirdPartyID ? true : false,
          title: source.title ? source.title : null,
          translatedTitle: source.translatedTitle ? source.translatedTitle : null,
          artist: source.artist ? source.artist : null,
          drawn: source.date ? source.date : null,
          link: source.link ? source.link : null,
          commentary: source.commentary ? source.commentary : null,
          translatedCommentary: source.translatedCommentary ? source.translatedCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
          updatedDate,
          hasOriginal,
          hasUpscaled,
          updater: req.session.username
        })

        let tagMap = tags
        let bulkTagUpdate = [] as any

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: functions.tagType(newTags[i].tag), description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(newTags[i].bytes) as any), false)
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(artists[i].bytes) as any), false)
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(characters[i].bytes) as any), false)
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(series[i].bytes) as any), false)
            bulkObj.image = filename
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
              bulkTagUpdate.push({tag: i.implication, type: functions.tagType(i.implication), description: tag?.description || null, image: tag?.image || null})
            }
          }
        }

        tagMap = functions.removeDuplicates(tagMap)
        await sql.tag.purgeTagMap(postID)
        await sql.tag.bulkInsertTags(bulkTagUpdate, req.session.username, noImageUpdate ? true : false)
        await sql.tag.insertTagMap(postID, tagMap)

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(Number(unverifiedID))
          for (let i = 0; i < unverifiedPost.images.length; i++) {
            const imgPath = functions.getImagePath(unverifiedPost.images[i].type, Number(unverifiedID), unverifiedPost.images[i].order, unverifiedPost.images[i].filename)
            const upscaledImgPath = functions.getUpscaledImagePath(unverifiedPost.images[i].type, Number(unverifiedID), unverifiedPost.images[i].order, unverifiedPost.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(imgPath)
            await serverFunctions.deleteUnverifiedFile(upscaledImgPath)
          }
          await sql.post.deleteUnverifiedPost(Number(unverifiedID))
        }

        await serverFunctions.migratePost(post, oldR18, newR18)

        if (req.session.role === "admin" || req.session.role === "mod") {
          if (silent) return res.status(200).send("Success")
        }

        artists = artists.map((a: any) => a.tag)
        characters = characters.map((c: any) => c.tag)
        series = series.map((s: any) => s.tag)


        const updated = await sql.post.post(postID)
        let r18 = updated.restrict === "explicit"

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
                    newImagePath = functions.getUpscaledImageHistoryPath(postID, 1, vanilla.images[i].order, vanilla.images[i].filename)
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
              uploadDate: vanilla.uploadDate, updatedDate: vanilla.updatedDate, type: vanilla.type, restrict: vanilla.restrict, 
              style: vanilla.style, thirdParty: vanilla.thirdParty, title: vanilla.title, translatedTitle: vanilla.translatedTitle, 
              drawn: vanilla.drawn, artist: vanilla.artist, link: vanilla.link, commentary: vanilla.commentary, translatedCommentary: vanilla.translatedCommentary, 
              bookmarks: vanilla.bookmarks, mirrors: vanilla.mirrors, hasOriginal: vanilla.hasOriginal, hasUpscaled: vanilla.hasUpscaled, 
              artists: vanilla.artists, characters: vanilla.characters, series: vanilla.series, tags: vanilla.tags, reason})

            let newImages = [] as any
            for (let i = 0; i < images.length; i++) {
                if (imgChanged) {
                  let newImagePath = ""
                  if (upscaledImages[i]) {
                    const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
                    newImagePath = functions.getUpscaledImageHistoryPath(postID, 2, imageOrders[i], imageFilenames[i])
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
              uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, restrict: updated.restrict, 
              style: updated.style, thirdParty: updated.thirdParty, title: updated.title, translatedTitle: updated.translatedTitle, 
              drawn: updated.drawn, artist: updated.artist, link: updated.link, commentary: updated.commentary, 
              translatedCommentary: updated.translatedCommentary, bookmarks: updated.bookmarks, mirrors: updated.mirrors, 
              hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists, characters, series, tags, reason})
        } else {
            let newImages = [] as any
            for (let i = 0; i < images.length; i++) {
              if (imgChanged) {
                let newImagePath = ""
                if (upscaledImages[i]) {
                  const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
                  newImagePath = functions.getUpscaledImageHistoryPath(postID, nextKey, imageOrders[i], imageFilenames[i])
                  await serverFunctions.uploadFile(newImagePath, buffer, r18)
                }
                if (images[i]) {
                  const buffer = Buffer.from(Object.values(images[i].bytes) as any)
                  newImagePath = functions.getImageHistoryPath(postID, nextKey, imageOrders[i], imageFilenames[i])
                  await serverFunctions.uploadFile(newImagePath, buffer, r18)
                }
                newImages.push(newImagePath)
              } else {
                newImages.push(functions.getImagePath(updated.images[i].type, postID, updated.images[i].order, updated.images[i].filename))
              }
            }
            await sql.history.insertPostHistory({
              postID, username: req.session.username, images: newImages, uploader: updated.uploader, updater: updated.updater, 
              uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, restrict: updated.restrict, 
              style: updated.style, thirdParty: updated.thirdParty, title: updated.title, translatedTitle: updated.translatedTitle, 
              drawn: updated.drawn, artist: updated.artist, link: updated.link, commentary: updated.commentary, 
              translatedCommentary: updated.translatedCommentary, bookmarks: updated.bookmarks, mirrors: updated.mirrors, 
              hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists, characters, series, tags, reason})
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/upload/unverified", csrfProtection, uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const images = req.body.images 
        const upscaledImages = req.body.upscaledImages 
        let type = req.body.type 
        const restrict = req.body.restrict 
        const style = req.body.style
        const thirdPartyID = req.body.thirdPartyID 
        const source = req.body.source 
        let artists = req.body.artists
        let characters = req.body.characters
        let series = req.body.series
        let tags = req.body.tags
        let newTags = req.body.newTags
        let duplicates = req.body.duplicates

        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${artists.join(" ")} ${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
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
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const postID = await sql.post.insertUnverifiedPost()
        if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.post.insertUnverifiedThirdParty(postID, Number(thirdPartyID))

        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let current = upscaledImages[i] ? upscaledImages : images
          const ext = current[i].ext
          let fileOrder = current.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          const filename = cleanTitle ? `${source.title}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
          `${postID}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png" || ext === "avif") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(current[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (ext === "gif") {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (ext === "mp4" || ext === "webm") {
            kind = "video"
            type = "video"
          } else if (ext === "mp3" || ext === "wav") {
            kind = "audio"
            type = "audio"
        } else if (ext === "glb" || ext === "obj" || ext === "fbx") {
            kind = "model"
            type = "model"
        }
          if (images[i]) {
            let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(images[i].bytes) as any)
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            hasOriginal = true
          }

          if (upscaledImages[i]) {
            let imagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            hasUpscaled = true
          }
          let dimensions = null as any
          let hash = ""
          if (kind === "video" || kind === "audio" || kind === "model") {
            const buffer = functions.base64ToBuffer(current[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            const buffer = Buffer.from(Object.values(current[i].bytes) as any)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          }
          await sql.post.insertUnverifiedImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, current[i].size)
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
          restrict, 
          style, 
          thirdParty: thirdPartyID ? true : false,
          title: source.title ? source.title : null,
          translatedTitle: source.translatedTitle ? source.translatedTitle : null,
          artist: source.artist ? source.artist : null,
          drawn: source.date ? source.date : null,
          link: source.link ? source.link : null,
          commentary: source.commentary ? source.commentary : null,
          translatedCommentary: source.translatedCommentary ? source.translatedCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
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

        let bulkTagUpdate = [] as any
        for (let i = 0; i < tagMap.length; i++) {
          bulkTagUpdate.push({tag: tagMap[i], type: functions.tagType(tagMap[i]), description: null, image: null})
        }

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: functions.tagType(newTags[i].tag), description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(newTags[i].bytes) as any))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(artists[i].bytes) as any))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(characters[i].bytes) as any))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(series[i].bytes) as any))
            bulkObj.image = filename
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
              bulkTagUpdate.push({tag: i.implication, type: functions.tagType(i.implication), description: tag?.description || null, image: tag?.image || null})
            }
          }
        }

        tagMap = functions.removeDuplicates(tagMap)

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
        let postID = Number(req.body.postID)
        let unverifiedID = Number(req.body.unverifiedID)
        const images = req.body.images 
        const upscaledImages = req.body.upscaledImages 
        let type = req.body.type 
        const restrict = req.body.restrict 
        const style = req.body.style
        const thirdPartyID = req.body.thirdPartyID 
        const source = req.body.source 
        let artists = req.body.artists
        let characters = req.body.characters
        let series = req.body.series
        let tags = req.body.tags
        let newTags = req.body.newTags
        let reason = req.body.reason

        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (unverifiedID && Number.isNaN(unverifiedID)) return res.status(400).send("Bad unverifiedID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

        let rawTags = `${artists.join(" ")} ${characters.join(" ")} ${series.join(" ")} ${tags.join(" ")}`
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
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        if (unverifiedID) {
          const unverified = await sql.post.unverifiedPost(unverifiedID)
          if (!unverified) return res.status(400).send("Bad unverifiedID")
          for (let i = 0; i < unverified.images.length; i++) {
            await sql.post.deleteUnverifiedImage(unverified.images[i].imageID)
            await serverFunctions.deleteUnverifiedFile(functions.getImagePath(unverified.images[i].type, unverifiedID, unverified.images[i].order, unverified.images[i].filename))
            await serverFunctions.deleteUnverifiedFile(functions.getUpscaledImagePath(unverified.images[i].type, unverifiedID, unverified.images[i].order, unverified.images[i].filename))
          }
        }

        const originalPostID = postID as any
        postID = unverifiedID ? unverifiedID : await sql.post.insertUnverifiedPost()

        if (unverifiedID) await sql.post.deleteUnverifiedThirdParty(postID)
        if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.post.insertUnverifiedThirdParty(postID, Number(thirdPartyID))

        if (originalPostID) {
          const post = await sql.post.post(originalPostID)
          if (!post) return res.status(400).send("Bad postID")
          await sql.post.bulkUpdateUnverifiedPost(postID, {
            uploader: post.uploader,
            uploadDate: post.uploadDate
          })
        }

        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          let current = upscaledImages[i] ? upscaledImages : images
          const ext = current[i].ext
          let fileOrder = current.length > 1 ? `${order}` : "1"
          const cleanTitle = functions.cleanTitle(source.title)
          const filename = cleanTitle ? `${cleanTitle}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
          `${postID}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png" || ext === "avif") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(current[i].bytes))
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (ext === "gif") {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (ext === "mp4" || ext === "webm") {
            kind = "video"
            type = "video"
          } else if (ext === "mp3" || ext === "wav") {
            kind = "audio"
            type = "audio"
        } else if (ext === "glb" || ext === "obj" || ext === "fbx") {
            kind = "model"
            type = "model"
        }
          if (images[i]) {
            let imagePath = functions.getImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(images[i].bytes) as any)
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            hasOriginal = true
          }
          if (upscaledImages[i]) {
            let imagePath = functions.getUpscaledImagePath(kind, postID, Number(fileOrder), filename)
            const buffer = Buffer.from(Object.values(upscaledImages[i].bytes) as any)
            await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
            hasUpscaled = true
          }
          let dimensions = null as any
          let hash = ""
          if (kind === "video" || kind === "audio" || kind === "model") {
            const buffer = functions.base64ToBuffer(current[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            const buffer = Buffer.from(Object.values(current[i].bytes) as any)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          }
          await sql.post.insertUnverifiedImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, current[i].size)
        }
        if (upscaledImages?.length > images?.length) hasOriginal = false
        if (images?.length > upscaledImages?.length) hasUpscaled = false

        const updatedDate = new Date().toISOString()
        await sql.post.bulkUpdateUnverifiedPost(postID, {
          originalID: originalPostID ? originalPostID : null,
          reason: reason ? reason : null,
          restrict, 
          style, 
          thirdParty: thirdPartyID ? true : false,
          title: source.title ? source.title : null,
          translatedTitle: source.translatedTitle ? source.translatedTitle : null,
          artist: source.artist ? source.artist : null,
          drawn: source.date ? source.date : null,
          link: source.link ? source.link : null,
          commentary: source.commentary ? source.commentary : null,
          translatedCommentary: source.translatedCommentary ? source.translatedCommentary : null,
          bookmarks: source.bookmarks ? source.bookmarks : null,
          mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
          type,
          updatedDate,
          hasOriginal,
          hasUpscaled,
          updater: req.session.username
        })

        let tagMap = tags

        let bulkTagUpdate = [] as any
        for (let i = 0; i < tagMap.length; i++) {
          bulkTagUpdate.push({tag: tagMap[i], type: functions.tagType(tagMap[i]), description: null, image: null})
        }

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: functions.tagType(newTags[i].tag), description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(newTags[i].bytes) as any))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null} as any
          if (artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(artists[i].bytes) as any))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null} as any
          if (characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(characters[i].bytes) as any))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null} as any
          if (series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(series[i].bytes) as any))
            bulkObj.image = filename
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
              bulkTagUpdate.push({tag: i.implication, type: functions.tagType(i.implication), description: tag?.description || null, image: tag?.image || null})
            }
          }
        }

        tagMap = functions.removeDuplicates(tagMap)
        await sql.tag.purgeUnverifiedTagMap(postID)
        await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate)
        await sql.tag.insertUnverifiedTagMap(postID, tagMap)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/approve", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let reason = req.body.reason
        let postID = Number(req.body.postID)
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isMod(req.session)) return res.status(403).end()
        const unverified = await sql.post.unverifiedPost(Number(postID))
        if (!unverified) return res.status(400).send("Bad request")

        const newPostID = unverified.originalID ? Number(unverified.originalID) : await sql.post.insertPost()

        let post = unverified.originalID ? await sql.post.post(unverified.originalID) : null
        let oldR18 = post ? post.restrict === "explicit" : unverified.restrict === "explicit"
        let newR18 = unverified.restrict === "explicit"

        let imgChanged = await serverFunctions.imagesChangedUnverified(post?.images, unverified.images, false, oldR18)
        if (!imgChanged) imgChanged = await serverFunctions.imagesChangedUnverified(post?.images, unverified.images, true, oldR18)

        let vanillaBuffers = [] as any
        let upscaledVanillaBuffers = [] as any
        if (unverified.originalID) {
          if (!post) return res.status(400).send("Bad postID")
          for (let i = 0; i < post.images.length; i++) {
            const imagePath = functions.getImagePath(post.images[i].type, newPostID, post.images[i].order, post.images[i].filename)
            const upscaledImagePath = functions.getUpscaledImagePath(post.images[i].type, newPostID, post.images[i].order, post.images[i].filename)
            const buffer = await serverFunctions.getFile(imagePath, false, oldR18) as Buffer
            const upscaledBuffer = await serverFunctions.getFile(upscaledImagePath, false, oldR18) as Buffer
            vanillaBuffers.push(buffer)
            upscaledVanillaBuffers.push(upscaledBuffer)
            await serverFunctions.deleteFile(functions.getImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename), oldR18)
            await serverFunctions.deleteFile(functions.getUpscaledImagePath(post.images[i].type, postID, post.images[i].order, post.images[i].filename), oldR18)
            await sql.post.deleteImage(post.images[i].imageID)
          }
        }

        if (unverified.thirdParty) {
          const thirdPartyID = await sql.post.unverifiedParent(postID).then((r) => r.parentID)
          await sql.post.insertThirdParty(newPostID, thirdPartyID)
        }

        const {artists, characters, series, tags} = await serverFunctions.unverifiedTagCategories(unverified.tags)

        let type = unverified.type
        if (type !== "comic") type = "image"

        let hasOriginal = false
        let hasUpscaled = false
        let originalCheck = [] as string[]
        let upscaledCheck = [] as string[]

        let imageFilenames = [] as any
        let imageOrders = [] as any
        for (let i = 0; i < unverified.images.length; i++) {
          const imagePath = functions.getImagePath(unverified.images[i].type, postID, unverified.images[i].order, unverified.images[i].filename)
          let buffer = await serverFunctions.getUnverifiedFile(imagePath) as Buffer
          const upscaledImagePath = functions.getUpscaledImagePath(unverified.images[i].type, postID, unverified.images[i].order, unverified.images[i].filename)
          const upscaledBuffer = await serverFunctions.getUnverifiedFile(upscaledImagePath) as Buffer

          let current = upscaledBuffer ? upscaledBuffer : buffer
          let order = i + 1
          const ext = path.extname(unverified.images[i].filename).replace(".", "")
          let fileOrder = unverified.images.length > 1 ? `${order}` : "1"
          const filename = unverified.title ? `${unverified.title}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
          `${newPostID}.${ext}`
          imageFilenames.push(filename)
          imageOrders.push(order)
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png" || ext === "avif") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(current)
            if (animated) {
              kind = "animation"
              if (type !== "video") type = "animation"
            } else {
              kind = "image"
            }
          } else if (ext === "gif") {
            kind = "animation"
            if (type !== "video") type = "animation"
          } else if (ext === "mp4" || ext === "webm") {
            kind = "video"
            type = "video"
          } else if (ext === "mp3" || ext === "wav") {
            kind = "audio"
            type = "audio"
        } else if (ext === "glb" || ext === "obj" || ext === "fbx") {
            kind = "model"
            type = "model"
        }
          if (buffer.byteLength) {
            let newImagePath = functions.getImagePath(kind, newPostID, Number(fileOrder), filename)
            await serverFunctions.uploadFile(newImagePath, buffer, oldR18)
            hasOriginal = true
            originalCheck.push(newImagePath)
          }
          if (upscaledBuffer.byteLength) {
            let newImagePath = functions.getUpscaledImagePath(kind, newPostID, Number(fileOrder), filename)
            await serverFunctions.uploadFile(newImagePath, upscaledBuffer, oldR18)
            hasUpscaled = true
            upscaledCheck.push(newImagePath)
          }

          let dimensions = null as any
          let hash = ""
          if (kind === "video" || kind === "audio" || kind === "model") {
            const buffer = functions.base64ToBuffer(unverified.thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            hash = await phash(current).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(current)
          }
          await sql.post.insertImage(newPostID, filename, type, order, hash, dimensions.width, dimensions.height, current.byteLength)
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
          restrict: unverified.restrict,
          style: unverified.style,
          thirdParty: unverified.thirdParty,
          title: unverified.title ? unverified.title : null,
          translatedTitle: unverified.translatedTitle ? unverified.translatedTitle : null,
          artist: unverified.artist ? unverified.artist : null,
          drawn: unverified.date ? unverified.date : null,
          link: unverified.link ? unverified.link : null,
          commentary: unverified.commentary ? unverified.commentary : null,
          translatedCommentary: unverified.translatedCommentary ? unverified.translatedCommentary : null,
          bookmarks: unverified.bookmarks ? unverified.bookmarks : null,
          mirrors: unverified.mirrors ? functions.mirrorsJSON(unverified.mirrors) : null,
          type,
          uploadDate: unverified.uploadDate,
          updatedDate: unverified.updatedDate,
          uploader: unverified.uploader,
          updater: unverified.updater,
          approver: req.session.username,
          hasOriginal,
          hasUpscaled,
          hidden
        })

        let tagMap = unverified.tags

        let bulkTagUpdate = [] as any

        for (let i = 0; i < tags.length; i++) {
          if (!tags[i].tag) continue
          let bulkObj = {tag: tags[i].tag, type: functions.tagType(tags[i].tag), description: tags[i].description, image: null} as any
          if (tags[i].image) {
            const imagePath = functions.getTagPath("tag", tags[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = tags[i].image
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          let bulkObj = {tag: artists[i].tag, type: "artist", description: "Artist.", image: null} as any
          if (artists[i].image) {
            const imagePath = functions.getTagPath("artist", artists[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = artists[i].image
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          let bulkObj = {tag: characters[i].tag, type: "character", description: "Character.", image: null} as any
          if (characters[i].image) {
            const imagePath = functions.getTagPath("character", characters[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = characters[i].image
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          let bulkObj = {tag: series[i].tag, type: "series", description: "Series.", image: null} as any
          if (series[i].image) {
            const imagePath = functions.getTagPath("series", series[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer, false)
            bulkObj.image = series[i].image
          }
          bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < tagMap.length; i++) {
          const implications = await sql.tag.implications(tagMap[i])
          if (implications?.[0]) {
            for (const i of implications) {
              tagMap.push(i.implication)
              const tag = await sql.tag.tag(i.implication)
              bulkTagUpdate.push({tag: i.implication, type: functions.tagType(i.implication), description: tag?.description || null, image: tag?.image || null})
            }
          }
        }

        tagMap = functions.removeDuplicates(tagMap)
        if (unverified.originalID) await sql.tag.purgeTagMap(unverified.originalID)
        await sql.tag.bulkInsertTags(bulkTagUpdate, unverified.uploader)
        await sql.tag.insertTagMap(newPostID, tagMap)

        await sql.post.deleteUnverifiedPost(Number(postID))
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
            const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(file)
            await serverFunctions.deleteUnverifiedFile(upscaledFile)
        }

        if (post) {
          await serverFunctions.migratePost(post, oldR18, newR18)
        }

        if (unverified.originalID) {
          const updated = await sql.post.post(unverified.originalID)
          let r18 = updated.restrict === "explicit"
          const postHistory = await sql.history.postHistory(newPostID)
          const nextKey = await serverFunctions.getNextKey("post", String(newPostID), r18)
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
                      newImagePath = functions.getUpscaledImageHistoryPath(newPostID, 1, vanilla.images[i].order, vanilla.images[i].filename)
                      await serverFunctions.uploadFile(newImagePath, upscaledVanillaBuffers[i], r18)
                    }
                    if (vanillaBuffers[i]) {
                      newImagePath = functions.getImageHistoryPath(newPostID, 1, vanilla.images[i].order, vanilla.images[i].filename)
                      await serverFunctions.uploadFile(newImagePath, vanillaBuffers[i], r18)
                    }
                    vanillaImages.push(newImagePath)
                  } else {
                    vanillaImages.push(functions.getImagePath(vanilla.images[i].type, newPostID, vanilla.images[i].order, vanilla.images[i].filename))
                  }
              }
              await sql.history.insertPostHistory({
                postID: newPostID, username: vanilla.user, images: vanillaImages, uploader: vanilla.uploader, updater: vanilla.updater, 
                uploadDate: vanilla.uploadDate, updatedDate: vanilla.updatedDate, type: vanilla.type, restrict: vanilla.restrict, 
                style: vanilla.style, thirdParty: vanilla.thirdParty, title: vanilla.title, translatedTitle: vanilla.translatedTitle, 
                drawn: vanilla.drawn, artist: vanilla.artist, link: vanilla.link, commentary: vanilla.commentary, translatedCommentary: vanilla.translatedCommentary, 
                bookmarks: vanilla.bookmarks, mirrors: vanilla.mirrors, hasOriginal: vanilla.hasOriginal, hasUpscaled: vanilla.hasUpscaled, 
                artists: vanilla.artists, characters: vanilla.characters, series: vanilla.series, tags: vanilla.tags, reason})

              let newImages = [] as any
              for (let i = 0; i < unverified.images.length; i++) {
                if (imgChanged) {
                  let newImagePath = ""
                  const upscaledUnverifiedPath = functions.getUpscaledImagePath(unverified.images[i].type, unverified.images[i].postID, unverified.images[i].order, unverified.images[i].filename)
                  const upscaledBuffer = await serverFunctions.getUnverifiedFile(upscaledUnverifiedPath)
                  if (upscaledBuffer) {
                    newImagePath = functions.getUpscaledImageHistoryPath(newPostID, 2, imageOrders[i], imageFilenames[i])
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
                uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, restrict: updated.restrict, 
                style: updated.style, thirdParty: updated.thirdParty, title: updated.title, translatedTitle: updated.translatedTitle, 
                drawn: updated.drawn, artist: updated.artist, link: updated.link, commentary: updated.commentary, 
                translatedCommentary: updated.translatedCommentary, bookmarks: updated.bookmarks, mirrors: updated.mirrors, 
                hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists, characters, series, tags, reason})
          } else {
              let newImages = [] as any
              for (let i = 0; i < unverified.images.length; i++) {
                if (imgChanged) {
                  let newImagePath = ""
                  const upscaledUnverifiedPath = functions.getUpscaledImagePath(unverified.images[i].type, unverified.images[i].postID, unverified.images[i].order, unverified.images[i].filename)
                  const upscaledBuffer = await serverFunctions.getUnverifiedFile(upscaledUnverifiedPath)
                  if (upscaledBuffer) {
                    newImagePath = functions.getUpscaledImageHistoryPath(newPostID, nextKey, imageOrders[i], imageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, upscaledBuffer, r18)
                  }
                  const unverifiedPath = functions.getImagePath(unverified.images[i].type, unverified.images[i].postID, unverified.images[i].order, unverified.images[i].filename)
                  const buffer = await serverFunctions.getUnverifiedFile(unverifiedPath)
                  if (buffer.byteLength) {
                    newImagePath = functions.getImageHistoryPath(newPostID, nextKey, imageOrders[i], imageFilenames[i])
                    await serverFunctions.uploadFile(newImagePath, buffer, r18)
                  }
                  newImages.push(newImagePath)
                } else {
                  newImages.push(functions.getImagePath(updated.images[i].type, newPostID, updated.images[i].order, updated.images[i].filename))
                }
              }
              await sql.history.insertPostHistory({
                postID, username: req.session.username, images: newImages, uploader: updated.uploader, updater: updated.updater, 
                uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, restrict: updated.restrict, 
                style: updated.style, thirdParty: updated.thirdParty, title: updated.title, translatedTitle: updated.translatedTitle, 
                drawn: updated.drawn, artist: updated.artist, link: updated.link, commentary: updated.commentary, 
                translatedCommentary: updated.translatedCommentary, bookmarks: updated.bookmarks, mirrors: updated.mirrors, 
                hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists, characters, series, tags, reason})
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
        let postID = Number(req.body.postID)
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!permissions.isMod(req.session)) return res.status(403).end()
        const unverified = await sql.post.unverifiedPost(Number(postID))
        if (!unverified) return res.status(400).send("Bad postID")
        await sql.post.deleteUnverifiedPost(Number(postID))
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(file)
        }

        let subject = "Notice: Post has been rejected"

        let rejectionText = "A post you submitted has been rejected."
        if (unverified.title) rejectionText = `Post ${unverified.title} ${unverified.link ? `(${unverified.link}) ` : ""}has been rejected.`
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