import axios from "axios"
import sql from "../sql/SQLQuery"
import fs from "fs"
import path from "path"
import util from "util"
import child_process from "child_process"
import sharp from "sharp"
import functions from "../functions/Functions"
import serverFunctions from "./ServerFunctions"
import tagConvert from "../assets/json/tag-convert.json"
import {UploadImage, PostRating, UploadTag, MiniTag, PostTagged, Tag, WDTaggerResponse, 
PostType, PostStyle} from "../types/Types"

const exec = util.promisify(child_process.exec)

export default class ServerTags {
    public static tagCategories = async (tags: string[] | undefined) => {
        if (!tags) tags = []
        let result = await sql.tag.tags(tags.filter(Boolean))
        let artists = [] as MiniTag[] 
        let characters = [] as MiniTag[] 
        let series = [] as MiniTag[] 
        let newTags = [] as MiniTag[] 
        for (let i = 0; i < tags.length; i++) {
            const index = result.findIndex((r: any) => tags[i] === r.tag)
            const obj = {} as MiniTag 
            obj.tag = tags[i]
            obj.type = result[index].type
            obj.image = result[index].image
            obj.imageHash = result[index].imageHash
            obj.description = result[index].description 
            obj.social = result[index].social
            obj.twitter = result[index].twitter
            obj.website = result[index].website
            obj.fandom = result[index].fandom
            obj.wikipedia = result[index].wikipedia
            if (result[index].type === "artist") {
                artists.push(obj)
            } else if (result[index].type === "character") {
                characters.push(obj)
            } else if (result[index].type === "series") {
                series.push(obj)
            } else {
                newTags.push(obj)
            }
        }
        return {artists, characters, series, tags: newTags}
    }

    public static unverifiedTagCategories = async (tags: string[] | undefined) => {
        if (!tags) tags = []
        let result = await sql.tag.unverifiedTags(tags.filter(Boolean))
        let artists = [] as MiniTag[] 
        let characters = [] as MiniTag[] 
        let series = [] as MiniTag[] 
        let newTags = [] as MiniTag[]
        for (let i = 0; i < tags.length; i++) {
            const index = result.findIndex((r: any) => tags[i] === r.tag)
            const obj = {} as MiniTag 
            obj.tag = tags[i]
            obj.type = result[index].type
            obj.image = result[index].image
            obj.imageHash = result[index].imageHash
            obj.description = result[index].description 
            obj.social = result[index].social
            obj.twitter = result[index].twitter
            obj.website = result[index].website
            obj.fandom = result[index].fandom
            obj.wikipedia = result[index].wikipedia
            if (result[index].type === "artist") {
                artists.push(obj)
            } else if (result[index].type === "character") {
                characters.push(obj)
            } else if (result[index].type === "series") {
                series.push(obj)
            } else {
                newTags.push(obj)
            }
        }
        return {artists, characters, series, tags: newTags}
    }

    public static deleteTag = async (tag: Tag) => {
        await serverFunctions.files.deleteFolder(`history/tag/${tag.tag}`, false).catch(() => null)
        if (tag.image) {
            await serverFunctions.files.deleteFile(functions.link.getTagPath(tag.type, tag.image), false).catch(() => null)
        }
        await sql.tag.deleteTag(tag.tag)
    }

    public static updateImplications = async (posts: PostTagged[], implications: string[]) => {
        for (const post of posts) {
            for (const implication of implications) {
                if (!post.tags.includes(implication)) {
                    await sql.tag.insertTagMap(post.postID, [implication])
                }
            }
        }
    }

    public static batchUpdateImplications = async () => {
        console.log("Updating all tag implications...")
        const posts = await sql.search.posts()
        for (let i = 0; i < posts.length; i++) {
            const postID = posts[i].postID
            let tagMap = posts[i].tags
            for (let i = 0; i < tagMap.length; i++) {
                const implications = await sql.tag.implications(tagMap[i])
                if (implications?.[0]) tagMap.push(...implications.map(((i: any) => i.implication)))
            }
            tagMap = functions.util.removeDuplicates(tagMap)
            //await sql.tag.purgeTagMap(postID)
            //await sql.tag.insertTagMap(postID, tagMap)
        }
        console.log("Done")
    }

    public static tagMap = async (cache?: boolean) => {
        if (cache) {
            let cached = await sql.getCache("tag-map")
            if (cached) return cached as {[key: string]: Tag}
        }
        let result = await sql.tag.tags([])
        const tagMap = {} as {[key: string]: Tag}
        for (const tag of result) {
            tagMap[tag.tag] = tag
        }
        sql.setCache("tag-map", tagMap)
        return tagMap
    }

    public static downloadWDTagger = async () => {
        const wdTaggerPath = path.join(__dirname, "../../assets/python/wdtagger")
        if (!fs.existsSync(wdTaggerPath)) fs.mkdirSync(wdTaggerPath, {recursive: true})
        const configPath = path.join(wdTaggerPath, "config.json")
        const modelPath = path.join(wdTaggerPath, "model.safetensors")
        const csvPath = path.join(wdTaggerPath, "selected_tags.csv")
        if (!fs.existsSync(configPath)) {
            const data = await axios.get(`https://huggingface.co/SmilingWolf/wd-swinv2-tagger-v3/resolve/main/config.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(configPath, JSON.stringify(data, null, 4))
        }
        if (!fs.existsSync(csvPath)) {
            const data = await axios.get(`https://huggingface.co/SmilingWolf/wd-swinv2-tagger-v3/resolve/main/selected_tags.csv`, {responseType: "text"}).then((r) => r.data)
            fs.writeFileSync(csvPath, data)
        }
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading waifu diffusion tagger...")
            const data = await axios.get(`https://huggingface.co/SmilingWolf/wd-swinv2-tagger-v3/resolve/main/model.safetensors`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
    }

    public static wdtagger = async (bytes: number[]) => {
        const buffer = Buffer.from(bytes)
        const folder = path.join(__dirname, "./dump")
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

        const filename = `${Math.floor(Math.random() * 100000000)}.jpg`
        const imagePath = path.join(folder, filename)
        fs.writeFileSync(imagePath, buffer)
        const scriptPath = path.join(__dirname, "../../assets/python/wdtagger.py")
        const wdTaggerPath = path.join(__dirname, "../../assets/python/wdtagger")
        let command = `python3 "${scriptPath}" -i "${imagePath}" -m "${wdTaggerPath}"`
        const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
        const json = JSON.parse(str.match(/{.*?}/gm)?.[0]) as WDTaggerResponse
        fs.unlinkSync(imagePath)
        return json
    }

    public static tagLookup = async (current: UploadImage, type: PostType, rating: PostRating, style: PostStyle, hasUpscaled?: boolean) => {
        let tagArr = [] as string[]
        let blockedTags = tagConvert.blockedTags
        let tagReplaceMap = tagConvert.tagReplaceMap
        let artists = [{}] as UploadTag[]
        let characters = [{}] as UploadTag[]
        let series = [{}] as UploadTag[]
        let meta = [] as string[]
        let tags = [] as string[]
        let newTags = [] as UploadTag[]
        const tagMap = await this.tagMap()

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

        let booruLinks = await serverFunctions.links.booruLinks(pngBytes)
        let {tagData, danbooruLink, newRating} = await serverFunctions.links.testBooruLinks(booruLinks, rating)
        rating = newRating

        if (Object.keys(tagData).length) {
            tagArr = tagData.tags.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            tagArr.push("autotags")
            if (hasUpscaled) tagArr.push("upscaled")
            let artistStrArr = tagData.artists.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            let charStrArr = tagData.characters.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            let seriesStrArr = tagData.series.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            if (seriesStrArr?.includes("original")) {
                charStrArr = ["original"]
                seriesStrArr = ["no-series"]
            }

            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel-art")) style = "pixel"
            if (tagArr.includes("dakimakura")) style = "daki"
            if (tagArr.includes("sketch")) style = "sketch"
            if (tagArr.includes("lineart")) style = "lineart"
            if (tagArr.includes("ad")) style = "promo"
            if (current.name.includes("chibi")) style = "chibi"
            if (current.name.includes("pixel")) style = "pixel"
            if (current.name.includes("daki")) style = "daki"
            if (current.name.includes("sketch")) style = "sketch"
            if (current.name.includes("lineart")) style = "lineart"
            if (current.name.includes("promo")) style = "promo"
            if (current.name.includes("comic") && type === "image")  type = "comic"
            if (tagArr.includes("comic") && type === "image")  type = "comic"
            if (current.name.includes("r18")) rating = functions.r18()

            tagArr = tagArr.map((tag: string) => functions.tag.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                tagArr = tagArr.map((tag: string) => tag.replaceAll(key, value))
            }
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)

            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }

            const isTransparent = await serverFunctions.util.isTransparent(bytes)
            if (isTransparent) tagArr.push("transparent")
            if (current.name.includes("text")) tagArr.push("untranslated")
            if (current.name.includes("tutorial")) tagArr.push("art-tutorial")
            if (current.name.includes("fanbox")) {
                tagArr.push("fanbox")
                tagArr.push("paid-content-available")
            }
            if (current.name.includes("patreon")) {
                tagArr.push("patreon")
                tagArr.push("paid-content-available")
            }

            artistStrArr = artistStrArr.map((tag: string) => functions.tag.cleanTag(tag))
            charStrArr = charStrArr.map((tag: string) => functions.tag.cleanTag(tag))
            seriesStrArr = seriesStrArr.map((tag: string) => functions.tag.cleanTag(tag))

            let charTest = charStrArr.filter(str => (str.match(/\(([^)]+)\)/g)?.length || 0) < 2)
            if (charTest.length > 1) {
                tagArr.push("multiple-characters")
            } else if (charTest.length === 1) {
                tagArr.push("solo")
            }

            for (let i = 0; i < artistStrArr.length; i++) {
                artists[artists.length - 1].tag = artistStrArr[i]
                artists.push({})
            }

            for (let i = 0; i < charStrArr.length; i++) {
                characters[characters.length - 1].tag = charStrArr[i]
                const seriesName = charStrArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "")
                if (seriesName) {
                    seriesStrArr.push(seriesName)
                    characters.push({})
                }
            }

            seriesStrArr = functions.util.removeDuplicates(seriesStrArr)

            for (let i = 0; i < seriesStrArr.length; i++) {
                series[series.length - 1].tag = seriesStrArr[i]
                series.push({})
            }

            tagArr = functions.util.cleanHTML(tagArr.join(" ")).split(/[\n\r\s]+/g)

            let notExists = [] as UploadTag[]
            for (let i = 0; i < tagArr.length; i++) {
                const exists = tagMap[tagArr[i]]
                if (exists) {
                    if (exists.type === "meta") {
                        meta.push(tagArr[i])
                    } else {
                        tags.push(tagArr[i])
                    }
                } else {
                    tags.push(tagArr[i])
                    notExists.push({tag: tagArr[i], description: `${functions.util.toProperCase(tagArr[i]).replaceAll("-", " ")}.`})
                }
            }
            newTags = notExists
        } else {
            let result = await this.wdtagger(bytes)

            let tagArr = result.tags
            let characterArr = result.characters

            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel-art")) style = "pixel"
            if (tagArr.includes("dakimakura")) style = "daki"
            if (tagArr.includes("sketch")) style = "sketch"
            if (tagArr.includes("lineart")) style = "lineart"
            if (tagArr.includes("ad")) style = "promo"
            if (current.name.includes("chibi")) style = "chibi"
            if (current.name.includes("pixel")) style = "pixel"
            if (current.name.includes("daki")) style = "daki"
            if (current.name.includes("sketch")) style = "sketch"
            if (current.name.includes("lineart")) style = "lineart"
            if (current.name.includes("promo")) style = "promo"
            if (current.name.includes("comic") && type === "image") type = "comic"
            if (tagArr.includes("comic") && type === "image")  type = "comic"
            if (current.name.includes("r18")) rating = functions.r18()

            tagArr = tagArr.map((tag: string) => functions.tag.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                tagArr = tagArr.map((tag: string) => tag.replaceAll(key, value))
            }
            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)

            tagArr.push("autotags")
            tagArr.push("needscheck")
            if (hasUpscaled) tagArr.push("upscaled")

            const isTransparent = await serverFunctions.util.isTransparent(bytes)
            if (isTransparent) tagArr.push("transparent")
            if (current.name.includes("text")) tagArr.push("untranslated")
            if (current.name.includes("tutorial")) tagArr.push("art-tutorial")
            if (current.name.includes("fanbox")) {
                tagArr.push("fanbox")
                tagArr.push("paid-content-available")
            }
            if (current.name.includes("patreon")) {
                tagArr.push("patreon")
                tagArr.push("paid-content-available")
            }

            characterArr = characterArr.map((tag: string) => functions.tag.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                characterArr = characterArr.map((tag: string) => tag.replaceAll(key, value))
            }
            for (let i = 0; i < blockedTags.length; i++) {
                characterArr = characterArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }
            characterArr = characterArr.filter((tag: string) => tag.length >= 3)

            let charTest = characterArr.filter(str => (str.match(/\(([^)]+)\)/g)?.length || 0) < 2)
            if (charTest.length > 1) {
                tagArr.push("multiple-characters")
            } else if (charTest.length === 1) {
                tagArr.push("solo")
            }

            let seriesArr = [] as string[]

            for (let i = 0; i < characterArr.length; i++) {
                const seriesName = characterArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "") || ""
                seriesArr.push(seriesName)
            }

            seriesArr = functions.util.removeDuplicates(seriesArr)

            for (let i = 0; i < characterArr.length; i++) {
                characters[characters.length - 1].tag = characterArr[i]
                characters.push({})
            }

            for (let i = 0; i < seriesArr.length; i++) {
                series[series.length - 1].tag = seriesArr[i]
                series.push({})
            }
            tagArr = functions.util.cleanHTML(tagArr.join(" ")).split(/[\n\r\s]+/g)

            let notExists = [] as UploadTag[]
            for (let i = 0; i < tagArr.length; i++) {
                const exists = tagMap[tagArr[i]]
                if (exists) {
                    if (exists.type === "meta") {
                        meta.push(tagArr[i])
                    } else {
                        tags.push(tagArr[i])
                    }
                } else {
                    tags.push(tagArr[i])
                    notExists.push({tag: tagArr[i], description: `${functions.util.toProperCase(tagArr[i]).replaceAll("-", " ")}.`})
                }
            }
            newTags = notExists
        }
        return {
            type,
            rating,
            style,
            artists,
            characters,
            series,
            meta,
            tags,
            newTags,
            danbooruLink
        }
    }
}