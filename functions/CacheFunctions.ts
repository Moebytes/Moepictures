import localforage from "localforage"
import functions from "./Functions"
import {GetEndpoint, TagCount, Tag, Session, PostSearchParams} from "../types/Types"

export default class CacheFunctions {
    public static cachedThumbs = new Map<string, string>()
    public static cachedImages = new Map<string, string>()
    public static cachedResponses = new Map<string, {data: any, expires: number}>()
    public static cacheDuration = 1000

    public static getThumbCache = (cacheKey: string) => {
        return this.cachedThumbs.get(cacheKey) || ""
    }

    public static responseCached = <T extends string>(endpoint: T, params: GetEndpoint<T>["params"]) => {
        let cacheKey = `${endpoint}_${JSON.stringify(params)}`
        if ((params as PostSearchParams)?.sort !== "random") {
            const cachedResponse = this.cachedResponses.get(cacheKey)
            if (cachedResponse && Date.now() < cachedResponse.expires) {
                return true
            }
        }
        return false
    }

    public static clearResponseCache = () => {
        this.cachedResponses.clear()
    }

    public static clearResponseCacheKey = (endpoint: string) => {
        this.cachedResponses.forEach((value, key) => {
            if (key.startsWith(endpoint)) {
                this.cachedResponses.delete(key)
            }
        })
    }

    public static noCacheURL = (image: string) => {
        const url = new URL(image)
        const roundedTime = Math.floor(Date.now() / 30000) * 30000
        url.searchParams.set("update", roundedTime.toString())
        return url.toString()
    }

    public static tagsCache = async (session: Session, setSessionFlag: (value: boolean) => void) => {
        const cache = await localforage.getItem("tags")
        if (cache) {
            return cache as {[key: string]: Tag}
        } else {
            let tagMap = await functions.http.get("/api/tag/map", {tags: []}, session, setSessionFlag)
            localforage.setItem("tags", tagMap)
            return tagMap
        }
    }
    
    public static tagCountsCache = async (tags: string[], session: Session, setSessionFlag: (value: boolean) => void) => {
        let tagCountMap = {} as {[key: string]: TagCount}
        const cache = await localforage.getItem("tagCounts")
        if (cache) {
            tagCountMap = cache as {[key: string]: TagCount}
        } else {
            let tagCounts = await functions.http.get("/api/tag/counts", {tags: []}, session, setSessionFlag)
            for (const tagCount of tagCounts) {
                tagCountMap[tagCount.tag] = tagCount
            }
            localforage.setItem("tagCounts", tagCountMap)
        }
        let result = [] as TagCount[]
        for (const tag of tags) {
            if (tagCountMap[tag]) result.push(tagCountMap[tag])
        }
        return result
    }

    public static emojisCache = async (session: Session, setSessionFlag: (value: boolean) => void) => {
        const cache = await localforage.getItem("emojis")
        if (cache) {
            return cache as {[key: string]: string}
        } else {
            let emojis = await functions.http.get("/api/misc/emojis", null, session, setSessionFlag)
            localforage.setItem("emojis", cache)
            return emojis
        }
    }

    public static clearCache = () => {
        localforage.removeItem("tags")
        localforage.removeItem("tagCounts")
        localforage.removeItem("emojis")
    }
}