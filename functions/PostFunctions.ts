/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import path from "path"
import functions from "./Functions"
import permissions from "../structures/Permissions"
import {NavigateFunction} from "react-router-dom"
import {Post, PostFull, PostOrdered, Session, PostSearch, UnverifiedPost, PostHistory, PostRating, PostStyle, UploadImage,
UploadTag} from "../types/Types"

export default class PostFunctions {
    public static mirrorsJSON = (sourceMirrors: string) => {
        if (!sourceMirrors) return ""
        const mirrorsArr = sourceMirrors.split("\n")
        let json = {}
        for (const mirror of mirrorsArr) {
            if (mirror.includes("deviantart")) json["deviantart"] = mirror
            if (mirror.includes("artstation")) json["artstation"] = mirror
            if (mirror.includes("youtube")) json["youtube"] = mirror
            if (mirror.includes("soundcloud")) json["soundcloud"] = mirror
            if (mirror.includes("bandcamp")) json["bandcamp"] = mirror
            if (mirror.includes("sketchfab")) json["sketchfab"] = mirror
            if (mirror.includes("twitter") || mirror.includes("x.com")) json["twitter"] = mirror
        }
        return JSON.stringify(json)
    }

    public static stripTags = <T extends Post[] | PostSearch[] | PostFull[] | PostHistory[]>(posts: T) => {
        for (let i = 0; i < posts.length; i++) {
            // @ts-ignore
            delete posts[i].tags
        }
        return posts as T
    }

    public static cleanTitle = (title?: string | null) => {
        if (!title) return ""
        return title.replace(/[\/\?<>\\:\*\|"%]/g, "")
    }

    public static borderColor = (post: PostSearch) => {
        if (post.favorited) return "var(--favoriteBorder)"
        if (post.favgrouped) return "var(--favgroupBorder)"
        if (post.hidden) return "var(--takendownBorder)"
        if (post.locked) return "var(--lockedBorder)"
        if (post.hasChildren) return "var(--parentBorder)"
        if (post.parentID) return "var(--childBorder)"
        if (post.isGrouped) return "var(--groupBorder)"
        if (Number(post.variationCount) > 1) return "var(--variationBorder)"
        return "var(--imageBorder)"
    }

    public static updateLocalFavorite = (postID: string, favorited: boolean, posts: PostSearch[] | PostOrdered[] | Post[], 
        setPosts: (state: PostSearch[] | PostOrdered[] | Post[]) => void) => {
        if (!posts?.length) return
        const postIndex = posts.findIndex((p) => p.postID === postID)
        if (postIndex === -1) return
        posts = structuredClone(posts);
        (posts[postIndex] as PostSearch).favorited = favorited
        localStorage.setItem("savedPosts", JSON.stringify(posts))
    }

    public static generateSlug = (name: string) => {
        let slug = String(name).trim().toLowerCase().replace(/\s+/g, "-").replaceAll("/", "").replaceAll("\\", "")
        slug = slug.replaceAll("#", "")
        slug = slug.replaceAll("?", "")
        slug = slug.replaceAll("&", "")
        if (!slug) slug = "untitled"
        return slug
    }

    public static postSlug = (title?: string | null, englishTitle?: string | null) => {
        if (!title) return "untitled"
        if (englishTitle) return this.generateSlug(englishTitle)
        return this.generateSlug(title)
    }

    public static currentUploads = (pending: UnverifiedPost[] = []) => {
        return pending.reduce((count, p) => count + (p.deleted ? 0 : 1), 0)
    }

    public static openPost = async (postResolvable: Post | PostHistory | string | number | null, event: React.MouseEvent, navigate: NavigateFunction, 
        session?: Session, setSessionFlag?: (value: boolean) => void, historyIndex = "") => {
        if (!postResolvable) return
        let post = postResolvable as Post | undefined
        if (typeof postResolvable === "string" || typeof postResolvable === "number") {
            if (session && setSessionFlag) post = await functions.http.get("/api/post", {postID: String(postResolvable)}, session, setSessionFlag)
        }
        if (!post) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${post.postID}/${post.slug}${historyIndex}`, "_blank")
        } else {
            navigate(`/post/${post.postID}/${post.slug}${historyIndex}`)
        }
    }

    public static processRedirects = async (post: PostFull | PostSearch | PostHistory | UnverifiedPost | null, postID: string, slug: string, navigate: NavigateFunction, 
        session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!post || postID !== post.postID) return
        slug = decodeURIComponent(slug).trim()
        if (slug !== post.slug) {
            if (!permissions.isMod(session)) {
                const redirects = await functions.http.get("/api/post/redirects", {postID}, session, setSessionFlag)
                for (const redirect of redirects) {
                    if (redirect.oldSlug === slug) {
                        const searchParams = new URLSearchParams(window.location.search)
                        const newPath = location.pathname.replace(/(?<=\d+)\/[^/]+$/, "") + `/${post.slug}`
                        return navigate(`${newPath}?${searchParams}`, {replace: true})
                    }
                }
                functions.dom.replaceLocation("/404")
            } else {
                const searchParams = new URLSearchParams(window.location.search)
                const newPath = location.pathname.replace(/(?<=\d+)\/[^/]+$/, "") + `/${post.slug}`
                navigate(`${newPath}?${searchParams}`, {replace: true})
            }
        }
    }

    public static isR18 = (ratingType: PostRating) => {
        return ratingType === "lewd" || ratingType === "all+l"
    }

    public static isSketch = (styleType: PostStyle) => {
        return styleType === "sketch" || styleType === "lineart"
    }

    public static parseImages = async (post: PostSearch | PostHistory, session: Session) => {
            let images = [] as UploadImage[]
            let upscaledImages = [] as UploadImage[]
            for (let i = 0; i < post.images.length; i++) {
                const image = post.images[i]
                const upscaledImage = post.upscaledImages?.[i] || image
    
                let imgLink = typeof image === "string" ? await functions.link.getPostImage(post, i, session, false) : functions.link.getImageLink(image)
                let upscaledImgLink = typeof upscaledImage === "string" ? await functions.link.getPostImage(post, i, session, true) : functions.link.getImageLink(upscaledImage, true)
                let altSource = typeof image === "string" ? "" : image.altSource
                let directLink = typeof image === "string" ? "" : image.directLink
    
                let buffer = await functions.http.getBuffer(functions.util.appendURLParams(imgLink, {upscaled: false}), {"x-force-upscale": "false"})
                let upscaledBuffer = await functions.http.getBuffer(functions.util.appendURLParams(upscaledImgLink, {upscaled: true}), {"x-force-upscale": "true"})
    
                if (buffer.byteLength) {
                    let ext = path.extname(imgLink)
                    let link = await functions.crypto.decryptItem(imgLink, session)
                    if (!link.includes(ext)) link += `#${ext}`
                    let decrypted = await functions.crypto.decryptBuffer(buffer, imgLink, session)
    
                    let {width, height, size, duration} = await functions.image.dimensions(link)
                    let {thumbnail, thumbnailExt} = await functions.image.thumbnail(link)
    
                    images.push({link, ext: ext.replace(".", ""), width, height, size, duration, thumbnail, thumbnailExt, altSource,
                    directLink, originalLink: imgLink, bytes: Object.values(new Uint8Array(decrypted)), name: path.basename(imgLink)})
                }
                if (upscaledBuffer.byteLength) {
                    let upscaledExt = path.extname(upscaledImgLink)
                    let upscaledLink = await functions.crypto.decryptItem(upscaledImgLink, session)
                    if (!upscaledLink.includes(upscaledExt)) upscaledLink += `#${upscaledExt}`
                    let decrypted = await functions.crypto.decryptBuffer(upscaledBuffer, upscaledImgLink, session)
                    
                    let {width, height, size, duration} = await functions.image.dimensions(upscaledLink)
                    let {thumbnail, thumbnailExt} = await functions.image.thumbnail(upscaledLink)
                    
                    upscaledImages.push({link: upscaledLink, ext: upscaledExt.replace(".", ""), width, height, 
                    size, duration, thumbnail, thumbnailExt, originalLink: upscaledImgLink, altSource, directLink,
                    bytes: Object.values(new Uint8Array(decrypted)), name: path.basename(upscaledImgLink)})
                }
            }
            
            return {images, upscaledImages}
        }

        public static parseNewTags = async (post: PostSearch | PostHistory, session: Session, setSessionFlag: (value: boolean) => void) => {
            const tags = post.tags
            if (!tags?.[0]) return []
            const tagMap = await functions.cache.tagCountsCache(session, setSessionFlag)
            let notExists = [] as UploadTag[]
            for (let i = 0; i < tags.length; i++) {
                const exists = tagMap[tags[i]]
                if (!exists) notExists.push({tag: tags[i], description: `${functions.util.toProperCase(tags[i]).replaceAll("-", " ")}.`})
            }
            return notExists
        }

        public static imageSourceMap = (post: Post | PostHistory) => {
            const sourceMap = {} as {[key: string]: string | null}
            if ("historyID" in post) {
                if (post.imageSources) {
                    for (const entry of Object.entries(post.imageSources)) {
                        let [key, value] = entry
                        if (value?.trim()) {
                            sourceMap[String(key)] = value.trim()
                        }
                    }
                }
            } else {
                for (const image of post.images) {
                    if (image.altSource?.trim()) {
                        sourceMap[String(image.order)] = image.altSource.trim()
                    }
                }
            }
            return sourceMap
        }

        public static imageLinkMap = (post: Post | PostHistory) => {
            const linkMap = {} as {[key: string]: string | null}
            if ("historyID" in post) {
                if (post.imageLinks) {
                    for (const entry of Object.entries(post.imageLinks)) {
                        let [key, value] = entry
                        if (value?.trim()) {
                            linkMap[String(key)] = value.trim()
                        }
                    }
                }
            } else {
                for (const image of post.images) {
                    if (image.directLink?.trim()) {
                        linkMap[String(image.order)] = image.directLink.trim()
                    }
                }
            }
            return linkMap
        }
}