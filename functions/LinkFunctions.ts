/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import functions from "./Functions"
import {Session, Image, Post, PostHistory, Tag, TagCount, MiniTag} from "../types/Types"

export default class LinkFunctions {
    private static postImageCache: Map<string, string> = new Map()
    private static postThumbnailCache: Map<string, string> = new Map()
    
    public static getImagePath = (folder: string, postID: string, order: number, filename: string) => {
        return `${folder}/${postID}-${order}-${filename}`
    }

    public static getUpscaledImagePath = (folder: string, postID: string, order: number, filename: string) => {
        return `${folder}-upscaled/${postID}-${order}-${filename}`
    }

    public static getThumbnailImagePath = (folder: string, filename: string) => {
        if (!filename) return ""
        return `thumbnail/${folder}/${filename}`
    }

    public static getImageHistoryPath = (postID: string, key: number, order: number, filename: string) => {
        return `history/post/${postID}/original/${key}/${postID}-${order}-${filename}`
    }

    public static getUpscaledImageHistoryPath = (postID: string, key: number, order: number, filename: string) => {
        return `history/post/${postID}/upscaled/${key}/${postID}-${order}-${filename}`
    }

    public static getImageLink = (image: Image, upscaled?: boolean) => {
        if (!image.filename && !image.upscaledFilename) return ""
        if (upscaled && image.upscaledImageLink) return image.upscaledImageLink
        if (image.imageLink) return image.imageLink
        let filename = upscaled ? image.upscaledFilename || image.filename : image.filename
        const link = `${window.location.protocol}//${window.location.host}/${image.type}/${image.postID}-${image.order}-${encodeURIComponent(filename)}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash})
    }

    public static getRawImageLink = (filename: string) => {
        if (!filename) return ""
        return `${window.location.protocol}//${window.location.host}/${filename}`
    }

    public static getPostImage = async (partialPost: Post | PostHistory, index: number, 
        session: Session, upscaled?: boolean) => {
        const cacheKey = `${partialPost.postID}:${index}`

        if (this.postImageCache.has(cacheKey)) {
            return this.postImageCache.get(cacheKey)!
        }

        let image = partialPost.images[index]
        if (typeof image === "string") {
            if (image.startsWith("history/post")) return `${functions.config.getDomain()}/${image}`
            if (image.startsWith("http") && new URL(image).searchParams.has("hash")) return image
        }
        let post = await functions.http.get("/api/post", {postID: partialPost.postID}, session, undefined, true)
        if (!post) return ""
        const img = this.getImageLink(post.images[index], upscaled)

        this.postImageCache.set(cacheKey, img)
        return img
    }

    public static getUnverifiedImageLink = (image: Image, upscaled?: boolean) => {
        if (!image.filename && !image.upscaledFilename) return ""
        let filename = upscaled ? image.upscaledFilename || image.filename : image.filename
        const link = `${window.location.protocol}//${window.location.host}/unverified/${image.type}/${image.postID}-${image.order}-${filename}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash, upscaled})
    }

    public static getThumbnailLink = (image: Image, sizeType: string, session: Session, mobile?: boolean, forceLive?: boolean) => {
        if (!image.thumbnail && !image.filename) return ""
        let originalFilename = `${image.postID}-${image.order}-${encodeURIComponent(image.filename)}`
        let filename = image.thumbnail || originalFilename
        if (forceLive) return this.getImageLink(image, false)
        if (image.type === "image" || image.type === "comic") {
            if (sizeType === "massive" && !mobile) {
                return this.getImageLink(image, false)
            }
        }
        if (image.type === "animation" || image.type === "video") {
            if (session.liveAnimationPreview && !mobile && !functions.file.isZip(originalFilename)) return this.getImageLink(image, false)
        }
        if (image.type === "model" || image.type === "live2d") {
            if (session.liveModelPreview && !mobile) return this.getImageLink(image, false)
        }
        if (image.thumbLink) return image.thumbLink
        const link = `${window.location.protocol}//${window.location.host}/thumbnail/${image.type}/${encodeURIComponent(filename)}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash})
    }

    public static getRawThumbnailLink = (filename: string, sizeType: string, mobile?: boolean) => {
        if (filename.startsWith(window.location.protocol)) return filename
        if (!filename) return ""
        if (sizeType === "massive" && !mobile) {
            return this.getRawImageLink(filename)
        }
        return `${window.location.protocol}//${window.location.host}/thumbnail/${filename}`
    }

    public static getPostThumbnail = async (partialPost: Post | PostHistory, index: number, sizeType: string, 
        session: Session, mobile?: boolean) => {
        const cacheKey = `${partialPost.postID}:${index}:${sizeType}:${mobile ? 1 : 0}`

        if (this.postThumbnailCache.has(cacheKey)) {
            return this.postThumbnailCache.get(cacheKey)!
        }

        let image = partialPost.images[index]
        if (typeof image === "string") {
            if (image.startsWith("history/post")) return `${functions.config.getDomain()}/${image}`
            if (image.startsWith("http") && new URL(image).searchParams.has("hash")) return image
        }
        let post = await functions.http.get("/api/post", {postID: partialPost.postID}, session, undefined, true)
        if (!post) return ""
        const thumb = this.getThumbnailLink(post.images[index], sizeType, session, mobile)

        this.postThumbnailCache.set(cacheKey, thumb)
        return thumb
    }

    public static getUnverifiedThumbnailLink = (image: Image, sizeType: string, session: Session, mobile?: boolean) => {
        if (!image.thumbnail && !image.filename) return ""
        let originalFilename = `${image.postID}-${image.order}-${encodeURIComponent(image.filename)}`
        let filename = image.thumbnail || originalFilename
        if (image.type === "image" || image.type === "comic") {
            if (sizeType === "massive" && !mobile) {
                return this.getUnverifiedImageLink(image, false)
            }
        }
        if (image.type === "animation" || image.type === "video") {
            if (session.liveAnimationPreview && !mobile && !functions.file.isZip(originalFilename)) filename = originalFilename
        }
        if (image.type === "model" || image.type === "live2d") {
            if (session.liveModelPreview && !mobile) filename = originalFilename
        }
        const link = `${window.location.protocol}//${window.location.host}/thumbnail/unverified/${image.type}/${filename}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash, upscaled: false})
    }

    public static getTagPath = (folder: string, filename: string) => {
        let dest = "tag"
        if (folder === "artist") dest = "artist"
        if (folder === "character") dest = "character"
        if (folder === "series") dest = "series"
        if (folder === "pfp") dest = "pfp"
        return `${dest}/${filename}`
    }

    public static getTagHistoryPath = (tag: string, key: number, filename: string) => {
        return `history/tag/${encodeURIComponent(tag)}/${key}/${filename}`
    }

     public static getTagLink = (tag: Tag | TagCount | MiniTag) => {
        if (!tag.image) return ""
        let dest = "tag"
        if (tag.type === "artist") dest = "artist"
        if (tag.type === "character") dest = "character"
        if (tag.type === "series") dest = "series"
        if (tag.imageLink) return tag.imageLink
        if (tag.image.includes("history/")) return `${window.location.protocol}//${window.location.host}/${tag.image}`
        const link = `${window.location.protocol}//${window.location.host}/${dest}/${encodeURIComponent(tag.image)}`
        return tag.imageHash ? functions.util.appendURLParams(link, {hash: tag.imageHash}) : link
    }

    public static getFolderLink = (folder: string, filename: string | null, hash: string | null) => {
        if (!filename) return ""
        let dest = "tag"
        if (folder === "artist") dest = "artist"
        if (folder === "character") dest = "character"
        if (folder === "series") dest = "series"
        if (folder === "pfp") dest = "pfp"
        if (!folder || filename.includes("history/")) return `${window.location.protocol}//${window.location.host}/${filename}`
        const link = `${window.location.protocol}//${window.location.host}/${dest}/${encodeURIComponent(filename)}`
        return hash ? functions.util.appendURLParams(link, {hash: hash}) : link
    }

    public static getUnverifiedFolderLink = (folder: string, filename: string | null) => {
        if (!filename) return ""
        let dest = "tag"
        if (folder === "artist") dest = "artist"
        if (folder === "character") dest = "character"
        if (folder === "series") dest = "series"
        if (folder === "pfp") dest = "pfp"
        return `${window.location.protocol}//${window.location.host}/unverified/${dest}/${encodeURIComponent(filename)}`
    }

    public static linkToBase64 = async (link: string) => {
        const arrayBuffer = await functions.http.getBuffer(link)
        if (!arrayBuffer.byteLength) return ""
        const buffer = Buffer.from(arrayBuffer)
        let mime = functions.byte.bufferFileType(arrayBuffer)[0]?.mime || "image/jpeg"
        return `data:${mime};base64,${buffer.toString("base64")}`
    }
}