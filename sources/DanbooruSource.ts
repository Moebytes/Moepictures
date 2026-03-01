/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {AbstractSource} from "./AbstractSource"

export class DanbooruSource extends AbstractSource {
    public matches = (url: string) => {
        return /danbooru\.donmai\.us/.test(url)
    }

    public extractImages = async (url: string) => {
        const json = await this.fetchJSON(`${url}.json`)
        const image = await this.fetchBuffer(json.file_url)
        return [image]
    }
}