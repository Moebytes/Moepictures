import {Express, NextFunction, Request, Response} from "express"
import sql from "../structures/SQLQuery"
import fs from "fs"
import path from "path"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import rateLimit from "express-rate-limit"
import phash from "sharp-phash"
import fileType from "magic-bytes.js"
import imageSize from "image-size"
import {performance} from "perf_hooks"
import axios from "axios"

const uploadLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 20,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const editLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 20,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const modLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 500,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const altPath = (imagePath: string) => {
  let i = 2
  let newDest = imagePath
  while (fs.existsSync(newDest)) {
      newDest = `${path.dirname(imagePath)}/${path.basename(imagePath, path.extname(imagePath))}${i}${path.extname(imagePath)}`
      i++
  }
  return newDest
}

const validImages = (images: any[]) => {
  if (!images.length) return false
  for (let i = 0; i < images.length; i++) {
    const result = fileType(images[i].bytes)?.[0]
    const jpg = result?.mime === "image/jpeg"
    const png = result?.mime === "image/png"
    const webp = result?.mime === "image/webp"
    const gif = result?.mime === "image/gif"
    const mp4 = result?.mime === "video/mp4"
    const webm = result?.mime === "video/webm"
    if (jpg || png || webp || gif || mp4 || webm) {
      const MB = images[i].size / (1024*1024)
      const maxSize = jpg ? 5 :
                      webp ? 10 :
                      png ? 10 :
                      gif ? 50 :
                      mp4 ? 100 :
                      webm ? 100 : 100
      if (images[i].ext !== result.typename) return false
      if (MB <= maxSize) continue
    }
    return false
  }
  return true
}


const CreateRoutes = (app: Express) => {
    app.post("/api/post/upload", modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const images = req.body.images 
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

        if (!req.session.username) return res.status(400).send("Not logged in")
        if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) {
          series = characters?.[0]?.tag ? [{tag: "no-series"}] : [{tag: "unknown-series"}]
        }
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

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

        if (!validImages(images)) return res.status(400).send("Invalid images")
        const totalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        if (totalMB > 200) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const postID = await sql.insertPost()
        if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.insertThirdParty(postID, Number(thirdPartyID))

        if (type !== "comic") type = "image"

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          const ext = images[i].ext
          let fileOrder = images.length > 1 ? `${order}` : ""
          const filename = source.title ? `${source.title}${fileOrder}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}${fileOrder}.${ext}` :
          `${postID}${fileOrder ? `-${fileOrder}` : ""}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(images[i].bytes))
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
          }

          let imagePath = functions.getImagePath(kind, postID, filename)
          const buffer = Buffer.from(Object.values(images[i].bytes))
          await serverFunctions.uploadFile(imagePath, buffer)
          let dimensions = null as any
          let hash = ""
          if (kind === "video") {
            const buffer = functions.base64ToBuffer(images[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          }
          await sql.insertImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, images[i].size)
        }

        const uploadDate = new Date().toISOString()
        await sql.bulkUpdatePost(postID, {
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
          type,
          uploadDate,
          updatedDate: uploadDate,
          uploader: req.session.username,
          updater: req.session.username
        })

        let tagMap = tags

        let bulkTagUpdate = [] as any

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: "tag", description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
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
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
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
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
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
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(series[i].tag)
        }
        await sql.insertCuteness(postID, req.session.username, 500)

        tagMap = functions.removeDuplicates(tagMap)

        await sql.bulkInsertTags(bulkTagUpdate)
        await sql.insertTagMap(postID, tagMap)

        if (unverifiedID) {
          const unverifiedPost = await sql.unverifiedPost(Number(unverifiedID))
          for (let i = 0; i < unverifiedPost.images.length; i++) {
            const imgPath = functions.getImagePath(unverifiedPost.images[i].type, Number(unverifiedID), unverifiedPost.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(imgPath)
          }
          await sql.deleteUnverifiedPost(Number(unverifiedID))
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit", modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const postID = Number(req.body.postID)
        const images = req.body.images 
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

        if (Number.isNaN(postID)) return res.status(400).send("Bad request")
        if (!req.session.username) return res.status(400).send("Not logged in")
        if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) {
          series = characters?.[0]?.tag ? [{tag: "no-series"}] : [{tag: "unknown-series"}]
        }
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

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

        if (!validImages(images)) return res.status(400).send("Invalid images")
        const totalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        if (totalMB > 200) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const post = await sql.post(postID)
        if (!post) return res.status(400).send("Bad request")
        for (let i = 0; i < post.images.length; i++) {
          await sql.deleteImage(post.images[i].imageID)
          await serverFunctions.deleteFile(functions.getImagePath(post.images[i].type, postID, post.images[i].filename))
        }

        await sql.deleteThirdParty(postID)
        if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.insertThirdParty(postID, Number(thirdPartyID))

        if (type !== "comic") type = "image"

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          const ext = images[i].ext
          let fileOrder = images.length > 1 ? `${order}` : ""
          const filename = source.title ? `${source.title}${fileOrder}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}${fileOrder}.${ext}` :
          `${postID}${fileOrder ? `-${fileOrder}` : ""}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(images[i].bytes))
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
          }

          let imagePath = functions.getImagePath(kind, postID, filename)
          const buffer = Buffer.from(Object.values(images[i].bytes))
          await serverFunctions.uploadFile(imagePath, buffer)
          let dimensions = null as any
          let hash = ""
          if (kind === "video") {
            const buffer = functions.base64ToBuffer(images[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          }
          await sql.insertImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, images[i].size)
        }

        await sql.updatePost(postID, "type", type)
        const updatedDate = new Date().toISOString()
        await sql.bulkUpdatePost(postID, {
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
          type,
          updatedDate,
          updater: req.session.username
        })

        let tagMap = tags

        let bulkTagUpdate = [] as any

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: "tag", description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
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
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
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
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
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
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(series[i].tag)
        }

        tagMap = functions.removeDuplicates(tagMap)
        await sql.purgeTagMap(postID)
        await sql.bulkInsertTags(bulkTagUpdate)
        await sql.insertTagMap(postID, tagMap)

        if (unverifiedID) {
          const unverifiedPost = await sql.unverifiedPost(Number(unverifiedID))
          for (let i = 0; i < unverifiedPost.images.length; i++) {
            const imgPath = functions.getImagePath(unverifiedPost.images[i].type, Number(unverifiedID), unverifiedPost.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(imgPath)
          }
          await sql.deleteUnverifiedPost(Number(unverifiedID))
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/upload/unverified", uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const images = req.body.images 
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

        if (!req.session.username) return res.status(400).send("Not logged in")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) {
          series = characters?.[0]?.tag ? [{tag: "no-series"}] : [{tag: "unknown-series"}]
        }
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

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

        if (!validImages(images)) return res.status(400).send("Invalid images")
        const totalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        if (totalMB > 200) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const postID = await sql.insertUnverifiedPost()
        if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.insertUnverifiedThirdParty(postID, Number(thirdPartyID))


        if (type !== "comic") type = "image"

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          const ext = images[i].ext
          let fileOrder = images.length > 1 ? `${order}` : ""
          const filename = source.title ? `${source.title}${fileOrder}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}${fileOrder}.${ext}` :
          `${postID}${fileOrder ? `-${fileOrder}` : ""}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(images[i].bytes))
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
          }

          let imagePath = functions.getImagePath(kind, postID, filename)
          const buffer = Buffer.from(Object.values(images[i].bytes))
          await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
          let dimensions = null as any
          let hash = ""
          if (kind === "video") {
            await sql.updateUnverifiedPost(postID, "thumbnail", images[i].thumbnail)
            const buffer = functions.base64ToBuffer(images[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          }
          await sql.insertUnverifiedImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, images[i].size)
        }

        const uploadDate = new Date().toISOString()
        await sql.bulkUpdateUnverifiedPost(postID, {
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
          type,
          uploadDate,
          updatedDate: uploadDate,
          uploader: req.session.username,
          updater: req.session.username,
          duplicates: duplicates ? true : false,
          newTags: newTags.length
        })

        let tagMap = tags

        let bulkTagUpdate = [] as any
        for (let i = 0; i < tagMap.length; i++) {
          bulkTagUpdate.push({tag: tagMap[i], type: "tag", description: null, image: null})
        }

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: "tag", description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
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
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
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
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
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
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(series[i].tag)
        }

        tagMap = functions.removeDuplicates(tagMap)

        await sql.bulkInsertUnverifiedTags(bulkTagUpdate)
        await sql.insertUnverifiedTagMap(postID, tagMap)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit/unverified", editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let postID = Number(req.body.postID)
        let unverifiedID = Number(req.body.unverifiedID)
        const images = req.body.images 
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

        if (Number.isNaN(postID)) return res.status(400).send("Bad request")
        if (unverifiedID && Number.isNaN(unverifiedID)) return res.status(400).send("Bad request")
        if (!req.session.username) return res.status(400).send("Not logged in")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!series?.[0]?.tag) {
          series = characters?.[0]?.tag ? [{tag: "no-series"}] : [{tag: "unknown-series"}]
        }
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!tags?.[0]) tags = ["needs-tags"]
        if (!newTags?.[0]) newTags = []

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

        if (!validImages(images)) return res.status(400).send("Invalid images")
        const totalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        if (totalMB > 200) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        if (unverifiedID) {
          const unverified = await sql.unverifiedPost(unverifiedID)
          if (!unverified) return res.status(400).send("Bad request")
          for (let i = 0; i < unverified.images.length; i++) {
            await sql.deleteUnverifiedImage(unverified.images[i].imageID)
            await serverFunctions.deleteUnverifiedFile(functions.getImagePath(unverified.images[i].type, unverifiedID, unverified.images[i].filename))
          }
        }

        const originalPostID = postID as any
        postID = unverifiedID ? unverifiedID : await sql.insertUnverifiedPost()

        if (unverifiedID) await sql.deleteUnverifiedThirdParty(postID)
        if (thirdPartyID && !Number.isNaN(Number(thirdPartyID))) await sql.insertUnverifiedThirdParty(postID, Number(thirdPartyID))

        if (originalPostID) {
          const post = await sql.post(originalPostID)
          if (!post) return res.status(400).send("Bad request")
          await sql.bulkUpdateUnverifiedPost(postID, {
            uploader: post.uploader,
            uploadDate: post.uploadDate
          })
        }

        if (type !== "comic") type = "image"

        for (let i = 0; i < images.length; i++) {
          let order = i + 1
          const ext = images[i].ext
          let fileOrder = images.length > 1 ? `${order}` : ""
          const filename = source.title ? `${source.title}${fileOrder}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}${fileOrder}.${ext}` :
          `${postID}${fileOrder ? `-${fileOrder}` : ""}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(Buffer.from(images[i].bytes))
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
          }

          let imagePath = functions.getImagePath(kind, postID, filename)
          const buffer = Buffer.from(Object.values(images[i].bytes))
          await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
          let dimensions = null as any
          let hash = ""
          if (kind === "video") {
            const buffer = functions.base64ToBuffer(images[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          }
          await sql.insertUnverifiedImage(postID, filename, kind, order, hash, dimensions.width, dimensions.height, images[i].size)
        }

        const updatedDate = new Date().toISOString()
        await sql.bulkUpdateUnverifiedPost(postID, {
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
          type,
          updatedDate,
          updater: req.session.username
        })

        let tagMap = tags

        let bulkTagUpdate = [] as any
        for (let i = 0; i < tagMap.length; i++) {
          bulkTagUpdate.push({tag: tagMap[i], type: "tag", description: null, image: null})
        }

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          let bulkObj = {tag: newTags[i].tag, type: "tag", description: null, image: null} as any
          if (newTags[i].desc) bulkObj.description = newTags[i].desc
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
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
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
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
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
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
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            bulkObj.image = filename
          }
          bulkTagUpdate.push(bulkObj)
          tagMap.push(series[i].tag)
        }

        tagMap = functions.removeDuplicates(tagMap)
        await sql.purgeUnverifiedTagMap(postID)
        await sql.bulkInsertUnverifiedTags(bulkTagUpdate)
        await sql.insertUnverifiedTagMap(postID, tagMap)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/approve", modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let postID = Number(req.body.postID)
        if (Number.isNaN(postID)) return res.status(400).send("Bad request")
        if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
        const unverified = await sql.unverifiedPost(Number(postID))
        if (!unverified) return res.status(400).send("Bad request")

        const newPostID = await sql.insertPost()

        if (unverified.originalID) {
          const post = await sql.post(unverified.originalID)
          if (!post) return res.status(400).send("Bad request")
          for (let i = 0; i < post.images.length; i++) {
            await sql.deleteImage(post.images[i].imageID)
            await serverFunctions.deleteFile(functions.getImagePath(post.images[i].type, postID, post.images[i].filename))
          }
        }
        if (unverified.thirdParty) {
          const thirdPartyID = await sql.unverifiedParent(postID).then((r) => r.parentID)
          await sql.insertThirdParty(newPostID, thirdPartyID)
        }

        const {artists, characters, series, tags} = await serverFunctions.unverifiedTagCategories(unverified.tags)

        let type = unverified.type
        if (type !== "comic") type = "image"

        for (let i = 0; i < unverified.images.length; i++) {
          const imagePath = functions.getImagePath(unverified.images[i].type, postID, unverified.images[i].filename)
          const buffer = await serverFunctions.getUnverifiedFile(imagePath) as Buffer
          let order = i + 1
          const ext = path.extname(unverified.images[i].filename).replace(".", "")
          let fileOrder = unverified.images.length > 1 ? `${order}` : ""
          const filename = unverified.title ? `${unverified.title}${fileOrder}.${ext}` : 
          characters[0].tag !== "unknown-character" ? `${characters[0].tag}${fileOrder}.${ext}` :
          `${newPostID}${fileOrder ? `-${fileOrder}` : ""}.${ext}`
          let kind = "image" as any
          if (type === "comic") {
            kind = "comic"
          } else if (ext === "jpg" || ext === "png") {
            kind = "image"
          } else if (ext === "webp") {
            const animated = await functions.isAnimatedWebp(buffer)
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
          }

          let newImagePath = functions.getImagePath(kind, newPostID, filename)
          await serverFunctions.uploadFile(newImagePath, buffer)
          let dimensions = null as any
          let hash = ""
          if (kind === "video") {
            const buffer = functions.base64ToBuffer(unverified.thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          } else {
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
            dimensions = imageSize(buffer)
          }
          await sql.insertImage(newPostID, filename, type, order, hash, dimensions.width, dimensions.height, buffer.byteLength)
        }

        await sql.bulkUpdatePost(newPostID, {
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
          type,
          uploadDate: unverified.uploadDate,
          updatedDate: unverified.updatedDate,
          uploader: unverified.uploader,
          updater: unverified.updater
        })

        let tagMap = unverified.tags

        let bulkTagUpdate = [] as any

        for (let i = 0; i < tags.length; i++) {
          if (!tags[i].tag) continue
          let bulkObj = {tag: tags[i].tag, type: "tag", description: tags[i].description, image: null} as any
          if (tags[i].image) {
            const imagePath = functions.getTagPath("tag", tags[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer)
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
            await serverFunctions.uploadFile(imagePath, buffer)
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
            await serverFunctions.uploadFile(imagePath, buffer)
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
            await serverFunctions.uploadFile(imagePath, buffer)
            bulkObj.image = series[i].image
          }
          bulkTagUpdate.push(bulkObj)
        }

        tagMap = functions.removeDuplicates(tagMap)
        if (unverified.originalID) await sql.purgeTagMap(unverified.originalID)
        await sql.bulkInsertTags(bulkTagUpdate)
        await sql.insertTagMap(newPostID, tagMap)

        await sql.deleteUnverifiedPost(Number(postID))
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(file)
        }
        
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/reject", modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let postID = Number(req.body.postID)
        if (Number.isNaN(postID)) return res.status(400).send("Bad request")
        if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
        const unverified = await sql.unverifiedPost(Number(postID))
        if (!unverified) return res.status(400).send("Bad request")
        await sql.deleteUnverifiedPost(Number(postID))
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].filename)
            await serverFunctions.deleteUnverifiedFile(file)
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })
}

export default CreateRoutes