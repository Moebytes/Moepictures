import {Express, NextFunction, Request, Response} from "express"
import crypto from "crypto"
import functions from "../structures/Functions"
import sql from "../sql/SQLQuery"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import matureTags from "../assets/json/mature-tags.json"
import rateLimit from "express-rate-limit"

const searchLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 1000,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const SearchRoutes = (app: Express) => {
    app.get("/api/search/posts", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            const type = req.query.type as string
            const restrict = req.query.restrict as string
            const style = req.query.style as string
            const sort = req.query.sort as string
            const offset = req.query.offset as string
            const limit = req.query.limit as string
            let withTags = req.query.withTags === "true"
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict, true)) return res.status(400).send("Invalid restrict")
            if (restrict === "explicit") if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            if (!functions.validStyle(style, true)) return res.status(400).send("Invalid style")
            if (!functions.validSort(sort)) return res.status(400).send("Invalid sort")
            const tags = query?.trim().split(/ +/g).filter(Boolean)
            for (let i = 0; i < tags?.length; i++) {
                const tag = await sql.tag.tag(tags[i])
                if (!tag) {
                    const alias = await sql.tag.alias(tags[i])
                    if (alias) tags[i] = alias.tag
                }
            }
            let result = null as any
            if (sort === "tagcount" || sort === "reverse tagcount") withTags = true
            if (query.startsWith("pixiv:")) {
                const pixivID = Number(query.match(/(?<=pixiv:)(\d+)/g)?.[0])
                result = await sql.search.searchPixivID(pixivID, withTags)
            } else {
                if (sort === "favorites" || sort === "reverse favorites") {
                    if (!req.session.username) return res.status(401).send("Unauthorized")
                    const favorites = await sql.favorite.searchFavorites(req.session.username, tags, type, restrict, style, sort, offset, limit, withTags)
                    result = favorites.map((f: any) => f.post)
                    result[0].postCount = favorites[0].postCount
                } else {
                    result = await sql.search.search(tags, type, restrict, style, sort, offset, limit, withTags)
                }
            }
            result = result.map((p: any) => {
                if (p.images?.length > 1) {
                    p.images = p.images.sort((a: any, b: any) => a.order - b.order)
                }
                return p 
            })
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                result = result.filter((p: any) => !p.hidden)
                result = result.filter((p: any) => p.restrict !== "explicit")
                result = functions.stripTags(result)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/random", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            const type = req.query.type as string
            const restrict = req.query.restrict as string
            const style = req.query.style as string
            const limit = req.query.limit as string
            const offset = req.query.offset as string
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict, true)) return res.status(400).send("Invalid restrict")
            if (restrict === "explicit") if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            if (!functions.validStyle(style, true)) return res.status(400).send("Invalid style")
            const tags = query?.trim().split(/ +/g).filter(Boolean)
            for (let i = 0; i < tags?.length; i++) {
                const tag = await sql.tag.tag(tags[i])
                if (!tag) {
                    const alias = await sql.tag.alias(tags[i])
                    if (alias) tags[i] = alias.tag
                }
            }
            let result = await sql.search.random(tags, type, restrict, style, limit, offset)
            result = result.map((p: any) => {
                if (p.images?.length > 1) {
                    p.images = p.images.sort((a: any, b: any) => a.order - b.order)
                }
                return p 
            })
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                result = result.filter((p: any) => !p.hidden)
                result = result.filter((p: any) => p.restrict !== "explicit")
                result = functions.stripTags(result)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/search/similar", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {type, bytes} = req.body
            if (!bytes) return res.status(400).send("Image data must be provided as bytes")
            const buffer = Buffer.from(Object.values(bytes) as any)
            let hash = ""
            const useMD5 = type === "mp3" || type === "wav" || type === "glb" || type === "fbx" || type === "obj"
            if (useMD5) {
                hash = crypto.createHash("md5").update(buffer).digest("hex")
            } else {
                hash = await phash(buffer).then((hash: any) => functions.binaryToHex(hash))
            }
            const query = {
                text: `SELECT * FROM "images" WHERE "images".hash = $1`,
                values: [hash]
              }
            let images = await sql.run(query)
            if (!images.length) images = await sql.run(`SELECT * FROM "images"`)
            let postIDs = new Set<number>()
            for (let i = 0; i < images.length; i++) {
                if (useMD5) {
                    const imgHash = images[i].hash
                    if (imgHash === hash) postIDs.add(images[i].postID)
                } else {
                    if (dist(images[i].hash, hash) < 5) postIDs.add(images[i].postID)
                }
            }
            let result = await sql.search.posts(Array.from(postIDs))
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/artists", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("artists", sort, search, offset)
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/characters", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("characters", sort, search, offset)
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/series", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("series", sort, search, offset)
            result = functions.stripTags(result)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/tags", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            let type = req.query.type as string
            const offset = req.query.offset as string
            if (!functions.validTagSort(sort)) return res.status(400).send("Invalid sort")
            if (!functions.validTagType(type)) return res.status(400).send("Invalid type")
            let search = query?.trim().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = await sql.search.tagSearch(search, sort, type, offset)
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                result = result.filter((t: any) => !functions.arrayIncludes(t.tag, matureTags, true))
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/comments", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validCommentSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let parts = search.split(/ +/g)
            let usernames = [] as any 
            let parsedSearch = ""
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes("user:")) {
                    const username = parts[i].split(":")[1]
                    usernames.push(username)
                } else {
                    parsedSearch += `${parts[i]} `
                }
            }
            let result = [] as any
            if (usernames.length) {
                result = await sql.comment.searchCommentsByUsername(usernames, parsedSearch.trim(), sort, offset)
            } else {
                result = await sql.comment.searchComments(parsedSearch.trim(), sort, offset)
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/suggestions", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let type = req.query.type as string
            if (!type) type = "all"
            if (!functions.validTagType(type)) return res.status(400).send("Invalid type")
            let search = query?.trim().toLowerCase().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = await sql.search.tagSearch(search, "posts", type).then((r) => r.slice(0, 10))
            if (!result?.[0]) return res.status(200).json([])
            if (req.session.role !== "admin" && req.session.role !== "mod") {
                result = result.filter((t: any) => !functions.arrayIncludes(t.tag, matureTags, true))
            }
            const tags = await sql.tag.tagCounts(result.map((r: any) => r.tag))
            res.status(200).json(tags.slice(0, 10))
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/search/sidebartags", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {postIDs} = req.body
            let postArray = Array.from(postIDs) as any
            if (req.session.captchaAmount === undefined) req.session.captchaAmount = 0
            req.session.captchaAmount = req.session.captchaAmount + 1
            if (req.session.role === "admin" || req.session.role === "mod") req.session.captchaAmount = 0
            if (req.session.captchaAmount! > 1000) {
                if (postArray.length === 1) return res.status(200).json([])
                postArray = []
            }
            let slice = false
            if (!postArray?.length) slice = true
            let posts = await sql.search.posts(postArray)
            let uniqueTags = new Set()
            for (let i = 0; i < posts.length; i++) {
                for (let j = 0; j < posts[i].tags.length; j++) {
                    uniqueTags.add(posts[i].tags[j])
                }
            }
            const uniqueTagArray = Array.from(uniqueTags) as any
            let result = await sql.tag.tagCounts(uniqueTagArray.filter(Boolean))
            for (let i = 0; i < uniqueTagArray.length; i++) {
                const found = result.find((r: any) => r.tag === uniqueTagArray[i])
                if (!found) result.push({tag: uniqueTagArray[i], count: "0", type: "tag", image: ""})
            }
            res.status(200).json(slice ? result.slice(0, 100) : result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/threads", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validThreadSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            const stickyThreads = await sql.thread.stickyThreads()
            const threadResult = await sql.thread.searchThreads(search, sort, offset)
            const result = [...stickyThreads, ...threadResult]
            const newThreadCount = (stickyThreads[0]?.threadCount || 0) + (threadResult[0]?.threadCount || 0)
            for (let i = 0; i < result.length; i++) {
                result[i].threadCount = newThreadCount
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/messages", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const offset = req.query.offset as string
            if (!functions.validThreadSort(sort)) return res.status(400).send("Invalid sort")
            if (!req.session.username) return res.status(401).send("Unauthorized")
            const search = query?.trim() ?? ""
            const messages = await sql.message.allMessages(req.session.username, search, sort, offset)
            let filtered = [] as any
            let messageCount = messages[0]?.messageCount || 0
            for (const message of messages) {
                if (message.creator === req.session.username) {
                    if (message.creatorDelete) {
                        messageCount--
                        continue
                    }
                } else if (message.recipient === req.session.username) {
                    if (message.recipientDelete) {
                        messageCount--
                        continue
                    }
                }
                filtered.push(message)
            }
            for (const message of filtered) {
                message.messageCount = messageCount
            }
            res.status(200).json(filtered)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/reports", searchLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(401).send("Unauthorized")
            if (req.session.role !== "admin" && req.session.role !== "mod") return res.status(403).end()
            const result = await sql.report.reports(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default SearchRoutes