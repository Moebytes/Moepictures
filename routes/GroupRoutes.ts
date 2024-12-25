import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import {Group, GroupHistory, GroupPosts, GroupParams, GroupEditParams, GroupPostDeleteParams,
GroupReorderParams, GroupRequestParams, GroupRequestFulfillParams, GroupDeleteRequestParams,
GroupPostDeleteRequestParams, GroupDeleteRequestFulfillParams, GroupPostDeleteRequestFulfillParams,
GroupEditRequestParams, GroupEditRequestFulfillParams, GroupHistoryParams} from "../types/Types"

const groupLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	standardHeaders: true,
	legacyHeaders: false,
    keyGenerator,
    handler
})

const GroupRoutes = (app: Express) => {
    app.post("/api/group", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            let {postID, name, username, date} = req.body as GroupParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!name) return res.status(400).send("Invalid name")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post")
            const slug = functions.generateSlug(name)
            let targetUser = req.session.username
            if (username && permissions.isMod(req.session)) targetUser = username
            try {
                const groupID = await sql.group.insertGroup(targetUser, name, slug, post.rating)
                await sql.group.insertGroupPost(String(groupID), postID, 1)
            } catch {
                const group = await sql.group.group(slug)
                if (!group) return res.status(400).send("Invalid group")
                if (!group.posts?.length) group.posts = [{order: 0}] as any
                const maxOrder = Math.max(...group.posts.map((post: any) => post.order))
                if (group.rating !== post.rating) {
                    if (post.rating === functions.r18()) {
                        await sql.group.updateGroup(group.groupID, "rating", functions.r18())
                    } else if (post.rating === functions.r17() && group.rating !== functions.r18()) {
                        await sql.group.updateGroup(group.groupID, "rating", functions.r17())
                    } else if (post.rating === functions.r15() && group.rating !== functions.r17() && group.rating !== functions.r18()) {
                        await sql.group.updateGroup(group.groupID, "rating", functions.r15())
                    }
                }
                try {
                    await sql.group.insertGroupPost(group.groupID, postID, maxOrder + 1)
                } catch {}

                const groupHistory = await sql.history.groupHistory(group.groupID)
                const updated = await sql.group.group(slug)
                const changes = functions.parseGroupChanges(group, updated)
                let posts = updated.posts.map((post: any) => ({postID: post.postID, order: post.order}))
                if (!date) date = new Date().toISOString()
                if (!groupHistory.length) {
                    let vanilla = group as unknown as GroupHistory
                    vanilla.user = group.creator
                    vanilla.date = group.createDate
                    let vanillaPosts = vanilla.posts.map((post: any) => ({postID: post.postID, order: post.order}))
                    await sql.history.insertGroupHistory({username: vanilla.user, groupID: vanilla.groupID, slug: vanilla.slug, name: vanilla.name, date: vanilla.date, 
                    rating: vanilla.rating, description: vanilla.description, posts: JSON.stringify(vanillaPosts), orderChanged: false, addedPosts: [], removedPosts: [], changes})
                    await sql.history.insertGroupHistory({username: targetUser, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                    description: updated.description, posts: JSON.stringify(posts), orderChanged: false, addedPosts: [postID], removedPosts: [], changes})
                } else {
                    await sql.history.insertGroupHistory({username: targetUser, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                    description: updated.description, posts: JSON.stringify(posts), orderChanged: false, addedPosts: [postID], removedPosts: [], changes})
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/group/edit", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            let {slug, name, description, username, date, silent, reason} = req.body as GroupEditParams
            if (!name) return res.status(400).send("Invalid name")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            const newSlug = functions.generateSlug(name)
            let targetUser = req.session.username
            if (username && permissions.isMod(req.session)) targetUser = username
            if (group.name === name && group.slug === newSlug 
            && group.description === description) return res.status(200).send("Success")
            await sql.group.updateGroupName(group.groupID, targetUser, name, newSlug, description)

            if (permissions.isMod(req.session)) {
                if (silent) return res.status(200).send("Success")
            }
        
            const updated = await sql.group.group(newSlug)
            const changes = functions.parseGroupChanges(group, updated)
            const groupHistory = await sql.history.groupHistory(group.groupID)
            let posts = group.posts.map((post: any) => ({postID: post.postID, order: post.order}))
            if (!date) date = new Date().toISOString()
            if (!groupHistory.length) {
                let vanilla = group as unknown as GroupHistory
                vanilla.user = group.creator
                vanilla.date = group.createDate
                await sql.history.insertGroupHistory({username: vanilla.user, groupID: vanilla.groupID, slug: vanilla.slug, name: vanilla.name, date: vanilla.date, 
                rating: vanilla.rating, description: vanilla.description, posts: JSON.stringify(posts), orderChanged: false, addedPosts: [], removedPosts: [], changes})
                await sql.history.insertGroupHistory({username: targetUser, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                description: updated.description, posts: JSON.stringify(posts), orderChanged: false, addedPosts: [], removedPosts: [], changes, reason})
            } else {
                await sql.history.insertGroupHistory({username: targetUser, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                description: updated.description, posts: JSON.stringify(posts), orderChanged: false, addedPosts: [], removedPosts: [], changes, reason})
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/group/delete", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const slug = req.query.slug as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            await sql.group.deleteGroup(group.groupID)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/group", groupLimiter, async (req: Request, res: Response) => {
        try {
            const name = req.query.name as string
            if (!name) return res.status(400).send("Invalid name")
            const slug = functions.generateSlug(name)
            const group = await sql.group.group(slug)
            if (!permissions.isMod(req.session)) {
                group.posts = group.posts.filter((p: any) => !p?.hidden)
            }
            if (!req.session.showR18) {
                if (functions.isR18(group.rating)) return res.status(403).end()
            }
            for (let i = group.posts.length - 1; i >= 0; i--) {
                const post = group.posts[i]
                if (post.private) {
                    const tags = await sql.post.postTags(post.postID)
                    const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                    if (!permissions.canPrivate(req.session, categories.artists)) group.posts.splice(i, 1)
                }
            }
            serverFunctions.sendEncrypted(group, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/groups", groupLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const groups = await sql.group.postGroups(postID)
            let newGroups = [] as GroupPosts[]
            for (let i = 0; i < groups.length; i++) {
                const group = groups[i]
                if (!permissions.isMod(req.session)) {
                    group.posts = group.posts.filter((p: any) => !p?.hidden)
                }
                if (!req.session.showR18) {
                    if (functions.isR18(group.rating)) continue
                }
                for (let i = group.posts.length - 1; i >= 0; i--) {
                    const post = group.posts[i]
                    if (post.private) {
                        const tags = await sql.post.postTags(post.postID)
                        const categories = await serverFunctions.tagCategories(tags.map((tag) => tag.tag))
                        if (!permissions.canPrivate(req.session, categories.artists)) group.posts.splice(i, 1)
                    }
                }
                newGroups.push(group)
            }
            serverFunctions.sendEncrypted(newGroups, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/groups/list", groupLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            let groups = req.query.groups as string[]
            if (!groups) groups = []
            let result = await sql.group.groups(groups.filter(Boolean))
            let newGroups = [] as Group[]
            for (let i = 0; i < result.length; i++) {
                const group = result[i]
                if (!req.session.showR18) {
                    if (functions.isR18(group.rating)) continue
                }
                newGroups.push(group)
            }
            serverFunctions.sendEncrypted(newGroups, req, res)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.delete("/api/group/post/delete", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            let {postID, name, username, date} = req.query as unknown as GroupPostDeleteParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!name) return res.status(400).send("Invalid name")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post")
            const slug = functions.generateSlug(name)
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            let filteredPosts = group.posts.filter((p: any) => p.postID !== post.postID)
            let rating = functions.r13()
            for (const filteredPost of filteredPosts) {
                if (filteredPost.rating === functions.r18()) rating = functions.r18()
                if (filteredPost.rating === functions.r17() && rating !== functions.r18()) rating = functions.r17()
                if (filteredPost.rating === functions.r15() && rating !== functions.r17() && rating !== functions.r18()) rating = functions.r15()
            }
            await sql.group.updateGroup(group.groupID, "rating", rating)
            await sql.group.deleteGroupPost(group.groupID, postID)
            if (group.posts.length === 1) {
                await sql.group.deleteGroup(group.groupID)
            } else {
                let targetUser = req.session.username
                if (username && permissions.isMod(req.session)) targetUser = username

                const groupHistory = await sql.history.groupHistory(group.groupID)
                const updated = await sql.group.group(slug)
                const changes = functions.parseGroupChanges(group, updated)
                let posts = updated.posts.map((post: any) => ({postID: post.postID, order: post.order}))
                if (!date) date = new Date().toISOString()
                if (!groupHistory.length) {
                    let vanilla = group as unknown as GroupHistory
                    vanilla.user = group.creator
                    vanilla.date = group.createDate
                    let vanillaPosts = vanilla.posts.map((post: any) => ({postID: post.postID, order: post.order}))
                    await sql.history.insertGroupHistory({username: vanilla.user, groupID: vanilla.groupID, slug: vanilla.slug, name: vanilla.name, date: vanilla.date, 
                    rating: vanilla.rating, description: vanilla.description, posts: JSON.stringify(vanillaPosts), orderChanged: false, addedPosts: [], removedPosts: [], changes})
                    await sql.history.insertGroupHistory({username: targetUser, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                    description: updated.description, posts: JSON.stringify(posts), orderChanged: false, addedPosts: [], removedPosts: [postID], changes})
                } else {
                    await sql.history.insertGroupHistory({username: targetUser, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                    description: updated.description, posts: JSON.stringify(posts), orderChanged: false, addedPosts: [], removedPosts: [postID], changes})
                }
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/group/reorder", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {slug, posts, silent} = req.body as GroupReorderParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            for (let i = 0; i < posts.length; i++) {
                if (Number(posts[i].order) !== i + 1) return res.status(400).send("Bad post orders")
            }
            let added = [] as any[]
            let removed = [] as any[]
            let changed = [] as any[]
            for (let i = 0; i < posts.length; i++) {
                let newPost = posts[i]
                let oldPost = group.posts.find((p: any) => String(p.postID) === String(newPost.postID))
                if (!oldPost) {
                    added.push(newPost)
                } else {
                    if (Number(oldPost.order) !== Number(newPost.order)) {
                        changed.push(newPost)
                    }
                }
            }
            for (let i = 0; i < group.posts.length; i++) {
                let oldPost = group.posts[i]
                let newPost = posts.find((p: any) => String(p.postID) === String(oldPost.postID))
                if (!newPost) {
                    removed.push(oldPost)
                }
            }
            let toRemove = [...removed, ...changed]
            let toAdd = [...added, ...changed]
            let addedPosts = added.map((p: any) => p.postID)
            let removedPosts = removed.map((p: any) => p.postID)
            if (![...toRemove, ...toAdd].length) return res.status(200).send("Success")
            await sql.group.bulkDeleteGroupMappings(group.groupID, toRemove)
            await sql.group.bulkInsertGroupMappings(group.groupID, toAdd)
            await sql.group.updateGroup(group.groupID, "updater", req.session.username)
            await sql.group.updateGroup(group.groupID, "updatedDate", new Date().toISOString())

            if (permissions.isMod(req.session)) {
                if (silent) return res.status(200).send("Success")
            }

            const groupHistory = await sql.history.groupHistory(group.groupID)
            const updated = await sql.group.group(slug)
            const changes = functions.parseGroupChanges(group, updated)
            const date = new Date().toISOString()
            if (!groupHistory.length) {
                let vanilla = group as unknown as GroupHistory
                vanilla.user = group.creator
                vanilla.date = group.createDate
                let vanillaPosts = vanilla.posts.map((post: any) => ({postID: post.postID, order: post.order}))
                await sql.history.insertGroupHistory({username: vanilla.user, groupID: vanilla.groupID, slug: vanilla.slug, name: vanilla.name, date: vanilla.date, 
                rating: vanilla.rating, description: vanilla.description, posts: JSON.stringify(vanillaPosts), orderChanged: false, addedPosts: [], removedPosts: [], changes})
                await sql.history.insertGroupHistory({username: req.session.username, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                description: updated.description, posts: JSON.stringify(posts), orderChanged: true, addedPosts, removedPosts, changes})
            } else {
                await sql.history.insertGroupHistory({username: req.session.username, groupID: updated.groupID, slug: updated.slug, name: updated.name, date, rating: updated.rating, 
                description: updated.description, posts: JSON.stringify(posts), orderChanged: true, addedPosts, removedPosts, changes})
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/request", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, name, reason} = req.body as GroupRequestParams
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!name) return res.status(400).send("Invalid name")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post")
            const slug = functions.generateSlug(name)
            await sql.request.insertGroupRequest(req.session.username, slug, name, postID, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/group/request/list", groupLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.request.groupRequests(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/request/fulfill", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {username, slug, postID, accepted} = req.body as GroupRequestFulfillParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            await sql.request.deleteGroupRequest(username, slug, postID)
            if (accepted) {
                let message = `Group request on ${functions.getDomain()}/group/${slug} has been approved. Thanks for the contribution!`
                await serverFunctions.systemMessage(username, "Notice: Group request has been approved", message)
            } else {
                let message = `Group request on ${functions.getDomain()}/group/${slug} has been rejected. Sorry!`
                // await serverFunctions.systemMessage(username, "Notice: Group request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/delete/request", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {slug, reason} = req.body as GroupDeleteRequestParams
            if (!slug) return res.status(400).send("Invalid slug")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            await sql.request.insertGroupDeleteRequest(req.session.username, slug, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/post/delete/request", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {removalItems, reason} = req.body as GroupPostDeleteRequestParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            for (const item of removalItems) {
                const group = await sql.group.group(item.slug)
                if (!group) return res.status(400).send("Invalid group")
            }
            for (const item of removalItems) {
                await sql.request.insertGroupPostDeleteRequest(req.session.username, item.slug, item.postID, reason)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/group/delete/request/list", groupLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.request.groupDeleteRequests(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/delete/request/fulfill", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {username, slug, accepted} = req.body as GroupDeleteRequestFulfillParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            await sql.request.deleteGroupDeleteRequest(username, slug)
            if (accepted) {
                let message = `Group deletion request on ${functions.getDomain()}/group/${slug} has been approved. Thanks!`
                await serverFunctions.systemMessage(username, "Notice: Group deletion request has been approved", message)
            } else {
                let message = `Group deletion request on ${functions.getDomain()}/group/${slug} has been rejected. This group can stay up. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Group deletion request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/post/delete/request/fulfill", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {username, slug, postID, accepted} = req.body as GroupPostDeleteRequestFulfillParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            await sql.request.deleteGroupPostDeleteRequest(username, slug, postID)
            if (accepted) {
                let message = `Group post deletion request on ${functions.getDomain()}/group/${slug} has been approved. Thanks!`
                await serverFunctions.systemMessage(username, "Notice: Group post deletion request has been approved", message)
            } else {
                let message = `Group post deletion request on ${functions.getDomain()}/group/${slug} has been rejected. This post can remain up. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Group post deletion request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/edit/request", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {slug, name, description, reason} = req.body as GroupEditRequestParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            const changes = functions.parseGroupChanges(group, {name, description, posts: group.posts} as GroupPosts)
            await sql.request.insertGroupEditRequest(req.session.username, slug, name, description, [], [], false, changes, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/group/edit/request/list", groupLimiter, async (req: Request, res: Response) => {
        try {
            let {offset} = req.query as unknown as {offset: number}
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.request.groupEditRequests(Number(offset))
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/edit/request/fulfill", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {username, slug, accepted} = req.body as GroupEditRequestFulfillParams
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!username) return res.status(400).send("Bad username")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            await sql.request.deleteGroupEditRequest(username, slug)
            if (accepted) {
                let message = `Group edit request on ${functions.getDomain()}/group/${slug} has been approved. Thanks for the contribution!`
                await serverFunctions.systemMessage(username, "Notice: Group edit request has been approved", message)
            } else {
                let message = `Group edit request on ${functions.getDomain()}/group/${slug} has been rejected. The original group details can stay. Thanks!`
                // await serverFunctions.systemMessage(username, "Notice: Group edit request has been rejected", message)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/group/history", groupLimiter, async (req: Request, res: Response) => {
        try {
            let {slug, historyID, username, query, offset} = req.query as unknown as GroupHistoryParams
            if (!offset) offset = 0
            if (!req.session.username) return res.status(403).send("Unauthorized")
            let result = [] as GroupHistory[]
            if (slug) {
                const group = await sql.group.group(slug)
                if (!group) return res.status(400).send("Bad group")
                if (historyID) {
                    const history = await sql.history.groupHistoryID(group.groupID, historyID)
                    result = [history]
                } else if (username) {
                    result = await sql.history.userGroupHistory(username)
                } else {
                    result = await sql.history.groupHistory(group.groupID, Number(offset), query)
                }
            } else {
                result = await sql.history.groupHistory(undefined, Number(offset))
            }
            serverFunctions.sendEncrypted(result, req, res)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })

    app.delete("/api/group/history/delete", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {slug, historyID} = req.query as {slug: string, historyID: string}
            if (Number.isNaN(Number(historyID))) return res.status(400).send("Invalid historyID")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!slug) return res.status(400).send("Bad slug")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const group = await sql.group.group(slug as string)
            if (!group) return res.status(400).send("Bad group")
            const groupHistory = await sql.history.groupHistory(group.groupID)
            if (groupHistory[0]?.historyID === historyID) {
                return res.status(400).send("Bad request")
            } else {
                await sql.history.deleteGroupHistory(historyID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request")
        }
    })
}

export default GroupRoutes