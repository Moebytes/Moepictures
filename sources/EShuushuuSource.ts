/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {AbstractSource} from "./AbstractSource"

export class EShuushuuSource extends AbstractSource {
    public matches = (url: string) => {
        return /e-shuushuu\.net/.test(url)
    }

    public extractImages = async (url: string) => {
        const html = await this.fetchText(url)
        const imagePart = html.match(/(\/images\/).*?(?=")/gm)?.[0]
        const image = `https://e-shuushuu.net${imagePart}`
        const buffer = await this.fetchBuffer(image)
        return [buffer]
    }
}