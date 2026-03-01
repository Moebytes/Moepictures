/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Scraper} from "@the-convocation/twitter-scraper"
// @ts-ignore
import {cycleTLSFetch} from "@the-convocation/twitter-scraper/cycletls"
import {AbstractSource} from "./AbstractSource"

let twitter: Scraper

export class TwitterSource extends AbstractSource {
    public init = async () => {
        try {
            twitter = new Scraper({fetch: cycleTLSFetch})
        } catch (e) {
            console.log(e)
        }
    }
    
    public matches = (url: string) => {
        return /twitter\.com/.test(url) || /x\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const id = url.match(/(?<=status\/)\d+/)?.[0] || ""
        const tweet = await twitter.getTweet(id)
        if (!tweet) throw new Error("bad tweet")
        let images = [] as Buffer[]
        for (let i = 0; i < tweet.photos.length; i++) {
            const response = await this.fetchBuffer(tweet.photos[i].url)
            images.push(response)
        }
        for (let i = 0; i < tweet.videos.length; i++) {
            const response = await this.fetchBuffer(tweet.videos[i].url || tweet.videos[i].preview)
            images.push(response)
        }
        return images
    }
}