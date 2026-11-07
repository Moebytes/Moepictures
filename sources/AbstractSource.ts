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

    private remainingBytes = 32 * 1024 * 1024

    public readBody = async (response: Awaited<ReturnType<typeof serverFunctions.http.fetch>>) => {
        if (!response.body) return Buffer.alloc(0)
        const chunks: Uint8Array[] = []
        for await (const chunk of response.body) {
            this.remainingBytes -= chunk.length
            if (this.remainingBytes < 0) throw new RangeError("Exceeded size limit")
            chunks.push(chunk)
        }
        return Buffer.concat(chunks)
    }

    public fetchBuffer = async (url: string) => {
        const buffer = await serverFunctions.http.proxyFetch(url, this.headers)
        return this.readBody(buffer)
    }

    public fetchJSON = async (url: string) => {
        const text = await this.fetchText(url)
        return JSON.parse(text)
    }

    public fetchText = async (url: string) => {
        const buffer = await serverFunctions.http.fetch(url, this.headers)
        return this.readBody(buffer).toString()
    }
}