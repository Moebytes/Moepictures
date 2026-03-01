/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {AbstractSource} from "./AbstractSource"

export class ZerochanSource extends AbstractSource {
    public matches = (url: string) => {
        return /zerochan\.net/.test(url)
    }

    public extractImages = async (url: string) => {
        let json = await this.fetchJSON(`${url}?json`)
        let image = await this.fetchBuffer(json.full)
        return [image]
    }
}