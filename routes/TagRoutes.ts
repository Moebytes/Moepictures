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
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
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
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const tagObj = await sql.tag(tag)
            if (!tagObj) return res.status(400).send("Bad request")
            if (description) {
                await sql.updateTag(tag, "description", description)
            }
            if (image?.[0]) {
                console.log(image?.[0])
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
                    const newFilename = image ? `${key.trim()}.${functions.fileExtension(image)}` : `${key.trim()}.${path.extname(tagObj.image).replace(".", "")}`
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

    app.post("/api/tag/aliasto", async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo} = req.body
            if (!req.session.username || !tag || !aliasTo) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
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

    app.get("/api/tag/list/unverified", async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            let tags = req.query.tags as string[]
            if (!tags) tags = []
            let result = await sql.unverifiedTags(tags.filter(Boolean))
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/tag/delete/request", async (req: Request, res: Response) => {
        try {
            const {tag, reason} = req.body
            if (!tag) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const exists = await sql.tag(tag)
            if (!exists) return res.status(400).send("Bad request")
            await sql.insertTagDeleteRequest(req.session.username, tag, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/delete/request/list", async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.tagDeleteRequests()
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/delete/request/fulfill", async (req: Request, res: Response) => {
        try {
            const {username, tag} = req.body
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username || !username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.deleteTagDeleteRequest(username, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request", async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo, reason} = req.body
            if (!tag || !aliasTo) return res.status(400).send("Bad request")
            if (!req.session.username) return res.status(400).send("Bad request")
            const exists = await sql.tag(tag)
            if (!exists) return res.status(400).send("Bad request")
            const exists2 = await sql.tag(aliasTo)
            if (!exists2) return res.status(400).send("Bad request")
            await sql.insertAliasRequest(req.session.username, tag, aliasTo, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/aliasto/request/list", async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.aliasRequests()
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request/fulfill", async (req: Request, res: Response) => {
        try {
            const {username, tag} = req.body
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username || !username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.deleteAliasRequest(username, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/edit/request", async (req: Request, res: Response) => {
        try {
            const {tag, key, description, image, aliases, reason} = req.body
            if (!req.session.username || !tag) return res.status(400).send("Bad request")
            const tagObj = await sql.tag(tag)
            if (!tagObj) return res.status(400).send("Bad request")
            let imagePath = null as any
            if (image?.[0]) {
                const filename = `${tag}.${functions.fileExtension(image)}`
                imagePath = functions.getTagPath(tagObj.type, filename)
                await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(image)))
            }
            await sql.insertTagEditRequest(req.session.username, tag, key, description, imagePath, aliases?.[0] ? aliases : null, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/edit/request/list", async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.tagEditRequests()
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/edit/request/fulfill", async (req: Request, res: Response) => {
        try {
            const {username, tag, image} = req.body
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username || !username) return res.status(400).send("Bad request")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            if (image) await serverFunctions.deleteUnverifiedFile(image)
            await sql.deleteTagEditRequest(username, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default TagRoutes