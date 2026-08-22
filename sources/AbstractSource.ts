/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import serverFunctions from "../server/ServerFunctions"

export abstract class AbstractSource {
    public constructor(public url: string) {}

    public get headers(): {[key: string]: string} {
        return {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.5",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0"
        }
    }

    public abstract matches(url: string): boolean

    public abstract extractImages(url: string): Promise<Buffer[]>

    public fetchBuffer = async (url: string) => {
        const arrayBuffer = await serverFunctions.http.proxyFetch(url, this.headers).then((r) => r.arrayBuffer())
        return Buffer.from(arrayBuffer)
    }

    public fetchJSON = async (url: string) => {
        return serverFunctions.http.proxyFetch(url, this.headers).then((r) => r.json()) as any
    }

    public fetchText = async (url: string) => {
        return fetch(url, {headers: this.headers}).then((r) => r.text())
    }
}