/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import crypto from "crypto"
import sql from "../sql/SQLQuery"
import functions from "../functions/Functions"
import serverFunctions from "./ServerFunctions"
import {Image, UploadImage, PostFull, DeletedPost, Note, UnverifiedPost, PostCuteness} from "../types/Types"

export default class ServerPosts {
    public static imagesChanged = async (oldImages: Image[], newImages: UploadImage[], upscaled: boolean, r18: boolean) => {
        if (oldImages?.length !== newImages?.length) return true
        for (let i = 0; i < oldImages.length; i++) {
            const oldImage = oldImages[i]
            const newImage = newImages[i]
            if ((oldImage.altSource ?? "") !== (newImage.altSource ?? "")) return true
            if ((oldImage.directLink ?? "") !== (newImage.directLink ?? "")) return true
            let oldPath = ""
            if (upscaled) {
                oldPath = functions.link.getUpscaledImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.upscaledFilename || oldImage.filename)
            } else {
                oldPath = functions.link.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            }
            const oldBuffer = await serverFunctions.files.getFile(oldPath, false, r18, oldImage.pixelHash)
            if (!oldBuffer) continue
            const newBuffer = Buffer.from(newImage.bytes)
            const imgMD5 = crypto.createHash("md5").update(oldBuffer).digest("hex")
            const currentMD5 = crypto.createHash("md5").update(newBuffer).digest("hex")
            if (imgMD5 !== currentMD5) return true
        }
        return false
    }

    public static imagesChangedUnverified = async (oldImages: Image[], newImages: Image[] | UploadImage[], upscaled: boolean, isEdit?: boolean, r18?: boolean) => {
        if (oldImages?.length !== newImages?.length) return true
        for (let i = 0; i < oldImages.length; i++) {
            const oldImage = oldImages[i]
            const newImage = newImages[i]
            if (!oldImage || !newImage) continue
            let oldPath = ""
            if (upscaled) {
                oldPath = functions.link.getUpscaledImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.upscaledFilename || oldImage.filename)
            } else {
                oldPath = functions.link.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            }
            const oldBuffer = isEdit ? await serverFunctions.files.getFile(oldPath, false, r18 ?? false, oldImage.pixelHash) : await serverFunctions.files.getUnverifiedFile(oldPath, false, oldImage.pixelHash)
            if (!oldBuffer) continue
            let newBuffer = null as Buffer | null
            if ("bytes" in newImage) {
                newBuffer = Buffer.from(newImage.bytes)
            } else {
                let newPath = ""
                let postImage = newImage as Image
                if (upscaled) {
                    newPath = functions.link.getUpscaledImagePath(postImage.type, postImage.postID, postImage.order, postImage.upscaledFilename || postImage.filename)
                } else {
                    newPath = functions.link.getImagePath(postImage.type, postImage.postID, postImage.order, postImage.filename)
                }
                newBuffer = await serverFunctions.files.getUnverifiedFile(newPath, false, newImage.pixelHash)
            }
            if (!newBuffer) continue
            const imgMD5 = crypto.createHash("md5").update(oldBuffer).digest("hex")
            const currentMD5 = crypto.createHash("md5").update(newBuffer as any).digest("hex")
            if (imgMD5 !== currentMD5) return true
        }
        return false
    }

    public static buffersChanged = (oldBuffer: Buffer, currentBuffer: Buffer) => {
        if (!oldBuffer && !currentBuffer) return false
        if (!oldBuffer && currentBuffer) return true
        const imgMD5 = crypto.createHash("md5").update(oldBuffer as any).digest("hex")
        const currentMD5 = crypto.createHash("md5").update(currentBuffer as any).digest("hex")
        if (imgMD5 !== currentMD5) return true
        return false
    }

    public static migratePost = async (postID: string, oldType: string, newType: string, oldR18: boolean, newR18: boolean) => {
        if (oldType === newType && oldR18 === newR18) return

        const post = await sql.post.post(postID) as PostFull
        for (let i = 0; i < post.images.length; i++) {
            if ((post.images[i].type === "image" || post.images[i].type === "comic") && 
            (newType === "image" || newType === "comic")) {
                await sql.post.updateImage(post.images[i].imageID, "type", newType)
            }
        }
        const updated = await sql.post.post(postID) as PostFull
        for (let i = 0; i < post.images.length; i++) {
            const imagePath = functions.link.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
            const upscaledImagePath = functions.link.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
            const updatedImagePath = functions.link.getImagePath(updated.images[i].type, updated.postID, updated.images[i].order, updated.images[i].filename)
            const updatedUpscaledImagePath = functions.link.getUpscaledImagePath(updated.images[i].type, updated.postID, updated.images[i].order, updated.images[i].upscaledFilename || updated.images[i].filename)

            if (oldR18 !== newR18 || imagePath !== updatedImagePath || upscaledImagePath !== updatedUpscaledImagePath) {
                serverFunctions.files.renameFile(imagePath, updatedImagePath, oldR18, newR18)
                serverFunctions.files.renameFile(upscaledImagePath, updatedUpscaledImagePath, oldR18, newR18)
            }
        }
        if (oldR18 !== newR18) {
            serverFunctions.files.renameFolder(`history/post/${post.postID}`, `history/post/${post.postID}`, oldR18, newR18)
        }
    }

    public static reorderHashes = async (oldImages: Image[], newImages: Image[] | UploadImage[], r18: boolean, unverified?: boolean) => {
        let oldHashes = [] as {hash: string, order: number}[]
        let newHashes = [] as {hash: string, order: number}[]
        for (let i = 0; i < oldImages.length; i++) {
            const oldImage = oldImages[i]
            const newImage = newImages[i]
            if (!oldImage || !newImage) continue
            let oldPath = functions.link.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            const oldBuffer = unverified ? await serverFunctions.files.getUnverifiedFile(oldPath, false, oldImage.pixelHash)
            : await serverFunctions.files.getFile(oldPath, false, r18, oldImage.pixelHash)
            let newBuffer = null as Buffer | null
            if ("bytes" in newImage) {
                newBuffer = Buffer.from(newImage.bytes)
            } else {
                let postImage = newImage as Image
                let newPath = functions.link.getImagePath(postImage.type, postImage.postID, postImage.order, postImage.filename)
                newBuffer = unverified ? await serverFunctions.files.getUnverifiedFile(newPath, false, newImage.pixelHash)
                : await serverFunctions.files.getFile(newPath, false, r18, newImage.pixelHash)
            }
            try {
                let oldHash = await serverFunctions.util.pHash(oldBuffer!)
                let newHash = await serverFunctions.util.pHash(newBuffer!)
                oldHashes.push({hash: oldHash, order: oldImage.order})
                newHashes.push({hash: newHash, order: (newImage as Image)?.order || i + 1})

            } catch {
                let oldHash = serverFunctions.util.md5(oldBuffer)
                let newHash = serverFunctions.util.md5(newBuffer)
                oldHashes.push({hash: oldHash, order: oldImage.order})
                newHashes.push({hash: newHash, order: (newImage as Image)?.order || i + 1})
            }
        }
        return {oldHashes, newHashes}
    }

    public static migrateNotes = async (oldImages: Image[], newImages: Image[] | UploadImage[], r18: boolean, unverified?: boolean) => {
        const {oldHashes, newHashes} = await this.reorderHashes(oldImages, newImages, r18, unverified)
        let changedNotes = [] as {noteID: string, oldOrder: number, newOrder: number}[]
        let deletedNotes = [] as {noteID: string}[]
        const postID = oldImages[0].postID
        let postNotes = [] as Note[]
        if (unverified) {
            postNotes = await sql.note.unverifiedPostNotes(postID)
        } else {
            postNotes = await sql.note.postNotes(postID)
        }
        for (const note of postNotes) {
            const hash = note.imageHash
            const oldOrder = oldHashes.find((o) => dist(o.hash, hash) < 6)?.order
            if (!oldOrder) continue
            const newOrder = newHashes.find((n) => dist(n.hash, hash) < 6)?.order
            if (newOrder === undefined) {
                deletedNotes.push({noteID: note.noteID})
            } else if (oldOrder !== newOrder) {
                changedNotes.push({noteID: note.noteID, oldOrder, newOrder})
            }
        }
        for (const changed of changedNotes) {
            if (unverified) {
                await sql.note.updateUnverifiedNote(changed.noteID, "order", changed.newOrder)
            } else {
                await sql.note.updateNote(changed.noteID, "order", changed.newOrder)
            }
        }
        for (const deleted of deletedNotes) {
            if (unverified) {
                await sql.note.deleteUnverifiedNote(deleted.noteID)
            } else {
                await sql.note.deleteNote(deleted.noteID)
            }
        }
    }

    public static imageOrderHashes = (post: PostFull) => {
        let hashMap = {} as {[key: string]: string}
        for (const image of post.images) {
            hashMap[image.order] = image.pixelHash
        }
        return hashMap
    }

    public static resolveImageOrder = (image: Image, images: Image[], imageOrderHashes?: {[key: string]: string}) => {
        if (imageOrderHashes) {
            let pixelHash = imageOrderHashes[String(image.order)]
            let resolved = images.find((i) => i.pixelHash === pixelHash)
            return resolved?.order ?? image.order
        } else {
            return image.order
        }
    }

    public static applyImageSources = async (postID: string, imageSources?: {[key: string]: string | null} | null, 
        unverified?: boolean, imageOrderHashes?: {[key: string]: string}) => {
        let post = unverified ? await sql.post.unverifiedPost(postID) : await sql.post.post(postID)
        if (!post) return
        for (const image of post.images) {
            let order = this.resolveImageOrder(image, post.images, imageOrderHashes)
            let altSource = imageSources?.[String(order)] ?? null
            if (unverified) {
                await sql.post.updateUnverifiedImage(image.imageID, "altSource", altSource)
            } else {
                await sql.post.updateImage(image.imageID, "altSource", altSource)
            }
        }
    }

    public static applyImageLinks = async (postID: string, imageLinks?: {[key: string]: string | null} | null, 
        unverified?: boolean, imageOrderHashes?: {[key: string]: string}) => {
        let post = unverified ? await sql.post.unverifiedPost(postID) : await sql.post.post(postID)
        if (!post) return
        for (const image of post.images) {
            let order = this.resolveImageOrder(image, post.images, imageOrderHashes)
            let directLink = imageLinks?.[String(order)] ?? null
            if (unverified) {
                await sql.post.updateUnverifiedImage(image.imageID, "directLink", directLink)
            } else {
                await sql.post.updateImage(image.imageID, "directLink", directLink)
            }
        }
    }

    public static deletePost = async (post: DeletedPost | PostCuteness) => {
        let r18 = functions.post.isR18(post.rating)
        await sql.post.deletePost(post.postID)
        for (let i = 0; i < post.images.length; i++) {
            const file = functions.link.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
            const upscaledFile = functions.link.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
            const thumbnail = functions.link.getThumbnailImagePath(post.images[i].type, post.images[i].thumbnail)
            await serverFunctions.files.deleteFile(file, r18)
            await serverFunctions.files.deleteFile(upscaledFile, r18)
            await serverFunctions.files.deleteFile(thumbnail, r18)
        }
        await serverFunctions.files.deleteFolder(`history/post/${post.postID}`, r18).catch(() => null)
    }

    public static deleteUnverifiedPost = async (unverified: UnverifiedPost) => {
        await sql.post.deleteUnverifiedPost(unverified.postID)
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.link.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
            const upscaledFile = functions.link.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
            const thumbnail = functions.link.getThumbnailImagePath(unverified.images[i].type, unverified.images[i].thumbnail)
            await serverFunctions.files.deleteUnverifiedFile(file)
            await serverFunctions.files.deleteUnverifiedFile(upscaledFile)
            await serverFunctions.files.deleteUnverifiedFile(thumbnail)
        }
    }

    public static updateHashes = async () => {
        console.log("Updating all hashes...")
        const modelPosts = await sql.search.search([], "model", "all", "all", "date")
        const audioPosts = await sql.search.search([], "audio", "all", "all", "date")
        const posts = [...modelPosts, ...audioPosts]
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i]
            for (let j = 0; j < post.images.length; j++) {
                const image = post.images[j]
                const imgPath = functions.link.getImagePath(image.type, post.postID, image.order, image.filename)
                const buffer = await serverFunctions.files.getFile(imgPath, false, false, image.pixelHash)
                const md5 = crypto.createHash("md5").update(buffer).digest("hex")
                await sql.post.updateImage(image.imageID, "hash", md5)
            }
        }
        console.log("Done")
    }

    public static postIDFromPixivID = async (rawPixivID: string) => {
        const pixivID = rawPixivID.match(/(\d+)/g)?.[0] || ""
        const result = await sql.search.searchPixivID(pixivID, "", "", "", "")
        return result[0] ? result[0].postID : ""
    }

    public static resolveSourceLink = (hash: string, order: number, sourceLinks: {link: string, hash: string}[]) => {
        // Test at the order first
        let first = sourceLinks[order - 1]
        if (first && dist(hash, first.hash) < 6) return first.link

        for (const current of sourceLinks) {
            if (dist(hash, current.hash) < 6) return current.link
        }

        return null
    }
}