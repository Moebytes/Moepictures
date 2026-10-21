/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Dispatcher, ProxyAgent, fetch as proxyFetch} from "undici"
import {lookup} from "dns/promises"
import {isIP} from "net"

export default class ServerHTTP {
    private static proxyAgent: ProxyAgent | null = null
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

    public static validatePublicURL = async (input: string) => {
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
        return url
    }

    public static followRedirect = async (input: string, send: (url: URL) => Promise<Awaited<ReturnType<typeof proxyFetch>>> 
        = (url) => proxyFetch(url, {method: "HEAD", redirect: "manual"})) => {
        let current = await this.validatePublicURL(input)
        for (let redirects = 0; redirects <= 5; redirects++) {
            const response = await send(current)
            const location = response.headers.get("location")
            if (response.status < 300 || response.status >= 400 || !location) return response
            if (redirects === 5) throw new Error("Too many redirects")
            current = await this.validatePublicURL(new URL(location, current).href)
        }
        throw new Error("Too many redirects")
    }

    public static getProxy = async () => {
        if (this.proxyAgent && Date.now() < this.proxyExpiration) {
            return this.proxyAgent
        }

        const proxies = await fetch("https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt")
            .then((r) => r.text())
            .then((text) => text.split("\n").map((p) => p.trim()).filter(Boolean))
        const proxy = proxies[Math.floor(Math.random() * proxies.length)]

        this.proxyAgent = new ProxyAgent("http://" + proxy)
        this.proxyExpiration = Date.now() + 60 * 60 * 1000
        return this.proxyAgent
    }

    public static proxyFetch = async (link: string, headers: any = {}) => {
        try {
            const proxyAgent = await this.getProxy()
            return this.fetch(link, headers, proxyAgent)
        } catch (e) {
            console.log(e)
            this.proxyExpiration = 0
            if (this.proxyAgent) {
                this.proxyAgent.close()
                this.proxyAgent = null
            }
            return this.fetch(link, headers)
        }
    }

    public static fetch = async (link: string, headers: any = {}, dispatcher?: Dispatcher) => {
        if (link.includes("danbooru")) headers["user-agent"] = `user #${process.env.DANBOORU_USER}`
        return this.followRedirect(link, (url) => proxyFetch(url, {headers, dispatcher, redirect: "manual"}))
    }
}