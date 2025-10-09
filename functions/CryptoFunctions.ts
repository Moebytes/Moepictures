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
        let privateKey = functions.http.privateKey
        let serverPublicKey = functions.http.serverPublicKey
        if (!privateKey) await functions.http.updateClientKeys(session)
        if (!serverPublicKey) await functions.http.updateServerPublicKey(session)
        privateKey = functions.http.privateKey
        serverPublicKey = functions.http.serverPublicKey

        if (!cacheKey) cacheKey = img
        const cached = functions.cache.cachedThumbs.get(cacheKey)
        if (cached) return cached
        let isAnimatedWebP = false
        let arrayBuffer = null as ArrayBuffer | null
        let decryptedImg = await decryption.decryptedLink(img, privateKey, serverPublicKey, session)
        if (forceImage && functions.file.isVideo(img)) {
            const url = await functions.video.videoThumbnail(img)
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedThumbs.set(cacheKey, cacheUrl)
            return cacheUrl
        }
        if (functions.file.isLive2D(img)) {
            const url = await functions.model.live2dScreenshot(decryptedImg + "#.zip")
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
            arrayBuffer = await fetch(img).then((r) => r.arrayBuffer()) as ArrayBuffer
            isAnimatedWebP = functions.file.isAnimatedWebp(arrayBuffer)
        }
        if (functions.file.isImage(img) && !isAnimatedWebP) {
            const base64 = await functions.link.linkToBase64(decryptedImg)
            functions.cache.cachedImages.set(cacheKey, base64)
            return base64
        } else {
            if (!arrayBuffer) arrayBuffer = await fetch(decryptedImg).then((r) => r.arrayBuffer()) as ArrayBuffer
            const url = URL.createObjectURL(new Blob([arrayBuffer]))
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
    }

    public static decryptItem = async (img: string, session: Session, cacheKey?: string) => {
        if (permissions.noEncryption(session)) return img
        let privateKey = functions.http.privateKey
        let serverPublicKey = functions.http.serverPublicKey
        if (!privateKey) await functions.http.updateClientKeys(session)
        if (!serverPublicKey) await functions.http.updateServerPublicKey(session)
        privateKey = functions.http.privateKey
        serverPublicKey = functions.http.serverPublicKey

        if (!cacheKey) cacheKey = img
        const cached = functions.cache.cachedImages.get(cacheKey)
        if (cached) return cached
        if (functions.file.isVideo(img)) {
            return img
        }
        let isAnimatedWebP = false
        let arrayBuffer = null as ArrayBuffer | null
        let decrypted = await decryption.decryptedLink(img, privateKey, serverPublicKey, session)
        if (functions.file.isWebP(img)) {
            arrayBuffer = await fetch(img).then((r) => r.arrayBuffer()) as ArrayBuffer
            isAnimatedWebP = functions.file.isAnimatedWebp(arrayBuffer)
        }
        if (functions.file.isImage(img) && !isAnimatedWebP) {
            const base64 = await functions.link.linkToBase64(decrypted)
            functions.cache.cachedImages.set(cacheKey, base64)
            return base64
        } else {
            arrayBuffer = await fetch(decrypted).then((r) => r.arrayBuffer()) as ArrayBuffer
            const url = URL.createObjectURL(new Blob([arrayBuffer]))
            let cacheUrl = `${url}#${path.extname(img)}`
            functions.cache.cachedImages.set(cacheKey, cacheUrl)
            return cacheUrl
        }
    }

    public static decryptBuffer = async (buffer: ArrayBuffer, imageLink: string, session: Session) => {
        if (permissions.noEncryption(session)) return buffer
        let privateKey = functions.http.privateKey
        let serverPublicKey = functions.http.serverPublicKey
        if (!privateKey) await functions.http.updateClientKeys(session)
        if (!serverPublicKey) await functions.http.updateServerPublicKey(session)
        privateKey = functions.http.privateKey
        serverPublicKey = functions.http.serverPublicKey

        if (functions.file.isVideo(imageLink)) {
            return buffer
        }
        let decrypted = decryption.decrypt(buffer, privateKey, serverPublicKey, session)
        return decrypted
    }
}