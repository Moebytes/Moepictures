/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import enLocale from "../assets/locales/en.json"
import path from "path"
import {UploadImage} from "../types/Types"

export default class UtilFunctions {
    public static defer = async <T extends any[]>(func: (...params: T) => any, timeout: number, ...args: T) => {
        return new Promise<void>((resolve, reject) => {
            setTimeout(() => {
                Promise.resolve(func(...args))
                    .then(resolve)
                    .catch(reject)
            }, timeout)
        })
    }

    public static parseURLParams = (url: string, params?: object | null) => {
        if (!params) return url
        const parsed = url.startsWith("http") ? new URL(url) : new URL(url, window.location.origin)
        Object.entries(params).forEach(([key, value]) => {
            parsed.searchParams.delete(key)
            if (value === undefined || value === null) return

            if (Array.isArray(value)) {
                value.forEach((v) => parsed.searchParams.append(key, String(v)))
            } else {
                parsed.searchParams.set(key, String(value))
            }
        })
        return parsed.toString()
    }

    public static appendURLParams = (url: string, params: {[key: string]: string | boolean | undefined}) => {
        if (!url) return ""
        const [baseUrl, hash] = url.split("#")
        const obj = new URL(baseUrl)
    
        for (const [key, value] of Object.entries(params)) {
            if (typeof value !== "undefined") obj.searchParams.set(key, value.toString())
        }
        return hash ? `${baseUrl}#${hash.split("?")[0]}?${obj.searchParams.toString()}` : obj.toString()
    }

    public static removeQueryParams = (image: string) => {
        const url = new URL(image)
        url.search = ""
        return url.toString()
    }
    
    public static isSafari = () => {
        // @ts-ignore
        return /constructor/i.test(window.HTMLElement) || (function (p) {return p.toString() === "[object SafariRemoteNotification]" })(!window["safari"] || (typeof safari !== "undefined" && safari.pushNotification))
    }

    public static decodeEntities = (encodedString: string) => {
        const regex = /&(nbsp|amp|quot|lt|gt);/g
        const translate = {
            nbsp: " ",
            amp : "&",
            quot: "\"",
            lt  : "<",
            gt  : ">"
        }
        return encodedString.replace(regex, function(match, entity) {
            return translate[entity]
        }).replace(/&#(\d+);/gi, function(match, numStr) {
            const num = parseInt(numStr, 10)
            return String.fromCharCode(num)
        })
    }

    public static cleanHTML = (str: string) => {
        return this.decodeEntities(str).replace(/<\/?[a-z][^>]*>/gi, "").replace(/\r?\n|\r/g, "")
    }

    public static removeDiacritics = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    }

    public static removeDuplicates = <T>(array: T[]) => {
        const set = new Set<string>()
        return array.filter(item => {
            const serialized = JSON.stringify(item)
            if (set.has(serialized)) {
                return false
            } else {
                set.add(serialized)
                return true
            }
        })
    }

    public static removeItem = <T>(array: T[], value: T) => {
        return array.filter((item) => JSON.stringify(item) !== JSON.stringify(value))
    }

    public static arrayIncludes = (str: string | undefined, arr: string[]) => {
        for (let i = 0; i < arr.length; i++) {
            if (str?.includes(arr[i])) return true
        }
        return false
    }
    
    public static toProperCase = (str: string) => {
        if (!str) return ""
        return str.replace(/\w\S*/g, (txt) => {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            }
        )
    }

    public static alphaNumeric(str: string) {
        for (let i = 0; i < str.length; i++) {
          const code = str.charCodeAt(i)
          if (!(code > 47 && code < 58) && // 0-9
              !(code > 64 && code < 91) && // A-Z
              !(code > 96 && code < 123)) { // a-z
            return false
          }
        }
        return true
    }

    public static round = (value: number, step?: number) => {
        if (!step) step = 1.0
        const inverse = 1.0 / step
        return Math.round(value * inverse) / inverse
    }

    public static getFile = async (filepath: string) => {
        const blob = await fetch(filepath).then((r) => r.blob())
        const name = path.basename(filepath).replace(".mp3", "").replace(".wav", "").replace(".flac", "").replace(".ogg", "")
        // @ts-ignore
        blob.lastModifiedDate = new Date()
        // @ts-ignore
        blob.name = name
        return blob as File
    }

    public static shuffleArray = <T>(array: T[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    public static insertAtIndex = <T>(array: T[], index: number, item: T | null) => {
        if (item === null) return array.filter((value, i) => i !== index)
        return array.map((value, i) => (i === index ? item : value))
    }

    public static parseUserAgent = (userAgent?: string) => {
        if (!userAgent) return "unknown"
        let os = "unknown"
        let browser = "unknown"

        if (/CFNetwork\/.*Darwin\//i.test(userAgent)) {
            return "iOS App"
        }

        if (/okhttp\//i.test(userAgent)) {
            return "Android App"
        }
    
        const osPatterns = {
            "Windows": /Windows NT (\d+\.\d+)/,
            "macOS": /Macintosh; Intel Mac OS X (\d+[_\.]\d+)/,
            "Linux": /Linux/,
            "iPhone": /iPhone OS (\d+[_\.]\d+)/,
            "iPad": /iPad; CPU OS (\d+[_\.]\d+)/,
            "Android": /Android (\d+\.\d+)/
        }
    
        const browserPatterns = {
            "Chrome": /Chrome\/(\d+\.\d+)/,
            "Firefox": /Firefox\/(\d+\.\d+)/,
            "Safari": /Version\/(\d+\.\d+).*Safari\//,
            "Internet Explorer": /MSIE (\d+\.\d+)/,
            "Edge": /Edg\/(\d+\.\d+)/,
            "Opera": /Opera\/(\d+\.\d+)|OPR\/(\d+\.\d+)/,
            "Brave": /Brave\/(\d+\.\d+)/,
            "Vivaldi": /Vivaldi\/(\d+\.\d+)/
        }
    
        for (const [key, pattern] of Object.entries(osPatterns)) {
            const match = userAgent.match(pattern)
            if (match) {
                os = key
                break
            }
        }
    
        for (const [key, pattern] of Object.entries(browserPatterns)) {
            const match = userAgent.match(pattern)
            if (match) {
                browser = key
                break
            }
        }
      
        if (os === "unknown" && browser === "unknown") {
          return userAgent
        }

        return `${os} ${browser}`
    }

    public static isJapaneseText = (text: string) => {
        return /[\u3040-\u30FF\u4E00-\u9FFF\uFF66-\uFF9F]/.test(text)
    }

    public static filterNulls = <T>(arr?: (T | null | undefined)[] | null) => {
        if (!arr) return []
        return arr.filter((item) => item !== null && item !== undefined) as T[]
    }

    public static safeNumber = (text: string) => {
        if (Number.isNaN(Number(text))) return null
        return Number(text)
    }

    public static cleanArray = <T>(arr?: T[]) => {
        if (!arr) return []
        return arr.filter(item => item && (typeof item !== "object" || Object.keys(item).length > 0))
    }

    public static numberArray = (max: number, spacing: number) => {
        const arr = [] as string[]
        for (let i = spacing; i <= max; i += spacing) {
            arr.push(i.toString())
        }
        return arr
    }

    public static getSiteName = (link: string, i18n: typeof enLocale) => {
        try {
            if (link.includes("pximg.net")) return "Pximg"
            if (link.includes("pbs.twimg")) return "Twimg"
            const domain = new URL(link).hostname.replace("www.", "").split(".")?.[0] || ""
            return this.toProperCase(domain)
        } catch {
            return i18n.labels.unknown || "Unknown"
        }
    }

    public static stripLinks = (text: string) => {
        return text.replace(/(https?:\/\/[^\s]+)/g, "").replace(/(:[^\s]+:)/g, "")
    }

    public static readableFileSize = (bytes: number) => {
        const i = bytes === 0 ? 0 : Math.floor(Math.log(bytes) / Math.log(1024))
        return `${Number((bytes / Math.pow(1024, i)).toFixed(2))} ${["B", "KB", "MB", "GB", "TB"][i]}`
    }

    public static numericSortImages = (items: UploadImage[]) => {
        return items.sort((a, b) => {
            let splitA = a.name.split("_")
            let partA = splitA[0] + "_" + splitA[splitA.length - 1]
            partA = partA.replace(/[^a-zA-Z0-9_.]/g, "").split(".")[0]
            let splitB = b.name.split("_")
            let partB = splitB[0] + "_" + splitB[splitB.length - 1]
            partB = partB.replace(/[^a-zA-Z0-9_.]/g, "").split(".")[0]
            return partA.localeCompare(partB, undefined, {numeric: true, sensitivity: "base"})
        })
    }

    public static objDiff = <T extends object>(objA: T, objB: T) => {
        let diff = {} as T
        const keys = new Set([...Object.keys(objA), ...Object.keys(objB)])

        for (const key of keys) {
            const valueA = objA[key]
            const valueB = objB[key]

            if (!(key in objB)) {
                diff[key] = null
            } else if (!(key in objA) || valueA !== valueB) {
                diff[key] = valueB
            }
        }
        return diff
    }

    public static replaceAtIndex = <T>(arr: T[], index: number, element: T) => {
        const newArray = [...arr]
        newArray[index] = element
        return newArray
    }

    public static parseFilename = (filename: string) => {
        let source = filename.match(/\*\d+\*/g)?.[0].replaceAll("*", "") || ""
        const id = filename.replace(/\*\d+\*/g, "").match(/\d{4,}/g)?.[0] || filename.split("_")[0]

        if (!source) source = id
        
        let match = filename.match(/_(p|g!?|c!?|s)(\d+)/i)
        const qualifier = match?.[1].toLowerCase() || "s"
        const num = Number(match?.[2] || 0)

        return {id, qualifier, num, source}
    }

    public static flipObject = (obj: object) => {
        return Object.fromEntries(Object.entries(obj).map(([key, value]) => [value, key]))
    }

    public static extractLinks = (text: string) => {
        const matches = text.match(/\b((?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*)/gi)
        return matches ? matches : [] as string[]
    }

    public static appendAndLimit = <T>(item: T, list: T[] | undefined, limit = 10) => {
        const combined = [item, ...(list || [])].filter(Boolean)
        return this.removeDuplicates(combined).slice(0, limit)
    }
}