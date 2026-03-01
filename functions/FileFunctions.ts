/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import path from "path"
import functions from "./Functions"
import fileType from "magic-bytes.js"
import {isLive2DZip as verifyLive2DZip} from "live2d-renderer"
import JSZip from "jszip"

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"]
const animationExtensions = [".gif", ".webp", ".apng", ".png", ".zip"]
const videoExtensions = [".mp4", ".webm", ".mov", ".mkv"]
const audioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".aac"]
const modelExtensions = [".glb", ".gltf", ".fbx", ".vrm", ".obj"]

export default class FileFunctions {
    public static isImage = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, imageExtensions)
        }
        if (file.startsWith("data:image")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, imageExtensions)
    }

    public static isAnimation = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, animationExtensions)
        }
        if (file.startsWith("data:image")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, animationExtensions)
    }

    public static isAudio = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, audioExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, audioExtensions)
    }

    public static isModel = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, modelExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, modelExtensions)
    }

    public static isZip = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".zip"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".zip"
    }

    public static isGIF = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".gif"
        }
        if (file?.startsWith("data:image/gif")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".gif"
    }

    public static isWebP = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webp"
        }
        if (file?.startsWith("data:image/webp")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".webp"
    }

    public static isPNG = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".png" || ext === ".apng"
        }
        if (file?.startsWith("data:image/png")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".png" || ext === ".apng"
    }

    public static isGLTF = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".glb"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".glb"
    }

    public static isOBJ = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".obj"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".obj"
    }

    public static isFBX = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".fbx"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".fbx"
    }

    public static isVRM = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".vrm"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".vrm"
    }

    public static isAnimatedWebp = (buffer: ArrayBuffer) => {
        let str = ""
        const byteArray = new Uint8Array(Buffer.from(buffer))
        for (let i = 0; i < byteArray.length; i++) {
            str += String.fromCharCode(byteArray[i])
        }
        return str.indexOf("ANMF") !== -1
    }

    public static isAnimatedPng = (buffer: ArrayBuffer) => {
        let str = ""
        const byteArray = new Uint8Array(Buffer.from(buffer))
        for (let i = 0; i < byteArray.length; i++) {
            str += String.fromCharCode(byteArray[i])
        }
        return str.indexOf("acTL") !== -1
    }

    public static isVideo = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, videoExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, videoExtensions)
    }

    public static isMP4 = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mp4"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".mp4"
    }

    public static isWebM = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webm"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".webm"
    }

    public static isLive2DZip = async (buffer: ArrayBuffer) => {
        return verifyLive2DZip(buffer)
    }

    public static isLive2D = async (file?: string) => {
        if (!file) return false
        const buffer = await functions.http.getBuffer(file)
        return this.isLive2DZip(buffer)
    }

    public static isUgoiraZip = async (buffer: ArrayBuffer) => {
        let isZip = false
        const result = fileType(new Uint8Array(buffer))?.[0] || {mime: ""}
        if (result.mime === "application/zip") isZip = true
        if (!isZip) return false
        
        const zip = await JSZip.loadAsync(buffer)
        
        let hasImage = false
        let hasAnimation = false

        for (const [relativePath, file] of Object.entries(zip.files)) {
            if (relativePath.startsWith("__MACOSX") || file.dir) continue
            if (relativePath.endsWith('animation.json')) hasAnimation = true
            if (relativePath.match(/\.(png|jpg|webp|avif)$/)) hasImage = true
        }
        
        return hasImage && hasAnimation
    }

    public static isUgoira = async (file?: string) => {
        if (!file) return false
        const buffer = await functions.http.getBuffer(file)
        return this.isUgoiraZip(buffer)
    }
}