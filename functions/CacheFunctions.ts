/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import localforage from "localforage"
import functions from "./Functions"
import {GetEndpoint, TagCount, Alias, Session, PostSearchParams} from "../types/Types"

export default class CacheFunctions {
    public static cachedThumbs = new Map<string, string>()
    public static cachedImages = new Map<string, string>()
    public static cachedResponses = new Map<string, {data: any, expires: number}>()
    public static cacheDuration = 1000
    public static cacheExpiryTime = 15 * 60 * 1000
    public static cacheExpiry = Date.now() + this.cacheExpiryTime

    public static getThumbCache = (cacheKey: string) => {
        if (Date.now() > this.cacheExpiry) {
            this.cachedThumbs.clear()
            this.cacheExpiry = Date.now() + this.cacheExpiryTime
            return ""
        }
        return this.cachedThumbs.get(cacheKey) || ""
    }

    public static getImageCache = (cacheKey: string) => {
        if (Date.now() > this.cacheExpiry) {
            this.cachedImages.clear()
            this.cacheExpiry = Date.now() + this.cacheExpiryTime
            return ""
        }
        return this.cachedImages.get(cacheKey) || ""
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
    
    public static tagCountsCache = async (session: Session, setSessionFlag: (value: boolean) => void) => {
        let tagCountMap = {} as {[key: string]: TagCount}
        const cache = await localforage.getItem("tagCounts")
        if (cache) {
            return cache as {[key: string]: TagCount}
        } else {
            let tagCounts = await functions.http.get("/api/tag/counts", {tags: []}, session, setSessionFlag)
            for (const tagCount of tagCounts) {
                tagCountMap[tagCount.tag] = tagCount
            }
            localforage.setItem("tagCounts", tagCountMap)
            return tagCountMap
        }
    }

    public static sortedTagCounts = async (tagsInput: string[] | "all", session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!tagsInput.length) return []
        let tags = tagsInput === "all" ? [] : tagsInput
        let tagCountMap = await this.tagCountsCache(session, setSessionFlag)
        if (!tags.length) tags = Object.keys(tagCountMap)
        let result = [] as TagCount[]
        for (const tag of tags) {
            if (tagCountMap[tag]) result.push(tagCountMap[tag])
        }
        result = result.sort((a, b) => b.count > a.count ? 1 : -1)
        return result
    }

    public static aliasCache = async (session: Session, setSessionFlag: (value: boolean) => void) => {
        const cache = await localforage.getItem("aliases")
        if (cache) {
            return cache as Alias[]
        } else {
            let aliasMap = await functions.http.get("/api/tag/aliases", {aliases: []}, session, setSessionFlag)
            localforage.setItem("aliases", aliasMap)
            return aliasMap
        }
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
        localforage.removeItem("aliases")
        localforage.removeItem("tagCounts")
        localforage.removeItem("emojis")
    }
}