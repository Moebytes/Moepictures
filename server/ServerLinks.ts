/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import FormData from "form-data"
import * as cheerio from "cheerio"
import axios from "axios"
import dist from "sharp-phash/distance"
import functions from "../functions/Functions"
import serverFunctions from "./ServerFunctions"
import {PostRating} from "../types/Types"
import path from "path"

export default class ServerLinks {
    public static revDanbooru = async (bytes: number[]) => {
        const oldBuffer = Buffer.from(bytes)
        const oldHash = await serverFunctions.util.pHash(oldBuffer)
        const form = new FormData()
        form.append("search[file]", oldBuffer, {filename: "image.png"})
        const result = await axios.post(`https://danbooru.donmai.us/iqdb_queries.json${process.env.DANBOORU_API_KEY}`, 
            form, {headers: {...form.getHeaders()}}).then((r) => r.data)
        if (result[0]?.score < 70) return ""
        const original = result[0].post.file_url
        if (!original || path.extname(original) === ".zip" || path.extname(original) === ".mp4") return ""
        const buffer = await fetch(original, {headers: {"user-agent": `${process.env.DANBOORU_USERNAME}`}}).then((r) => r.arrayBuffer())
        const hash = await serverFunctions.util.pHash(Buffer.from(buffer))
        if (dist(hash, oldHash) < 7) {
            return `https://danbooru.donmai.us/posts/${result[0].post.id}`
        } else {
            return ""
        }
    }

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
                const post = await serverFunctions.http.proxyFetch(`${link}.json`).then((r) => r.json()) as any
                const mediaId = post.media_asset.id
                const html = await serverFunctions.http.proxyFetch(`https://danbooru.donmai.us/media_assets/${mediaId}`).then((r) => r.text())
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
            try {
            const json = await serverFunctions.http.proxyFetch(`${danbooruLink}.json`).then((r) => r.json()) as any
            if (json.rating === "q") rating = functions.highestRating(rating, functions.r17())
            if (json.rating === "e") rating = functions.highestRating(rating, functions.r18())
            tagData.tags = json.tag_string_general
            tagData.artists = json.tag_string_artist
            tagData.characters = json.tag_string_character
            tagData.series = json.tag_string_copyright
            } catch (e) {
                console.log(e)
            }
        }

        let gelbooruLink = booruLinks.find((link) => link.includes("gelbooru.com"))
        if (!Object.keys(tagData).length && gelbooruLink) {
            let id = gelbooruLink.match(/\d+/g)?.[0]
            let url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&id=${id}&json=1${process.env.GELBOORU_API_KEY}`
            const json = await serverFunctions.http.proxyFetch(url).then((r) => r.json()) as any
            let post = json.post[0]
            if (post) {
                if (post.rating === "questionable") rating = functions.highestRating(rating, functions.r17())
                if (post.rating === "explicit") rating = functions.highestRating(rating, functions.r18())
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
            const json = await serverFunctions.http.proxyFetch(url).then((r) => r.json()) as any
            let post = json[0]
            if (post) {
                if (post.rating === "questionable") rating = functions.highestRating(rating, functions.r17())
                tagData.tags = post.tags
                tagData.artists = ""
                tagData.characters = ""
                tagData.series = ""
            }
        }
        return {tagData, newRating: rating}
    }
}