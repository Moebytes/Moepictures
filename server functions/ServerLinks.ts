import FormData from "form-data"
import * as cheerio from "cheerio"
import axios from "axios"
import functions from "../functions/Functions"
import {PostRating} from "../types/Types"

export default class ServerLinks {
    public static booruLinks = async (bytes: number[]) => {
        if (!bytes) return Promise.reject("Image bytes must be provided")
        const buffer = Buffer.from(bytes)
        const form = new FormData()
        form.append("file", buffer, {filename: "image.png"})
        const html = await axios.post("https://iqdb.org/", form, {headers: {...form.getHeaders()}}).then((r) => r.data)

        let mirrors = [] as string[]
        const $ = cheerio.load(html)

        let promises = [] as Promise<any>[]
        const appendExtraLinks = async (link: string) => {
            try {
                const post = await axios.get(`${link}.json`).then((r) => r.data)
                const mediaId = post.media_asset.id
                const html = await axios.get(`https://danbooru.donmai.us/media_assets/${mediaId}`).then((r) => r.data)
                const links = html.match(/(?<=Source<\/th>\s*<td class="break-all"><a [^>]*href=").*?(?=")/gm) || []
                for (let link of links) {
                    link = link.replaceAll("&amp;", "&")
                    if (link.includes("twitter") || link.includes("x.com")) mirrors.unshift(link)
                    if (link.includes("safebooru")) mirrors.push(link)
                }
            } catch {}
        }
        const appendRedirect = async (link: string) => {
            try {
                const redirect = await axios.get(link)
                mirrors.push(redirect.request.res.responseUrl)
            } catch {}
        }

        $("#pages > div").each((i, el) => {
            let link = ($(el).find("a").first().attr("href") || "").replace(/^\/\//, "http://").replace("http://", "https://")
            let link2 = ($(el).find("a").last().attr("href") || "").replace(/^\/\//, "http://").replace("http://", "https://")
            const textTds = $(el).find("td").filter((_, td) => $(td).children("img").length === 0).map((_, td) => $(td).text().trim()).get()
            const similarity = parseFloat(textTds.find(text => /% similarity$/.test(text)) || "")

            if (similarity > 75) {
                if (link.includes("danbooru.donmai.us")) {
                    mirrors.push(link)
                    promises.push(appendExtraLinks(link))
                }
                if (link2.includes("gelbooru.com")) {
                    promises.push(appendRedirect(link2))
                }
                if (link.includes("yande.re")) mirrors.push(link)
                if (link.includes("konachan.com")) mirrors.push(link)
                if (link.includes("zerochan.net")) mirrors.push(link)
                if (link.includes("e-shuushuu.net")) mirrors.push(link)
                if (link.includes("anime-pictures.net")) mirrors.push(link)
            }
        })

        await Promise.all(promises)
        const prioritySort = (url: string) => {
            const priorities = [
                "twitter.com", "x.com",
                "danbooru.donmai.us",
                "gelbooru.com",
                "safebooru.org",
                "yande.re",
                "konachan.com",
                "zerochan.net",
                "e-shuushuu.net",
                "anime-pictures.net"
            ]
            for (let i = 0; i < priorities.length; i++) {
                if (url.includes(priorities[i])) return i
            }
            return priorities.length
        }
        return mirrors.sort((a, b) => prioritySort(a) - prioritySort(b))
    }
    
    public static testBooruLinks = async (booruLinks: string[], rating: PostRating) => {
        let tagData = {} as {artists: string, characters: string, series: string, tags: string}

        let danbooruLink = booruLinks.find((link) => link.includes("danbooru.donmai.us"))
        if (danbooruLink) {
            const json = await functions.http.fetch(`${danbooruLink}.json`)
            if (json.rating === "q") rating = functions.r17()
            if (json.rating === "e") rating = functions.r18()
            tagData.tags = json.tag_string_general
            tagData.artists = json.tag_string_artist
            tagData.characters = json.tag_string_character
            tagData.series = json.tag_string_copyright
        }

        let gelbooruLink = booruLinks.find((link) => link.includes("gelbooru.com"))
        if (!Object.keys(tagData).length && gelbooruLink) {
            let id = gelbooruLink.match(/\d+/g)?.[0]
            let url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&id=${id}&json=1${process.env.GELBOORU_API_KEY}`
            const json = await functions.http.fetch(url)
            let post = json.post[0]
            if (post) {
                if (post.rating === "questionable") rating = functions.r17()
                if (post.rating === "explicit") rating = functions.r18()
                    tagData.tags = post.tags
                    tagData.artists = ""
                    tagData.characters = ""
                    tagData.series = ""
            }
        }

        let safebooruLink = booruLinks.find((link) => link.includes("safebooru.org"))
        if (!Object.keys(tagData).length && safebooruLink) {
            let id = safebooruLink.match(/\d+/g)?.[0]
            let url = `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&id=${id}`
            const json = await functions.http.fetch(url)
            let post = json[0]
            if (post) {
                if (post.rating === "questionable") rating = functions.r17()
                tagData.tags = post.tags
                tagData.artists = ""
                tagData.characters = ""
                tagData.series = ""
            }
        }
        return {tagData, danbooruLink, newRating: rating}
    }
}