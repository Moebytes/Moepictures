import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"

const favoriteLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const FavoriteRoutes = (app: Express) => {
    app.post("/api/favorite/toggle", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const favorite = await sql.favorite.favorite(Number(postID), req.session.username)
            if (favorite) {
                await sql.favorite.deleteFavorite(Number(postID), req.session.username)
            } else {
                await sql.favorite.insertFavorite(Number(postID), req.session.username)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/favorite/update", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, favorited} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (favorited == null) return res.status(400).send("Bad favorited")
            const favorite = await sql.favorite.favorite(Number(postID), req.session.username)
            if (favorited) {
                if (!favorite) await sql.favorite.insertFavorite(Number(postID), req.session.username)
            } else {
                if (favorite) await sql.favorite.deleteFavorite(Number(postID), req.session.username)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favorite", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const favorite = await sql.favorite.favorite(Number(postID), req.session.username)
            if (!req.session.publicKey) return res.status(401).send("No public key")
            const encrypted = cryptoFunctions.encryptAPI(favorite, req.session.publicKey)
            res.status(200).send(encrypted)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/favgroup/update", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, name, isPrivate} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post")
            const slug = functions.generateSlug(name)
            await sql.favorite.insertFavgroup(req.session.username, slug, name, isPrivate, post.restrict)
            try {
                const favgroup = await sql.favorite.favgroup(req.session.username, slug)
                if (!favgroup) {
                    await sql.favorite.insertFavgroupPost(req.session.username, slug, Number(postID), 1)
                } else {
                    if (!favgroup.posts?.length) favgroup.posts = [{order: 0}]
                    const maxOrder = Math.max(...favgroup.posts.map((post: any) => post.order))
                    if (favgroup.restrict !== post.restrict) {
                        if (post.restrict === "explicit") {
                            await sql.favorite.updateFavGroup(req.session.username, slug, "restrict", "explicit")
                        } else if (post.restrict === "questionable" && favgroup.restrict !== "explicit") {
                            await sql.favorite.updateFavGroup(req.session.username, slug, "restrict", "questionable")
                        }
                    }
                    await sql.favorite.insertFavgroupPost(req.session.username, slug, Number(postID), maxOrder + 1)
                }
            } catch {}
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favgroups", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            let newFavgroups = [] as any[]
            const favgroups = await sql.favorite.postFavgroups(Number(postID), req.session.username)
            for (let i = 0; i < favgroups.length; i++) {
                const group = favgroups[i]
                if (!permissions.isMod(req.session)) {
                    group.posts = group.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    if (group.restrict === "explicit") continue
                }
                for (let i = group.posts.length - 1; i >= 0; i--) {
                    const post = group.posts[i]
                    if (post.private) {
                        const categories = await serverFunctions.tagCategories(post.tags)
                        if (!permissions.canPrivate(req.session, categories.artists)) group.posts.splice(i, 1)
                    }
                }
                newFavgroups.push(group)
            }
            if (!req.session.publicKey) return res.status(401).send("No public key")
            const encrypted = cryptoFunctions.encryptAPI(newFavgroups, req.session.publicKey)
            res.status(200).send(encrypted)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/favgroup/post/delete", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            const name = req.query.name as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const slug = functions.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return res.status(400).send("Invalid favgroup")
            let filteredPosts = favgroup.posts.filter((p: any) => String(p.postID) !== String(postID))
            let restrict = "safe"
            for (const filteredPost of filteredPosts) {
                if (filteredPost.restrict === "explicit") restrict = "explicit"
                if (filteredPost.restrict === "questionable" && restrict !== "explicit") restrict = "questionable"
            }
            await sql.favorite.updateFavGroup(req.session.username, slug, "restrict", restrict)
            await sql.favorite.deleteFavgroupPost(Number(postID), req.session.username, favgroup.slug)
            if (favgroup.posts.length === 1) {
                await sql.favorite.deleteFavgroup(req.session.username, favgroup.slug)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favgroup", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const username = req.query.username as string
            const name = req.query.name as string
            if (!username) return res.status(400).send("Bad username")
            const slug = functions.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(username, slug)
            if (!favgroup) return res.status(400).send("Invalid favgroup")
            if (favgroup.private) {
                if (!permissions.isMod(req.session) && username !== req.session.username) return res.status(403).send("Unauthorized")
            }
            if (!permissions.isMod(req.session)) {
                favgroup.posts = favgroup.posts.filter((p: any) => !p?.hidden)
            }
            if (!req.session.showR18) {
                if (favgroup.restrict === "explicit") return res.status(403).end()
            }
            for (let i = favgroup.posts.length - 1; i >= 0; i--) {
                const post = favgroup.posts[i]
                if (post.private) {
                    const categories = await serverFunctions.tagCategories(post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) favgroup.posts.splice(i, 1)
                }
            }
            if (!req.session.publicKey) return res.status(401).send("No public key")
            const encrypted = cryptoFunctions.encryptAPI(favgroup, req.session.publicKey)
            res.status(200).send(encrypted)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/favgroup/edit", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {key, name, isPrivate} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const slug = functions.generateSlug(key)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return res.status(400).send("Invalid favgroup")
            if (isPrivate !== undefined) {
                await sql.favorite.updateFavGroup(req.session.username, slug, "private", isPrivate)
            }
            if (name !== undefined) {
                if (!name) return res.status(400).send("Invalid name")
                const newSlug = functions.generateSlug(name)
                await sql.favorite.updateFavGroup(req.session.username, slug, "name", name)
                await sql.favorite.updateFavGroup(req.session.username, slug, "slug", newSlug)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/favgroup/delete", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const name = req.query.name as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            const slug = functions.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return res.status(400).send("Invalid favgroup")
            await sql.favorite.deleteFavgroup(req.session.username, favgroup.slug)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/favgroup/reorder", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {name, posts} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const slug = functions.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return res.status(400).send("Invalid favgroup")
            for (let i = 0; i < posts.length; i++) {
                if (Number(posts[i].order) !== i + 1) return res.status(400).send("Bad post orders")
            }
            let toChange = [] as any
            for (let i = 0; i < posts.length; i++) {
                let newPost = posts[i]
                let oldPost = favgroup.posts.find((p: any) => p.postID === newPost.postID)
                if (Number(oldPost.order) !== Number(newPost.order)) toChange.push(newPost)
            }
            await sql.favorite.bulkDeleteFavgroupMappings(req.session.username, favgroup.slug, toChange)
            await sql.favorite.bulkInsertFavgroupMappings(req.session.username, favgroup.slug, toChange)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default FavoriteRoutes