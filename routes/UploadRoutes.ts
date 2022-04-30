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
import axios from "axios"

const uploadLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 20,
	message: "Too many uploads, try again later.",
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
    if (jpg || png || webp || gif || mp4) {
      const MB = images[i].size / (1024*1024)
      const maxSize = jpg ? 5 :
                      webp ? 10 :
                      png ? 10 :
                      gif ? 50 :
                      mp4 ? 100 : 100
      if (images[i].ext !== result.typename) return false
      if (MB <= maxSize) continue
    }
    return false
  }
  return true
}


const CreateRoutes = (app: Express) => {
    app.post("/api/post/upload", uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
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
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
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

        await sql.updatePost(postID, "restrict", restrict)
        await sql.updatePost(postID, "style", style)
        await sql.updatePost(postID, "thirdParty", thirdPartyID ? true : false)
        await sql.updatePost(postID, "title", source.title ? source.title : null)
        await sql.updatePost(postID, "translatedTitle", source.translatedTitle ? source.translatedTitle : null)
        await sql.updatePost(postID, "artist", source.artist ? source.artist : null)
        await sql.updatePost(postID, "drawn", source.date ? source.date : null)
        await sql.updatePost(postID, "link", source.link ? source.link : null)
        await sql.updatePost(postID, "commentary", source.commentary ? source.commentary : null)
        await sql.updatePost(postID, "translatedCommentary", source.translatedCommentary ? source.translatedCommentary : null)
        const uploadDate = new Date().toISOString()
        await sql.updatePost(postID, "uploadDate", uploadDate)
        await sql.updatePost(postID, "uploader", req.session.username)
        await sql.updatePost(postID, "updater", req.session.username)
        await sql.updatePost(postID, "updatedDate", uploadDate)


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
          } else if (ext === "mp4") {
            kind = "video"
            type = "video"
          }

          let imagePath = functions.getImagePath(kind, postID, filename)
          // if (fs.existsSync(imagePath)) imagePath = altPath(imagePath)
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
          const imageID = await sql.insertImage(postID)
          await sql.updateImage(imageID, "filename", filename)
          await sql.updateImage(imageID, "type", kind)
          await sql.updateImage(imageID, "order", order)
          await sql.updateImage(imageID, "hash", hash)
          await sql.updateImage(imageID, "width", dimensions.width)
          await sql.updateImage(imageID, "height", dimensions.height)
          await sql.updateImage(imageID, "size", images[i].size)
        }

        await sql.updatePost(postID, "type", type)

        let tagMap = tags

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          const exists = await sql.insertTag(newTags[i].tag)
          await sql.updateTag(newTags[i].tag, "type", "tag")
          if (!exists && newTags[i].desc) await sql.updateTag(newTags[i].tag, "description", newTags[i].desc)
          if (!exists && newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
            await sql.updateTag(newTags[i].tag, "image", filename)
          }
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const exists = await sql.insertTag(artists[i].tag)
          await sql.updateTag(artists[i].tag, "type", "artist")
          if (!exists) await sql.updateTag(artists[i].tag, "description", "Artist.")
          if (!exists && artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
            await sql.updateTag(artists[i].tag, "image", filename)
          }
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          const exists = await sql.insertTag(characters[i].tag)
          await sql.updateTag(characters[i].tag, "type", "character")
          if (!exists) await sql.updateTag(characters[i].tag, "description", "Character.")
          if (!exists && characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
            await sql.updateTag(characters[i].tag, "image", filename)
          }
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          const exists = await sql.insertTag(series[i].tag)
          await sql.updateTag(series[i].tag, "type", "series")
          if (!exists) await sql.updateTag(series[i].tag, "description", "Series.")
          if (!exists && series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            await sql.updateTag(series[i].tag, "image", filename)
          }
          tagMap.push(series[i].tag)
        }
        await sql.insertCuteness(postID, req.session.username, 500)

        tagMap = functions.removeDuplicates(tagMap)

        for (let i = 0; i < tagMap.length; i++) {
          await sql.insertTagMap(postID, tagMap[i])
        }

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

    app.put("/api/post/edit", async (req: Request, res: Response, next: NextFunction) => {
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
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
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
        
        await sql.updatePost(postID, "restrict", restrict)
        await sql.updatePost(postID, "style", style)
        await sql.updatePost(postID, "thirdParty", thirdPartyID ? true : false)
        await sql.updatePost(postID, "title", source.title ? source.title : null)
        await sql.updatePost(postID, "translatedTitle", source.translatedTitle ? source.translatedTitle : null)
        await sql.updatePost(postID, "artist", source.artist ? source.artist : null)
        await sql.updatePost(postID, "drawn", source.date ? source.date : null)
        await sql.updatePost(postID, "link", source.link ? source.link : null)
        await sql.updatePost(postID, "commentary", source.commentary ? source.commentary : null)
        await sql.updatePost(postID, "translatedCommentary", source.translatedCommentary ? source.translatedCommentary : null)
        const updateDate = new Date().toISOString()
        await sql.updatePost(postID, "updater", req.session.username)
        await sql.updatePost(postID, "updatedDate", updateDate)

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
          } else if (ext === "mp4") {
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
          const imageID = await sql.insertImage(postID)
          await sql.updateImage(imageID, "filename", filename)
          await sql.updateImage(imageID, "type", kind)
          await sql.updateImage(imageID, "order", order)
          await sql.updateImage(imageID, "hash", hash)
          await sql.updateImage(imageID, "width", dimensions.width)
          await sql.updateImage(imageID, "height", dimensions.height)
          await sql.updateImage(imageID, "size", images[i].size)
        }

        await sql.updatePost(postID, "type", type)

        let tagMap = tags

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          const exists = await sql.insertTag(newTags[i].tag)
          await sql.updateTag(newTags[i].tag, "type", "tag")
          if (!exists && newTags[i].desc) await sql.updateTag(newTags[i].tag, "description", newTags[i].desc)
          if (!exists && newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
            await sql.updateTag(newTags[i].tag, "image", filename)
          }
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const exists = await sql.insertTag(artists[i].tag)
          await sql.updateTag(artists[i].tag, "type", "artist")
          if (!exists) await sql.updateTag(artists[i].tag, "description", "Artist.")
          if (!exists && artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
            await sql.updateTag(artists[i].tag, "image", filename)
          }
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          const exists = await sql.insertTag(characters[i].tag)
          await sql.updateTag(characters[i].tag, "type", "character")
          if (!exists) await sql.updateTag(characters[i].tag, "description", "Character.")
          if (!exists && characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
            await sql.updateTag(characters[i].tag, "image", filename)
          }
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          const exists = await sql.insertTag(series[i].tag)
          await sql.updateTag(series[i].tag, "type", "series")
          if (!exists) await sql.updateTag(series[i].tag, "description", "Series.")
          if (!exists && series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            await sql.updateTag(series[i].tag, "image", filename)
          }
          tagMap.push(series[i].tag)
        }

        tagMap = functions.removeDuplicates(tagMap)
        await sql.purgeTagMap(postID)
        for (let i = 0; i < tagMap.length; i++) {
          await sql.insertTagMap(postID, tagMap[i])
        }

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
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
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

        await sql.updateUnverifiedPost(postID, "restrict", restrict)
        await sql.updateUnverifiedPost(postID, "style", style)
        await sql.updateUnverifiedPost(postID, "thirdParty", thirdPartyID ? true : false)
        await sql.updateUnverifiedPost(postID, "title", source.title ? source.title : null)
        await sql.updateUnverifiedPost(postID, "translatedTitle", source.translatedTitle ? source.translatedTitle : null)
        await sql.updateUnverifiedPost(postID, "artist", source.artist ? source.artist : null)
        await sql.updateUnverifiedPost(postID, "drawn", source.date ? source.date : null)
        await sql.updateUnverifiedPost(postID, "link", source.link ? source.link : null)
        await sql.updateUnverifiedPost(postID, "commentary", source.commentary ? source.commentary : null)
        await sql.updateUnverifiedPost(postID, "translatedCommentary", source.translatedCommentary ? source.translatedCommentary : null)
        const uploadDate = new Date().toISOString()
        await sql.updateUnverifiedPost(postID, "uploadDate", uploadDate)
        await sql.updateUnverifiedPost(postID, "uploader", req.session.username)
        await sql.updateUnverifiedPost(postID, "updater", req.session.username)
        await sql.updateUnverifiedPost(postID, "updatedDate", uploadDate)
        await sql.updateUnverifiedPost(postID, "duplicates", duplicates ? true : false)
        await sql.updateUnverifiedPost(postID, "newTags", newTags.length)


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
          } else if (ext === "mp4") {
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
          const imageID = await sql.insertUnverifiedImage(postID)
          await sql.updateUnverifiedImage(imageID, "filename", filename)
          await sql.updateUnverifiedImage(imageID, "type", kind)
          await sql.updateUnverifiedImage(imageID, "order", order)
          await sql.updateUnverifiedImage(imageID, "hash", hash)
          await sql.updateUnverifiedImage(imageID, "width", dimensions.width)
          await sql.updateUnverifiedImage(imageID, "height", dimensions.height)
          await sql.updateUnverifiedImage(imageID, "size", images[i].size)
        }

        await sql.updateUnverifiedPost(postID, "type", type)

        let tagMap = tags

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          const exists = await sql.insertUnverifiedTag(newTags[i].tag)
          await sql.updateUnverifiedTag(newTags[i].tag, "type", "tag")
          if (!exists && newTags[i].desc) await sql.updateUnverifiedTag(newTags[i].tag, "description", newTags[i].desc)
          if (!exists && newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
            await sql.updateUnverifiedTag(newTags[i].tag, "image", filename)
          }
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const exists = await sql.insertUnverifiedTag(artists[i].tag)
          await sql.updateUnverifiedTag(artists[i].tag, "type", "artist")
          if (!exists) await sql.updateUnverifiedTag(artists[i].tag, "description", "Artist.")
          if (!exists && artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
            await sql.updateUnverifiedTag(artists[i].tag, "image", filename)
          }
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          const exists = await sql.insertUnverifiedTag(characters[i].tag)
          await sql.updateUnverifiedTag(characters[i].tag, "type", "character")
          if (!exists) await sql.updateUnverifiedTag(characters[i].tag, "description", "Character.")
          if (!exists && characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
            await sql.updateUnverifiedTag(characters[i].tag, "image", filename)
          }
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          const exists = await sql.insertUnverifiedTag(series[i].tag)
          await sql.updateUnverifiedTag(series[i].tag, "type", "series")
          if (!exists) await sql.updateUnverifiedTag(series[i].tag, "description", "Series.")
          if (!exists && series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            await sql.updateUnverifiedTag(series[i].tag, "image", filename)
          }
          tagMap.push(series[i].tag)
        }

        tagMap = functions.removeDuplicates(tagMap)

        for (let i = 0; i < tagMap.length; i++) {
          await sql.insertUnverifiedTag(tagMap[i], "tag")
          await sql.insertUnverifiedTagMap(postID, tagMap[i])
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit/unverified", async (req: Request, res: Response, next: NextFunction) => {
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
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]
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
          await sql.updateUnverifiedPost(postID, "uploader", post.uploader)
          await sql.updateUnverifiedPost(postID, "uploadDate", post.uploadDate)
        }
        
        await sql.updateUnverifiedPost(postID, "originalID", originalPostID ? originalPostID : null)
        await sql.updateUnverifiedPost(postID, "reason", reason ? reason : null)
        await sql.updateUnverifiedPost(postID, "restrict", restrict)
        await sql.updateUnverifiedPost(postID, "style", style)
        await sql.updateUnverifiedPost(postID, "thirdParty", thirdPartyID ? true : false)
        await sql.updateUnverifiedPost(postID, "title", source.title ? source.title : null)
        await sql.updateUnverifiedPost(postID, "translatedTitle", source.translatedTitle ? source.translatedTitle : null)
        await sql.updateUnverifiedPost(postID, "artist", source.artist ? source.artist : null)
        await sql.updateUnverifiedPost(postID, "drawn", source.date ? source.date : null)
        await sql.updateUnverifiedPost(postID, "link", source.link ? source.link : null)
        await sql.updateUnverifiedPost(postID, "commentary", source.commentary ? source.commentary : null)
        await sql.updateUnverifiedPost(postID, "translatedCommentary", source.translatedCommentary ? source.translatedCommentary : null)
        const updateDate = new Date().toISOString()
        await sql.updateUnverifiedPost(postID, "updater", req.session.username)
        await sql.updateUnverifiedPost(postID, "updatedDate", updateDate)

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
          } else if (ext === "mp4") {
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
          const imageID = await sql.insertUnverifiedImage(postID)
          await sql.updateUnverifiedImage(imageID, "filename", filename)
          await sql.updateUnverifiedImage(imageID, "type", kind)
          await sql.updateUnverifiedImage(imageID, "order", order)
          await sql.updateUnverifiedImage(imageID, "hash", hash)
          await sql.updateUnverifiedImage(imageID, "width", dimensions.width)
          await sql.updateUnverifiedImage(imageID, "height", dimensions.height)
          await sql.updateUnverifiedImage(imageID, "size", images[i].size)
        }

        await sql.updateUnverifiedPost(postID, "type", type)

        let tagMap = tags

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          await sql.insertUnverifiedTag(newTags[i].tag)
          await sql.updateUnverifiedTag(newTags[i].tag, "type", "tag")
          if (newTags[i].desc) await sql.updateUnverifiedTag(newTags[i].tag, "description", newTags[i].desc)
          if (newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
            await sql.updateUnverifiedTag(newTags[i].tag, "image", filename)
          }
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const exists = await sql.insertUnverifiedTag(artists[i].tag)
          await sql.updateUnverifiedTag(artists[i].tag, "type", "artist")
          if (!exists) await sql.updateUnverifiedTag(artists[i].tag, "description", "Artist.")
          if (!exists && artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artist", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
            await sql.updateUnverifiedTag(artists[i].tag, "image", filename)
          }
          tagMap.push(artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          const exists = await sql.insertUnverifiedTag(characters[i].tag)
          await sql.updateUnverifiedTag(characters[i].tag, "type", "character")
          if (!exists) await sql.updateUnverifiedTag(characters[i].tag, "description", "Character.")
          if (!exists && characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("character", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
            await sql.updateUnverifiedTag(characters[i].tag, "image", filename)
          }
          tagMap.push(characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          const exists = await sql.insertUnverifiedTag(series[i].tag)
          await sql.updateUnverifiedTag(series[i].tag, "type", "series")
          if (!exists) await sql.updateUnverifiedTag(series[i].tag, "description", "Series.")
          if (!exists && series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
            await sql.updateUnverifiedTag(series[i].tag, "image", filename)
          }
          tagMap.push(series[i].tag)
        }

        tagMap = functions.removeDuplicates(tagMap)
        await sql.purgeUnverifiedTagMap(postID)
        for (let i = 0; i < tagMap.length; i++) {
          await sql.insertUnverifiedTag(tagMap[i], "tag")
          await sql.insertUnverifiedTagMap(postID, tagMap[i])
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/approve", async (req: Request, res: Response, next: NextFunction) => {
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

        await sql.updatePost(newPostID, "restrict", unverified.restrict)
        await sql.updatePost(newPostID, "style", unverified.style)
        await sql.updatePost(newPostID, "thirdParty", unverified.thirdParty)
        await sql.updatePost(newPostID, "title", unverified.title ? unverified.title : null)
        await sql.updatePost(newPostID, "translatedTitle", unverified.translatedTitle ? unverified.translatedTitle : null)
        await sql.updatePost(newPostID, "artist", unverified.artist ? unverified.artist : null)
        await sql.updatePost(newPostID, "drawn", unverified.date ? unverified.date : null)
        await sql.updatePost(newPostID, "link", unverified.link ? unverified.link : null)
        await sql.updatePost(newPostID, "commentary", unverified.commentary ? unverified.commentary : null)
        await sql.updatePost(newPostID, "translatedCommentary", unverified.translatedCommentary ? unverified.translatedCommentary : null)
        await sql.updatePost(newPostID, "uploadDate", unverified.uploadDate)
        await sql.updatePost(newPostID, "uploader", unverified.uploader)
        await sql.updatePost(newPostID, "updater", unverified.updater)
        await sql.updatePost(newPostID, "updatedDate", unverified.updatedDate)

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
          } else if (ext === "mp4") {
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
          const imageID = await sql.insertImage(newPostID)
          await sql.updateImage(imageID, "filename", filename)
          await sql.updateImage(imageID, "type", kind)
          await sql.updateImage(imageID, "order", order)
          await sql.updateImage(imageID, "hash", hash)
          await sql.updateImage(imageID, "width", dimensions.width)
          await sql.updateImage(imageID, "height", dimensions.height)
          await sql.updateImage(imageID, "size", buffer.byteLength)
        }
        await sql.updatePost(newPostID, "type", type)

        let tagMap = unverified.tags

        for (let i = 0; i < tags.length; i++) {
          if (!tags[i].tag) continue
          const exists = await sql.insertTag(tags[i].tag)
          await sql.updateTag(tags[i].tag, "type", "tag")
          if (!exists && tags[i].description) await sql.updateTag(tags[i].tag, "description", tags[i].description)
          if (!exists && tags[i].image) {
            const imagePath = functions.getTagPath("tag", tags[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer)
            await sql.updateTag(tags[i].tag, "image", tags[i].image)
          }
        }

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const exists = await sql.insertTag(artists[i].tag)
          await sql.updateTag(artists[i].tag, "type", "artist")
          if (!exists) await sql.updateTag(artists[i].tag, "description", "Artist.")
          if (!exists && artists[i].image) {
            const imagePath = functions.getTagPath("artist", tags[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer)
            await sql.updateTag(tags[i].tag, "image", tags[i].image)
          }
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          const exists = await sql.insertTag(characters[i].tag)
          await sql.updateTag(characters[i].tag, "type", "character")
          if (!exists) await sql.updateTag(characters[i].tag, "description", "Character.")
          if (!exists && characters[i].image) {
            const imagePath = functions.getTagPath("character", tags[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer)
            await sql.updateTag(tags[i].tag, "image", tags[i].image)
          }
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          const exists = await sql.insertTag(series[i].tag)
          await sql.updateTag(series[i].tag, "type", "series")
          if (!exists) await sql.updateTag(series[i].tag, "description", "Series.")
          if (!exists && series[i].image) {
            const imagePath = functions.getTagPath("series", tags[i].image)
            const buffer = await serverFunctions.getUnverifiedFile(imagePath)
            await serverFunctions.uploadFile(imagePath, buffer)
            await sql.updateTag(tags[i].tag, "image", tags[i].image)
          }
        }

        tagMap = functions.removeDuplicates(tagMap)
        if (unverified.originalID) await sql.purgeTagMap(unverified.originalID)
        for (let i = 0; i < tagMap.length; i++) {
          await sql.insertTagMap(newPostID, tagMap[i])
        }

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

    app.post("/api/post/reject", async (req: Request, res: Response, next: NextFunction) => {
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