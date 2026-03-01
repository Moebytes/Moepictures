/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import path from "path"
import Pixiv from "pixiv.ts"
import JSZip from "jszip"
import {AbstractSource} from "./AbstractSource"
import {UgoiraData} from "../types/Types"

let pixiv: Pixiv

export class PixivSource extends AbstractSource {
    public get headers() {
        return {...super.headers, Referer: "https://www.pixiv.net/"}
    }

    public init = async () => {
        try {
            pixiv = await Pixiv.refreshLogin(process.env.PIXIV_TOKEN!)
        } catch (e) {
            console.log(e)
        }
    }

    public matches = (url: string) => {
        return /pixiv\.net/.test(url) || /pximg\.net/.test(url)
    }

    public extractImages = async (url: string) => {
        if (!pixiv) await this.init()
        let resolvable = url
        if (/pximg\.net/.test(url)) {
            if (/user-profile/.test(url)) {
                let image = await this.fetchBuffer(url)
                return [image]
            }
            resolvable = path.basename(url).match(/(\d+)(?=_)/)?.[0] ?? ""
        }
        const illust = await pixiv.illust.get(resolvable)
        if (!illust) throw new Error("bad illust")
        if (illust.type === "ugoira") {
            let meta = await pixiv.ugoira.get(resolvable)
            let buffer = await this.fetchBuffer(meta.ugoira_metadata.zip_urls.medium)
            const zip = await new JSZip().loadAsync(buffer)
            zip.file("animation.json", JSON.stringify(meta.ugoira_metadata.frames))
            let newBuffer = await zip.generateAsync({type: "nodebuffer"})
            return [newBuffer]
        }
        if (illust.meta_pages.length) {
            let images = [] as Buffer[]
            for (let i = 0; i < illust.meta_pages.length; i++) {
                const link = illust.meta_pages[i].image_urls.original
                const response = await this.fetchBuffer(link)
                images.push(response)
            }
            return images
        } else {
            const link = illust.meta_single_page.original_image_url || illust.image_urls.large || illust.image_urls.medium
            const image = await this.fetchBuffer(link)
            return [image]
        }
    }

    public illust = async (url: string) => {
        if (!pixiv) await this.init()
        let resolvable = url as string | number
        if (url.includes("pximg.net")) {
            const id = path.basename(url).match(/(\d+)(?=_)/)?.[0]
            resolvable = Number(id)
        }
        let illust = await pixiv.illust.get(resolvable)
        let ugoiraMetadata = null as UgoiraData | null
        if (illust.type === "ugoira") {
            ugoiraMetadata = await pixiv.ugoira.get(illust.id).then((r) => r.ugoira_metadata)
        }
        return {illust, ugoiraMetadata}
    }
}