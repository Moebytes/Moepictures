import functions from "./Functions"
import {MiniTag, TagCount, Post, PostFull, TagHistory, PostOrdered, Tag, Session, 
UploadTag, PostSearch, UnverifiedPost, TagGroupCategory, MiniTagGroup} from "../types/Types"

export default class TagFunctions {
    public static fixTwitterTag = (tag: string) => {
        return tag.toLowerCase().replaceAll("_", "-").replace(/^[-]+/, "").replace(/[-]+$/, "")
    }

    public static parseTagsSingle = async (post: PostSearch, session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!post.tags) return this.parseTags([post], session, setSessionFlag)
        let tagMap = await functions.cache.tagsCache(session, setSessionFlag)
        let result = [] as Tag[]
        for (let i = 0; i < post.tags.length; i++) {
            const tag = post.tags[i]
            if (tagMap[tag]) result.push(tagMap[tag])
        }
        return result
    }

    public static parseTags = async (posts: PostFull[] | PostSearch[] | PostOrdered[] | Post[], session: Session, 
        setSessionFlag: (value: boolean) => void) => {
        let cleanPosts = posts.filter((p) => !(p as PostSearch).fake)
        const postIDs = cleanPosts.map((post) => post.postID)
        let result = await functions.http.get("/api/search/sidebartags", {postIDs}, session, setSessionFlag).catch(() => null)
        return result ? result : []
    }

    public static parseTagsUnverified = async (posts: UnverifiedPost[]) => {
        let result = [] as TagCount[]
        for (let i = 0; i < posts.length; i++) {
            for (let j = 0; j < posts[i].tags.length; j++) {
                result.push({tag: posts[i].tags[j], count: "1", type: "tag", image: "", imageHash: ""})
            }
        }
        return result
    }

    public static tagCategories = async (parsedTags: string[] | TagCount[] | Tag[] | undefined, session: Session, 
        setSessionFlag: (value: boolean) => void, cache?: boolean) => {
        let artists = [] as MiniTag[]
        let characters = [] as MiniTag[]
        let series = [] as MiniTag[]
        let meta = [] as MiniTag[]
        let tags = [] as MiniTag[] 
        if (!parsedTags) return {artists, characters, series, meta, tags}
        let tagMap = cache ? await functions.cache.tagsCache(session, setSessionFlag) : await functions.http.get("/api/tag/map", 
        {tags: parsedTags.map((t: string | TagCount | Tag) => typeof t === "string" ? t : t.tag)}, session, setSessionFlag)
        for (let i = 0; i < parsedTags.length; i++) {
            let tag = parsedTags[i].hasOwnProperty("tag") ? (parsedTags[i] as TagCount).tag : parsedTags[i] as string
            let count = parsedTags[i].hasOwnProperty("count") ? (parsedTags[i] as TagCount).count : 0
            const foundTag = tagMap[tag]
            if (!foundTag) {
                const unverifiedTag = await functions.http.get("/api/tag/unverified", {tag}, session, setSessionFlag)
                if (unverifiedTag) {
                    const obj = {} as MiniTag
                    obj.tag = tag
                    obj.count = String(count)
                    obj.image = unverifiedTag.image
                    obj.imageHash = unverifiedTag.imageHash
                    obj.type = unverifiedTag.type
                    obj.description = unverifiedTag.description 
                    obj.social = unverifiedTag.social
                    obj.twitter = unverifiedTag.twitter
                    obj.website = unverifiedTag.website
                    obj.fandom = unverifiedTag.fandom
                    obj.wikipedia = unverifiedTag.wikipedia
                    if (unverifiedTag.type === "artist") {
                        artists.push(obj)
                    } else if (unverifiedTag.type === "character") {
                        characters.push(obj)
                    } else if (unverifiedTag.type === "series") {
                        series.push(obj)
                    } else if (unverifiedTag.type === "meta") {
                        meta.push(obj)
                    } else {
                        tags.push(obj)
                    }
                }
                continue
            }
            const obj = {} as MiniTag 
            obj.tag = tag
            obj.count = String(count)
            obj.type = foundTag.type
            obj.image = foundTag.image
            obj.imageHash = foundTag.imageHash
            obj.description = foundTag.description 
            obj.social = foundTag.social
            obj.twitter = foundTag.twitter
            obj.website = foundTag.website
            obj.fandom = foundTag.fandom
            obj.wikipedia = foundTag.wikipedia
            if (foundTag.type === "artist") {
                artists.push(obj)
            } else if (foundTag.type === "character") {
                characters.push(obj)
            } else if (foundTag.type === "series") {
                series.push(obj)
            } else if (foundTag.type === "meta") {
                meta.push(obj)
            } else {
                tags.push(obj)
            }
        }
        return {artists, characters, series, meta, tags}
    }

    public static tagGroupCategories = async (tagGroups: MiniTagGroup[], session: Session, 
        setSessionFlag: (value: boolean) => void, cache?: boolean) => {
        let newTagGroups = [] as {name: string, tags: MiniTag[]}[]
        if (!tagGroups) return []
        for (const tagGroup of tagGroups) {
            if (!tagGroup) continue
            const tagCounts = await functions.cache.tagCountsCache(tagGroup.tags, session, setSessionFlag)
            let {tags} = await this.tagCategories(tagCounts, session, setSessionFlag, cache)
            newTagGroups.push({name: tagGroup.name, tags})
        }
        return newTagGroups
    }

    public static getTagColor = (tag: Tag | TagHistory | MiniTag | TagCount) => {
        if ((tag as Tag).banned) return "strikethrough"
        if ((tag as Tag).r18) return "r18-tag-color"
        if (tag.type === "artist") return "artist-tag-color"
        if (tag.type === "character") return "character-tag-color"
        if (tag.type === "series") return "series-tag-color"
        if (tag.type === "meta") return "meta-tag-color"
        if (tag.type === "appearance") return "appearance-tag-color"
        if (tag.type === "outfit") return "outfit-tag-color"
        if (tag.type === "accessory") return "accessory-tag-color"
        if (tag.type === "action") return "action-tag-color"
        if (tag.type === "scenery") return "scenery-tag-color"
        return "tag-color"
    }

    public static tagObject = (tags: string[]) => {
        return tags.map((tag) => ({tag})) as UploadTag[]
    }

    public static trimSpecialCharacters = (query: string) => {
        return query?.trim().split(/ +/g).map((item) => {
            if (item.startsWith("+-")) return item.replace("+-", "")
            if (item.startsWith("+")) return item.replace("+", "")
            if (item.startsWith("-")) return item.replace("-", "")
            if (item.startsWith("*")) return item.replace("*", "")
            return item
        }).join(" ") || ""
    }

    public static appendSpecialCharacters = (parts: string[], tag: string) => {
        const last = parts[parts.length - 1]
        if (last.startsWith("+-")) return `+-${tag}`
        if (last.startsWith("+")) return `+${tag}`
        if (last.startsWith("-")) return `-${tag}`
        if (last.startsWith("*")) return `*${tag}`
        return tag
    }

    public static appendFavoriteTags = (favoriteTags: string[]) => {
        const favoriteArr = favoriteTags.slice(0, 100)
        let newFavoriteTags = [] as string[]
        for (const item of favoriteArr) {
            if (!item) continue
            newFavoriteTags.push(`+${item}`)
        }
        return newFavoriteTags
    }

    public static negateBlacklist = (blacklist: string) => {
        const blacklistArr = blacklist.split(/ +/g).slice(0, 100)
        let newBlacklist = [] as string[]
        for (const item of blacklistArr) {
            if (!item) continue
            if (item.startsWith("*")) continue
            if (item.startsWith("+-")) {
                newBlacklist.push(`+${item}`)
            } else if (item.startsWith("+")) {
                newBlacklist.push(`+-${item}`)
            } else if (item.startsWith("-")) {
                newBlacklist.push(item)
            } else {
                newBlacklist.push(`-${item}`)
            }
        }
        return newBlacklist
    }

    public static parseTagGroups = (rawTags: string) => {
        const tagGroups: {name: string, tags: string[]}[] = []
        const tags: Set<string> = new Set()
        if (!rawTags) return {tagGroups, tags: []}
      
        const groupRegex = /([a-zA-Z0-9_-]+)\{([^}]+)\}/g
        let match = null as RegExpExecArray | null
      
        while ((match = groupRegex.exec(rawTags)) !== null) {
          const name = match[1]
          const groupTags = match[2].trim().split(/\s+/)
          tagGroups.push({name, tags: groupTags})
          groupTags.forEach(tag => tags.add(tag))
        }
      
        const remainingTags = rawTags.replace(groupRegex, "").trim().split(/\s+/)
        const soloTags = [] as string[]
        remainingTags.forEach(tag => {if (tag) {tags.add(tag); soloTags.push(tag)}})
        if (tagGroups.length && soloTags.length) tagGroups.push({name: "Tags", tags: soloTags})

        return {tagGroups, tags: Array.from(tags)}
    }

    public static cleanTags = (tags: UploadTag[], type: "artists" | "characters" | "series" | "newTags") => {
        if (!functions.util.cleanArray(tags)[0]) {
          tags = []
          if (type === "artists") tags = [{tag: "unknown-artist"}]
          if (type === "characters") tags = [{tag: "unknown-character"}]
          if (type === "series") tags = [{tag: "unknown-series"}]
        }
        tags = tags.filter(Boolean).map((t) => {
          if (t.tag) t.tag = t.tag.toLowerCase().replace(/[^a-z0-9()]+/g, "-")
          return t
        })
        return tags
    }
      
    public static cleanStringTags = (tags: string[] | undefined, type: "artists" | "characters" | "series" | "tags") => {
        if (!functions.util.cleanArray(tags)[0]) {
          tags = []
          if (type === "artists") tags = ["unknown-artist"]
          if (type === "characters") tags = ["unknown-character"]
          if (type === "series") tags = ["unknown-series"]
          if (type === "tags") tags = ["needs-tags"]
        }
        tags = tags?.filter(Boolean).map((t) => t.toLowerCase().replace(/[^a-z0-9()]+/g, "-"))
        return tags || []
    }

    public static parseTagGroupsField = (tags: string[], tagGroups?: MiniTagGroup[] | TagGroupCategory[]) => {
        if (!tagGroups?.length) return tags.join(" ")
        let resultStr = ""
        let removeTags = [] as string[]
        for (const tagGroup of tagGroups) {
            if (!tagGroup) continue
            if (tagGroup.name.toLowerCase() === "tags") continue
            let stringTags = tagGroup.tags.map((tag: string | MiniTag) => typeof tag === "string" ? tag : tag.tag)
            resultStr += `${tagGroup.name}{${stringTags.join(" ")}}\n`
            removeTags.push(...stringTags)
        }
        let missingTags = tags.filter((tag) => !removeTags.includes(tag))
        resultStr += `${missingTags.join(" ")}`
        return resultStr
    }

    public static cleanTag = (tag: string) => {
        return tag.normalize("NFD").replace(/[^a-z0-9_\-()><&!#@]/gi, "").replaceAll("_", "-")
    }
}