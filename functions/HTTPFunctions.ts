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
    public static lockManager = {} as {[key: string]: Promise<any> | null}

    public static getJSON = async (link: string, headers?: any) => {
        return fetch(link, {headers}).then((r) => r.json())
    }

    public static getBuffer = async (link: string, headers?: any) => {
        return fetch(link, {headers, credentials: "include"}).then((r) => r.arrayBuffer())
    }

    public static updateClientKeys = async (session: Session, setSessionFlag?: (value: boolean) => void) => {
        if (this.privateKey) return this.privateKey
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
        return this.privateKey
    }

    public static updateServerPublicKey = async (session: Session, setSessionFlag?: (value: boolean) => void) => {
        if (this.serverPublicKey) return this.serverPublicKey
        if (this.serverKeyLock) await functions.timeout(1000 + Math.random() * 1000)
        if (!this.serverPublicKey) {
            this.serverKeyLock = true
            const response = await functions.http.post("/api/server-key", null, session, setSessionFlag)
            this.serverPublicKey = response.publicKey
        }
        return this.serverPublicKey
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
        setSessionFlag?: (value: boolean) => void, noLock?: boolean) => {
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
            let response: any
            let parsedURL = functions.util.parseURLParams(endpoint, params)
            if (noLock) {
                response = await fetch(parsedURL, {headers, credentials: "include"}).then((r) => r.arrayBuffer())
            } else {
                if (!this.lockManager[endpoint]) {
                    this.lockManager[endpoint] = fetch(parsedURL, {headers, credentials: "include"}).then((r) => r.arrayBuffer())
                }
                response = await this.lockManager[endpoint]
                this.lockManager[endpoint] = null
            }

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
        const headers = {"Content-Type": "application/json", "x-csrf-token": session.csrfToken}
        try {
            let body = data ? JSON.stringify(data) : null
            let response = await fetch(endpoint, {method: "POST", headers, credentials: "include", body}).then((r) => r.text())
            try {
                response = JSON.parse(response)
            } catch {}
            return response as PostEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static put = async <T extends string>(endpoint: T, data: PutEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"Content-Type": "application/json", "x-csrf-token": session.csrfToken}
        try {
            let body = data ? JSON.stringify(data) : null
            let response = await fetch(endpoint, {method: "PUT", headers, credentials: "include", body}).then((r) => r.text())
            try {
                response = JSON.parse(response)
            } catch {}
            return response as PutEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static delete = async <T extends string>(endpoint: T, params: DeleteEndpoint<T>["params"], session: Session, 
        setSessionFlag?: (value: boolean) => void) => {
        const headers = {"x-csrf-token": session.csrfToken}
        try {
            const parsedURL = functions.util.parseURLParams(endpoint, params)
            let response = await fetch(parsedURL, {method: "DELETE", headers, credentials: "include"}).then((r) => r.text())
            try {
                response = JSON.parse(response)
            } catch {}
            return response as DeleteEndpoint<T>["response"]
        } catch (err: any) {
            return Promise.reject(err)
        }
    }

    public static proxyImage = async (link: string, session: Session, setSessionFlag: (value: boolean) => void) => {
        try {
            const images = await functions.http.post(`/api/misc/proxy-images`, {url: encodeURIComponent(link)}, session, setSessionFlag)
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

    public static followRedirect = async (link: string) => {
        const response = await fetch(link, {method: "HEAD", redirect: "follow"})
        return response.url
    }

    public static followRedirects = async (link: string) => {
        let redirects = [] as string[]
        let currentLink = link

        while (true) {
            redirects.push(currentLink)

            const response = await fetch(currentLink, {redirect: "manual"})
            const location = response.headers.get("location")
            if (!location) break

            currentLink = new URL(location, currentLink).href
        }

        return redirects
    }
}