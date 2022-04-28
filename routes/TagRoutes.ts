import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fs from "fs"
import path from "path"

const TagRoutes = (app: Express) => {
    app.get("/api/tag", async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return res.status(400).send("Bad request")
            let result = await sql.tag(tag)
            res.status(200).json(result)
        } catch {
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/counts", async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tagCounts(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/list", async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.tags(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.delete("/api/tag/delete", async (req: Request, res: Response) => {
        try {
            const tag = req.query.tag as string
            if (!tag) return res.status(400).send("Invalid tag")
            const tagExists = await sql.tag(tag.trim())
            if (!req.session.username || !tagExists) return res.status(400).send("Bad request")
            await sql.deleteTag(tag.trim())
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/tag/edit", async (req: Request, res: Response) => {
        try {
            const {tag, key, description, image, aliases} = req.body
            if (!req.session.username || !tag) return res.status(400).send("Bad request")
            const tagObj = await sql.tag(tag)
            if (!tagObj) return res.status(400).send("Bad request")
            if (description) {
                await sql.updateTag(tag, "description", description)
            }
            if (image?.[0]) {
                if (tagObj.image) {
                    const imagePath = functions.getTagPath(tagObj.type, tagObj.image)
                    await serverFunctions.deleteFile(imagePath)
                }
                const filename = `${tag}.${functions.fileExtension(image)}`
                const imagePath = functions.getTagPath(tagObj.type, filename)
                await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(image)))
                await sql.updateTag(tag, "image", filename)
                tagObj.image = filename
            }
            if (aliases?.[0]) {
                await sql.purgeAliases(tag)
                for (let i = 0; i < aliases.length; i++) {
                    await sql.insertAlias(tag, aliases[i])
                }
            }
            if (key.trim() !== tag) {
                if (tagObj.image) {
                    const newFilename = `${key.trim()}.${functions.fileExtension(image)}`
                    const oldImagePath = functions.getTagPath(tagObj.type, tagObj.image)
                    const newImagePath = functions.getTagPath(tagObj.type, newFilename)
                    await serverFunctions.renameFile(oldImagePath, newImagePath)
                    await sql.updateTag(tag, "image", newFilename)
                }
                await sql.updateTag(tag, "tag", key.trim())
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliastag", async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo} = req.body
            if (!req.session.username || !tag || !aliasTo) return res.status(400).send("Bad request")
            const exists = await sql.tag(aliasTo)
            if (!exists) return res.status(400).send("Bad request")
            await sql.renameTagMap(tag, aliasTo)
            await sql.deleteTag(tag)
            await sql.insertAlias(aliasTo, tag)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })
}

export default TagRoutes