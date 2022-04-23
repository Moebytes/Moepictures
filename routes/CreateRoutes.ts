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
    app.post("/api/upload", uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        const images = req.body.images 
        let type = req.body.type 
        const restrict = req.body.restrict 
        const style = req.body.style 
        const variationID = req.body.variationID 
        const thirdPartyID = req.body.thirdPartyID 
        const source = req.body.source 
        let artists = req.body.artists
        let characters = req.body.characters
        let series = req.body.series
        let tags = req.body.tags
        let newTags = req.body.newTags

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

        if (!req.session.username) return res.status(400).send("Not logged in")
        if (!validImages(images)) return res.status(400).send("Invalid images")
        const totalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        if (totalMB > 200) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const variation = variationID ? true : false
        const postID = variationID ? Number(variationID) : await sql.insertPost()
        

        if (variation) {
          const post = await sql.post(postID)
          type = post.type
          const uploadDate = new Date().toISOString()
          await sql.updatePost(postID, "updater", req.session.username)
          await sql.updatePost(postID, "updatedDate", uploadDate)
          tags = functions.removeDuplicates([...tags, ...post.tags])
        } else {
          await sql.updatePost(postID, "restrict", restrict)
          await sql.updatePost(postID, "style", style)
          await sql.updatePost(postID, "cuteness", 500)
          await sql.updatePost(postID, "favorites", 0)
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
          } else if (ext === "mp4") {
            kind = "video"
            type = "video"
          }

          let imagePath = functions.getImagePath(kind, postID, filename)
          if (fs.existsSync(imagePath)) imagePath = altPath(imagePath)
          const dir = path.dirname(imagePath)
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
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

        if (!variation) {
          for (let i = 0; i < artists.length; i++) {
            if (!artists[i].tag) continue
            const exists = await sql.insertTag(artists[i].tag)
            await sql.updateTag(artists[i].tag, "type", "artist")
            await sql.updateTag(artists[i].tag, "description", "Artist.")
            if (!exists && artists[i].image) {
              const filename = `${artists[i].tag}.${artists[i].ext}`
              const imagePath = functions.getTagPath("artist", filename)
              const dir = path.dirname(imagePath)
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
              await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(artists[i].bytes)))
              await sql.updateTag(artists[i].tag, "image", filename)
            }
            tagMap.push(artists[i].tag)
          }

          for (let i = 0; i < characters.length; i++) {
            if (!characters[i].tag) continue
            const exists = await sql.insertTag(characters[i].tag)
            await sql.updateTag(characters[i].tag, "type", "character")
            await sql.updateTag(characters[i].tag, "description", "Character.")
            if (!exists && characters[i].image) {
              const filename = `${characters[i].tag}.${characters[i].ext}`
              const imagePath = functions.getTagPath("character", filename)
              const dir = path.dirname(imagePath)
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
              await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(characters[i].bytes)))
              await sql.updateTag(characters[i].tag, "image", filename)
            }
            tagMap.push(characters[i].tag)
          }

          for (let i = 0; i < series.length; i++) {
            if (!series[i].tag) continue
            const exists = await sql.insertTag(series[i].tag)
            await sql.updateTag(series[i].tag, "type", "series")
            await sql.updateTag(series[i].tag, "description", "Series.")
            if (!exists && series[i].image) {
              const filename = `${series[i].tag}.${series[i].ext}`
              const imagePath = functions.getTagPath("series", filename)
              const dir = path.dirname(imagePath)
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
              await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(series[i].bytes)))
              await sql.updateTag(series[i].tag, "image", filename)
            }
            tagMap.push(series[i].tag)
          }
        }

        for (let i = 0; i < newTags.length; i++) {
          if (!newTags[i].tag) continue
          const exists = await sql.insertTag(newTags[i].tag)
          await sql.updateTag(newTags[i].tag, "type", "attribute")
          await sql.updateTag(newTags[i].tag, "description", newTags[i].desc)
          if (!exists && newTags[i].image) {
            const filename = `${newTags[i].tag}.${newTags[i].ext}`
            const imagePath = functions.getTagPath("tag", filename)
            const dir = path.dirname(imagePath)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(newTags[i].bytes)))
            await sql.updateTag(newTags[i].tag, "image", filename)
          }
        }

        tagMap = functions.removeDuplicates(tagMap)

        for (let i = 0; i < tagMap.length; i++) {
          await sql.insertTagMap(postID, tagMap[i])
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })
}

export default CreateRoutes