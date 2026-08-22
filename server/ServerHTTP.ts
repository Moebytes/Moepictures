/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {ProxyAgent, fetch as proxyFetch} from "undici"

export default class ServerHTTP {
    private static proxyAgent: ProxyAgent | null = null
    private static proxyExpiration = 0
    private static proxyPromise: Promise<ProxyAgent> | null = null

    public static getProxy = async () => {
        if (this.proxyAgent && Date.now() < this.proxyExpiration) {
            return this.proxyAgent
        }
        if (this.proxyPromise) return this.proxyPromise

        this.proxyPromise = (async () => {
            const proxies = await fetch("https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/protocols/http/data.txt")
                .then((r) => r.text())
                .then((text) => text.split("\n").map((p) => p.trim()).filter(Boolean))

            proxies.sort(() => Math.random() - 0.5)

            for (const proxy of proxies) {
                try {
                    const proxyAgent = new ProxyAgent(proxy)
                    const response = await proxyFetch("https://www.google.com/generate_204", {
                        dispatcher: proxyAgent,
                        signal: AbortSignal.timeout(5000)
                    })

                    if (response.status === 204) {
                        this.proxyAgent = proxyAgent
                        this.proxyExpiration = Date.now() + 60 * 60 * 1000
                        this.proxyPromise = null
                        return proxyAgent
                    }
                    proxyAgent.close()
                } catch {}
            }

            this.proxyPromise = null
            throw new Error("no working proxies")
        })()

        return this.proxyPromise
    }

    public static proxyFetch = async (link: string, headers: any = {}) => {
        try {
            const proxyAgent = await this.getProxy()
            if (link.includes("danbooru")) headers["user-agent"] = `${process.env.DANBOORU_USERNAME}`

            // disable for now
            // return proxyFetch(link, {headers, dispatcher: proxyAgent})
            return fetch(link, {headers})
        } catch (e) {
            console.log(e)
            this.proxyExpiration = 0

            if (this.proxyAgent) {
                this.proxyAgent.close()
                this.proxyAgent = null
            }
            return fetch(link, {headers})
        }
    }
}