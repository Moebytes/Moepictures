import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fs from "fs"
import path from "path"

const tagLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const tagUpdateLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 100,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const TagRoutes = (app: Express) => {
    app.get("/api/tag", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return res.status(400).send("Bad tag")
            let result = await sql.tag(tag)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/related", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return res.status(400).send("Bad tag")
            let result = await sql.relatedTags(tag)
            res.status(200).json(result?.related || [])
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/unverified", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let tag = req.query.tag as string
            if (!tag) return res.status(400).send("Bad tag")
            let result = await sql.unverifiedTags([tag])
            res.status(200).json(result?.[0])
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/tag/counts", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

    app.get("/api/tag/list", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

    app.delete("/api/tag/delete", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const tag = req.query.tag as string
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!tag) return res.status(400).send("Invalid tag")
            const tagExists = await sql.tag(tag.trim())
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!tagExists) return res.status(400).send("Bad tag")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await serverFunctions.deleteFolder(`history/tag/${tag.trim()}`).catch(() => null)
            await serverFunctions.deleteFile(functions.getTagPath(tagExists.type, tagExists.image)).catch(() => null)
            await sql.deleteTag(tag.trim())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/tag/edit", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, key, description, image, aliases, implications, pixivTags, pixiv, twitter, website, fandom, reason} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!tag) return res.status(400).send("Bad tag")
            const tagObj = await sql.tag(tag)
            if (!tagObj) return res.status(400).send("Bad tag")
            let imageFilename = tagObj.image
            let tagDescription = tagObj.description
            if (description !== undefined) {
                await sql.updateTag(tag, "description", description)
                tagDescription = description
            }
            let vanillaImageBuffer = null as any
            let imgChange = false
            if (image?.[0]) {
                if (tagObj.image) {
                    const imagePath = functions.getTagPath(tagObj.type, tagObj.image)
                    vanillaImageBuffer = await serverFunctions.getFile(imagePath)
                    await serverFunctions.deleteFile(imagePath)
                    tagObj.image = null
                }
                if (image[0] !== "delete") {
                    const filename = `${tag}.${functions.fileExtension(image)}`
                    const imagePath = functions.getTagPath(tagObj.type, filename)
                    const newBuffer = Buffer.from(Object.values(image) as any)
                    imgChange = serverFunctions.buffersChanged(vanillaImageBuffer, newBuffer)
                    await serverFunctions.uploadFile(imagePath, newBuffer)
                    await sql.updateTag(tag, "image", filename)
                    tagObj.image = filename
                    imageFilename = filename
                } else {
                    await sql.updateTag(tag, "image", null as any)
                    imageFilename = null
                }
            }
            if (aliases) {
                await sql.purgeAliases(tag)
                for (let i = 0; i < aliases.length; i++) {
                    if (!aliases[i]) break
                    await sql.insertAlias(tag, aliases[i])
                }
            } 
            if (implications) {
                await sql.purgeImplications(tag)
                for (let i = 0; i < implications.length; i++) {
                    if (!implications[i]) break
                    await sql.insertImplication(tag, implications[i])
                }
            }
            if (pixivTags) {
                await sql.updateTag(tag, "pixivTags", pixivTags)
            }
            if (key.trim() !== tag) {
                if (tagObj.image) {
                    const newFilename = image ? `${key.trim()}.${functions.fileExtension(image)}` : `${key.trim()}.${path.extname(tagObj.image).replace(".", "")}`
                    const oldImagePath = functions.getTagPath(tagObj.type, tagObj.image)
                    const newImagePath = functions.getTagPath(tagObj.type, newFilename)
                    await serverFunctions.renameFile(oldImagePath, newImagePath)
                    await sql.updateTag(tag, "image", newFilename)
                    imageFilename = newFilename
                }
                await sql.updateTag(tag, "tag", key.trim())
            }
            if (tagObj.type === "artist") {
                if (website !== undefined) {
                    await sql.updateTag(tag, "website", website)
                }
                if (pixiv !== undefined) {
                    await sql.updateTag(tag, "pixiv", pixiv)
                }
                if (twitter !== undefined) {
                    await sql.updateTag(tag, "twitter", twitter)
                }
            }
            if (tagObj.type === "character") {
                if (fandom !== undefined) {
                    await sql.updateTag(tag, "fandom", fandom)
                }
            }
            if (tagObj.type === "series") {
                if (website !== undefined) {
                    await sql.updateTag(tag, "website", website)
                }
                if (twitter !== undefined) {
                    await sql.updateTag(tag, "twitter", twitter)
                }
            }
            const tagHistory = await sql.tagHistory(tag)
            const nextKey = await serverFunctions.getNextKey("tag", key)
            if (!tagHistory.length || (imgChange && nextKey === 1)) {
                let targetTag = tag
                let vanilla = await sql.tag(targetTag)
                if (!vanilla) {
                    targetTag = key.trim()
                    vanilla = await sql.tag(targetTag)
                }
                let posts = await sql.search([targetTag], "all", "all", "all", "reverse date", undefined, "1")
                vanilla.date = posts[0].uploadDate 
                vanilla.user = posts[0].uploader
                vanilla.key = targetTag
                vanilla.aliases = vanilla.aliases.map((alias: any) => alias?.alias)
                vanilla.implications = vanilla.implications.map((implication: any) => implication?.implication)
                if (vanilla.image && vanillaImageBuffer) {
                    if (imgChange) {
                        const newImagePath = functions.getTagHistoryPath(targetTag, 1, vanilla.image)
                        await serverFunctions.uploadFile(newImagePath, vanillaImageBuffer)
                        vanilla.image = newImagePath
                    }
                } else {
                    vanilla.image = null
                }
                await sql.insertTagHistory(vanilla.user, vanilla.tag, vanilla.key, vanilla.type, vanilla.image, vanilla.description, vanilla.aliases, vanilla.implications, vanilla.pixivTags, vanilla.website, vanilla.pixiv, vanilla.twitter, vanilla.fandom)
                if (image?.[0] && imageFilename) {
                    if (imgChange) {
                        const imagePath = functions.getTagHistoryPath(key, 2, imageFilename)
                        await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(image) as any))
                        imageFilename = imagePath
                    }
                }
                await sql.insertTagHistory(req.session.username, tag, key, tagObj.type, imageFilename, tagDescription, aliases, implications, pixivTags, website, pixiv, twitter, fandom, reason)
            } else {
                if (image?.[0] && imageFilename) {
                    if (imgChange) {
                        const imagePath = functions.getTagHistoryPath(key, nextKey, imageFilename)
                        await serverFunctions.uploadFile(imagePath, Buffer.from(Object.values(image) as any))
                        imageFilename = imagePath
                    }
                }
                await sql.insertTagHistory(req.session.username, tag, key, tagObj.type, imageFilename, tagDescription, aliases, implications, pixivTags, website, pixiv, twitter, fandom, reason)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!tag || !aliasTo) return res.status(400).send("Bad tag or aliasTo")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const exists = await sql.tag(aliasTo)
            if (!exists) return res.status(400).send("Bad tag")
            await sql.renameTagMap(tag, aliasTo)
            await sql.deleteTag(tag)
            await sql.insertAlias(aliasTo, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/list/unverified", tagLimiter, async (req: Request, res: Response, next: NextFunction) => {
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

    app.post("/api/tag/delete/request", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, reason} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!tag) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const exists = await sql.tag(tag)
            if (!exists) return res.status(400).send("Bad tag")
            await sql.insertTagDeleteRequest(req.session.username, tag, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/delete/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.tagDeleteRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/delete/request/fulfill", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.deleteTagDeleteRequest(username, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, aliasTo, reason} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!tag || !aliasTo) return res.status(400).send("Bad tag or aliasTo")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const exists = await sql.tag(tag)
            if (!exists) return res.status(400).send("Bad tag")
            const exists2 = await sql.tag(aliasTo)
            if (!exists2) return res.status(400).send("Bad aliasTo")
            await sql.insertAliasRequest(req.session.username, tag, aliasTo, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/aliasto/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.aliasRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/aliasto/request/fulfill", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            await sql.deleteAliasRequest(username, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/edit/request", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, key, description, image, aliases, implications, pixivTags, pixiv, twitter, website, fandom, reason} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!tag) return res.status(400).send("Bad tag")
            const tagObj = await sql.tag(tag)
            if (!tagObj) return res.status(400).send("Bad tag")
            let imagePath = null as any
            if (image?.[0]) {
                if (image[0] !== "delete") {
                    const filename = `${tag}.${functions.fileExtension(image)}`
                    imagePath = functions.getTagPath(tagObj.type, filename)
                    await serverFunctions.uploadUnverifiedFile(imagePath, Buffer.from(Object.values(image) as any))
                } else {
                    imagePath = "delete"
                }
            }
            await sql.insertTagEditRequest(req.session.username, tag, key, description, imagePath, aliases?.[0] ? aliases : null, implications?.[0] ? implications : null, pixivTags?.[0] ? pixivTags : null, pixiv, twitter, website, fandom, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/edit/request/list", tagLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.tagEditRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tag/edit/request/fulfill", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {username, tag, image} = req.body
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (!tag) return res.status(400).send("Invalid tag")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            if (image) await serverFunctions.deleteUnverifiedFile(image)
            await sql.deleteTagEditRequest(username, tag)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tag/history", tagLimiter, async (req: Request, res: Response) => {
        try {
            const tag = req.query.tag as string
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const result = await sql.tagHistory(tag, offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/tag/history/delete", tagUpdateLimiter, async (req: Request, res: Response) => {
        try {
            const {tag, historyID} = req.query
            if (!serverFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const tagHistory = await sql.tagHistory(tag as string)
            if (tagHistory[0]?.historyID === Number(historyID)) {
                return res.status(400).send("Bad request")
            } else {
                const currentHistory = tagHistory.find((history) => history.historyID === Number(historyID))
                if (currentHistory.image?.includes("history/")) {
                    await serverFunctions.deleteFile(currentHistory.image)
                }
                await sql.deleteTagHistory(Number(historyID))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default TagRoutes