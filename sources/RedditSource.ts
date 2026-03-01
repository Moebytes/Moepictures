/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import snoowrap from "snoowrap"
import {AbstractSource} from "./AbstractSource"

let reddit: snoowrap

export class RedditSource extends AbstractSource {
    public init = async () => {
        try {
            reddit = new snoowrap({
                userAgent: process.env.REDDIT_USER_AGENT!,
                clientId: process.env.REDDIT_APP_ID,
                clientSecret: process.env.REDDIT_APP_SECRET,
                refreshToken: process.env.REDDIT_REFRESH_TOKEN
            })
        } catch (e) {
            console.log(e)
        }
    }

    public matches = (url: string) => {
        return /reddit\.com/.test(url)
    }

    public extractImages = async (url: string) => {
        const postID = url.match(/(?<=comments\/).*?(?=\/|$)/)?.[0]
        // @ts-ignore
        const post = await reddit.getSubmission(postID).fetch() as snoowrap.Submission
        if (!post) throw new Error("bad post")
        const image = await this.fetchBuffer(post.url)
        return [image]
    }
}