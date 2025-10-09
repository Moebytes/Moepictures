import path from "path"
import crypto from "crypto"
import functions from "./Functions"
import decryption from "../structures/Decryption"
import {Post, PostChanges, PostOrdered, GroupPosts, GroupChanges, TagChanges, Tag, Note, Session, 
PostSearch, PostHistory, MiniTagGroup} from "../types/Types"

export default class CompareFunctions {
    public static imagesChanged = async (revertPost: PostSearch | PostHistory, currentPost: PostSearch | PostHistory, session: Session) => {
        let privateKey = functions.http.privateKey
        let serverPublicKey = functions.http.serverPublicKey
        if (!privateKey) await functions.http.updateClientKeys(session)
        if (!serverPublicKey) await functions.http.updateServerPublicKey(session)
        privateKey = functions.http.privateKey
        serverPublicKey = functions.http.serverPublicKey

        if (revertPost.images.length !== currentPost.images.length) return true
        for (let i = 0; i < revertPost.images.length; i++) {
            const revImage = revertPost.images[i]
            const currImage = currentPost.images[i]
            const revUpscaledImage = revertPost.upscaledImages?.[i] || revImage
            const currUpscaledImage = currentPost.upscaledImages?.[i] || currImage
            
            let imgLink = typeof revImage === "string" ? functions.link.getRawImageLink(revImage) : functions.link.getImageLink(revImage)
            let currentLink = typeof currImage === "string" ? functions.link.getRawImageLink(currImage) : functions.link.getImageLink(currImage)

            let upscaledImgLink = typeof revUpscaledImage === "string" ? functions.link.getRawImageLink(revUpscaledImage) : functions.link.getImageLink(revUpscaledImage, true)
            let currentUpscaledLink = typeof currUpscaledImage === "string" ? functions.link.getRawImageLink(currUpscaledImage) : functions.link.getImageLink(currUpscaledImage, true)

            let imgBuffer = await functions.http.getBuffer(functions.util.appendURLParams(imgLink, {upscaled: false}), {"x-force-upscale": "false"})
            let currentBuffer = await functions.http.getBuffer(functions.util.appendURLParams(currentLink, {upscaled: false}), {"x-force-upscale": "false"})
            let upscaledImgBuffer = await functions.http.getBuffer(functions.util.appendURLParams(upscaledImgLink, {upscaled: true}), {"x-force-upscale": "true"})
            let upscaledCurrentBuffer = await functions.http.getBuffer(functions.util.appendURLParams(currentUpscaledLink, {upscaled: true}), {"x-force-upscale": "true"})

            if (imgBuffer.byteLength && functions.file.isImage(imgLink)) {
                const isAnimated = functions.file.isAnimatedWebp(imgBuffer)
                if (!isAnimated) imgBuffer = decryption.decrypt(imgBuffer, privateKey, serverPublicKey, session)
            }
            if (currentBuffer.byteLength && functions.file.isImage(currentLink)) {
                const isAnimated = functions.file.isAnimatedWebp(currentBuffer)
                if (!isAnimated) currentBuffer = decryption.decrypt(currentBuffer, privateKey, serverPublicKey, session)
            }
            if (upscaledImgBuffer.byteLength && functions.file.isImage(upscaledImgLink)) {
                const isAnimated = functions.file.isAnimatedWebp(upscaledImgBuffer)
                if (!isAnimated) upscaledImgBuffer = decryption.decrypt(upscaledImgBuffer, privateKey, serverPublicKey, session)
            }
            if (upscaledCurrentBuffer.byteLength && functions.file.isImage(currentUpscaledLink)) {
                const isAnimated = functions.file.isAnimatedWebp(upscaledCurrentBuffer)
                if (!isAnimated) upscaledCurrentBuffer = decryption.decrypt(upscaledCurrentBuffer, privateKey, serverPublicKey, session)
            }

            if (imgBuffer.byteLength) {
                const imgMD5 = crypto.createHash("md5").update(Buffer.from(imgBuffer) as any).digest("hex")
                const currentMD5 = crypto.createHash("md5").update(Buffer.from(currentBuffer) as any).digest("hex")
                if (imgMD5 !== currentMD5) return true
            }
            if (upscaledImgBuffer.byteLength) {
                const imgMD5 = crypto.createHash("md5").update(Buffer.from(upscaledImgBuffer) as any).digest("hex")
                const currentMD5 = crypto.createHash("md5").update(Buffer.from(upscaledCurrentBuffer) as any).digest("hex")
                if (imgMD5 !== currentMD5) return true
            }
        }
        return false
    }

    public static tagsChanged = (revertPost: PostSearch | PostHistory, currentPost: PostSearch | PostHistory) => {
        if (JSON.stringify(revertPost.artists) !== JSON.stringify(currentPost.artists)) return true
        if (JSON.stringify(revertPost.characters) !== JSON.stringify(currentPost.characters)) return true
        if (JSON.stringify(revertPost.series) !== JSON.stringify(currentPost.series)) return true
        if (JSON.stringify(revertPost.tags) !== JSON.stringify(currentPost.tags)) return true
        return false
    }

    public static sourceChanged = (revertPost: PostSearch | PostHistory, currentPost: PostSearch | PostHistory) => {
        if (revertPost.title !== currentPost.title) return true
        if (revertPost.englishTitle !== currentPost.englishTitle) return true
        if (revertPost.posted !== currentPost.posted) return true
        if (revertPost.source !== currentPost.source) return true
        if (revertPost.artist !== currentPost.artist) return true
        if (revertPost.commentary !== currentPost.commentary) return true
        if (revertPost.englishCommentary !== currentPost.englishCommentary) return true
        return false
    }

    public static parsePostChanges = (oldPost: Post, newPost: Post) => {
        let json = {} as PostChanges
        if (oldPost.images.length !== newPost.images.length) {
            json.images = newPost.images
        }
        if (oldPost.type !== newPost.type) {
            json.type = newPost.type
        }
        if (oldPost.rating !== newPost.rating) {
            json.rating = oldPost.rating
        }
        if (oldPost.style !== newPost.style) {
            json.style = newPost.style
        }
        if (oldPost.parentID !== newPost.parentID) {
            json.parentID = newPost.parentID
        }
        if (oldPost.title !== newPost.title) {
            json.title = newPost.title
        }
        if (oldPost.englishTitle !== newPost.englishTitle) {
            json.englishTitle = newPost.englishTitle
        }
        if (oldPost.artist !== newPost.artist) {
            json.artist = newPost.artist
        }
        if (functions.date.formatDate(new Date(oldPost.posted)) !== functions.date.formatDate(new Date(newPost.posted))) {
            json.posted = newPost.posted
        }
        if (oldPost.source !== newPost.source) {
            json.source = newPost.source
        }
        if (JSON.stringify(oldPost.mirrors) !== JSON.stringify(newPost.mirrors)) {
            json.mirrors = newPost.mirrors
        }
        if (oldPost.bookmarks !== newPost.bookmarks) {
            json.bookmarks = newPost.bookmarks
        }
        if (oldPost.buyLink !== newPost.buyLink) {
            json.buyLink = newPost.buyLink
        }
        if (oldPost.commentary !== newPost.commentary) {
            json.commentary = newPost.commentary
        }
        if (oldPost.englishCommentary !== newPost.englishCommentary) {
            json.englishCommentary = newPost.englishCommentary
        }
        return json
    }

    public static parseTagChanges = (oldTag: Tag, newTag: Tag) => {
        let json = {} as TagChanges
        if (oldTag.tag !== newTag.tag) {
            json.tag = newTag.tag
        }
        if (oldTag.type !== newTag.type) {
            json.type = newTag.type
        }
        if (oldTag.description !== newTag.description) {
            json.description = newTag.description
        }
        let oldAliases = oldTag.aliases?.filter(Boolean).map((a) => a?.alias ? a.alias : a) || []
        let newAliases = newTag.aliases?.filter(Boolean).map((a) => a?.alias ? a.alias : a) || []
        if (JSON.stringify(oldAliases) !== JSON.stringify(newAliases)) {
            json.aliases = newTag.aliases
        }
        let oldImplications = oldTag.implications?.filter(Boolean).map((i) => i?.implication ? i.implication : i) || []
        let newImplications = newTag.implications?.filter(Boolean).map((i) => i?.implication ? i.implication : i) || []
        if (JSON.stringify(oldImplications) !== JSON.stringify(newImplications)) {
            json.implications = newTag.implications
        }
        if (JSON.stringify(oldTag.pixivTags?.filter(Boolean)) !== JSON.stringify(newTag.pixivTags?.filter(Boolean))) {
            json.pixivTags = newTag.pixivTags
        }
        if (oldTag.website !== newTag.website) {
            json.website = newTag.website
        }
        if (oldTag.social !== newTag.social) {
            json.social = newTag.social
        }
        if (oldTag.twitter !== newTag.twitter) {
            json.twitter = newTag.twitter
        }
        if (oldTag.fandom !== newTag.fandom) {
            json.fandom = newTag.fandom
        }
        if (oldTag.wikipedia !== newTag.wikipedia) {
            json.wikipedia = newTag.wikipedia
        }
        if (oldTag.featuredPost?.postID !== newTag.featuredPost?.postID) {
            json.featuredPost = newTag.featuredPost?.postID
        }
        if (Boolean(oldTag.r18) !== Boolean(newTag.r18)) {
            json.r18 = newTag.r18
        }
        return json
    }

    public static parseGroupChanges = (oldGroup: GroupPosts, newGroup: GroupPosts) => {
        let json = {} as GroupChanges
        if (oldGroup.name !== newGroup.name) {
            json.name = newGroup.name
        }
        if (oldGroup.description !== newGroup.description) {
            json.description = newGroup.description
        }
        if (JSON.stringify(oldGroup.posts) !== JSON.stringify(newGroup.posts)) {
            json.posts = newGroup.posts.map((post: PostOrdered) => ({postID: post.postID, order: post.order}))
        }
        return json
    }

    public static parseNoteChanges = (oldNotes: Note[], newNotes:  Note[]) => {
        let styleChanged = false
        if (!oldNotes) oldNotes = [] as Note[]
        if (!newNotes) newNotes = [] as Note[]
        const itemKey = (item: Note) => item.character ? `Character -> ${item.characterTag}` : `${item.transcript} -> ${item.translation}`
        const prevMap = new Map(oldNotes.map((item) => [itemKey(item), item]))
        const newMap = new Map(newNotes.map((item) => [itemKey(item), item]))

        const addedEntries = newNotes
            .filter((item) => !prevMap.has(itemKey(item)))
            .map((item) => itemKey(item))

        const removedEntries = oldNotes
            .filter((item) => !newMap.has(itemKey(item)))
            .map((item) => itemKey(item))

        for (const note of oldNotes) {
            const match = newNotes.find((item) => item.noteID === note.noteID)
            if (!match) continue
            if (note.overlay !== match.overlay || 
                note.fontFamily !== match.fontFamily || 
                note.bold !== match.bold || 
                note.italic !== match.italic || 
                note.fontSize !== match.fontSize || 
                note.textColor !== match.textColor || 
                note.backgroundColor !== match.backgroundColor || 
                note.backgroundAlpha !== match.backgroundAlpha || 
                note.strokeColor !== match.strokeColor || 
                note.strokeWidth !== match.strokeWidth || 
                note.borderRadius !== match.borderRadius || 
                note.breakWord !== match.breakWord) {
                    styleChanged = true
                    break
                }
        }

        return {addedEntries, removedEntries, styleChanged}
    }

    public static tagGroupChanges = (oldTagGroups?: MiniTagGroup[], newTagGroups?: MiniTagGroup[]) => {
        let addedTagGroups = [] as MiniTagGroup[]
        let removedTagGroups = [] as MiniTagGroup[]
      
        if (!oldTagGroups || !newTagGroups) return {addedTagGroups, removedTagGroups}
      
        for (const newGroup of newTagGroups) {
            if (!newGroup) continue
        
            const oldGroup = oldTagGroups.find((group) => group?.name === newGroup.name)
        
            if (oldGroup) {
                const addedTags = newGroup.tags.filter((tag) => !oldGroup.tags.includes(tag))
                const removedTags = oldGroup.tags.filter((tag) => !newGroup.tags.includes(tag))
        
                if (addedTags.length) {
                    addedTagGroups.push({name: newGroup.name, tags: addedTags})
                }
                if (removedTags.length) {
                    removedTagGroups.push({name: newGroup.name, tags: removedTags})
                }
            } else {
                addedTagGroups.push({name: newGroup.name, tags: newGroup.tags})
            }
        }

        for (const oldGroup of oldTagGroups) {
            if (!oldGroup) continue
            const newGroup = newTagGroups.find((group) => group?.name === oldGroup.name)
            if (!newGroup) {
                removedTagGroups.push({name: oldGroup.name, tags: oldGroup.tags})
            }
        }
      
        return {addedTagGroups, removedTagGroups}
    }
}