/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Agent, Client, ProxyAgent, fetch as proxyFetch} from "undici"
import {lookup} from "dns/promises"
import {isIP} from "net"

export default class ServerHTTP {
    private static proxyURL: string | null = null
    private static proxyExpiration = 0

    public static isPublicIP = (address: string) => {
        const value = address.toLowerCase().split("%")[0]
        const version = isIP(value)

        if (version === 4) {
            const [a, b] = value.split(".").map(Number)
            return !(
                a === 0 || a === 10 ||
                a === 127 || a >= 224 ||
                (a === 100 && b >= 64 && b <= 127) ||
                (a === 169 && b === 254) ||
                (a === 172 && b >= 16 && b <= 31) ||
                (a === 192 && (b === 0 || b === 168)) ||
                (a === 198 && (b === 18 || b === 19)))
        }

        if (version === 6) {
            if (value.startsWith("::ffff:")) {
                return this.isPublicIP(value.slice(7))
            }
            return !(
                value === "::" ||
                value === "::1" ||
                /^[fcfd]/.test(value) ||
                /^fe[89ab]/.test(value) ||
                value.startsWith("ff"))
        }

        return false
    }

    private static resolvePublicURL = async (input: string) => {
        const url = new URL(input)
        if ((url.protocol !== "http:" && url.protocol !== "https:") || url.username || url.password) {
            throw new Error("Invalid url")
        }
        const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase()
        if (hostname === "localhost" || hostname.endsWith(".localhost") || 
            hostname.endsWith(".local") || hostname.endsWith(".internal")) {
            throw new Error("Invalid url")
        }
        const addresses = isIP(hostname) ? [{address: hostname}] : await lookup(hostname, {all: true, verbatim: true})
        if (!addresses.length || addresses.some((entry) => !this.isPublicIP(entry.address))) {
            throw new Error("Invalid url")
        }
        return {url, addresses}
    }

    public static validatePublicURL = async (input: string) => {
        const url = await this.resolvePublicURL(input).then((r) => r.url)
        return url
    }

    private static sendPinned = async (url: URL, addresses: {address: string}[], method: string,
        headers: {[key: string]: string}, proxyURL?: string) => {
        const hostname = url.hostname.replace(/^\[|\]$/g, "")
        const address = addresses[0].address
        const target = `${isIP(address) === 6 ? `[${address}]` : address}:${url.port || 
            (url.protocol === "https:" ? "443" : "80")}`

        const dispatcher = proxyURL ? new ProxyAgent({
            uri: proxyURL,
            clientFactory: (origin, options) => {
                const client = new Client(origin, options)
                const connect = client.connect.bind(client) as any
                client.connect = ((options: any, callback?: any) => connect({...options, path: target,
                    headers: {...options.headers, host: target}}, callback)) as typeof client.connect
                return client
            }
        }) : new Agent({connect: {
            lookup: ((_host: string, options: any, callback: any) => {
                const entries = addresses.map((entry) => ({address: entry.address, family: isIP(entry.address)}))
                if (options.all) callback(null, entries)
                else callback(null, entries[0].address, entries[0].family)
            }) as any,
            servername: isIP(hostname) ? undefined : hostname
        }})
        try {
            return await proxyFetch(url, {method, headers, dispatcher, 
                redirect: "manual", signal: AbortSignal.timeout(60000)})
        } finally {
            void dispatcher.close().catch(() => {})
        }
    }

    public static followRedirect = async (input: string, method = "HEAD", headers: Record<string, string> = {}, proxyURL?: string) => {
        let current = await this.resolvePublicURL(input)
        for (let redirects = 0; redirects <= 5; redirects++) {
            const response = await this.sendPinned(current.url, current.addresses, method, headers, proxyURL)
            const location = response.headers.get("location")
            if (response.status < 300 || response.status >= 400 || !location) return response
            await response.body?.cancel()
            if (redirects === 5) throw new Error("Too many redirects")
            current = await this.resolvePublicURL(new URL(location, current.url).href)
        }
        throw new Error("Too many redirects")
    }

    public static getProxy = async () => {
        if (this.proxyURL && Date.now() < this.proxyExpiration) {
            return this.proxyURL
        }

        const proxies = await fetch("https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt")
            .then((r) => r.text())
            .then((text) => text.split("\n").map((p) => p.trim()).filter(Boolean))
        const proxy = proxies[Math.floor(Math.random() * proxies.length)]

        this.proxyURL = "http://" + proxy
        this.proxyExpiration = Date.now() + 60 * 60 * 1000
        return this.proxyURL
    }

    public static proxyFetch = async (link: string, headers: any = {}) => {
        try {
            const proxyURL = await this.getProxy()
            return await this.fetch(link, headers, proxyURL)
        } catch (e) {
            console.log(e)
            this.proxyExpiration = 0
            this.proxyURL = null
            return this.fetch(link, headers)
        }
    }

    public static fetch = async (link: string, headers: any = {}, proxyURL?: string) => {
        if (link.includes("danbooru")) headers["user-agent"] = `user #${process.env.DANBOORU_USER}`
        return this.followRedirect(link, "GET", headers, proxyURL)
    }
}