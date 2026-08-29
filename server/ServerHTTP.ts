/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {ProxyAgent, fetch as proxyFetch} from "undici"

export default class ServerHTTP {
    private static proxyAgent: ProxyAgent | null = null
    private static proxyExpiration = 0

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
            const result = await proxyFetch(link, {headers, dispatcher: proxyAgent})
            return result
        } catch (e) {
            console.log(e)
            this.proxyExpiration = 0
            if (this.proxyAgent) {
                this.proxyAgent.close()
                this.proxyAgent = null
            }
            return globalThis.fetch(link, {headers})
        }
    }

    public static fetch = async (link: string, headers: any = {}) => {
        if (link.includes("danbooru")) headers["user-agent"] = `user #${process.env.DANBOORU_USER}`
        return globalThis.fetch(link, {headers})
    }
}