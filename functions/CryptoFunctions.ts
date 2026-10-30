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
    private static pendingImages = new Map<string, Promise<string>>()
    
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

    private static pendingThumbs = new Map<string, Promise<string>>()

    public static decryptThumb = async (img: string, session: Session, cacheKey = img, forceImage?: boolean) => {
        if (permissions.noEncryption(session)) return img
        const cached = functions.cache.getThumbCache(cacheKey)
        if (cached) return cached
        const pendingKey = `${cacheKey}:${Boolean(forceImage)}`
        let pending = this.pendingThumbs.get(pendingKey)
        if (!pending) {
            pending = this.loadThumb(img, session, forceImage).then((url) => {
                functions.cache.cachedThumbs.set(cacheKey, url)
                return url
            }).finally(() => {this.pendingThumbs.delete(pendingKey)})
            this.pendingThumbs.set(pendingKey, pending)
        }
        return pending
    }

    private static loadThumb = async (img: string, session: Session, forceImage?: boolean) => {
        const privateKey = await functions.http.updateClientKeys(session)
        const serverPublicKey = await functions.http.updateServerPublicKey(session)
        if (forceImage && functions.file.isVideo(img)) {
            const url = await functions.video.videoThumbnail(img)
            return `${url}#${path.extname(img)}`
        }
        const decryptedImg = await decryption.decryptedLink(img, privateKey, serverPublicKey, session)
        const buffer = await functions.http.getBuffer(decryptedImg)
        const type = functions.byte.bufferFileType(buffer)[0]
        if (type?.mime === "application/zip") {
            if (await functions.file.isLive2DZip(buffer)) {
                const url = await functions.model.live2dScreenshot(decryptedImg)
                return `${url}#${path.extname(img)}`
            }
            if (await functions.file.isUgoiraZip(buffer)) {
                const url = await functions.anim.ugoiraThumbnail(decryptedImg)
                return `${url}#${path.extname(img)}`
            }
        }
        if (functions.file.isModel(img)) {
            const url = await functions.model.modelImage(decryptedImg, img)
            return `${url}#${path.extname(img)}`
        }
        if (functions.file.isAudio(img)) {
            const url = await functions.audio.songCover(decryptedImg)
            return `${url}#${path.extname(img)}`
        }
        const animated = (functions.file.isWebP(img) && functions.file.isAnimatedWebp(buffer)) ||
            (functions.file.isPNG(img) && functions.file.isAnimatedPng(buffer))
        if (functions.file.isImage(img) && !animated) {
            const mime = type?.mime || "image/jpeg"
            const base64 = `data:${mime};base64,${Buffer.from(buffer).toString("base64")}`
            if (decryptedImg !== img && decryptedImg.startsWith("blob:")) URL.revokeObjectURL(decryptedImg)
            return base64
        }
        return `${decryptedImg}#${path.extname(img)}`
    }

    public static decryptItem = async (img: string, session: Session, cacheKey = img) => {
        if (permissions.noEncryption(session)) return img
        const cached = functions.cache.getImageCache(cacheKey)
        if (cached) return cached
        if (functions.file.isVideo(img)) return img
        let pending = this.pendingImages.get(cacheKey)
        if (!pending) {
            pending = this.loadItem(img, session, cacheKey).finally(() => {
                this.pendingImages.delete(cacheKey)
            })
            this.pendingImages.set(cacheKey, pending)
        }
        return pending
    }

    private static loadItem = async (img: string, session: Session, cacheKey: string) => {
        const privateKey = await functions.http.updateClientKeys(session)
        const serverPublicKey = await functions.http.updateServerPublicKey(session)
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