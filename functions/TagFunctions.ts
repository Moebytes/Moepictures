import functions from "./Functions"
import permissions from "../structures/Permissions"
import {MiniTag, TagCount, Post, PostFull, TagHistory, PostOrdered, Tag, Session, PostHistory,
UploadTag, PostSearch, UnverifiedPost, TagGroupCategory, MiniTagGroup} from "../types/Types"

export default class TagFunctions {
    public static fixTwitterTag = (tag: string) => {
        return tag.toLowerCase().replaceAll("_", "-").replace(/^[-]+/, "").replace(/[-]+$/, "")
    }

    public static parseTags = async (posts: PostFull[] | PostSearch[] | PostOrdered[] | Post[], session: Session, 
        setSessionFlag: (value: boolean) => void, isBanner?: boolean) => {
        if (!posts.length) return []
        let taggedPosts = posts.filter((p) => p.hasOwnProperty("tags")) as PostFull[] | PostSearch[] 
        if (!taggedPosts.length) {
            taggedPosts = await functions.http.get("/api/posts", 
            {postIDs: posts.map((p: Post) => p.postID).slice(0, 20)}, session, setSessionFlag, true)
        }
        let uniqueTags = new Set<string>()
        for (let i = 0; i < taggedPosts.length; i++) {
            for (let j = 0; j < taggedPosts[i].tags.length; j++) {
                uniqueTags.add(taggedPosts[i].tags[j])
            }
        }
        const uniqueTagArray = Array.from(uniqueTags)
        let result = await functions.cache.sortedTagCounts(uniqueTagArray.slice(0, 300), session, setSessionFlag)
        for (let i = 0; i < uniqueTagArray.length; i++) {
            const found = result.find((r: any) => r.tag === uniqueTagArray[i])
            if (!found) result.push({tag: uniqueTagArray[i], count: "0", type: "tag", 
                image: "", imageHash: "", hidden: false, r18: false, social: "", twitter: "",
                website: "", fandom: "", wikipedia: ""})
        }
        let characterTags = result.filter((t: any) => t.type === "character")
        let seriesTags = result.filter((t: any) => t.type === "series")
        return isBanner ? [...seriesTags, ...characterTags] : result
    }

    public static parseTagsUnverified = async (posts: UnverifiedPost[]) => {
        let result = [] as TagCount[]
        for (let i = 0; i < posts.length; i++) {
            for (let j = 0; j < posts[i].tags.length; j++) {
                result.push({tag: posts[i].tags[j], count: "1", type: "tag", 
                image: "", imageHash: "", hidden: false, r18: false, social: "", twitter: "",
                website: "", fandom: "", wikipedia: ""})
            }
        }
        return result
    }

    public static tagCategories = async (parsedTags: string[] | TagCount[] | Tag[] | undefined, session: Session, 
        setSessionFlag: (value: boolean) => void) => {
        let artists = [] as TagCount[]
        let characters = [] as TagCount[]
        let series = [] as TagCount[]
        let meta = [] as TagCount[]
        let tags = [] as TagCount[] 
        if (!parsedTags) return {artists, characters, series, meta, tags}
        let tagMap = await functions.cache.tagCountsCache(session, setSessionFlag)
        let unverifiedCheck = [] as string[]
        for (let i = 0; i < parsedTags.length; i++) {
            let tag = parsedTags[i].hasOwnProperty("tag") ? (parsedTags[i] as TagCount).tag : parsedTags[i] as string
            let count = parsedTags[i].hasOwnProperty("count") ? (parsedTags[i] as TagCount).count : 0
            const foundTag = tagMap[tag]
            if (foundTag) {
                const obj = {} as TagCount 
                obj.tag = tag
                obj.count = String(count)
                obj.type = foundTag.type
                obj.image = foundTag.image
                obj.imageHash = foundTag.imageHash
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
            } else {
                unverifiedCheck.push(tag)
            }
        }
        if (permissions.isMod(session) && unverifiedCheck.length) {
            const unverifiedTags = await functions.http.get("/api/tag/list/unverified", {tags: unverifiedCheck}, session, setSessionFlag)
            for (const unverifiedTag of unverifiedTags) {
                const obj = {} as TagCount
                obj.tag = unverifiedTag.tag
                obj.count = "0"
                obj.image = unverifiedTag.image
                obj.imageHash = unverifiedTag.imageHash
                obj.type = unverifiedTag.type
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
        }
        return {artists, characters, series, meta, tags}
    }

    public static tagGroupCategories = async (post: PostSearch | PostHistory | UnverifiedPost, session: Session, 
        setSessionFlag: (value: boolean) => void) => {
        let tagGroups = post.tagGroups
        let newTagGroups = [] as {name: string, tags: TagCount[]}[]
        if (!tagGroups?.length && !post.tags) {
            if ("originalID" in post) {
                let fullPost = await functions.http.get("/api/post/unverified", {postID: post.postID}, session, setSessionFlag)
                tagGroups = fullPost?.tagGroups || []
            } else {
                let fullPost = await functions.http.get("/api/post", {postID: post.postID}, session, setSessionFlag)
                tagGroups = fullPost?.tagGroups || []
            }
        }
        if (!tagGroups?.length) return []
        for (const tagGroup of tagGroups) {
            if (!tagGroup) continue
            const tagCounts = await functions.cache.sortedTagCounts(tagGroup.tags, session, setSessionFlag)
            let {tags} = await this.tagCategories(tagCounts, session, setSessionFlag)
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

    public static mapSpecialQualities = (query: string) => {
        return query?.trim().split(/ +/g).map((item) => {
            if (item.startsWith("+-")) return "+-"
            if (item.startsWith("+")) return "+"
            if (item.startsWith("-")) return "-"
            if (item.startsWith("*")) return "*"
            return ""
        })
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
      
        const groupRegex = /([a-zA-Z0-9_-]+)\s*\{([^}]+)\}/g
        let match = null as RegExpExecArray | null
      
        while ((match = groupRegex.exec(rawTags)) !== null) {
          const name = match[1].trim()
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
          if (t.tag) t.tag = t.tag.toLowerCase().replace(/[^a-z0-9():><&!#@?]+/g, "-")
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
        tags = tags?.filter(Boolean).map((t) => t.toLowerCase().replace(/[^a-z0-9():><&!#@?]+/g, "-"))
        return tags || []
    }

    public static cleanTag = (tag: string) => {
        return tag.toLowerCase().normalize("NFD").replace(/[^a-z0-9_\-():><&!#@?]/gi, "")
        .replaceAll("_", "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "")
    }

    public static parseTagGroupsField = (tags: string[], tagGroups?: MiniTagGroup[] | TagGroupCategory[]) => {
        if (!tagGroups?.length) return tags.join(" ")
        let resultStr = ""
        let removeTags = [] as string[]
        for (const tagGroup of tagGroups) {
            if (!tagGroup) continue
            if (tagGroup.name.toLowerCase() === "tags") continue
            let stringTags = tagGroup.tags.map((tag: string | TagCount) => typeof tag === "string" ? tag : tag.tag)
            resultStr += `${tagGroup.name}{${stringTags.join(" ")}}\n`
            removeTags.push(...stringTags)
        }
        let missingTags = tags.filter((tag) => !removeTags.includes(tag))
        resultStr += `${missingTags.join(" ")}`
        return resultStr
    }

    public static appendOrphanTags = (tagGroups: TagGroupCategory[], tags?: TagCount[]) => {
        if (!tags) return tagGroups
        let tagGroupTagsSet = new Set(tagGroups.flatMap((t) => t.tags.map((t) => t.tag)))
        let orphanTags = tags.filter((t) => !tagGroupTagsSet.has(t.tag))

        if (orphanTags.length) {
            let tagsGroupIndex = tagGroups.findIndex((g) => g.name === "Tags")
            if (tagsGroupIndex >= 0) {
                const existingGroup = tagGroups[tagsGroupIndex]
                const updatedGroup = {
                    ...existingGroup,
                    tags: [...existingGroup.tags, ...orphanTags]
                }
                const newTagGroups = [...tagGroups]
                newTagGroups.splice(tagsGroupIndex, 1, updatedGroup)
                return newTagGroups
            } else {
                return [...tagGroups, {name: "Tags", tags: orphanTags}]
            }
        }
        return tagGroups
    }
}