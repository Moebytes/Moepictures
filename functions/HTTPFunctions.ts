import axios from "axios"
import path from "path"
import localforage from "localforage"
import functions from "./Functions"
import decryption from "../structures/Decryption"
import {GetEndpoint, PostEndpoint, PutEndpoint, DeleteEndpoint, Session,  PostSearchParams} from "../types/Types"

export default class HTTPFunctions {
    public static privateKey = ""
    public static clientKeyLock = false
    public static serverPublicKey = ""
    public static serverKeyLock = false

    public static fetch = async (link: string, headers?: any) => {
        return axios.get(link, {headers}).then((r) => r.data) as Promise<any>
    }

    public static getBuffer = async (link: string, headers?: any) => {
        return axios.get(link, {responseType: "arraybuffer", withCredentials: true, headers}).then((r) => r.data) as Promise<ArrayBuffer>
    }

    public static updateClientKeys = async (session: Session, setSessionFlag?: (value: boolean) => void) => {
        if (this.privateKey) return
        if (this.clientKeyLock) await functions.timeout(1000 + Math.random() * 1000)
        if (!this.privateKey) {
            this.clientKeyLock = true
            const savedPublicKey = await localforage.getItem("publicKey") as string
            const savedPrivateKey = await localforage.getItem("privateKey") as string
            if (savedPublicKey && savedPrivateKey) {
                await functions.http.post("/api/client-key", {publicKey: savedPublicKey}, session, setSessionFlag)
                this.privateKey = savedPrivateKey
            } else {
                const keys = decryption.generateKeys()
                await functions.http.post("/api/client-key", {publicKey: keys.publicKey}, session, setSessionFlag)
                await localforage.setItem("publicKey", keys.publicKey)
                await localforage.setItem("privateKey", keys.privateKey)
                this.privateKey = keys.privateKey
            }
        }
    }

    public static updateServerPublicKey = async (session: Session, setSessionFlag?: (value: boolean) => void) => {
        if (this.serverPublicKey) return
        if (this.serverKeyLock) await functions.timeout(1000 + Math.random() * 1000)
        if (!this.serverPublicKey) {
            this.serverKeyLock = true
            const response = await functions.http.post("/api/server-key", null, session, setSessionFlag)
            this.serverPublicKey = response.publicKey
        }
    }

    public static arrayBufferToJSON = (arrayBuffer: ArrayBuffer) => {
        if (!arrayBuffer.byteLength) return undefined
        const text = new TextDecoder("utf-8").decode(arrayBuffer)
        try {
            const json = JSON.parse(text)
            return json
        } catch {
            return null
        }
    }

    public static get = async <T extends string>(endpoint: T, params: GetEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        if (!this.privateKey) await functions.http.updateClientKeys(session)
        if (!this.serverPublicKey) await functions.http.updateServerPublicKey(session)
        const headers = {"x-csrf-token": session.csrfToken}

        let cacheKey = `${endpoint}_${JSON.stringify(params)}`
        if ((params as PostSearchParams)?.sort !== "random") {
            let cachedResponse = functions.cache.cachedResponses.get(cacheKey)
            if (cachedResponse && Date.now() < cachedResponse.expires) {
                return cachedResponse.data as GetEndpoint<T>["response"]
            }
        }

        try {
            const response = await axios.get(endpoint, {params: params, headers, withCredentials: true, responseType: "arraybuffer"}).then((r) => r.data)
            const json = functions.http.arrayBufferToJSON(response)
            if (json !== null) {
                functions.cache.cachedResponses.set(cacheKey, {data: json, expires: Date.now() + functions.cache.cacheDuration})
                return json as GetEndpoint<T>["response"]
            }
            let decrypted = decryption.decryptAPI(response, this.privateKey, this.serverPublicKey, session)?.toString()
            try {
                decrypted = JSON.parse(decrypted!)
            } catch {}
            functions.cache.cachedResponses.set(cacheKey, {data: decrypted, expires: Date.now() + functions.cache.cacheDuration})
            return decrypted as GetEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static post = async <T extends string>(endpoint: T, data: PostEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"x-csrf-token": session.csrfToken}
        try {
            const response = await axios.post(endpoint, data as any, {headers, withCredentials: true}).then((r) => r.data)
            return response as PostEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static put = async <T extends string>(endpoint: T, data: PutEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"x-csrf-token": session.csrfToken}
        try {
            const response = await axios.put(endpoint, data as any, {headers, withCredentials: true}).then((r) => r.data)
            return response as PutEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static delete = async <T extends string>(endpoint: T, params: DeleteEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"x-csrf-token": session.csrfToken}
        try {
            const response = await axios.delete(endpoint, {params, headers, withCredentials: true}).then((r) => r.data)
            return response as DeleteEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static proxyImage = async (link: string, session: Session, setSessionFlag: (value: boolean) => void) => {
        try {
            const images = await functions.http.post(`/api/misc/proxy`, {url: encodeURIComponent(link)}, session, setSessionFlag)
            let files = [] as File[]
            for (let i = 0; i < images.length; i++) {
                const blob = new Blob([new Uint8Array(images[i].data)])
                const file = new File([blob], path.basename(link) + ".png")
                files.push(file)
            }
            return files
        } catch {
            const response = await fetch(link, {headers: {Referer: "https://www.pixiv.net/"}}).then((r) => r.arrayBuffer())
            const blob = new Blob([new Uint8Array(response)])
            const file = new File([blob], path.basename(link) + ".png")
            return [file]
        }
    }

    public static getImageOrFallback = async (path: string, fallback: string) => {
        return new Promise<string>(resolve => {
          const img = new window.Image()
          img.src = path
          img.onload = () => resolve(path)
          img.onerror = () => resolve(fallback)
        })
    }

    public static linkExists = async (link: string) => {
        const response = await fetch(link, {method: "HEAD"}).then((r) => r.status)
        return response !== 404
    }
}