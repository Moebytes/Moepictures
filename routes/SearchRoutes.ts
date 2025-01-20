import {Express, NextFunction, Request, Response} from "express"
import crypto from "crypto"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import sql from "../sql/SQLQuery"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import serverFunctions, {keyGenerator, handler} from "../structures/ServerFunctions"
import permissions from "../structures/Permissions"
import rateLimit from "express-rate-limit"
import {PostSearch, TagSearch, TagCount, PostSearchParams, CategorySearchParams, CommentSearch, TagSearchParams, 
GroupSearchParams, Image, SimilarSearchParams, CommentSearchParams, NoteSearch, SearchSuggestionsParams, 
SidebarTagParams, ThreadSearch, MessageSearchParams, MessageSearch} from "../types/Types"

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
            let {query, type, rating, style, sort, offset, limit, favoriteMode} = req.query as PostSearchParams
            if (!type) type = "all"
            if (!rating) rating = "all"
            if (!style) style = "all"
            if (!sort) sort = "random"
            let showChildren = req.query.showChildren === "true"
            let withTags = req.query.withTags === "true"
            if (!query) query = ""
            if (!functions.validType(type, true)) return res.status(400).send("Invalid type")
            if (!functions.validRating(rating, true)) return res.status(400).send("Invalid rating")
            if (functions.isR18(rating)) if (!req.session.showR18) return res.status(403).end()
            if (!functions.validStyle(style, true)) return res.status(400).send("Invalid style")
            if (!functions.validSort(sort)) return res.status(400).send("Invalid sort")
            const tags = query?.trim().split(/ +/g).filter(Boolean)
            for (let i = 0; i < tags?.length; i++) {
                const tag = await sql.tag.tag(tags[i])
                if (!tag) {
                    const alias = await sql.tag.alias(tags[i])
                    if (alias) tags[i] = alias.tag
                    if (!alias && functions.isJapaneseText(tags[i])) {
                        const pixivTag = await sql.tag.tagFromPixivTag(tags[i])
                        if (pixivTag) tags[i] = pixivTag.tag
                    }
                }
            }
            let result = [] as PostSearch[]
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
            if (req.session.blacklist) {
                const negated = functions.negateBlacklist(req.session.blacklist)
                tags.unshift(...negated)
            }
            if (favoriteMode && req.session.username) {
                const favoriteTags = await sql.favorite.tagFavorites(req.session.username)
                const appended = functions.appendFavoriteTags(favoriteTags.map((t) => t.tag))
                tags.unshift(...appended)
            }
            if (query.startsWith("id:")) {
                const id = query.match(/(\d+)/g)?.[0] || ""
                const post = await sql.post.post(id)
                if (post) result = [{...post, postCount: "1"}] as PostSearch[]
            } else if (query.startsWith("pixiv:") || query.includes("pixiv.net")) {
                const pixivID = query.match(/(\d+)/g)?.[0] || ""
                result = await sql.search.searchPixivID(pixivID, type, rating, style, sort, offset, limit, withTags, showChildren, req.session.username)
            } else if (query.startsWith("twitter:") || query.includes("twitter.com") || query.includes("x.com")) {
                const twitterID = query.match(/(\d{10,})/g)?.[0] || ""
                result = await sql.search.searchTwitterID(twitterID, type, rating, style, sort, offset, limit, withTags, showChildren, req.session.username)
            } else if (query.startsWith("source:") || query.startsWith("http")) {
                const source = query.replace("source:", "").trim()
                result = await sql.search.searchSource(source, type, rating, style, sort, offset, limit, withTags, showChildren, req.session.username)
            } else if (query.startsWith("format:")) {
                const format = query.replace("format:", "").trim()
                result = await sql.search.searchFormat(format, type, rating, style, sort, offset, limit, withTags, showChildren, req.session.username)
            } else if (query.startsWith("hash:")) {
                const sqlQuery = {
                    text: `SELECT * FROM "images" WHERE "images".hash = $1`,
                    values: [query.replace("hash:", "").trim()]
                }
                let images = await sql.run(sqlQuery) as Image[]
                if (images?.length) result = await sql.search.posts(images.map((i) => i.postID)) as PostSearch[]
            } else if (query.startsWith("favorites:")) {
                const username = query.replace("favorites:", "").trim()
                const user = await sql.user.user(username as string)
                if (!user?.publicFavorites) return res.status(403).send("Unauthorized")
                result = await sql.favorite.favorites(username, limit, offset, type, rating, style, sort, showChildren, req.session.username)
            } else if (query.startsWith("uploads:")) {
                const username = query.replace("uploads:", "").trim()
                const user = await sql.user.user(username as string)
                if (!user) return res.status(400).send("Bad username")
                result = await sql.user.uploads(username, limit, offset, type, rating, style, sort, showChildren, req.session.username)
            } else if (query.startsWith("group:")) {
                const [g, name] = query.split(":")
                let group = await sql.group.group(functions.generateSlug(name))
                if (!group) return res.status(400).send("Bad group")
                result = await sql.group.searchGroup(group.groupID, limit, offset, type, rating, style, sort, showChildren, req.session.username)
            } else if (query.startsWith("favgroup:")) {
                const [f, username, name] = query.split(":")
                let favgroup = await sql.favorite.favgroup(username, name, type, rating, style, sort, showChildren, req.session.username)
                if (!favgroup) return res.status(400).send("Bad favgroup")
                if (favgroup.private) {
                    if (!permissions.isMod(req.session) && username !== req.session.username) return res.status(403).send("Unauthorized")
                }
                result = favgroup.posts.map((p) => ({...p, postCount: favgroup.postCount}))
            } else if (query.startsWith("history:")) {
                const [h, username] = query.split(":")
                if (!permissions.isPremium(req.session)) return res.status(402).send("Premium only")
                if (username !== req.session.username && !permissions.isAdmin(req.session)) return res.status(403).send("Unauthorized")
                let history = await sql.history.userSearchHistory(username, limit, offset, "", type, rating, style, sort, showChildren, req.session.username)
                result = history.map((h) => ({...h.post, postCount: h.historyCount}))
            } else {
                result = await sql.search.search(tags, type, rating, style, sort, offset, limit, withTags, showChildren, req.session.username)
            }
            result = result.map((p) => {
                if (p.images?.length > 1) {
                    p.images = p.images.sort((a, b) => a.order - b.order)
                }
                return p 
            })
            result = result.filter((p) => !p.deleted)
            if (!permissions.isMod(req.session)) {
                result = result.filter((p) => !p.hidden)
                result = functions.stripTags(result)
            }
            if (!req.session.showR18) {
                result = result.filter((p) => !functions.isR18(p.rating))
            }
            for (let i = result.length - 1; i >= 0; i--) {
                const post = result[i]
                if (post.private) {
                    const categories = await serverFunctions.tagCategories(post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) result.splice(i, 1)
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.post("/api/search/similar", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {bytes, useMD5} = req.body as SimilarSearchParams
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
            let images = await sql.run(query) as Image[]
            if (!images.length) images = await sql.run(`SELECT * FROM "images"`)
            let postIDs = new Set<string>()
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
            let {query, sort, limit, offset} = req.query as CategorySearchParams
            if (!sort) sort = "random"
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("artists", sort, search, limit, offset)
            for (let i = 0; i < result.length; i++) {
                const artist = result[i]
                artist.posts = functions.stripTags(artist.posts)
                artist.posts = artist.posts.filter((p) => !p.deleted)
                if (!permissions.isMod(req.session)) {
                    artist.posts = artist.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    artist.posts = artist.posts.filter((p: any) => !functions.isR18(p?.rating))
                }
                for (let i = artist.posts.length - 1; i >= 0; i--) {
                    const post = artist.posts[i]
                    if (post.private) {
                        const tags = await sql.post.postTags(post.postID)
                        const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                        if (!permissions.canPrivate(req.session, categories.artists)) artist.posts.splice(i, 1)
                    }
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/characters", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, limit, offset} = req.query as CategorySearchParams
            if (!sort) sort = "random"
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("characters", sort, search, limit, offset)
            for (let i = 0; i < result.length; i++) {
                const character = result[i]
                character.posts = functions.stripTags(character.posts)
                character.posts = character.posts.filter((p) => !p.deleted)
                if (!permissions.isMod(req.session)) {
                    character.posts = character.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    character.posts = character.posts.filter((p: any) => !functions.isR18(p?.rating))
                }
                for (let i = character.posts.length - 1; i >= 0; i--) {
                    const post = character.posts[i]
                    if (post.private) {
                        const tags = await sql.post.postTags(post.postID)
                        const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                        if (!permissions.canPrivate(req.session, categories.artists)) character.posts.splice(i, 1)
                    }
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/series", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, limit, offset} = req.query as CategorySearchParams
            if (!sort) sort = "random"
            if (!functions.validCategorySort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim().split(/ +/g).filter(Boolean).join("-")
            let result = await sql.search.tagCategory("series", sort, search, limit, offset)
            for (let i = 0; i < result.length; i++) {
                const series = result[i]
                series.posts = functions.stripTags(series.posts)
                series.posts = series.posts.filter((p) => !p.deleted)
                if (!permissions.isMod(req.session)) {
                    series.posts = series.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    series.posts = series.posts.filter((p: any) => !functions.isR18(p?.rating))
                }
                for (let i = series.posts.length - 1; i >= 0; i--) {
                    const post = series.posts[i]
                    if (post.private) {
                        const tags = await sql.post.postTags(post.postID)
                        const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                        if (!permissions.canPrivate(req.session, categories.artists)) series.posts.splice(i, 1)
                    }
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/tags", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, type, limit, offset} = req.query as TagSearchParams
            if (!sort) sort = "random"
            if (!type) type = "all"
            if (!functions.validTagSort(sort)) return res.status(400).send("Invalid sort")
            if (!functions.validTagType(type)) return res.status(400).send("Invalid type")
            let search = query?.trim().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = [] as TagSearch[]
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
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/comments", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, offset} = req.query as CommentSearchParams
            if (!sort) sort = "random"
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
            let result = [] as CommentSearch[]
            if (usernames.length) {
                result = await sql.comment.searchCommentsByUsername(usernames, parsedSearch.trim(), sort, Number(offset))
            } else {
                result = await sql.comment.searchComments(parsedSearch.trim(), sort, Number(offset))
            }
            for (let i = result.length - 1; i >= 0; i--) {
                const comment = result[i]
                if (comment.post.deleted) result.splice(i, 1)
                if (!permissions.isMod(req.session)) {
                    if (comment.post.hidden) result.splice(i, 1)
                }
                if (!req.session.showR18) {
                    if (functions.isR18(comment.post.rating)) result.splice(i, 1)
                }
                if (comment.post.private) {
                    const tags = await sql.post.postTags(comment.post.postID)
                    const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                    if (!permissions.canPrivate(req.session, categories.artists)) result.splice(i, 1)
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/notes", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, offset} = req.query as CommentSearchParams
            if (!sort) sort = "random"
            if (!functions.validCommentSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let parts = search.split(/ +/g)
            let usernames = [] as any 
            let parsedSearch = ""
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes("notes:")) {
                    const username = parts[i].split(":")[1]
                    usernames.push(username)
                } else {
                    parsedSearch += `${parts[i]} `
                }
            }
            let result = [] as NoteSearch[]
            if (usernames.length) {
                result = await sql.note.searchNotesByUsername(usernames, parsedSearch.trim(), sort, Number(offset))
            } else {
                result = await sql.note.searchNotes(parsedSearch.trim(), sort, Number(offset))
            }
            for (let i = result.length - 1; i >= 0; i--) {
                const note = result[i]
                if (note.post.deleted) result.splice(i, 1)
                if (!permissions.isMod(req.session)) {
                    if (note.post.hidden) result.splice(i, 1)
                }
                if (!req.session.showR18) {
                    if (functions.isR18(note.post.rating)) result.splice(i, 1)
                }
                if (note.post.private) {
                    const tags = await sql.post.postTags(note.post.postID)
                    const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                    if (!permissions.canPrivate(req.session, categories.artists)) result.splice(i, 1)
                }
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/groups", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, rating, limit, offset} = req.query as GroupSearchParams
            if (!sort) sort = "random"
            if (!rating) rating = "all"
            if (!functions.validGroupSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let  result = await sql.search.groupSearch(search, sort, rating, limit, offset, req.session.username)
            if (!req.session.showR18) {
                result = result.filter((g: any) => !functions.isR18(g.rating))
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/suggestions", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, type} = req.query as SearchSuggestionsParams
            if (!query) query = ""
            if (!type) type = "all"
            if (!functions.validTagType(type)) return res.status(400).send("Invalid type")
            query = functions.trimSpecialCharacters(query)
            let search = query?.trim().toLowerCase().split(/ +/g).filter(Boolean).join("-") ?? ""
            let result = await sql.search.tagSearch(search, "posts", type, 100).then((r) => r.slice(0, 100))
            if (!result?.[0]) {
                return serverFunctions.sendEncrypted([], req, res)
            }
            if (!permissions.isMod(req.session)) {
                result = result.filter((tag: any) => !tag.hidden)
            }
            if (!req.session.showR18) {
                result = result.filter((tag: any) => !tag.r18)
            }
            const tags = await sql.tag.tagCounts(result.map((r: any) => r.tag))
            serverFunctions.sendEncrypted(tags.slice(0, 100), req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/sidebartags", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {postIDs} = req.query as SidebarTagParams
            if (!postIDs) postIDs = []
            const isBanner = req.query.isBanner === "true"
            let postArray = Array.from(postIDs)?.slice(0, 100) as any
            if (req.session.captchaNeeded) {
                if (postArray?.length === 1) {
                    return serverFunctions.sendEncrypted([], req, res)
                }
                postArray = []
            }
            let slice = false
            if (!postArray?.length) slice = true
            let posts = await sql.search.posts(postArray)
            let uniqueTags = new Set<string>()
            for (let i = 0; i < posts.length; i++) {
                for (let j = 0; j < posts[i].tags.length; j++) {
                    uniqueTags.add(posts[i].tags[j])
                }
            }
            const uniqueTagArray = Array.from(uniqueTags)
            let result = await sql.tag.tagCounts(uniqueTagArray.filter(Boolean))
            for (let i = 0; i < uniqueTagArray.length; i++) {
                const found = result.find((r: any) => r.tag === uniqueTagArray[i])
                if (!found) result.push({tag: uniqueTagArray[i], count: "0", type: "tag", image: "", imageHash: ""})
            }
            //let artistTags = result.filter((t: any) => t.type === "artist")
            let characterTags = result.filter((t: any) => t.type === "character")
            let seriesTags = result.filter((t: any) => t.type === "series")
            //let metaTags = result.filter((t: any) => t.type === "meta")
            //let tags = result.filter((t: any) => t.type === "tag")
            let finalTags = [] as TagCount[]
            if (isBanner) {
                finalTags = [...seriesTags, ...characterTags]
            } else {
                finalTags = result
            }
            finalTags = slice ? finalTags.slice(0, 100) : finalTags
            serverFunctions.sendEncrypted(finalTags, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/threads", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, offset} = req.query as CommentSearchParams
            if (!sort) sort = "random"
            if (!functions.validThreadSort(sort)) return res.status(400).send("Invalid sort")
            const search = query?.trim() ?? ""
            let parts = search.split(/ +/g)
            let usernames = [] as any 
            let parsedSearch = ""
            for (let i = 0; i < parts.length; i++) {
                if (parts[i].includes("threads:")) {
                    const username = parts[i].split(":")[1]
                    usernames.push(username)
                } else {
                    parsedSearch += `${parts[i]} `
                }
            }
            let result = [] as ThreadSearch[]
            if (usernames.length) {
                let unsorted = await sql.thread.searchThreadsByUsername(usernames, parsedSearch.trim(), sort, Number(offset), req.session.username)
                let stickyThreads = unsorted.filter((thread) => thread.sticky)
                const rulesThread = stickyThreads.find((thread) => thread.title.toLowerCase().includes("rules"))
                if (rulesThread) stickyThreads = functions.removeItem(stickyThreads, rulesThread)
                let threadResult = unsorted.filter((thread) => !thread.sticky)
                result = functions.filterNulls([rulesThread, ...stickyThreads, ...threadResult])
            } else {
                let stickyThreads = await sql.thread.stickyThreads(req.session.username)
                const rulesThread = stickyThreads.find((thread) => thread.title.toLowerCase().includes("rules"))
                if (rulesThread) stickyThreads = functions.removeItem(stickyThreads, rulesThread)
                let threadResult = await sql.thread.searchThreads(parsedSearch.trim(), sort, Number(offset), req.session.username)
                result = functions.filterNulls([rulesThread, ...stickyThreads, ...threadResult])
                const newThreadCount = (Number(stickyThreads[0]?.threadCount) || 0) + (Number(threadResult[0]?.threadCount) || 0)
                result = result.map((t) => ({...t, threadCount: String(newThreadCount)}))
            }
            if (!req.session.showR18) {
                result = result.filter((t) => !t.r18)
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/messages", searchLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let {query, sort, offset} = req.query as MessageSearchParams
            if (!sort) sort = "random"
            const hideSystem = req.query.hideSystem === "true"
            if (!functions.validThreadSort(sort)) return res.status(400).send("Invalid sort")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const search = query?.trim() ?? ""
            const messages = await sql.message.allMessages(req.session.username, search, sort, Number(offset))
            let filtered = [] as MessageSearch[]
            let messageCount = messages[0]?.messageCount || 0
            for (const message of messages) {
                if (message.r18 && !req.session.showR18) {
                    messageCount--
                    continue
                }
                if (hideSystem && message.creator === "moepictures") {
                    messageCount--
                    continue
                }
                if (message.creator === req.session.username) {
                    if (message.delete) {
                        messageCount--
                        continue
                    }
                }
                for (const recipient of message.recipients) {
                    if (recipient === req.session.username) {
                        if (message.delete) {
                            messageCount--
                            continue
                        }
                    }
                }
                filtered.push(message)
            }
            for (const message of filtered) {
                message.messageCount = messageCount
            }
            serverFunctions.sendEncrypted(filtered, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.get("/api/search/reports", searchLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.report.reports(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default SearchRoutes