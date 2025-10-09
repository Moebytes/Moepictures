import functions from "./Functions"
import axios from "axios"
import {Session, Image} from "../types/Types"

export default class LinkFunctions {
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

    public static getHistoryImageLink = (historyFile: string) => {
        return `${window.location.protocol}//${window.location.host}/${historyFile}`
    }

    public static getImageLink = (image: Image, upscaled?: boolean) => {
        if (!image.filename && !image.upscaledFilename) return ""
        let filename = upscaled ? image.upscaledFilename || image.filename : image.filename
        const link = `${window.location.protocol}//${window.location.host}/${image.type}/${image.postID}-${image.order}-${encodeURIComponent(filename)}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash})
    }

    public static getRawImageLink = (filename: string) => {
        if (!filename) return ""
        return `${window.location.protocol}//${window.location.host}/${filename}`
    }

    public static getUnverifiedImageLink = (image: Image, upscaled?: boolean) => {
        if (!image.filename && !image.upscaledFilename) return ""
        let filename = upscaled ? image.upscaledFilename || image.filename : image.filename
        const link = `${window.location.protocol}//${window.location.host}/unverified/${image.type}/${image.postID}-${image.order}-${filename}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash})
    }

    public static getThumbnailLink = (image: Image, sizeType: string, session: Session, mobile?: boolean, forceLive?: boolean) => {
        if (!image.thumbnail && !image.filename) return ""
        let size = 265
        if (sizeType === "tiny") size = 350
        if (sizeType === "small") size = 400
        if (sizeType === "medium") size = 600
        if (sizeType === "large") size = 800
        if (sizeType === "massive") size = 1000
        if (mobile) size = Math.floor(size / 2)
        let originalFilename = `${image.postID}-${image.order}-${encodeURIComponent(image.filename)}`
        let filename = image.thumbnail || originalFilename
        if (forceLive) return this.getImageLink(image, false)
        if (image.type === "image" || image.type === "comic") {
            return this.getImageLink(image, false)
        }
        if (image.type === "animation" || image.type === "video") {
            if (session.liveAnimationPreview) return this.getImageLink(image, false)
        }
        if (image.type === "model" || image.type === "live2d") {
            if (session.liveModelPreview) return this.getImageLink(image, false)
        }
        const link = `${window.location.protocol}//${window.location.host}/thumbnail/${size}/${image.type}/${encodeURIComponent(filename)}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash})
    }

    public static getRawThumbnailLink = (filename: string, sizeType: string, mobile?: boolean) => {
        if (filename.startsWith(window.location.protocol)) return filename
        if (!filename) return ""
        let size = 265
        if (sizeType === "tiny") size = 350
        if (sizeType === "small") size = 400
        if (sizeType === "medium") size = 600
        if (sizeType === "large") size = 800
        if (sizeType === "massive") size = 1000
        if (mobile) size = Math.floor(size / 2)
        return `${window.location.protocol}//${window.location.host}/${`thumbnail/${size}/${filename}`}`
    }

    public static getUnverifiedThumbnailLink = (image: Image, sizeType: string, session: Session, mobile?: boolean) => {
        if (!image.thumbnail && !image.filename) return ""
        let size = 265
        if (sizeType === "tiny") size = 350
        if (sizeType === "small") size = 400
        if (sizeType === "medium") size = 600
        if (sizeType === "large") size = 800
        if (sizeType === "massive") size = 1000
        if (mobile) size = Math.floor(size / 2)
        let originalFilename = `${image.postID}-${image.order}-${encodeURIComponent(image.filename)}`
        let filename = image.thumbnail || originalFilename
        if (image.type === "image" || image.type === "comic") {
            return this.getUnverifiedImageLink(image, false)
        }
        if (image.type === "animation" || image.type === "video") {
            if (session.liveAnimationPreview) filename = originalFilename
        }
        if (image.type === "model" || image.type === "live2d") {
            if (session.liveModelPreview) filename = originalFilename
        }
        const link = `${window.location.protocol}//${window.location.host}/thumbnail/${size}/unverified/${image.type}/${filename}`
        return functions.util.appendURLParams(link, {hash: image.pixelHash})
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
        return `history/tag/${tag}/${key}/${filename}`
    }

    public static getTagLink = (folder: string, filename: string | null, hash: string | null) => {
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

    public static getUnverifiedTagLink = (folder: string, filename: string | null) => {
        if (!filename) return ""
        let dest = "tag"
        if (folder === "artist") dest = "artist"
        if (folder === "character") dest = "character"
        if (folder === "series") dest = "series"
        if (folder === "pfp") dest = "pfp"
        return `${window.location.protocol}//${window.location.host}/unverified/${dest}/${encodeURIComponent(filename)}`
    }

    public static linkToBase64 = async (link: string) => {
        const arrayBuffer = await axios.get(link, {responseType: "arraybuffer"}).then((r) => r.data) as ArrayBuffer
        if (!arrayBuffer.byteLength) return ""
        const buffer = Buffer.from(arrayBuffer)
        let mime = functions.byte.bufferFileType(arrayBuffer)[0]?.mime || "image/jpeg"
        return `data:${mime};base64,${buffer.toString("base64")}`
    }
}