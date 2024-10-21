import e, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"

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
            const {postID, name} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!name) return res.status(400).send("Invalid name")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const post = await sql.post.post(postID)
            if (!post) return res.status(400).send("Invalid post")
            const slug = functions.generateSlug(name)
            try {
                const groupID = await sql.group.insertGroup(req.session.username, name, slug, post.restrict)
                await sql.group.insertGroupPost(String(groupID), postID, 1)
            } catch {
                const group = await sql.group.group(slug)
                if (!group) return res.status(400).send("Invalid group")
                if (!group.posts?.length) group.posts = [{order: 0}]
                const maxOrder = Math.max(...group.posts.map((post: any) => post.order))
                if (group.restrict !== post.restrict) {
                    if (post.restrict === "explicit") {
                        await sql.group.updateGroup(group.groupID, "restrict", "explicit")
                    } else if (post.restrict === "questionable" && group.restrict !== "explicit") {
                        await sql.group.updateGroup(group.groupID, "restrict", "questionable")
                    }
                }
                try {
                    await sql.group.insertGroupPost(group.groupID, postID, maxOrder + 1)
                } catch {}
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/group/edit", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {slug, name, description} = req.body
            if (!name) return res.status(400).send("Invalid name")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            const newSlug = functions.generateSlug(name)
            await sql.group.updateGroupName(group.groupID, req.session.username, name, newSlug, description)
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
            res.status(200).send(group)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/groups", groupLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const groups = await sql.group.postGroups(Number(postID))
            res.status(200).send(groups)
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
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            return res.status(400).send("Bad request")
        }
    })

    app.delete("/api/group/post/delete", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID as string
            const name = req.query.name as string
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!name) return res.status(400).send("Invalid name")
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const post = await sql.post.post(Number(postID))
            if (!post) return res.status(400).send("Invalid post")
            const slug = functions.generateSlug(name)
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            let filteredPosts = group.posts.filter((p: any) => p.postID !== post.postID)
            let restrict = "safe"
            for (const filteredPost of filteredPosts) {
                if (filteredPost.restrict === "explicit") restrict = "explicit"
                if (filteredPost.restrict === "questionable" && restrict !== "explicit") restrict = "questionable"
            }
            await sql.group.updateGroup(group.groupID, "restrict", restrict)
            await sql.group.deleteGroupPost(group.groupID, postID)
            if (group.posts.length === 1) {
                await sql.group.deleteGroup(group.groupID)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/group/reorder", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {slug, posts} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            for (let i = 0; i < posts.length; i++) {
                if (Number(posts[i].order) !== i + 1) return res.status(400).send("Bad post orders")
            }
            await sql.group.purgeGroupMap(group.groupID)
            await sql.group.bulkInsertGroupMappings(group.groupID, posts)
            await sql.group.updateGroup(group.groupID, "updater", req.session.username)
            await sql.group.updateGroup(group.groupID, "updatedDate", new Date().toISOString())
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/request", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {postID, name, reason} = req.body
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
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.request.groupRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/request/fulfill", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {username, slug, postID, accepted} = req.body
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
            const {slug, reason} = req.body
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

    app.get("/api/group/delete/request/list", groupLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.request.groupDeleteRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/delete/request/fulfill", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {username, slug, accepted} = req.body
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

    app.post("/api/group/edit/request", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {slug, name, description, reason} = req.body
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (req.session.banned) return res.status(403).send("You are banned")
            const group = await sql.group.group(slug)
            if (!group) return res.status(400).send("Invalid group")
            await sql.request.insertGroupEditRequest(req.session.username, slug, name, description, reason)
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/group/edit/request/list", groupLimiter, async (req: Request, res: Response) => {
        try {
            const offset = req.query.offset as string
            if (!req.session.username) return res.status(403).send("Unauthorized")
            if (!permissions.isMod(req.session)) return res.status(403).end()
            const result = await sql.request.groupEditRequests(offset)
            res.status(200).json(result)
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/group/edit/request/fulfill", csrfProtection, groupLimiter, async (req: Request, res: Response) => {
        try {
            const {username, slug, accepted} = req.body
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
}

export default GroupRoutes