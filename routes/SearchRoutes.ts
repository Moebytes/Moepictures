import {Express, NextFunction, Request, Response} from "express"
import crypto from "crypto"
import functions from "../structures/Functions"
import sql from "../sql/SQLQuery"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import serverFunctions, {keyGenerator, handler} from "../structures/ServerFunctions"
import permissions from "../structures/Permissions"
import rateLimit from "express-rate-limit"

const searchLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 400,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const SearchRoutes = (app: Express) => {
    app.get("/api/search/posts", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let query = req.query.query as string
            const type = req.query.type as string
            const restrict = req.query.restrict as string
            const style = req.query.style as string
            const sort = req.query.sort as string
            const offset = req.query.offset as string
            const limit = req.query.limit as string
            let withTags = req.query.withTags === "true"
            if (!query) query = ""
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRestrict(restrict, true)) return res.status(400).send("Invalid restrict")
            if (restrict === "explicit") if (!req.session.showR18) return res.status(403).end()
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
            let result = [] as any
            if (tags?.length > 3 || sort === "bookmarks" || sort === "reverse bookmarks") {
                if (!permissions.isPremium(req.session)) return res.status(402).send("Premium only")
            }
            if (sort === "favorites" || sort === "reverse favorites") {
                if (!req.session.username) return res.status(403).send("Unauthorized")
            }
            if (sort === "hidden" || sort === "reverse hidden" || 
                sort === "locked" || sort === "reverse locked" ||
                sort === "private" || sort === "reverse private") {
                if (!permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            }
            if (sort === "tagcount" || sort === "reverse tagcount") withTags = true
            if (query.startsWith("pixiv:") || query.includes("pixiv.net")) {
                const pixivID = Number(query.match(/(\d+)/g)?.[0])
                result = await sql.search.searchPixivID(pixivID, withTags)
            } else if (query.startsWith("twitter:") || query.includes("twitter.com") || query.includes("x.com")) {
                const twitterID = query.match(/(\d{10,})/g)?.[0] || ""
                result = await sql.search.searchTwitterID(twitterID, withTags)
            } else if (query.startsWith("source:") || query.startsWith("http")) {
                const source = query.replace("source:", "").trim()
                result = await sql.search.searchSource(source, withTags)
            } else if (query.startsWith("hash:")) {
                const sqlQuery = {
                    text: `SELECT * FROM "images" WHERE "images".hash = $1`,
                    values: [query.replace("hash:", "").trim()]
                }
                let images = await sql.run(sqlQuery)
                if (images?.length) result = await sql.search.posts(images.map((i: any) => i.postID))
            } else if (query.startsWith("favorites:")) {
                const username = query.replace("favorites:", "").trim()
                const user = await sql.user.user(username as string)
                if (!user?.publicFavorites) return res.status(403).send("Unauthorized")
                result = await sql.favorite.favorites(username, limit, offset, type, restrict, style, sort, req.session.username)
            } else if (query.startsWith("uploads:")) {
                const username = query.replace("uploads:", "").trim()
                const user = await sql.user.user(username as string)
                if (!user) return res.status(400).send("Bad username")
                result = await sql.user.uploads(username, limit, offset, type, restrict, style, sort, req.session.username)
            } else if (query.startsWith("group:")) {
                const [g, name] = query.split(":")
                let group = await sql.group.group(functions.generateSlug(name))
                if (!group) return res.status(400).send("Bad group")
                result = await sql.group.searchGroup(group.groupID, limit, offset, type, restrict, style, sort, req.session.username)
            } else if (query.startsWith("favgroup:")) {
                const [f, username, name] = query.split(":")
                let favgroup = await sql.favorite.favgroup(username, name, type, restrict, style, sort, req.session.username)
                if (!favgroup) return res.status(400).send("Bad favgroup")
                if (favgroup.private) {
                    if (!permissions.isMod(req.session) && username !== req.session.username) return res.status(403).send("Unauthorized")
                }
                result = favgroup.posts.map((p: any) => ({postCount: favgroup.postCount, ...p}))
            } else if (query.startsWith("history:")) {
                const [h, username] = query.split(":")
                if (!permissions.isPremium(req.session)) return res.status(402).send("Premium only")
                if (username !== req.session.username && !permissions.isAdmin(req.session)) return res.status(403).send("Unauthorized")
                let history = await sql.history.userSearchHistory(username, limit, offset, type, restrict, style, sort, req.session.username)
                result = history.map((h: any) => ({postCount: h.historyCount, ...h.post}))
            } else {
                result = await sql.search.search(tags, type, restrict, style, sort, offset, limit, withTags, req.session.username)
            }
            result = result.map((p: any) => {
                if (p.images?.length > 1) {
                    p.images = p.images.sort((a: any, b: any) => a.order - b.order)
                }
                return p 
            })
            if (!permissions.isMod(req.session)) {
                result = result.filter((p: any) => !p.hidden)
                result = functions.stripTags(result)
            }
            if (!req.session.showR18) {
                result = result.filter((p: any) => p.restrict !== "explicit")
            }
            for (let i = result.length - 1; i >= 0; i--) {
                const post = result[i]
                if (post.private) {
                    const categories = await serverFunctions.tagCategories(post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) result.splice(i, 1)
                }
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/search/similar", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {bytes, useMD5} = req.body
            if (!bytes) return res.status(400).send("Image data must be provided as bytes")
            const buffer = Buffer.from(Object.values(bytes) as any) as any
            let hash = ""
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
                    if (dist(images[i].hash, hash) < 7) postIDs.add(images[i].postID)
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
            const limit = req.query.limit as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("artists", sort, search, limit, offset)
            for (let i = 0; i < result.length; i++) {
                const artist = result[i]
                artist.posts = functions.stripTags(artist.posts)
                if (!permissions.isMod(req.session)) {
                    artist.posts = artist.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    artist.posts = artist.posts.filter((p: any) => p?.restrict !== "explicit")
                }
                for (let i = artist.posts.length - 1; i >= 0; i--) {
                    const post = artist.posts[i]
                    if (post.private) {
                        const categories = await serverFunctions.tagCategories(post.tags)
                        if (!permissions.canPrivate(req.session, categories.artists)) artist.posts.splice(i, 1)
                    }
                }
            }
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
            const limit = req.query.limit as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("characters", sort, search, limit, offset)
            for (let i = 0; i < result.length; i++) {
                const character = result[i]
                character.posts = functions.stripTags(character.posts)
                if (!permissions.isMod(req.session)) {
                    character.posts = character.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    character.posts = character.posts.filter((p: any) => p?.restrict !== "explicit")
                }
                for (let i = character.posts.length - 1; i >= 0; i--) {
                    const post = character.posts[i]
                    if (post.private) {
                        const categories = await serverFunctions.tagCategories(post.tags)
                        if (!permissions.canPrivate(req.session, categories.artists)) character.posts.splice(i, 1)
                    }
                }
            }
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
            const limit = req.query.limit as string
            const offset = req.query.offset as string
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("series", sort, search, limit, offset)
            for (let i = 0; i < result.length; i++) {
                const series = result[i]
                series.posts = functions.stripTags(series.posts)
                if (!permissions.isMod(req.session)) {
                    series.posts = series.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    series.posts = series.posts.filter((p: any) => p?.restrict !== "explicit")
                }
                for (let i = series.posts.length - 1; i >= 0; i--) {
                    const post = series.posts[i]
                    if (post.private) {
                        const categories = await serverFunctions.tagCategories(post.tags)
                        if (!permissions.canPrivate(req.session, categories.artists)) series.posts.splice(i, 1)
                    }
                }
            }
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
            const limit = req.query.limit as string
            const offset = req.query.offset as string
            if (!functions.validTagSort(sort)) return res.status(400).send("Invalid sort")
            if (!functions.validTagType(type)) return res.status(400).send("Invalid type")
            let search = query?.trim().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = []
            if (search.startsWith("social:")) {
                const social = search.replace("social:", "").trim()
                result = await sql.search.tagSocialSearch(social)
            } else {
                result = await sql.search.tagSearch(search, sort, type, limit, offset)
            }
            if (!permissions.isMod(req.session)) {
                result = result.filter((tag: any) => !tag.hidden)
            }
            if (!req.session.showR18) {
                result = result.filter((tag: any) => !tag.r18)
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
                if (parts[i].includes("comments:")) {
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
            for (let i = result.length - 1; i >= 0; i--) {
                const comment = result[i]
                if (!permissions.isMod(req.session)) {
                    if (comment.post.hidden) result.splice(i, 1)
                }
                if (!req.session.showR18) {
                    if (comment.post.restrict === "explicit") result.splice(i, 1)
                }
                if (comment.post.private) {
                    const categories = await serverFunctions.tagCategories(comment.post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) result.splice(i, 1)
                }
            }
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/groups", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = req.query.query as string
            let sort = req.query.sort as string
            const limit = req.query.limit as string
            const offset = req.query.offset as string
            if (!functions.validGroupSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let  result = await sql.search.groupSearch(search, sort, limit, offset)
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
            let result = await sql.search.tagSearch(search, "posts", type, "10").then((r) => r.slice(0, 10))
            if (!result?.[0]) return res.status(200).json([])
            if (!permissions.isMod(req.session)) {
                result = result.filter((tag: any) => !tag.hidden)
            }
            if (!req.session.showR18) {
                result = result.filter((tag: any) => !tag.r18)
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
            const {postIDs, isBanner} = req.body
            let postArray = Array.from(postIDs)?.slice(0, 100) as any
            if (req.session.captchaNeeded) {
                if (postArray?.length === 1) return res.status(200).json([])
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
            //let artistTags = result.filter((t: any) => t.type === "artist")
            let characterTags = result.filter((t: any) => t.type === "character")
            let seriesTags = result.filter((t: any) => t.type === "series")
            //let metaTags = result.filter((t: any) => t.type === "meta")
            //let tags = result.filter((t: any) => t.type === "tag")
            let finalTags = [] as any[]
            if (isBanner) {
                finalTags = [...seriesTags, ...characterTags]
            } else {
                finalTags = result
            }
            res.status(200).json(slice ? finalTags.slice(0, 100) : finalTags)
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
            let stickyThreads = await sql.thread.stickyThreads(req.session.username)
            const rulesThread = stickyThreads.find((thread: any) => thread.title.toLowerCase().includes("rules"))
            stickyThreads = functions.removeItem(stickyThreads, rulesThread)
            const threadResult = await sql.thread.searchThreads(search, sort, offset, req.session.username)
            const result = [rulesThread, ...stickyThreads, ...threadResult]
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
            const hideSystem = req.query.hideSystem === "true"
            if (!functions.validThreadSort(sort)) return res.status(400).send("Invalid sort")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const search = query?.trim() ?? ""
            const messages = await sql.message.allMessages(req.session.username, search, sort, offset)
            let filtered = [] as any
            let messageCount = messages[0]?.messageCount || 0
            for (const message of messages) {
                if (hideSystem && message.creator === "moepictures") {
                    messageCount--
                    continue
                }
                if (message.creator === req.session.username) {
                    if (message.delete) {
                        messageCount--
                        continue
                    }
                } else if (message.recipient === req.session.username) {
                    if (message.delete) {
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
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.report.reports(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default SearchRoutes