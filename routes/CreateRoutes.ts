import {Express, NextFunction, Request, Response} from "express"
import sql from "../structures/SQLQuery"
import fs from "fs"
import path from "path"
import functions from "../structures/Functions"
import phash from "sharp-phash"
import fileType from "magic-bytes.js"

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
    const gif = result?.mime === "image/gif"
    const mp4 = result?.mime === "video/mp4"
    if (jpg || png || gif || mp4) {
      const MB = images[i].size / (1024*1024)
      const maxSize = jpg ? 5 :
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
    app.post("/api/upload", async (req: Request, res: Response, next: NextFunction) => {
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
        const tags = req.body.tags

        if (!validImages(images)) return res.status(400).send("Invalid images")
        const totalMB = images.reduce((acc: any, obj: any) => acc + obj.size, 0) / (1024*1024)
        if (totalMB > 200) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRestrict(restrict)) return res.status(400).send("Invalid restrict")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        if (!artists?.[0]?.tag) artists = [{tag: "unknown-artist"}]
        if (!characters?.[0]?.tag) characters = [{tag: "unknown-character"}]
        if (!series?.[0]?.tag) series = [{tag: "unknown-series"}]

        const postID = variationID ? Number(variationID) : await sql.insertPost()

        await sql.updatePost(postID, "restrict", restrict)
        await sql.updatePost(postID, "style", style)
        await sql.updatePost(postID, "cuteness", 500)
        await sql.updatePost(postID, "thirdParty", thirdPartyID ? true : false)
        await sql.updatePost(postID, "title", source.title ? source.title : null)
        await sql.updatePost(postID, "artist", source.artist ? source.artist : null)
        await sql.updatePost(postID, "drawn", source.date ? source.date : null)
        await sql.updatePost(postID, "link", source.link ? source.link : null)
        await sql.updatePost(postID, "commentary", source.commentary ? source.commentary : null)
        const uploadDate = new Date().toISOString()
        await sql.updatePost(postID, "uploaded", uploadDate)
        await sql.updatePost(postID, "updated", uploadDate)

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
          fs.writeFileSync(imagePath, buffer)
          let hash = ""
          if (kind === "video") {
            const buffer = functions.base64ToBuffer(images[i].thumbnail)
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
          } else {
            hash = await phash(buffer).then((hash: string) => functions.binaryToHex(hash))
          }
          const imageID = await sql.insertImage(postID)
          await sql.updateImage(imageID, "filename", filename)
          await sql.updateImage(imageID, "type", kind)
          await sql.updateImage(imageID, "order", order)
          await sql.updateImage(imageID, "hash", hash)
        }

        await sql.updatePost(postID, "type", type)

        for (let i = 0; i < artists.length; i++) {
          if (!artists[i].tag) continue
          const exists = await sql.insertTag(artists[i].tag)
          await sql.updateTag(artists[i].tag, "type", "artist")
          if (!exists && artists[i].image) {
            const filename = `${artists[i].tag}.${artists[i].ext}`
            const imagePath = functions.getTagPath("artists", filename)
            const dir = path.dirname(imagePath)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(imagePath, Buffer.from(Object.values(artists[i].bytes)))
            await sql.updateTag(artists[i].tag, "image", filename)
          }
          await sql.insertTagMap(postID, artists[i].tag)
        }

        for (let i = 0; i < characters.length; i++) {
          if (!characters[i].tag) continue
          const exists = await sql.insertTag(characters[i].tag)
          await sql.updateTag(characters[i].tag, "type", "character")
          if (!exists && characters[i].image) {
            const filename = `${characters[i].tag}.${characters[i].ext}`
            const imagePath = functions.getTagPath("characters", filename)
            const dir = path.dirname(imagePath)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(imagePath, Buffer.from(Object.values(characters[i].bytes)))
            await sql.updateTag(characters[i].tag, "image", filename)
          }
          await sql.insertTagMap(postID, characters[i].tag)
        }

        for (let i = 0; i < series.length; i++) {
          if (!series[i].tag) continue
          const exists = await sql.insertTag(series[i].tag)
          await sql.updateTag(series[i].tag, "type", "series")
          if (!exists && series[i].image) {
            const filename = `${series[i].tag}.${series[i].ext}`
            const imagePath = functions.getTagPath("series", filename)
            const dir = path.dirname(imagePath)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(imagePath, Buffer.from(Object.values(series[i].bytes)))
            await sql.updateTag(series[i].tag, "image", filename)
          }
          await sql.insertTagMap(postID, series[i].tag)
        }

        for (let i = 0; i < tags.length; i++) {
          await sql.insertTag(tags[i]) 
          await sql.updateTag(tags[i], "type", "attribute")
          await sql.insertTagMap(postID, tags[i])
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })
}

export default CreateRoutes