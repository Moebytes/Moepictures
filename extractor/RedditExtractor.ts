import snoowrap from "snoowrap"
import {SourceExtractor} from "./SourceExtractor"

let reddit: snoowrap

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

export class RedditExtractor extends SourceExtractor {
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