/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {AbstractSource} from "./AbstractSource"

export class TumblrSource extends AbstractSource {
    public matches = (url: string) => {
        return /tumblr\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const html = await this.fetchText(url)
        const part = html.match(/(?<=srcSet=").*?(?="\/><\/div><\/figure)/gm)?.[0]?.trim() ?? ""
        const image = part.match(/(?<=,?\s)(https?:\/\/[^ ]+)(?=\s\d+w"?$)/gm)?.[0] ?? ""
        const buffer = await this.fetchBuffer(image)
        return [buffer]
    }
}