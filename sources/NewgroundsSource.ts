/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {AbstractSource} from "./AbstractSource"

export class NewgroundsSource extends AbstractSource {
    public matches = (url: string) => {
        return /newgrounds\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const html = await this.fetchText(url)
        const image = html.match(/(?<=full_image_text":"<img src=\\")(.*?)(?=\\")/gm)?.[0]?.replaceAll("\\", "") ?? ""
        const buffer = await this.fetchBuffer(image)
        return [buffer]
    }
}