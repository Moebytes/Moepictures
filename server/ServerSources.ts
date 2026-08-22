/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import path from "path"
import Pixiv from "pixiv.ts"
import DeviantArt from "deviantart.ts"
import {Scraper} from "@the-convocation/twitter-scraper"
// @ts-ignore
import {cycleTLSFetch} from "@the-convocation/twitter-scraper/cycletls"
import FormData from "form-data"
import axios from "axios"
import sharp from "sharp"
import serverFunctions from "./ServerFunctions"
import functions from "../functions/Functions"
import sql from "../sql/SQLQuery"
import {UploadImage, PostRating, UploadTag, PixivResponse, SaucenaoResponse} from "../types/Types"

let pixiv: Pixiv
let deviantart: DeviantArt
let twitter: Scraper

try {
    pixiv = await Pixiv.refreshLogin(process.env.PIXIV_TOKEN!)
    deviantart = await DeviantArt.login(process.env.DEVIANTART_CLIENT_ID!, process.env.DEVIANTART_CLIENT_SECRET!)
    twitter = new Scraper({fetch: cycleTLSFetch})
} catch (e) {
    console.log(e)
}

export default class ServerSources {
    public static checkArtistConflict = async (artistTag: string, userProfile: string) => {
        if (!userProfile) return artistTag
        const tag = await sql.tag.tag(artistTag)
        if (!tag || !tag?.social) return artistTag
        let conflict = tag.social !== userProfile
        if (!conflict && tag.description) {
            const profiles = functions.util.extractLinks(tag.description)
            if (profiles.length) conflict = !profiles.includes(userProfile)
        }
        if (conflict) {
            let id = userProfile.match(/\d+/)?.[0] || ""
            if (id) return `${artistTag}-(${id})`
        }
        return artistTag
    }

    public static pixivLookup = async (pixivLink: string, rating: PostRating) => {
        let source = ""
        let artist = ""
        let title = ""
        let englishTitle = ""
        let commentary = ""
        let englishCommentary = ""
        let posted = ""
        let bookmarks = ""
        let userProfile = ""
        let sourceImageCount = null as number | null
        let artistIcon = ""
        let artists = [{}] as UploadTag[]
        let sourceLinks = [] as {link: string, hash: string}[]
        let pixivTags = [] as string[]
        let drawingTools = [] as string[]
        let isAI = false

        const pixivID = pixivLink.match(/\d{5,}/gm)?.[0] ?? ""
        source = `https://www.pixiv.net/artworks/${pixivID}`
        try {
            const result = await serverFunctions.proxyFetch(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixivID}`).then((r) => r.json()) as any
            if (result.length) {
                if (result[0].rating === "q") rating = functions.highestRating(rating, functions.r17())
                if (result[0].rating === "e") rating = functions.highestRating(rating, functions.r18())
            }
        } catch {}

        let resolvable = source
        if (source.includes("pximg.net")) {
            resolvable = path.basename(source).match(/(\d+)(?=_)/)?.[0] || ""
        }
        const illust = await pixiv.illust.get(resolvable) as PixivResponse
        if (!illust) throw new Error("illust doesn't exist")
        userProfile = `https://www.pixiv.net/users/${illust.user.id}`
        const user = await pixiv.user.webDetail(illust.user.id)
        const twitter = user.social?.twitter?.url?.trim().match(/(?<=com\/).*?(?=\?|$)/)?.[0]
        illust.user.twitter = twitter || ""
        illust.user.profile_image_urls.medium = user.imageBig
        isAI = pixiv.util.isAI(illust, ["AI"])
                
        commentary = `${functions.util.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
        posted = functions.date.formatDate(new Date(illust.create_date), true)
        source = illust.url!
        title = illust.title
        artist = illust.user.name
        bookmarks = String(illust.total_bookmarks)
        sourceImageCount = illust.page_count
        pixivTags = illust.tags.map((t) => t.name)
        drawingTools = illust.tools
        const translated = await serverFunctions.util.translate([title, commentary])
        if (translated) {
            englishTitle = translated[0]
            englishCommentary = translated[1]
        }
        if (illust.x_restrict !== 0) {
            rating = functions.highestRating(rating, functions.r17())
        }
        let artistTag = illust.user.twitter ? functions.tag.fixTwitterTag(illust.user.twitter) : await serverFunctions.util.romajinize([artist]).then((r) => r[0])
        artists[artists.length - 1].tag = await this.checkArtistConflict(artistTag, userProfile)
        artistIcon = illust.user.profile_image_urls.medium
        artists.push({})

        let rawLinks = [] as string[]
        if (illust.meta_pages.length) {
            rawLinks = illust.meta_pages.map((m) => m.image_urls.original)
        } else if (illust.meta_single_page.original_image_url) {
            rawLinks = [illust.meta_single_page.original_image_url]
        }

        for (const link of rawLinks) {
            const buffer = await serverFunctions.util.imageBuffer(link)
            const hash = await serverFunctions.util.pHash(buffer)
            sourceLinks.push({link, hash})
        }

        return {source, artist, title, englishTitle, commentary, englishCommentary, pixivTags,
            userProfile, drawingTools, sourceImageCount, posted, bookmarks, 
            artistIcon, artists, rating, sourceLinks, isAI}
    }

    public static twitterLookup = async (twitterLink: string, rating: PostRating) => {
        let source = ""
        let artist = ""
        let title = ""
        let englishTitle = ""
        let commentary = ""
        let englishCommentary = ""
        let posted = ""
        let bookmarks = ""
        let userProfile = ""
        let sourceImageCount = null as number | null
        let artistIcon = ""
        let artists = [{}] as UploadTag[]
        let sourceLinks = [] as {link: string, hash: string}[]

        if (!twitter.isLoggedIn) {
            await twitter.login(process.env.TWITTER_USERNAME!, 
                process.env.TWITTER_PASSWORD!, process.env.TWITTER_EMAIL!)
        }
        const twitterID = twitterLink.match(/\d{10,}/gm)?.[0] ?? ""
        const tweet = await twitter.getTweet(twitterID)
        if (!tweet) throw new Error("tweet doesn't exist")
        const redirectLink = tweet.text?.match(/(https:\/\/t.co).*?(?=$)/gm)?.[0] ?? ""

        const redirects = await functions.http.followRedirects(redirectLink)
        for (const redirect of redirects) {
            if (redirect.includes("t.co")) continue
            try {
                let cleaned = redirect.replace("/photo/1", "")
                const result = await serverFunctions.proxyFetch(`https://danbooru.donmai.us/posts.json?tags=source%3A${cleaned}`).then((r) => r.json()) as any
                if (result.length) {
                    if (result[0].rating === "q") rating = functions.highestRating(rating, functions.r17())
                    if (result[0].rating === "e") rating = functions.highestRating(rating, functions.r18())
                }
            } catch {}
        }

        const tweetText = tweet.text?.replace(/(https:\/\/t.co).*?(?=$)/gm, "").trim()
        commentary = tweetText ?? ""
        posted = functions.date.formatDate(new Date(tweet?.timeParsed!), true)
        source = tweet.permanentUrl?.replace("x.com", "twitter.com") ?? ""
        title = tweetText ?? ""
        artist = tweet.username ?? ""
        bookmarks = String(tweet?.likes)
        userProfile = `https://twitter.com/${tweet.username}`
        sourceImageCount = tweet.photos.length
        
        const translated = await serverFunctions.util.translate([title, commentary])
        if (translated) {
            englishTitle = translated[0]
            englishCommentary = translated[1]
        }
        if (tweet.sensitiveContent) {
            rating = functions.highestRating(rating, functions.r17())
        }
        let artistTag = tweet.username ?? ""
        artists[artists.length - 1].tag = await this.checkArtistConflict(artistTag, userProfile)
        let profile = await twitter.getProfile(tweet.username ?? "").catch(() => ({avatar: ""}))
        artistIcon = profile.avatar ?? ""
        artists.push({})

        let rawLinks = [] as string[]
        if (tweet.photos.length) {
            rawLinks = tweet.photos.map((p) => p.url)
        }

        for (const link of rawLinks) {
            const buffer = await serverFunctions.util.imageBuffer(link)
            const hash = await serverFunctions.util.pHash(buffer)
            sourceLinks.push({link, hash})
        }

        return {source, artist, title, englishTitle, commentary, englishCommentary, userProfile,
            sourceImageCount, posted, bookmarks, artistIcon, artists, rating, sourceLinks}
    }

    public static deviantartLookup = async (deviantartLink: string, rating: PostRating) => {
        let source = ""
        let artist = ""
        let title = ""
        let englishTitle = ""
        let commentary = ""
        let englishCommentary = ""
        let posted = ""
        let bookmarks = ""
        let userProfile = ""
        let sourceImageCount = null as number | null
        let artistIcon = ""
        let artists = [{}] as UploadTag[]
        let sourceLinks = [] as {link: string, hash: string}[]

        const deviationRSS = await deviantart.rss.get(deviantartLink)
        const deviation = await deviantart.extendRSSDeviations([deviationRSS]).then((r) => r[0])
        title = deviation.title
        artist = deviation.author.user.username
        source = deviation.url
        commentary = deviation.description
        posted = functions.date.formatDate(new Date(deviation.date), true)
        userProfile = `https://www.deviantart.com/${deviation.author.user.username}`
        sourceImageCount = deviation.content.length
        if (deviation.rating === "adult") {
            rating = functions.highestRating(rating, functions.r17())
        }
        artists[artists.length - 1].tag = await this.checkArtistConflict(artist, userProfile)
        artistIcon = deviation.author.user.usericon
        artists.push({})

        let rawLinks = [] as string[]
        if (deviation.content.length) {
            rawLinks = deviation.content.map((c) => c.url)
        }

        for (const link of rawLinks) {
            const buffer = await serverFunctions.util.imageBuffer(link)
            const hash = await serverFunctions.util.pHash(buffer)
            sourceLinks.push({link, hash})
        }

        return {source, artist, title, englishTitle, commentary, englishCommentary, userProfile,
            sourceImageCount, posted, bookmarks, artistIcon, artists, rating, sourceLinks}
    }

    public static danbooruLookup = async (danbooruLink: string, rating: PostRating) => {
        let source = ""
        let artist = ""
        let title = ""
        let englishTitle = ""
        let commentary = ""
        let englishCommentary = ""
        let posted = ""
        let bookmarks = ""
        let artistIcon = ""
        let artists = [{}] as UploadTag[]
        let sourceLinks = [] as {link: string, hash: string}[]

        let id = danbooruLink.match(/\d+/)?.[0]
        let danbooruPost = await serverFunctions.proxyFetch(`https://danbooru.donmai.us/posts/${id}.json`).then((r) => r.json()) as any
        if (danbooruPost.rating === "q") rating = functions.highestRating(rating, functions.r17())
        if (danbooruPost.rating === "e") rating = functions.highestRating(rating, functions.r18())

        // Prefer storing twitter/pixiv sources if they exist. If we didn't find them before, 
        // it's highly likely they're deleted so no need to fetch them
        if (danbooruPost.source?.includes("pximg") || danbooruPost.source?.includes("pixiv")) {
            let id = path.basename(danbooruPost.source).match(/\d+/)?.[0]
            source = `https://www.pixiv.net/artworks/${id}`
        }
        if (danbooruPost.source?.includes("twitter")) {
            source = danbooruPost.source
            const redirectedLink = await functions.http.followRedirect(source)
            let regexCheck = redirectedLink.match(/(?<=com\/)(.*?)(?=\/status)/)?.[0] || ""
            if (regexCheck !== "i/web") artist = regexCheck
        }

        let commentaries = await serverFunctions.proxyFetch(`https://danbooru.donmai.us/artist_commentaries.json?commit=Search&search[post_id]=${id}`).then((r) => r.json()) as any
        if (commentaries[0]) {
            title = commentaries[0].original_title
            commentary = commentaries[0].original_description
            englishTitle = commentaries[0].translated_title
            englishCommentary = commentaries[0].translated_description
        }

        let rawLinks = [] as string[]
        if (danbooruPost.file_url) {
            rawLinks = [danbooruPost.file_url]
        }

        for (const link of rawLinks) {
            const buffer = await serverFunctions.util.imageBuffer(link)
            const hash = await serverFunctions.util.pHash(buffer)
            sourceLinks.push({link, hash})
        }

        return {source, artist, title, englishTitle, commentary, englishCommentary, 
                posted, bookmarks, artistIcon, artists, rating, sourceLinks}
    }

    public static saucenaoLookup = async (bytes: number[]) => {
        const form = new FormData()
        form.append("db", "999")
        form.append("api_key", process.env.SAUCENAO_KEY)
        form.append("output_type", 2)
        const inputType = functions.byte.bufferFileType(bytes)?.[0]
        form.append("file", Buffer.from(bytes), {
            filename: `file.${inputType.extension}`,
            contentType: inputType.mime
        })
        let result = await axios.post("https://saucenao.com/search.php", form, {headers: form.getHeaders()})
        .then((r) => r.data.results) as SaucenaoResponse[]
        result = result.sort((a, b) => Number(b.header.similarity) - Number(a.header.similarity))
        result = result.filter((r) => Number(r.header.similarity) > 70)
        return result
    }

    public static sourceLookup = async (current: UploadImage, rating: PostRating) => {
        let bytes = [] as number[]
        if (current.thumbnail) {
            bytes = await functions.byte.base64toUint8Array(current.thumbnail).then((r) => Object.values(r))
        } else {
            bytes = current.bytes
        }

        let pngBytes = bytes
        if (current.ext !== "jpg" && current.ext !== "png") {
            let buffer = await sharp(new Uint8Array(bytes)).png().toBuffer()
            pngBytes = Object.values(new Uint8Array(buffer))
        }

        let source = ""
        let artist = ""
        let title = ""
        let englishTitle = ""
        let commentary = ""
        let englishCommentary = ""
        let posted = ""
        let bookmarks = ""
        let userProfile = ""
        let sourceImageCount = null as number | null
        let artistIcon = ""
        let artists = [{}] as UploadTag[]
        let mirrors = [] as string[]
        let pixivTags = [] as string[]
        let drawingTools = [] as string[]
        let sourceLinks = [] as {link: string, hash: string}[]
        let isAI = false

        let basename = path.basename(current.name, path.extname(current.name)).trim()
        let {id, source: alt} = functions.util.parseFilename(current.name)
        if (id !== alt) basename = alt

        try {
            // Pixiv lookup
            if (/^\d{5,}(?=$|_)/.test(basename)) {
                let data = await this.pixivLookup(basename, rating)
                source = data.source
                artist = data.artist
                title = data.title
                englishTitle = data.englishTitle
                commentary = data.commentary
                englishCommentary = data.englishCommentary
                posted = data.posted
                bookmarks = data.bookmarks
                artistIcon = data.artistIcon
                artists = data.artists
                rating = data.rating
                sourceLinks = data.sourceLinks
                pixivTags = data.pixivTags
                userProfile = data.userProfile
                drawingTools = data.drawingTools
                sourceImageCount = data.sourceImageCount
                isAI = data.isAI

                const mirrorStr = mirrors?.length ? mirrors.join("\n") : ""
                return {
                    rating,
                    artists,
                    sourceLinks,
                    isAI,
                    source: {
                        title,
                        englishTitle,
                        artist,
                        source,
                        commentary,
                        englishCommentary,
                        bookmarks,
                        pixivTags,
                        userProfile,
                        drawingTools,
                        sourceImageCount,
                        posted,
                        mirrors: mirrorStr
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }
        
        try {
            // Twitter lookup
            if (/\d{10,}/.test(basename)) {
                let data = await this.twitterLookup(basename, rating)
                source = data.source
                artist = data.artist
                title = data.title
                englishTitle = data.englishTitle
                commentary = data.commentary
                englishCommentary = data.englishCommentary
                posted = data.posted
                bookmarks = data.bookmarks
                artistIcon = data.artistIcon
                artists = data.artists
                rating = data.rating
                sourceLinks = data.sourceLinks
                userProfile = data.userProfile
                sourceImageCount = data.sourceImageCount

                const mirrorStr = mirrors?.length ? mirrors.join("\n") : ""
                return {
                    rating,
                    artists,
                    sourceLinks,
                    isAI,
                    source: {
                        title,
                        englishTitle,
                        artist,
                        source,
                        commentary,
                        englishCommentary,
                        bookmarks,
                        pixivTags,
                        userProfile,
                        sourceImageCount,
                        posted,
                        mirrors: mirrorStr
                    }
                }
            }
        } catch (e) {
            console.log(e)
        }

        // Fallback to Saucenao - this has high rate limits
        let results = await this.saucenaoLookup(pngBytes)
        if (results.length) {
            const pixiv = results.filter((r) => r.header.index_id === 5)
            const twitter = results.filter((r) => r.header.index_id === 41)
            const deviantart = results.filter((r) => r.header.index_id === 34)
            const artstation = results.filter((r) => r.header.index_id === 39)
            const danbooru = results.filter((r) => r.header.index_id === 9)
            if (pixiv.length) mirrors.push(`https://www.pixiv.net/artworks/${pixiv[0].data.pixiv_id}`)
            if (twitter.length) mirrors.push(twitter[0].data.ext_urls[0])
            if (deviantart.length) {
                let redirectedLink = await functions.http.followRedirect(deviantart[0].data.ext_urls[0]).catch(() => "")
                mirrors.push(redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0])
            }
            if (artstation.length) mirrors.push(artstation[0].data.ext_urls[0])
            if (pixiv.length) {
                source = `https://www.pixiv.net/artworks/${pixiv[0].data.pixiv_id}`
                artist = pixiv[0].data.author_name || ""
                title = pixiv[0].data.title || ""
                try {
                    let data = await this.pixivLookup(source, rating)
                    source = data.source
                    artist = data.artist
                    title = data.title
                    englishTitle = data.englishTitle
                    commentary = data.commentary
                    englishCommentary = data.englishCommentary
                    posted = data.posted
                    bookmarks = data.bookmarks
                    artistIcon = data.artistIcon
                    artists = data.artists
                    rating = data.rating
                    sourceLinks = data.sourceLinks
                    pixivTags = data.pixivTags
                    userProfile = data.userProfile
                    drawingTools = data.drawingTools
                    sourceImageCount = data.sourceImageCount
                    isAI = data.isAI
                } catch (e) {
                    console.log(e)
                }
            } else if (twitter.length) {
                source = twitter[0].data.ext_urls[0]
                artist = twitter[0].data.twitter_user_handle || ""
                try {
                    let data = await this.twitterLookup(source, rating)
                    source = data.source
                    artist = data.artist
                    title = data.title
                    englishTitle = data.englishTitle
                    commentary = data.commentary
                    englishCommentary = data.englishCommentary
                    posted = data.posted
                    bookmarks = data.bookmarks
                    artistIcon = data.artistIcon
                    artists = data.artists
                    rating = data.rating
                    sourceLinks = data.sourceLinks
                    userProfile = data.userProfile
                    sourceImageCount = data.sourceImageCount
                } catch (e) {
                    console.log(e)
                }
            } else if (deviantart.length) {
                let redirectedLink = await functions.http.followRedirect(deviantart[0].data.ext_urls[0]).catch(() => "")
                source = redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0]
                artist = deviantart[0].data.member_name || ""
                title = deviantart[0].data.title || ""
                try {
                    let data = await this.deviantartLookup(source, rating)
                    source = data.source
                    artist = data.artist
                    title = data.title
                    englishTitle = data.englishTitle
                    commentary = data.commentary
                    englishCommentary = data.englishCommentary
                    posted = data.posted
                    bookmarks = data.bookmarks
                    artistIcon = data.artistIcon
                    artists = data.artists
                    rating = data.rating
                    sourceLinks = data.sourceLinks
                    userProfile = data.userProfile
                    sourceImageCount = data.sourceImageCount
                } catch (e) {
                    console.log(e)
                } 
            } else if (danbooru.length) {
                source = danbooru[0].data.ext_urls[0]
                artist = danbooru[0].data.creator || ""
                title = danbooru[0].data.characters || ""
                try {
                    let data = await this.danbooruLookup(source, rating)
                    source = data.source
                    artist = data.artist
                    title = data.title
                    englishTitle = data.englishTitle
                    commentary = data.commentary
                    englishCommentary = data.englishCommentary
                    posted = data.posted
                    bookmarks = data.bookmarks
                    artistIcon = data.artistIcon
                    artists = data.artists
                    rating = data.rating
                    sourceLinks = data.sourceLinks
                } catch (e) {
                    console.log(e)
                }
            }
        }
        mirrors = functions.util.removeItem(mirrors, source)
        const mirrorStr = mirrors?.length ? mirrors.join("\n") : ""
        return {
            rating,
            artists,
            sourceLinks,
            artistIcon,
            isAI,
            source: {
                title,
                englishTitle,
                artist,
                source,
                commentary,
                englishCommentary,
                bookmarks,
                pixivTags,
                userProfile,
                drawingTools,
                sourceImageCount,
                posted,
                mirrors: mirrorStr
            }
        }
    }
}