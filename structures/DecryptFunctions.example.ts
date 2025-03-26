import functions from "./Functions"
import permissions from "./Permissions"
import {ServerSession} from "../types/Types"

export default class DecryptFunctions {
    public static generateKeys = () => {
        return {publicKey: "", privateKey: ""}
    }

    public static decrypt = (arrayBuffer: ArrayBuffer, privateKey: string, serverPublicKey: string, session: ServerSession) => {
        return arrayBuffer
    }

    public static decryptAPI = (data: any, privateKey: string, serverPublicKey: string, session: ServerSession) => {
        return data
    }

     public static decryptedLink = async (link: string, privateKey: string, serverPublicKey: string, session: ServerSession) => {
        if (permissions.noEncryption(session)) return link
        if (link.includes("/unverified")) return link
        if (functions.isVideo(link)) return link
        const buffer = await fetch(link, {credentials: "include"}).then((r) => r.arrayBuffer())
        if (!functions.isEncrypted(buffer, link)) return link
        try {
            let decrypted = DecryptFunctions.decrypt(buffer, privateKey, serverPublicKey, session)
            if (!decrypted.byteLength) decrypted = Buffer.from(buffer)
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
        if (functions.isVideo(link)) return buffer
        if (!functions.isEncrypted(buffer, link)) return buffer
        const decrypted = DecryptFunctions.decrypt(buffer, privateKey, serverPublicKey, session)
        return decrypted
     }
}