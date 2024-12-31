import functions from "./Functions"

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

    public static encrypt = (buffer: Buffer, publicKey: string) => {
        return buffer
    }

    public static decrypt = (buffer: ArrayBuffer | Buffer, privateKey: string, serverPublicKey: string) => {
        return buffer
    }

    public static encryptAPI = (data: any, publicKey: string) => {
        return data
    }

    public static decryptAPI = (data: any, privateKey: string, serverPublicKey: string) => {
        return data
    }

     public static decryptedLink = async (link: string, privateKey: string, serverPublicKey: string) => {
        if (link.includes("/unverified")) return link
        if (functions.isVideo(link) || functions.isGIF(link)) return link
        const buffer = await fetch(link, {credentials: "include"}).then((r) => r.arrayBuffer())
        if (functions.isWebP(link)) if (functions.isAnimatedWebp(buffer)) return link
        if (!functions.isEncrypted(buffer)) return link
        try {
            const decrypted = Crypto.decrypt(buffer, privateKey, serverPublicKey)
            const blob = new Blob([new Uint8Array(decrypted)])
            return URL.createObjectURL(blob)
        } catch {
            return link
        }
     }

     public static decryptedBuffer = async (link: string, privateKey: string, serverPublicKey: string) => {
        const buffer = await fetch(link, {credentials: "include"}).then((r) => r.arrayBuffer())
        if (link.includes("/unverified")) return buffer
        if (functions.isVideo(link) || functions.isGIF(link)) buffer
        if (!functions.isEncrypted(buffer)) return buffer
        if (functions.isWebP(link)) if (functions.isAnimatedWebp(buffer)) return buffer
        const decrypted = Crypto.decrypt(buffer, privateKey, serverPublicKey)
        return decrypted
     }
}