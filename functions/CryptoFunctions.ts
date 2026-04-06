/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import path from "path"
import functions from "./Functions"
import permissions from "../structures/Permissions"
import decryption from "../structures/Decryption"
import {Session} from "../types/Types"

export default class CryptoFunctions {
    public static bufferToPem = (buffer: ArrayBuffer, label: string) => {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        return `-----BEGIN ${label}-----\n${base64.match(/.{1,64}/g)?.join('\n')}\n-----END ${label}-----`
    }

    public static pemToBuffer = (pem: string) => {
        const base64 = pem.replace(/-----BEGIN .*-----|-----END .*-----|\s+/g, "")
        const binary = atob(base64)
        const buffer = new ArrayBuffer(binary.length)
        const view = new Uint8Array(buffer)
        for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
        return buffer
    }
    
    public static isEncrypted = (buffer: ArrayBuffer | Buffer, link: string) => {
        const result = functions.byte.bufferFileType(buffer)
        if (result.length) {
            if (result[0].typename === "mp3" && !functions.file.isAudio(link)) return true
            if (result[0].typename === "exe") return true
            if (result[0].typename === "pic") return true
            if (result[0].typename === "mpeg") return true
            if (result[0].typename === "Json") return true
            return false
        }
        return true
    }

    public static decryptThumb = async (img: string, session: Session, cacheKey?: string, forceImage?: boolean) => {
        if (permissions.noEncryption(session)) return img
        let privateKey = await functions.http.updateClientKeys(session)
        let serverPublicKey = await functions.http.updateServerPublicKey(session)

        if (!cacheKey) cacheKey = img
        const cached = functions.cache.getThumbCache(cacheKey)
        if (cached) return cached
        let isAnimatedWebP = false
        let isAnimatedPNG = false
        let arrayBuffer = null as ArrayBuffer | null
        let decryptedImg = await decryption.decryptedLink(img, privateKey, serverPublicKey, session)
        if (forceImage && functions.file.isVideo(img)) {
            const url = await functions.video.videoThumbnail(img)
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedThumbs.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (await functions.file.isLive2D(img)) {
            const url = await functions.model.live2dScreenshot(decryptedImg)
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedThumbs.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (await functions.file.isUgoira(img)) {
            const url = await functions.anim.ugoiraThumbnail(decryptedImg)
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedThumbs.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (functions.file.isModel(img)) {
            const url = await functions.model.modelImage(decryptedImg, img)
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedThumbs.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (functions.file.isAudio(img)) {
            const url = await functions.audio.songCover(decryptedImg)
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedThumbs.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (functions.file.isWebP(img)) {
            arrayBuffer = await functions.http.getBuffer(img)
            isAnimatedWebP = functions.file.isAnimatedWebp(arrayBuffer)
        }
        if (functions.file.isPNG(img)) {
            arrayBuffer = await functions.http.getBuffer(img)
            isAnimatedPNG = functions.file.isAnimatedPng(arrayBuffer)
        }
        if (functions.file.isImage(img) && !isAnimatedWebP && !isAnimatedPNG) {
            const base64 = await functions.link.linkToBase64(decryptedImg)
            functions.cache.cachedImages.set(cacheKey, base64)
            return base64
        } else {
            if (!arrayBuffer) arrayBuffer = await functions.http.getBuffer(decryptedImg)
            const url = URL.createObjectURL(new Blob([arrayBuffer]))
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
    }

    public static decryptItem = async (img: string, session: Session, cacheKey?: string) => {
        if (permissions.noEncryption(session)) return img
        let privateKey = await functions.http.updateClientKeys(session)
        let serverPublicKey = await functions.http.updateServerPublicKey(session)

        if (!cacheKey) cacheKey = img
        const cached = functions.cache.getImageCache(cacheKey)
        if (cached) return cached
        if (functions.file.isVideo(img)) {
            return img
        }
        let isAnimatedWebP = false
        let isAnimatedPNG = false
        let arrayBuffer = null as ArrayBuffer | null
        let decrypted = await decryption.decryptedLink(img, privateKey, serverPublicKey, session)
        if (functions.file.isWebP(img)) {
            arrayBuffer = await functions.http.getBuffer(img)
            isAnimatedWebP = functions.file.isAnimatedWebp(arrayBuffer)
        }
        if (functions.file.isPNG(img)) {
            arrayBuffer = await functions.http.getBuffer(img)
            isAnimatedPNG = functions.file.isAnimatedPng(arrayBuffer)
        }
        if (functions.file.isImage(img) && !isAnimatedWebP && !isAnimatedPNG) {
            const base64 = await functions.link.linkToBase64(decrypted)
            functions.cache.cachedImages.set(cacheKey, base64)
            return base64
        } else {
            arrayBuffer = await functions.http.getBuffer(decrypted)
            const url = URL.createObjectURL(new Blob([arrayBuffer]))
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
    }

    public static decryptBuffer = async (buffer: ArrayBuffer, imageLink: string, session: Session) => {
        if (permissions.noEncryption(session)) return buffer
        let privateKey = await functions.http.updateClientKeys(session)
        let serverPublicKey = await functions.http.updateServerPublicKey(session)

        if (functions.file.isVideo(imageLink)) {
            return buffer
        }
        let decrypted = decryption.decrypt(buffer, privateKey, serverPublicKey, session)
        return decrypted
    }
}