import {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import serverFunctions from "../structures/ServerFunctions"
import fs from "fs"
import path from "path"

const PostRoutes = (app: Express) => {
    app.post("/api/comment", async (req: Request, res: Response) => {
        try {
            const {comment, postID} = req.body 
            if (!req.session.username || !comment || !postID) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const badComment = functions.validateComment(comment) 
            if (badComment) return res.status(400).send("Bad request")
            await sql.insertComment(Number(postID), req.session.username, comment)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/comments", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            const result = await sql.comments(Number(postID))
            res.status(200).json(result)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/comment", async (req: Request, res: Response) => {
        try {
            const commentID = req.query.commentID
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const comment = await sql.comment(Number(commentID))
            if (comment?.username !== req.session.username) return res.status(400).send("Bad request")
            await sql.deleteComment(Number(commentID))
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.put("/api/comment", async (req: Request, res: Response) => {
        try {
            const {comment, commentID} = req.body
            if (!req.session.username || !comment || !commentID) return res.status(400).send("Bad request")
            if (Number.isNaN(Number(commentID))) return res.status(400).send("Invalid commentID")
            const badComment = functions.validateComment(comment as string) 
            if (badComment) return res.status(400).send("Bad request")
            const com = await sql.comment(Number(commentID))
            if (com?.username !== req.session.username) return res.status(400).send("Bad request")
            await sql.updateComment(Number(commentID), comment as string)
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/post", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const post = await sql.post(Number(postID))
            if (post?.uploader !== req.session.username) return res.status(400).send("Bad request")
            await sql.deletePost(Number(postID))
            for (let i = 0; i < post.images.length; i++) {
                const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].filename)
                await serverFunctions.deleteFile(file)
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/tag", async (req: Request, res: Response) => {
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

    app.put("/api/tag", async (req: Request, res: Response) => {
        try {
            const {tag, key, description, image, aliases} = req.body
            if (!req.session.username || !tag) return res.status(400).send("Bad request")
            const tagObj = await sql.tag(tag)
            if (!tagObj) return res.status(400).send("Bad request")
            if (description) {
                await sql.updateTag(tag, "description", description)
            }
            if (image) {
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

    app.post("/api/favorite", async (req: Request, res: Response) => {
        try {
            const {postID, favorited} = req.body
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (favorited == null || !req.session.username) return res.status(400).send("Bad request")
            const favorite = await sql.favorite(Number(postID), req.session.username)
            if (favorited) {
                if (!favorite) await sql.insertFavorite(Number(postID), req.session.username)
            } else {
                if (favorite) await sql.deleteFavorite(favorite.favoriteID)
            }
            res.status(200).send("Success")
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favorite", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const favorite = await sql.favorite(Number(postID), req.session.username)
            res.status(200).send(favorite)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/favorites", async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            const favorites = await sql.favorites(req.session.username)
            res.status(200).send(favorites)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/uploads", async (req: Request, res: Response) => {
        try {
            if (!req.session.username) return res.status(400).send("Bad request")
            const uploads = await sql.uploads(req.session.username)
            res.status(200).send(uploads)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/cuteness", async (req: Request, res: Response) => {
        try {
            const {postID, cuteness} = req.body
            if (Number.isNaN(Number(postID)) || Number.isNaN(Number(cuteness))) return res.status(400).send("Bad request")
            if (!req.session.username) return res.status(400).send("Bad request")
            if (Number(cuteness) < 0 || Number(cuteness) > 1000) return res.status(400).send("Bad request")
            const cute = await sql.cuteness(Number(postID), req.session.username)
            if (cute) {
                await sql.updateCuteness(Number(postID), req.session.username, Number(cuteness))
            } else {
                await sql.insertCuteness(Number(postID), req.session.username, Number(cuteness))
            }
            res.status(200).send("Success")
        } catch (e) {
            console.log(e)
            res.status(400).send("Bad request") 
        }
    })

    app.get("/api/cuteness", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const cuteness = await sql.cuteness(Number(postID), req.session.username)
            res.status(200).send(cuteness)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.delete("/api/cuteness", async (req: Request, res: Response) => {
        try {
            const postID = req.query.postID
            if (Number.isNaN(Number(postID))) return res.status(400).send("Invalid postID")
            if (!req.session.username) return res.status(400).send("Bad request")
            const cuteness = await sql.cuteness(Number(postID), req.session.username)
            if (!cuteness) return res.status(400).send("Bad request")
            await sql.deleteCuteness(cuteness.cutenessID)
            res.status(200).send(cuteness)
        } catch {
            res.status(400).send("Bad request") 
        }
    })

    app.post("/api/aliastag", async (req: Request, res: Response) => {
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

export default PostRoutes