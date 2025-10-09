import crypto from "crypto"
import {ServerSession} from "../types/Types"

export default class Encryption {
    public static generateAPIKey = (length = 64) => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        const randomBytes = crypto.randomBytes(length)
        let apiKey = ""
        
        for (let i = 0; i < length; i++) {
            apiKey += characters[randomBytes[i] % characters.length]
        }

        return apiKey
    }

    public static hashAPIKey = (apiKey: string) => {
        return ""
    }

    public static serverPublicKey = () => {
        return ""
    }

    public static encryptAPI = (data: any, publicKey: string, session: ServerSession) => {
        return data
    }
    
    public static encrypt = (buffer: Buffer, publicKey: string, session: ServerSession) => {
        return buffer
    }
}