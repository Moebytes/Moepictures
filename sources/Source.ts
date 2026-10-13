/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {ArtstationSource} from "./ArtstationSource"
import {ArtStreetSource} from "./ArtStreetSource"
import {DeviantArtSource} from "./DeviantArtSource"
import {ImgurSource} from "./ImgurSource"
import {PinterestSource} from "./PinterestSource"
import {PixivSource} from "./PixivSource"
import {RedditSource} from "./RedditSource"
import {SkebSource} from "./SkebSource"
import {TumblrSource} from "./TumblrSource"
import {TwitterSource} from "./TwitterSource"
import serverFunctions from "../server/ServerFunctions"

export default class Source {
    public static extractImages = async (url: string) => {
        let sources = [
            new PixivSource(url),
            new TwitterSource(url),
            new SkebSource(url),
            new DeviantArtSource(url),
            new ArtstationSource(url),
            new RedditSource(url),
            new TumblrSource(url),
            new ArtStreetSource(url),
            new PinterestSource(url),
            new ImgurSource(url)
        ]

        for (const source of sources) {
            if (source.matches(url)) {
                try {
                    let images = await source.extractImages(url)
                    return images
                } catch {}
            }
        }

        let arrayBuffer = await serverFunctions.http.fetch(url).then((r) => r.arrayBuffer())
        let buffer = Buffer.from(arrayBuffer)
        return [buffer]
    }

    public static pixivIllust = async (url: string) => {
        const pixivSource = new PixivSource(url)
        return pixivSource.illust(url)
    }
}