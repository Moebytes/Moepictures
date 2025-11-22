import axios from "axios"
import sql from "../sql/SQLQuery"
import fs from "fs"
import path from "path"
import util from "util"
import child_process from "child_process"
import sharp from "sharp"
import functions from "../functions/Functions"
import serverFunctions from "./ServerFunctions"
import {UploadImage, PostRating, UploadTag, MiniTag, PostTagged, Tag, WDTaggerResponse, 
PostType, PostStyle, BulkTag} from "../types/Types"

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
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/wdtagger/config.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(configPath, JSON.stringify(data, null, 4))
        }
        if (!fs.existsSync(csvPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/wdtagger/selected_tags.csv`, {responseType: "text"}).then((r) => r.data)
            fs.writeFileSync(csvPath, data)
        }
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading waifu diffusion tagger...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/wdtagger/model.safetensors`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
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

    public static downloadImageRater = async () => {
        const raterPath = path.join(__dirname, "../../assets/python/imagerater")
        if (!fs.existsSync(raterPath)) fs.mkdirSync(raterPath, {recursive: true})
        const configPath = path.join(raterPath, "config.json")
        const modelPath = path.join(raterPath, "model.safetensors")
        const preprocessPath = path.join(raterPath, "preprocessor_config.json")
        if (!fs.existsSync(configPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/imagerater/config.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(configPath, JSON.stringify(data, null, 4))
        }
        if (!fs.existsSync(preprocessPath)) {
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/imagerater/preprocessor_config.json`, {responseType: "json"}).then((r) => r.data)
            fs.writeFileSync(preprocessPath, JSON.stringify(data, null, 4))
        }
        if (!fs.existsSync(modelPath)) {
            console.log("Downloading image rater...")
            const data = await axios.get(`https://huggingface.co/Moebits/anime-models/resolve/main/imagerater/model.safetensors`, {responseType: "arraybuffer"}).then((r) => r.data)
            fs.writeFileSync(modelPath, Buffer.from(data))
            console.log("Done!")
        }
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

        let booruLinks = await serverFunctions.links.booruLinks(pngBytes)
        let {tagData, danbooruLink, newRating} = await serverFunctions.links.testBooruLinks(booruLinks, rating)
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

            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }

            tagArr = tagArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)
            characterArr = characterArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag)

            tagArr = tagArr.map((tag: string) => functions.tag.cleanTag(tag))
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)
            characterArr = characterArr.map((tag: string) => functions.tag.cleanTag(tag))
            characterArr = characterArr.filter((tag: string) => tag.length >= 3)

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
                characterArr = characterArr.filter((tag: string) => !tag.includes(blockedTags[i]))
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
        let tagArr = tags.split(/ +/g)
        let tagReplaceMap = await sql.tag.tagReplaceMap()
        tagReplaceMap = functions.util.flipObject(tagReplaceMap)
        tagArr = tagArr.map((tag: string) => tagReplaceMap[tag] ? tagReplaceMap[tag] : tag.replaceAll("-", "_"))
        return tagArr.join(" ")
    }

    public static appendArtToolTags = (tags: string[], drawingTools?: string[] | null) => {
        if (!drawingTools?.length) return tags
        let appendTags = [] as string[]

        drawingTools = drawingTools.map((tool) => String(tool).toLowerCase())

        for (const tool of drawingTools) {
            if (tool === "clip studio paint") {
                appendTags.push("clip-studio-paint")
            } else if (tool === "sai") {
                appendTags.push("paint-tool-sai")
            } else if (tool === "photoshop") {
                appendTags.push("photoshop")
            } else if (tool === "live2d") {
                appendTags.push("live2d")
            } else if (tool === "illuststudio") {
                appendTags.push("illust-studio")
            } else if (tool === "photostudio") {
                appendTags.push("photo-studio")
            } else if (tool === "comicstudio") {
                appendTags.push("comic-studio")
            } else if (tool === "firealpaca") {
                appendTags.push("fire-alpaca")
            } else if (tool === "medibang paint" || tool === "medibang paint pro") {
                appendTags.push("medibang-paint")
            } else if (tool === "procreate") {
                appendTags.push("procreate")
            } else if (tool === "gimp") {
                appendTags.push("gimp")
            } else if (tool === "pixia") {
                appendTags.push("pixia")
            } else if (tool === "opencanvas") {
                appendTags.push("open-canvas")
            } else if (tool === "illustrator") {
                appendTags.push("illustrator")
            } else if (tool === "poser") {
                appendTags.push("poser")
            } else if (tool === "blender") {
                appendTags.push("blender")
            } else if (tool === "ms_paint") {
                appendTags.push("ms-paint")
            } else if (tool === "azpainter" || tool === "azpainter2") {
                appendTags.push("azpainter")
            } else if (tool === "krita") {
                appendTags.push("krita")
            } else if (tool === "aseprite") {
                appendTags.push("aseprite")
            } else if (tool === "aftereffects") {
                appendTags.push("after-effects")
            } else if (tool === "ibispaint") {
                appendTags.push("ibis-paint")
            } else if (tool === "zbrush") {
                appendTags.push("zbrush")
            } else if (tool === "maya") {
                appendTags.push("maya")
            } else if (tool === "3dsmax") {
                appendTags.push("3ds-max")
            } else if (tool === "cinema4d") {
                appendTags.push("cinema4d")
            } else if (tool === "inkscape") {
                appendTags.push("inkscape")
            } else if (tool === "azdrawing" || tool === "azdrawing2") {
                appendTags.push("azdrawing")
            } else if (tool === "pixiv sketch") {
                appendTags.push("pixiv-sketch")
            } else if (tool === "vroid studio") {
                appendTags.push("vroid-studio")
            } else if (tool === "retas studio") {
                appendTags.push("retas-studio")
            } else if (tool === "drawr") {
                appendTags.push("drawr")
            } else if (tool === "paintgraphic") {
                appendTags.push("paintgraphic")
            } else if (tool === "comicworks") {
                appendTags.push("comicworks")
            } else if (tool === "clip paint lab") {
                appendTags.push("clip-paint-lab")
            } else if (tool === "sketchbookpro") {
                appendTags.push("sketchbook-pro")
            } else if (tool === "paintshoppro") {
                appendTags.push("paintshop-pro")
            } else if (tool === "cgillust") {
                appendTags.push("cgillust")
            } else if (tool === "metasequoia") {
                appendTags.push("metasequoia")
            } else if (tool === "shade") {
                appendTags.push("shade3d")
            } else if (tool === "flash") {
                appendTags.push("flash")
            } else if (tool === "painter") {
                appendTags.push("corel-painter")
            }
        }

        return functions.util.removeDuplicates([...tags, ...appendTags])
    }

}