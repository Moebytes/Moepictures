import functions from "./Functions"
import permissions from "./Permissions"
import {ServerSession} from "../types/Types"

export default class Crypto {
    public static generateAPIKey = (length = 64) => {
        let apiKey = ""
        return apiKey
    }

    public static hashAPIKey = (apiKey: string) => {
        return apiKey
    }

    public static generateKeys = () => {
        return {publicKey: "", privateKey: ""}
    }

    public static serverPublicKey = () => {
        return ""
    }

    public static encrypt = (buffer: Buffer, publicKey: string, session: ServerSession) => {
        return buffer
    }

    public static decrypt = (buffer: ArrayBuffer, privateKey: string, serverPublicKey: string, session: ServerSession) => {
        return buffer
    }

    public static encryptAPI = (data: any, publicKey: string, session: ServerSession) => {
        return data
    }

    public static decryptAPI = (data: any, privateKey: string, serverPublicKey: string, session: ServerSession) => {
        return data
    }

     public static decryptedLink = async (link: string, privateKey: string, serverPublicKey: string, session: ServerSession) => {
        if (permissions.noEncryption(session)) return link
        if (link.includes("/unverified")) return link
        if (functions.isVideo(link) || functions.isGIF(link)) return link
        const buffer = await fetch(link, {credentials: "include"}).then((r) => r.arrayBuffer())
        if (functions.isWebP(link)) if (functions.isAnimatedWebp(buffer)) return link
        if (!functions.isEncrypted(buffer)) return link
        try {
            const decrypted = Crypto.decrypt(buffer, privateKey, serverPublicKey, session)
            const blob = new Blob([new Uint8Array(decrypted)])
            return URL.createObjectURL(blob)
        } catch {
            return link
        }
     }

     public static decryptedBuffer = async (link: string, privateKey: string, serverPublicKey: string, session: ServerSession) => {
        const buffer = await fetch(link, {credentials: "include"}).then((r) => r.arrayBuffer())
        if (permissions.noEncryption(session)) return buffer
        if (link.includes("/unverified")) return buffer
        if (functions.isVideo(link) || functions.isGIF(link)) return buffer
        if (!functions.isEncrypted(buffer)) return buffer
        if (functions.isWebP(link)) if (functions.isAnimatedWebp(buffer)) return buffer
        const decrypted = Crypto.decrypt(buffer, privateKey, serverPublicKey, session)
        return decrypted
     }
}