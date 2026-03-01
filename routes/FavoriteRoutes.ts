/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import sql from "../sql/SQLQuery"
import functions from "../functions/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../server/ServerFunctions"
import {Favgroup, FavgroupUpdateParams, FavgroupEditParams, FavgroupReorderParams, FavgroupSearch, PostSearchOrdered} from "../types/Types"

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
            const {postID} = req.body as {postID: string}
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const favorite = await sql.favorite.favorite(postID, req.session.username)
            if (favorite) {
                await sql.favorite.deleteFavorite(postID, req.session.username)
            } else {
                await sql.favorite.insertFavorite(postID, req.session.username)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/favorite/update", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, favorited} = req.body as {postID: string, favorited: boolean}
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (favorited === null || favorited === undefined) return void res.status(400).send("Bad favorited")
            const favorite = await sql.favorite.favorite(postID, req.session.username)
            if (favorited) {
                if (!favorite) await sql.favorite.insertFavorite(postID, req.session.username)
            } else {
                if (favorite) await sql.favorite.deleteFavorite(postID, req.session.username)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favorite", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const favorite = await sql.favorite.favorite(postID, req.session.username)
            serverFunctions.sendEncrypted(favorite, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/favgroup/update", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {postIDs, name, isPrivate} = req.body as FavgroupUpdateParams
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")

            const slug = functions.post.generateSlug(name)

            const posts = await sql.search.posts(postIDs)
            if (!posts.length) return void res.status(200).send("Success")

            let favgroup = await sql.favorite.favgroup(req.session.username, slug)
            let favgroupID = favgroup?.favgroupID || ""
            if (!favgroupID) {
                favgroupID = await sql.favorite.insertFavgroup(req.session.username, slug, name, isPrivate, posts[0].rating)
            }

            let existingPosts = favgroup?.posts ?? []
            let maxOrder = Math.max(0, ...existingPosts.map((post) => post.order))
            let newRating = functions.reduceHighestRating([...existingPosts, ...posts])
            await sql.favorite.updateFavGroup(req.session.username, slug, "rating", newRating)

            let toInsert = [] as {postID: string, order: number}[]
            for (let i = 0; i < posts.length; i++) {
                toInsert.push({postID: posts[i].postID, order: maxOrder + i + 1})
            }
            await sql.favorite.bulkInsertFavgroupMappings(favgroupID, toInsert)

            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favgroups", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            let newFavgroups = [] as Favgroup[]
            const favgroups = await sql.favorite.postFavgroups(postID, req.session.username)
            for (let i = 0; i < favgroups.length; i++) {
                const group = favgroups[i]
                group.posts = group.posts.filter((p) => !p.deleted)
                if (!permissions.isMod(req.session)) {
                    group.posts = group.posts.filter((p) => !p.hidden)
                }
                if (!req.session.showR18) {
                    if (functions.post.isR18(group.rating)) continue
                }
                for (let i = group.posts.length - 1; i >= 0; i--) {
                    const post = group.posts[i]
                    if (post.private) {
                        const tags = await sql.post.postTags(post.postID)
                        const categories = await serverFunctions.tags.tagCategories(tags.map((tag) => tag.tag))
                        if (!permissions.canPrivate(req.session, categories.artists)) group.posts.splice(i, 1)
                    }
                }
                newFavgroups.push(group)
            }
            serverFunctions.sendEncrypted(newFavgroups, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/favgroup/post/delete", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, name} = req.query as {postID: string, name: string}
            if (Number.isNaN(Number(postID))) return void res.status(400).send("Invalid postID")
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const slug = functions.post.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return void res.status(400).send("Invalid favgroup")
            let filteredPosts = favgroup.posts.filter((p: any) => String(p.postID) !== String(postID))
            let rating = functions.reduceHighestRating(filteredPosts)
            await sql.favorite.updateFavGroup(req.session.username, slug, "rating", rating)
            await sql.favorite.deleteFavgroupPost(favgroup.favgroupID, postID)
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
            const {username, name} = req.query as {username: string, name: string}
            if (!username) return void res.status(400).send("Bad username")
            const slug = functions.post.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(username, slug, "", "", "", "", true, req.session.username)
            if (!favgroup) return void res.status(400).send("Invalid favgroup")
            if (favgroup.private) {
                if (!permissions.isMod(req.session) && username !== req.session.username) return void res.status(403).send("Unauthorized")
            }
            favgroup.posts = favgroup.posts.filter((p) => !p.deleted)
            if (!permissions.isMod(req.session)) {
                favgroup.posts = favgroup.posts.filter((p) => !p.hidden)
            }
            if (!req.session.showR18) {
                if (functions.post.isR18(favgroup.rating)) return void res.status(403).end()
            }
            for (let i = favgroup.posts.length - 1; i >= 0; i--) {
                const post = favgroup.posts[i]
                if (post.private) {
                    const categories = await serverFunctions.tags.tagCategories(post.tags)
                    if (!permissions.canPrivate(req.session, categories.artists)) favgroup.posts.splice(i, 1)
                }
            }
            serverFunctions.sendEncrypted(favgroup, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/favgroup/edit", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {key, name, isPrivate} = req.body as FavgroupEditParams
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const slug = functions.post.generateSlug(key)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return void res.status(400).send("Invalid favgroup")
            if (isPrivate !== undefined) {
                await sql.favorite.updateFavGroup(req.session.username, slug, "private", isPrivate)
            }
            if (name !== undefined) {
                if (!name) return void res.status(400).send("Invalid name")
                const newSlug = functions.post.generateSlug(name)
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
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const slug = functions.post.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return void res.status(400).send("Invalid favgroup")
            await sql.favorite.deleteFavgroup(req.session.username, favgroup.slug)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/favgroup/reorder", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {name, posts} = req.body as FavgroupReorderParams
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            if (req.session.banned) return void res.status(403).send("You are banned")
            const slug = functions.post.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return void res.status(400).send("Invalid favgroup")
            for (let i = 0; i < posts.length; i++) {
                if (Number(posts[i].order) !== i + 1) return void res.status(400).send("Bad post orders")
            }
            let toChange = [] as {postID: string, order: number}[]
            for (let i = 0; i < posts.length; i++) {
                let newPost = posts[i]
                let oldPost = favgroup.posts.find((p) => p.postID === String(newPost.postID))
                if (Number(oldPost?.order) !== Number(newPost.order)) toChange.push(newPost)
            }
            await sql.favorite.bulkDeleteFavgroupMappings(favgroup.favgroupID, toChange)
            await sql.favorite.bulkInsertFavgroupMappings(favgroup.favgroupID, toChange)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/favgroup/remap", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {name, postIDs} = req.body as Omit<FavgroupUpdateParams, "isPrivate">
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")

            const slug = functions.post.generateSlug(name)
            const favgroup = await sql.favorite.favgroup(req.session.username, slug)
            if (!favgroup) return void res.status(400).send("Bad name")

            const posts = await sql.search.posts(postIDs)
            let newRating = functions.reduceHighestRating(posts)
            await sql.favorite.updateFavGroup(req.session.username, slug, "rating", newRating)

            let newPosts = [] as {postID: string, order: number}[]
            for (let i = 0; i < posts.length; i++) {
                newPosts.push({postID: posts[i].postID, order: i + 1})
            }
            await sql.favorite.bulkDeleteFavgroupMappings(favgroup.favgroupID, favgroup.posts)
            await sql.favorite.bulkInsertFavgroupMappings(favgroup.favgroupID, newPosts)

            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/tagfavorite/toggle", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const {tag} = req.body as {tag: string}
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const tagFavorite = await sql.favorite.tagFavorite(tag, req.session.username)
            if (tagFavorite) {
                await sql.favorite.deleteTagFavorite(tag, req.session.username)
            } else {
                await sql.favorite.insertTagFavorite(tag, req.session.username)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tagfavorite", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            const tag = req.query.tag as string
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            const tagFavorite = await sql.favorite.tagFavorite(tag, req.session.username)
            serverFunctions.sendEncrypted(tagFavorite, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/tagfavorites", favoriteLimiter, async (req: Request, res: Response) => {
        try {
            let username = req.query?.username as string | undefined
            let ownFavorites = false
            if (!username) {
                username = req.session.username
                ownFavorites = true
            }
            if (!username) return void res.status(400).send("Bad username")
            const user = await sql.user.user(username)
            if (user?.publicTagFavorites || ownFavorites) {
                const tagFavorites = await sql.favorite.tagFavorites(username)
                serverFunctions.sendEncrypted(tagFavorites, req, res)
            } else {
                serverFunctions.sendEncrypted([], req, res)
            }
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/tagfavorites/delete", csrfProtection, favoriteLimiter, async (req: Request, res: Response) => {
        try {
            if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
            await sql.favorite.deleteTagFavorites(req.session.username)
            res.status(200).send("Success") 
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })
}

export default FavoriteRoutes