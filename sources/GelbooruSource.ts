/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {AbstractSource} from "./AbstractSource"

export class GelbooruSource extends AbstractSource {
    public matches = (url: string) => {
        return /gelbooru\.com/.test(url) || /safebooru\.org/.test(url)
    }

    public extractImages = async (url: string) => {
        let domain = new URL(url).hostname
        let id = url.match(/\d+/g)?.[0]
        const apiLink = `https://${domain}/index.php?page=dapi&s=post&q=index&json=1&id=${id}`
        const json = await this.fetchJSON(apiLink)
        let post = json.hasOwnProperty("post") ? json.post[0] : json[0]
        const image = await this.fetchBuffer(post.file_url)
        return [image]
    }
}