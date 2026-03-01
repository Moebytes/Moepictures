/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {AbstractSource} from "./AbstractSource"

export class PinterestSource extends AbstractSource {
    public matches = (url: string) => {
        return /pinterest\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const html = await this.fetchText(url)
        const image = html.match(/(?<=")https:\/\/i\.pinimg\.com\/originals.*?(?=")/gm)?.[0] ?? ""
        const buffer = await this.fetchBuffer(image)
        return [buffer]
    }
}