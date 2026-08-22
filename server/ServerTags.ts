/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import sql from "../sql/SQLQuery"
import fs from "fs"
import path from "path"
import util from "util"
import child_process from "child_process"
import sharp from "sharp"
import functions from "../functions/Functions"
import serverFunctions from "./ServerFunctions"
import {UploadImage, PostRating, UploadTag, MiniTag, PostTagged, Tag, WDTaggerResponse, 
PostType, PostStyle, BulkTag, MiniTagGroup, CharSplitEntry, CharSplitNote} from "../types/Types"

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
        await serverFunctions.files.deleteFolder(`history/tag/${encodeURIComponent(tag.tag)}`, false).catch(() => null)
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

    public static tagMap = async (cache: boolean = true) => {
        if (cache) {
            let cached = await sql.getCache("tag-map") as {[key: string]: Tag}
            if (cached) return cached 
        }
        let result = await sql.tag.tags([])
        const tagMap = {} as {[key: string]: Tag}
        for (const tag of result) {
            tagMap[tag.tag] = tag
        }
        sql.setCache("tag-map", tagMap, 60)
        return tagMap
    }

    public static wdtagger = async (bytes: number[]) => {
        const buffer = Buffer.from(bytes)
        const imagePath = await serverFunctions.util.dumpImage(buffer)

        const scriptPath = path.join(__dirname, "../../assets/python/wdtagger.py")
        const wdTaggerPath = path.join(__dirname, "../../assets/python/wdtagger")
        let command = `python3 "${scriptPath}" -i "${imagePath}" -m "${wdTaggerPath}"`
        const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
        const json = JSON.parse(str.match(/{.*?}/gm)?.[0]) as WDTaggerResponse

        fs.unlinkSync(imagePath)
        return json
    }

    public static rateImage = async (bytes: number[]) => {
        const buffer = Buffer.from(bytes)
        const imagePath = await serverFunctions.util.dumpImage(buffer)

        const scriptPath = path.join(__dirname, "../../assets/python/imagerater.py")
        const modelPath = path.join(__dirname, "../../assets/python/imagerater")
        let command = `python3 "${scriptPath}" -i "${imagePath}" -m "${modelPath}"`
        const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
        
        fs.unlinkSync(imagePath)
        return str.trim()
    }

    public static tagLookup = async (current: UploadImage, type: PostType, rating: PostRating, style: PostStyle, hasUpscaled?: boolean) => {
        let tagArr = [] as string[]
        let blockedTags = await sql.tag.blockedTags()
        let tagReplaceMap = await sql.tag.tagReplaceMap()
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

        let danbooruLink = await serverFunctions.links.revDanbooru(pngBytes)
        let {tagData, newRating} = await serverFunctions.links.testBooruLinks([danbooruLink], rating)
        rating = functions.highestRating(rating, newRating)
        let predictedRating = await this.rateImage(pngBytes).catch(() => null)
        if (predictedRating) rating = functions.highestRating(rating, predictedRating)

        if (Object.keys(tagData).length) {
            tagArr = tagData.tags.split(" ")
            let artistStrArr = tagData.artists.split(" ")
            let charStrArr = tagData.characters.split(" ")
            let seriesStrArr = tagData.series.split(" ")

            tagArr.push("autotags")
            if (hasUpscaled) tagArr.push("upscaled")
            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel_art")) style = "pixel"
            if (tagArr.includes("dakimakura")) style = "daki"
            if (tagArr.includes("sketch")) style = "sketch"
            if (tagArr.includes("lineart")) style = "lineart"
            if (tagArr.includes("ad")) style = "promo"
            if (current.name.includes("chibi")) style = "chibi"
            if (current.name.includes("pixel")) style = "pixel"
            if (current.name.includes("daki")) style = "daki"
            if (current.name.includes("_3d")) style = "3d"
            if (current.name.includes("sketch")) style = "sketch"
            if (current.name.includes("lineart")) style = "lineart"
            if (current.name.includes("promo")) style = "promo"
            if (current.name.includes("comic") && type === "image") type = "comic"
            if (tagArr.includes("comic") && type === "image") type = "comic"
            if (current.name.includes("color-comic")) {
                type = "comic"
                tagArr.push("full-color-comic")
            }
            if (current.name.includes("sequence")) tagArr.push("image-sequence")
            if (current.name.includes("r18")) rating = functions.r18()
            if (seriesStrArr?.includes("original")) {
                charStrArr = ["original"]
                seriesStrArr = ["no-series"]
            }
            if (tagArr.includes("multiple_girls")) {
                tagArr.push("multiple-characters")
            } else {
                tagArr.push("solo")
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

            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }

            tagArr = tagArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)
            artistStrArr = artistStrArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)
            charStrArr = charStrArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)
            seriesStrArr = seriesStrArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)

            tagArr = tagArr.map((tag: string) => functions.tag.cleanTag(tag))
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)
            artistStrArr = artistStrArr.map((tag: string) => functions.tag.cleanTag(tag))
            charStrArr = charStrArr.map((tag: string) => functions.tag.cleanTag(tag))
            seriesStrArr = seriesStrArr.map((tag: string) => functions.tag.cleanTag(tag))

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

            tagArr.push("autotags")
            tagArr.push("needscheck")
            if (hasUpscaled) tagArr.push("upscaled")
            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel_art")) style = "pixel"
            if (tagArr.includes("dakimakura")) style = "daki"
            if (tagArr.includes("sketch")) style = "sketch"
            if (tagArr.includes("lineart")) style = "lineart"
            if (tagArr.includes("ad")) style = "promo"
            if (current.name.includes("chibi")) style = "chibi"
            if (current.name.includes("pixel")) style = "pixel"
            if (current.name.includes("daki")) style = "daki"
            if (current.name.includes("_3d")) style = "3d"
            if (current.name.includes("sketch")) style = "sketch"
            if (current.name.includes("lineart")) style = "lineart"
            if (current.name.includes("promo")) style = "promo"
            if (current.name.includes("comic") && type === "image") type = "comic"
            if (tagArr.includes("comic") && type === "image") type = "comic"
            if (current.name.includes("color-comic")) {
                type = "comic"
                tagArr.push("full-color-comic")
            }
            if (current.name.includes("sequence")) tagArr.push("image-sequence")
            if (current.name.includes("r18")) rating = functions.r18()
            if (tagArr.includes("multiple_girls")) {
                tagArr.push("multiple-characters")
            } else {
                tagArr.push("solo")
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

            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }

            for (let i = 0; i < blockedTags.length; i++) {
                characterArr = characterArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }

            tagArr = tagArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)
            characterArr = characterArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)

            tagArr = tagArr.map((tag: string) => functions.tag.cleanTag(tag))
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)
            characterArr = characterArr.map((tag: string) => functions.tag.cleanTag(tag))
            characterArr = characterArr.filter((tag: string) => tag.length >= 3)

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
            newTags
        }
    }

    public static applyAliases = async <T extends MiniTag[] | UploadTag[] | string[]>(tags: T) => {
        if (!tags?.length) return tags
        let result = [] as unknown[]
        for (const tag of tags) {
            let tagName = typeof tag === "string" ? tag : tag.tag ?? ""
            let alias = await sql.tag.alias(tagName)

            if (alias) {
                if (typeof tag === "string") {
                    result.push(alias.tag)
                } else {
                    const newTag = {...(tag as MiniTag | UploadTag), tag: alias.tag}
                    result.push(newTag)
                }
            } else {
                result.push(tag)
            }
        }
        return result as T
    }

    public static applyImplications = async (addedTags: string[], tagObjectMapping: {[key: string]: Tag},
        newTagsSet?: Set<string>, bulkTags?: BulkTag[], ) => {
        let newTags = newTagsSet ? [...newTagsSet] : addedTags
        if (!newTags?.length) return addedTags
        if (!newTagsSet) newTagsSet = new Set(addedTags)
        for (const tag of newTags) {
            const implications = await sql.tag.implications(tag)
            if (!implications?.length) continue
            for (const i of implications) {
                if (!newTagsSet.has(i.implication)) addedTags.push(i.implication)
                const tag = await sql.tag.tag(i.implication)
                if (bulkTags) {
                    bulkTags.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type || "tag", 
                    description: tag?.description || null, image: tag?.image || null, 
                    imageHash: tag?.imageHash || null})
                }
            }
        }
        return addedTags
    }

    public static convertToDanbooru = async (tags: string) => {
        let tagArr = tags.split(/\s+/g)
        let tagReplaceMap = await sql.tag.tagReplaceMap()
        tagReplaceMap = functions.util.flipObject(tagReplaceMap)
        tagArr = tagArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag.replaceAll("-", "_"))
        return tagArr.join(" ")
    }

    public static convertFromDanbooru = async (tags: string) => {
        let tagArr = tags.split(/\s+/g)
        let tagReplaceMap = await sql.tag.tagReplaceMap()
        tagArr = tagArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)
        tagArr = tagArr.map((tag: string) => functions.tag.cleanTag(tag))
        tagArr = tagArr.filter((tag: string) => tag.length >= 3)
        return tagArr.join(" ")
    }

    public static appendArtToolTags = (tags: string[], drawingTools?: string[] | null) => {
        if (!drawingTools?.length) return tags

        const toolMap = {
            "clip studio paint": "clip-studio-paint",
            "sai": "paint-tool-sai",
            "photoshop": "photoshop",
            "live2d": "live2d",
            "illuststudio": "illust-studio",
            "photostudio": "photo-studio",
            "comicstudio": "comic-studio",
            "firealpaca": "fire-alpaca",
            "medibang paint": "medibang-paint",
            "medibang paint pro": "medibang-paint",
            "procreate": "procreate",
            "gimp": "gimp",
            "pixia": "pixia",
            "opencanvas": "open-canvas",
            "illustrator": "illustrator",
            "poser": "poser",
            "blender": "blender",
            "ms_paint": "ms-paint",
            "azpainter": "azpainter",
            "azpainter2": "azpainter",
            "krita": "krita",
            "aseprite": "aseprite",
            "aftereffects": "after-effects",
            "ibispaint": "ibis-paint",
            "zbrush": "zbrush",
            "maya": "maya",
            "3dsmax": "3ds-max",
            "cinema4d": "cinema4d",
            "inkscape": "inkscape",
            "azdrawing": "azdrawing",
            "azdrawing2": "azdrawing",
            "pixiv sketch": "pixiv-sketch",
            "vroid studio": "vroid-studio",
            "retas studio": "retas-studio",
            "drawr": "drawr",
            "paintgraphic": "paintgraphic",
            "comicworks": "comicworks",
            "clip paint lab": "clip-paint-lab",
            "sketchbookpro": "sketchbook-pro",
            "paintshoppro": "paintshop-pro",
            "cgillust": "cgillust",
            "metasequoia": "metasequoia",
            "shade": "shade3d",
            "flash": "flash",
            "painter": "corel-painter",
        }

        const appendTags = drawingTools
            .map((tool) => toolMap[String(tool).toLowerCase()])
            .filter((tag): tag is string => tag !== undefined)

        return functions.util.removeDuplicates([...tags, ...appendTags])
    }

    public static splitTagGroups = async (data: CharSplitEntry[], tags: string[], characters: string[]) => {
        let characterNotes = [] as CharSplitNote[]
        let tagGroups = [] as MiniTagGroup[]
        const tagGroupTags: Set<string> = new Set()

        let cleaned = [] as (Omit<CharSplitEntry, "tags"> & {tags: string[]})[]
        for (const entry of data) {
            let filteredTags = entry.tags.split(" ").filter(tag => !entry.characterTags.includes(tag)).join(" ")
            let tags = await serverFunctions.tags.convertFromDanbooru(filteredTags).then((r) => r.split(/\s+/))
            let characterTags = await serverFunctions.tags.convertFromDanbooru(entry.characterTags.join(" ")).then((r) => r.split(/\s+/))
            characterTags = characterTags.filter((c) => c !== "unknown-artist")
            if (!characterTags.length) characterTags = characters
            cleaned.push({...entry, tags, characterTags})
        }

        cleaned.sort((a, b) => a.characterTags.length - b.characterTags.length)
        const seenTags = new Set<string>()
        for (const entry of cleaned) {
            entry.characterTags = entry.characterTags.filter((tag) => !seenTags.has(tag))
            entry.characterTags.forEach((tag) => seenTags.add(tag))
        }

        for (const entry of cleaned) {
            let characterTag = entry.characterTags[0]
            if (!characterTag) characterTag = "unknown-character"

            let note = {} as CharSplitNote
            note.imageWidth = entry.imageWidth
            note.imageHeight = entry.imageHeight
            note.x = entry.x
            note.y = entry.y
            note.width = entry.width
            note.height = entry.height
            note.character = true
            note.characterTag = characterTag
            characterNotes.push(note)

            let name = functions.util.toProperCase(characterTag.split("-")[0])
            let baseName = name.replace(/\d+$/, "")
            let exists = tagGroups.find((g) => g.name === name)
            let i = 2
            while (exists) {
                name = `${baseName}${i}`
                exists = tagGroups.find((g) => g.name === name)
                i++
            }
            let groupTags = entry.tags.filter((tag) => tags.includes(tag))
            tagGroups.push({name, tags: groupTags})
            groupTags.forEach((tag) => tagGroupTags.add(tag))
        }

        const soloTags = tags.filter((tag) => !tagGroupTags.has(tag))
        if (tagGroups.length && soloTags.length) tagGroups.push({name: "Tags", tags: soloTags})

        return {characterNotes, tagGroups}
    }

}