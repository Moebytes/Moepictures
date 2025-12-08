import sql from "../sql/SQLQuery"
import path from "path"
import functions from "../functions/Functions"
import serverFunctions from "../server functions/ServerFunctions"
import sharp from "sharp"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import {PostHistory, UploadImage, BulkTag, PostFull, UnverifiedPost, TagHistory, 
UploadTag, PostType, SourceData, PostRating, Image, PostStyle, MiniTag,
MiniTagGroup} from "../types/Types"

export default class ServerUpload {
    public static validImages = async (images: UploadImage[], skipMBCheck?: boolean) => {
        if (!images.length) return false
        for (let i = 0; i < images.length; i++) {
            if (functions.file.isModel(images[i].link) || functions.file.isZip(images[i].link)) {
                const MB = images[i].size / (1024*1024)
                const maxSize = functions.file.isModel(images[i].link) ? 10 : 50
                if (skipMBCheck || MB <= maxSize) continue
                return false
            }
            const result = functions.byte.bufferFileType(images[i].bytes)?.[0]
            const jpg = result?.mime === "image/jpeg"
            const png = result?.mime === "image/png"
            const webp = result?.mime === "image/webp"
            const avif = result?.mime === "image/avif"
            const gif = result?.mime === "image/gif"
            const mp4 = result?.mime === "video/mp4"
            const mp3 = result?.mime === "audio/mpeg"
            const wav = result?.mime === "audio/x-wav"
            const webm = (path.extname(images[i].link) === ".webm" && result?.typename === "mkv")
            if (jpg || png || webp || avif || gif) {
                if (!await serverFunctions.util.isAnime(images[i].bytes)) return false
            }
            if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav) {
                const MB = images[i].size / (1024*1024)
                const maxSize = functions.validation.maxFileSize({jpg, png, avif, mp3, wav, gif, webp, mp4, webm})
                let type = result.typename === "mkv" ? "webm" : result.typename
                if (images[i].ext !== type) return false
                if (skipMBCheck || MB <= maxSize) continue
            }
            return false
        }
        return true
    }

    public static updateTagImageHistory = async (targetTag: string, filename: string, newBuffer: Buffer, username: string) => {
        const tag = await sql.tag.tag(targetTag)
        if (!tag) return
        let oldBuffer = null as Buffer | null
        if (tag.image) {
            const imgPath = functions.link.getTagPath(tag.type, tag.image)
            oldBuffer = await serverFunctions.files.getFile(imgPath, false, false)
            let oldHash = await phash(oldBuffer!).then((hash: string) => functions.byte.binaryToHex(hash))
            let newHash = await phash(newBuffer!).then((hash: string) => functions.byte.binaryToHex(hash))
            if (dist(oldHash, newHash) < 6) return
        }

        const newHash = serverFunctions.util.md5(newBuffer)

        const tagHistory = await sql.history.tagHistory(targetTag)
        const nextKey = await serverFunctions.files.getNextKey("tag", targetTag, false)
        if (!tagHistory.length) {
            let vanilla = tag as unknown as TagHistory
            vanilla.date = tag.createDate 
            vanilla.aliases = vanilla.aliases.map((alias: any) => alias?.alias)
            vanilla.implications = vanilla.implications.map((implication: any) => implication?.implication)
            if (vanilla.image && oldBuffer) {
                    const newImagePath = functions.link.getTagHistoryPath(targetTag, 1, vanilla.image)
                    await serverFunctions.files.uploadFile(newImagePath, oldBuffer, false)
                    vanilla.image = newImagePath
            } else {
                vanilla.image = null
            }
            await sql.history.insertTagHistory({username: tag.creator, tag: targetTag, key: targetTag, type: vanilla.type, 
            image: vanilla.image, imageHash: vanilla.imageHash, description: vanilla.description, 
            aliases: functions.util.filterNulls(vanilla.aliases), implications: functions.util.filterNulls(vanilla.implications), 
            pixivTags: functions.util.filterNulls(vanilla.pixivTags), website: vanilla.website, social: vanilla.social, 
            twitter: vanilla.twitter, fandom: vanilla.fandom, wikipedia: vanilla.wikipedia, danbooruTag: vanilla.danbooruTag, 
            r18: vanilla.r18, featuredPost: vanilla.featuredPost?.postID, imageChanged: false, changes: null})
            
            const imagePath = functions.link.getTagHistoryPath(targetTag, 2, filename)
            await serverFunctions.files.uploadFile(imagePath, newBuffer, false)

            await sql.history.insertTagHistory({username, image: filename, imageHash: newHash, tag: targetTag, key: targetTag, 
            type: tag.type, description: tag.description, aliases: functions.util.filterNulls(tag.aliases).map((a) => a.alias), 
            implications: functions.util.filterNulls(tag.implications).map((i) => i.implication), 
            pixivTags: functions.util.filterNulls(tag.pixivTags), website: tag.website, social: tag.social, twitter: tag.twitter, 
            fandom: tag.fandom, wikipedia: tag.wikipedia, danbooruTag: tag.danbooruTag, r18: tag.r18, 
            featuredPost: tag.featuredPost?.postID, imageChanged: true, changes: null, reason: null})
        } else {
            const imagePath = functions.link.getTagHistoryPath(targetTag, nextKey, filename)
            await serverFunctions.files.uploadFile(imagePath, newBuffer, false)

            const result = await sql.history.tagHistory(targetTag)
            if (result.length > 1) {
                const lastResult = result[result.length - 1]
                const penultResult = result[result.length - 2]
                const lastImage = lastResult.image
                const penultImage = penultResult.image
                if (penultImage?.startsWith("history/tag") && !lastImage?.startsWith("history/tag")) {
                    await sql.history.updateTagHistory(lastResult.historyID, "image", penultImage)
                }
            }
            await sql.history.insertTagHistory({username, image: filename, imageHash: newHash, tag: targetTag, key: targetTag, 
            type: tag.type, description: tag.description, aliases: functions.util.filterNulls(tag.aliases).map((a) => a.alias), 
            implications: functions.util.filterNulls(tag.implications).map((i) => i.implication), 
            pixivTags: functions.util.filterNulls(tag.pixivTags), website: tag.website, social: tag.social, twitter: tag.twitter, 
            fandom: tag.fandom, wikipedia: tag.wikipedia, danbooruTag: tag.danbooruTag, r18: tag.r18, 
            featuredPost: tag.featuredPost?.postID, imageChanged: true, changes: null, reason: null})
        }
    }

    public static deleteImages = async (post: PostFull, data: {imgChanged: boolean, r18: boolean}) => {
        let {imgChanged, r18} = data
        let vanillaBuffers = [] as Buffer[]
        let upscaledVanillaBuffers = [] as Buffer[]
        for (let i = 0; i < post.images.length; i++) {
            const image = post.images[i]
            const imagePath = functions.link.getImagePath(image.type, post.postID, image.order, image.filename)
            const upscaledImagePath = functions.link.getUpscaledImagePath(image.type, post.postID, 
                image.order, image.upscaledFilename || image.filename)
            const thumbnailPath = functions.link.getThumbnailImagePath(image.type, image.thumbnail)
            const oldImage = await serverFunctions.files.getFile(imagePath, false, r18, image.pixelHash) as Buffer
            const oldUpscaledImage = await serverFunctions.files.getFile(upscaledImagePath, false, r18, image.pixelHash) as Buffer
            vanillaBuffers.push(oldImage)
            upscaledVanillaBuffers.push(oldUpscaledImage)
            if (imgChanged) {
                await sql.post.deleteImage(image.imageID)
                await serverFunctions.files.deleteFile(imagePath, r18)
                await serverFunctions.files.deleteFile(upscaledImagePath, r18)
                if (thumbnailPath) await serverFunctions.files.deleteFile(thumbnailPath, r18)
            }
        }
        return {vanillaBuffers, upscaledVanillaBuffers}
    }

    public static insertImages = async (postID: string, data: {images: UploadImage[] | Image[], 
        upscaledImages: UploadImage[] | Image[], type: PostType, rating: PostRating, source: SourceData, 
        characters: UploadTag[] | MiniTag[], imgChanged: boolean, unverified?: boolean, unverifiedImages?: boolean,
        thumbnail?: string | null, thumbnailFilename?: string, sourceLinks?: {link: string, hash: string}[]}) => {
        let {images, upscaledImages, type, rating, source, characters, imgChanged, unverified, unverifiedImages, sourceLinks} = data

        if (images.length !== upscaledImages.length) {
            const maxLength = Math.max(images.length, upscaledImages.length)
            while (images.length < maxLength) {
                images.push(null as any)
            }
            while (upscaledImages.length < maxLength) {
                upscaledImages.push(null as any)
            }
        }

        let hasOriginal = false
        let hasUpscaled = false
        let originalCheck = [] as string[]
        let upscaledCheck = [] as string[]
        let imageFilenames = [] as string[]
        let upscaledImageFilenames = [] as string[]
        let imageOrders = [] as number[]
        let r18 = functions.post.isR18(rating)
        let inferredType = type

        for (let i = 0; i < images.length; i++) {
            let order = i + 1
            const image = images[i]
            const upscaledImage = upscaledImages[i]
            let original = image ? image : upscaledImage
            let upscaled = upscaledImage ? upscaledImage : image
            let buffer = null as Buffer | null
            let upscaledBuffer = null as Buffer | null
            let thumbBuffer = null as Buffer | null
            if (image) {
                if ("bytes" in image) {
                    buffer = Buffer.from(image.bytes)
                } else if ("type" in image) {
                    const imagePath = functions.link.getImagePath(image.type, image.postID, image.order, image.filename)
                    if (unverifiedImages) {
                        buffer = await serverFunctions.files.getUnverifiedFile(imagePath, false, image.pixelHash)
                    } else {
                        buffer = await serverFunctions.files.getFile(imagePath, false, r18, image.pixelHash)
                    }
                }
            }
            if (upscaledImage) {
                if ("bytes" in upscaledImage) {
                    upscaledBuffer = Buffer.from(upscaledImage.bytes)
                } else if ("type" in upscaledImage) {
                    const upscaledImagePath = functions.link.getUpscaledImagePath(upscaledImage.type, 
                    upscaledImage.postID, upscaledImage.order, upscaledImage.upscaledFilename || upscaledImage.filename)
                    if (unverifiedImages) {
                        upscaledBuffer = await serverFunctions.files.getUnverifiedFile(upscaledImagePath, false, upscaledImage.pixelHash)
                    } else {
                        upscaledBuffer = await serverFunctions.files.getFile(upscaledImagePath, false, r18, upscaledImage.pixelHash)
                    }
                }
            }
            if (original.thumbnail) {
                if (functions.byte.isBase64(original.thumbnail) && "thumbnailExt" in original) {
                    let buffer = functions.byte.base64ToBuffer(original.thumbnail)
                    const processedThumb = await serverFunctions.util.processThumbnail(buffer, original.thumbnailExt)
                    thumbBuffer = processedThumb.thumbBuffer
                    original.thumbnailExt = processedThumb.thumbnailExt
                } else {
                    let thumbnailImagePath = functions.link.getThumbnailImagePath((original as Image).type, original.thumbnail)
                    if (unverifiedImages) {
                        thumbBuffer = await serverFunctions.files.getUnverifiedFile(thumbnailImagePath)
                    } else {
                        thumbBuffer = await serverFunctions.files.getFile(thumbnailImagePath, false, r18)
                    }
                }
            }
            let bufferFallback = buffer?.byteLength ? buffer : upscaledBuffer as Buffer
            let ext = ""
            if ("ext" in original) {
                ext = original.ext
            } else if ("filename" in image) {
                ext = path.extname(image.filename || image.upscaledFilename).replace(".", "")
            }
            const cleanTitle = functions.post.cleanTitle(source.title)
            let filename = ""
            let upscaledFilename = ""
            let thumbnailFilename = ""
            if (image) {
                let ext = ""
                if ("ext" in image) {
                    ext = image.ext
                } else {
                    ext = path.extname(image.filename).replace(".", "")
                }
                filename = cleanTitle ? `${cleanTitle}.${ext}` : 
                characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
                `${postID}.${ext}`
            }
            if (upscaledImage) {
                let ext = ""
                if ("ext" in upscaledImage) {
                    ext = upscaledImage.ext
                } else {
                    ext = path.extname(upscaledImage.upscaledFilename).replace(".", "")
                }
                upscaledFilename = cleanTitle ? `${cleanTitle}.${ext}` : 
                characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` : `${postID}.${ext}`
            }
            if (thumbBuffer?.byteLength) {
                let ext = ""
                if ("thumbnailExt" in original) {
                    ext = original.thumbnailExt
                } else {
                    ext = path.extname(original.thumbnail).replace(".", "")
                }
                thumbnailFilename = `${postID}-${order}.${ext}`
            }
            imageFilenames.push(filename)
            upscaledImageFilenames.push(upscaledFilename)
            imageOrders.push(order)
            let kind = "image"
            if (type === "comic") {
                kind = "comic"
            } else if (functions.file.isWebP(`.${ext}`)) {
                const animated = functions.file.isAnimatedWebp(new Uint8Array(bufferFallback).buffer)
                kind = animated ? "animation" : "image"
            } else if (functions.file.isPNG(`.${ext}`)) {
                const animated = functions.file.isAnimatedPng(new Uint8Array(bufferFallback).buffer)
                kind = animated ? "animation" : "image"
            } else if (functions.file.isImage(`.${ext}`)) {
                kind = "image"
            } else if (functions.file.isGIF(`.${ext}`)) {
                kind = "animation"
            } else if (functions.file.isVideo(`.${ext}`)) {
                kind = "video"
            } else if (functions.file.isAudio(`.${ext}`)) {
                kind = "audio"
            } else if (functions.file.isModel(`.${ext}`)) {
                kind = "model"
            } else if (functions.file.isZip(`.${ext}`)) {
                const live2d = await functions.file.isLive2DZip(new Uint8Array(bufferFallback).buffer)
                const ugoira = await functions.file.isUgoiraZip(new Uint8Array(bufferFallback).buffer)
                if (live2d) kind = "live2d"
                if (ugoira) kind = "animation"
            }
            if (images.length === 1) inferredType = kind as PostType
            if (imgChanged) {
                if (buffer?.byteLength) {
                    let imagePath = functions.link.getImagePath(kind, postID, Number(order), filename)
                    if (unverified) {
                        await serverFunctions.files.uploadUnverifiedFile(imagePath, buffer)
                    } else {
                        await serverFunctions.files.uploadFile(imagePath, buffer, r18)
                    }
                    hasOriginal = true
                    originalCheck.push(imagePath)
                }

                if (upscaledBuffer?.byteLength) {
                    let imagePath = functions.link.getUpscaledImagePath(kind, postID, Number(order), upscaledFilename)
                    if (unverified) {
                        await serverFunctions.files.uploadUnverifiedFile(imagePath, upscaledBuffer)
                    } else {
                        await serverFunctions.files.uploadFile(imagePath, upscaledBuffer, r18)
                    }
                    hasUpscaled = true
                    upscaledCheck.push(imagePath)
                }

                if (thumbBuffer?.byteLength && thumbnailFilename) {
                    let thumbPath = functions.link.getThumbnailImagePath(kind, thumbnailFilename)
                    if (unverified) {
                        await serverFunctions.files.uploadUnverifiedFile(thumbPath, thumbBuffer)
                    } else {
                        await serverFunctions.files.uploadFile(thumbPath, thumbBuffer, r18)
                    }
                }
        
                let dimensions = {} as {width?: number, height?: number}
                let upscaledDimensions = {} as {width?: number, height?: number}
                let hash = ""
                let pixelHash = ""
                if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d" || kind === "animation") {
                    hash = await phash(thumbBuffer || bufferFallback).then((hash: string) => functions.byte.binaryToHex(hash))
                    pixelHash = await serverFunctions.util.pixelHash(thumbBuffer || bufferFallback)
                    dimensions.width = original.width
                    dimensions.height = original.height
                    upscaledDimensions.width = upscaled.width
                    upscaledDimensions.height = upscaled.height
                } else {
                    hash = await phash(bufferFallback).then((hash: string) => functions.byte.binaryToHex(hash))
                    pixelHash = await serverFunctions.util.pixelHash(bufferFallback)
                    if (buffer?.byteLength) dimensions = await sharp(buffer).metadata()
                    if (upscaledBuffer?.byteLength) upscaledDimensions = await sharp(upscaledBuffer).metadata()
                }
                let width = dimensions?.width || null
                let height = dimensions?.height || null
                let upscaledWidth = upscaledDimensions?.width || null
                let upscaledHeight = upscaledDimensions?.height || null
                let size = buffer?.byteLength || null
                let upscaledSize = upscaledBuffer?.byteLength || null
                let duration = original.duration || null
                let altSource = original.altSource || null
                let directLink = sourceLinks ? serverFunctions.posts.resolveSourceLink(hash, order, sourceLinks) : original.directLink || null
                if (unverified) {
                    await sql.post.insertUnverifiedImage(postID, filename, upscaledFilename, kind, order, hash, pixelHash,
                    width, height, upscaledWidth, upscaledHeight, size, upscaledSize, duration, thumbnailFilename, directLink, altSource)
                } else {
                    await sql.post.insertImage(postID, filename, upscaledFilename, kind, order, hash, pixelHash,
                    width, height, upscaledWidth, upscaledHeight, size, upscaledSize, duration, thumbnailFilename, directLink, altSource)
                }
            }
        }
        if (upscaledCheck?.length > originalCheck?.length) hasOriginal = false
        if (originalCheck?.length > upscaledCheck?.length) hasUpscaled = false

        return {hasOriginal, hasUpscaled, imageFilenames, upscaledImageFilenames, imageOrders, inferredType}
    }

    public static updatePost = async (postID: string, data: {artists: UploadTag[] | MiniTag[], type: PostType, rating: PostRating, 
        style: PostStyle, source: SourceData, parentID?: string | null, hasOriginal: boolean, isNote?: boolean, hasUpscaled: boolean, 
        uploader?: string, uploadDate?: string, approver?: string, updater?: string, originalID?: string, updatedDate?: string, 
        unverified?: boolean, duplicates?: boolean, newTags?: UploadTag[], reason?: string | null}) => {
        let {artists, type, rating, style, source, parentID, uploader, approver, hasOriginal, hasUpscaled,
        updater, updatedDate, uploadDate, unverified, duplicates, newTags, originalID, isNote, reason} = data
        let hidden = false 
        for (let i = 0; i < artists.length; i++) {
            if (!artists[i].tag) continue
            const tag = await sql.tag.tag(artists[i].tag)
            if (tag?.banned) hidden = true
        }

        if (uploader) {
            if (!uploadDate) uploadDate = new Date().toISOString()
        }
        if (updater) {
            if (!updatedDate) updatedDate = uploadDate ? uploadDate : new Date().toISOString()
        }
        let approveDate = undefined as string | undefined
        if (approver) {
            approveDate = uploadDate ? uploadDate : new Date().toISOString()
        }

        const newSlug = functions.post.postSlug(source.title, source.englishTitle)

        if (unverified) {
            if (duplicates !== undefined) {
                duplicates = duplicates ? true : false
            }
            let newTagsAmount = undefined as number | undefined
            if (newTags !== undefined) {
                newTagsAmount = newTags.length || 0
            }
            await sql.post.bulkUpdateUnverifiedPost(postID, {
                originalID: originalID ? originalID : null,
                reason: reason ? reason : null,
                type,
                rating, 
                style, 
                parentID: parentID || null,
                title: source.title ? source.title : null,
                englishTitle: source.englishTitle ? source.englishTitle : null,
                artist: source.artist ? source.artist : null,
                posted: source.posted ? source.posted : null,
                source: source.source ? source.source : null,
                commentary: source.commentary ? source.commentary : null,
                englishCommentary: source.englishCommentary ? source.englishCommentary : null,
                bookmarks: source.bookmarks ? source.bookmarks : null,
                buyLink: source.buyLink ? source.buyLink : null,
                pixivTags: source.pixivTags?.length ? source.pixivTags : null,
                userProfile: source.userProfile ? source.userProfile : null,
                drawingTools: source.drawingTools?.length ? source.drawingTools : null,
                sourceImageCount: source.sourceImageCount ? source.sourceImageCount : null,
                mirrors: source.mirrors ? functions.post.mirrorsJSON(source.mirrors) : null,
                slug: newSlug,
                uploader,
                uploadDate,
                updater,
                updatedDate,
                duplicates,
                newTags: newTagsAmount,
                isNote,
                hasUpscaled,
                hasOriginal,
                hidden
            })
        } else {
            await sql.post.bulkUpdatePost(postID, {
                type,
                rating, 
                style, 
                parentID: parentID || null,
                title: source.title ? source.title : null,
                englishTitle: source.englishTitle ? source.englishTitle : null,
                artist: source.artist ? source.artist : null,
                posted: source.posted ? source.posted : null,
                source: source.source ? source.source : null,
                commentary: source.commentary ? source.commentary : null,
                englishCommentary: source.englishCommentary ? source.englishCommentary : null,
                bookmarks: source.bookmarks ? source.bookmarks : null,
                buyLink: source.buyLink ? source.buyLink : null,
                pixivTags: source.pixivTags?.length ? source.pixivTags : null,
                userProfile: source.userProfile ? source.userProfile : null,
                drawingTools: source.drawingTools?.length ? source.drawingTools : null,
                sourceImageCount: source.sourceImageCount ? source.sourceImageCount : null,
                mirrors: source.mirrors ? functions.post.mirrorsJSON(source.mirrors) : null,
                slug: newSlug,
                uploader,
                uploadDate,
                updater,
                updatedDate,
                approver,
                approveDate,
                hasUpscaled,
                hasOriginal,
                hidden
            })
        }
        return {newSlug}
    }

    public static updateTagGroups = async (postID: string, data: {oldTagGroups?: MiniTagGroup[], 
        newTagGroups?: MiniTagGroup[], unverified?: boolean}) => {
        let {oldTagGroups, newTagGroups, unverified} = data
        if (!oldTagGroups) oldTagGroups = []
        if (!newTagGroups) newTagGroups = []
        let tagObjectMapping = await serverFunctions.tags.tagMap()

        let {addedTagGroups, removedTagGroups} = functions.compare.tagGroupChanges(oldTagGroups, newTagGroups)
        
        let oldTagsSet = new Set<string>(oldTagGroups.filter(Boolean).map((o) => o.name))
        let newTagsSet = new Set<string>(newTagGroups.filter(Boolean).map((n) => n.name))
        let addedGroups = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
        let removedGroups = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)

        for (const tagGroup of addedTagGroups) {
            if (!tagGroup) continue
            tagGroup.tags = await serverFunctions.tags.applyAliases(tagGroup.tags)
            tagGroup.tags = await serverFunctions.tags.applyImplications(tagGroup.tags, tagObjectMapping)

            if (unverified) {
                const groupID = await sql.tag.insertUnverifiedTagGroup(postID, tagGroup.name)
                await sql.tag.insertUnverifiedTagGroupMap(groupID, postID, tagGroup.tags)
            } else {
                const groupID = await sql.tag.insertTagGroup(postID, tagGroup.name)
                await sql.tag.insertTagGroupMap(groupID, postID, tagGroup.tags)
            }
        }

        for (const tagGroup of removedTagGroups) {
            if (!tagGroup) continue
            if (unverified) {
                const group = await sql.tag.unverifiedTagGroup(postID, tagGroup.name)
                if (group) await sql.tag.deleteUnverifiedTagGroupMap(group.groupID, postID, tagGroup.tags)
            } else {
                const group = await sql.tag.tagGroup(postID, tagGroup.name)
                if (group) await sql.tag.deleteTagGroupMap(group.groupID, postID, tagGroup.tags)
            }
        }

        // Delete empty tag groups
        for (const tagGroup of newTagGroups) {
            if (!tagGroup) continue
            if (unverified) {
                const group = await sql.tag.unverifiedTagGroup(postID, tagGroup.name)
                if (!group?.tags.length) {
                    await sql.tag.deleteUnverifiedTagGroup(postID, tagGroup.name)
                }
            } else {
                const group = await sql.tag.tagGroup(postID, tagGroup.name)
                if (!group?.tags.length) {
                    await sql.tag.deleteTagGroup(postID, tagGroup.name)
                }
            }
        }
        return {
            addedTagGroups: addedGroups, 
            removedTagGroups: removedGroups
        }
    }

    public static insertTags = async (postID: string, data: {tags: string[], artists: UploadTag[] | MiniTag[], username: string,
        characters: UploadTag[] | MiniTag[], series: UploadTag[] | MiniTag[], newTags: UploadTag[] | MiniTag[], noImageUpdate?: boolean,
        post?: PostFull | UnverifiedPost | null, unverified?: boolean, originalPost?: PostFull}) => {
        let {artists, characters, series, newTags, tags, username, noImageUpdate, post, unverified} = data

        artists = await serverFunctions.tags.applyAliases(artists)
        characters = await serverFunctions.tags.applyAliases(characters)
        series = await serverFunctions.tags.applyAliases(series)
        newTags = await serverFunctions.tags.applyAliases(newTags)
        tags = await serverFunctions.tags.applyAliases(tags)

        tags = serverFunctions.tags.appendArtToolTags(tags, post?.drawingTools)

        let combinedTags = [...artists.map((a: MiniTag | UploadTag) => a.tag), ...characters.map((c: MiniTag | UploadTag) => c.tag), 
        ...series.map((s: MiniTag | UploadTag) => s.tag), ...newTags.map((n: MiniTag | UploadTag) => n.tag), ...tags] as string[]
        let oldTagsSet = new Set<string>(post?.tags || [])
        let newTagsSet = new Set<string>(combinedTags)
        let addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
        let removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)

        let bulkTagUpdate = [] as BulkTag[]
        let tagObjectMapping = await serverFunctions.tags.tagMap()

        if (unverified) {
            for (let i = 0; i < addedTags.length; i++) {
            bulkTagUpdate.push({tag: addedTags[i], type: tagObjectMapping[addedTags[i]]?.type || "tag", description: null,
                image: null, imageHash: null})
            }
        }

        for (let i = 0; i < newTags.length; i++) {
            let newTag = newTags[i]
            if (!newTag.tag) continue
            let bulkObj = {tag: newTag.tag, type: tagObjectMapping[newTag.tag]?.type || "tag", 
                description: null, image: null, imageHash: null} as BulkTag
            if (newTag.description) bulkObj.description = newTag.description
            if (!noImageUpdate && newTag.image) {
                let ext = ""
                let buffer = null as Buffer | null
                if ("ext" in newTag && "bytes" in newTag) {
                    ext = newTag.ext || ""
                    buffer = Buffer.from(Object.values(newTag.bytes!))
                } else {
                    ext = path.extname(newTag.image || "")
                    const imagePath = functions.link.getTagPath("tag", newTag.image || "")
                    buffer = await serverFunctions.files.getFile(imagePath, false, false)
                }
                const filename = `${newTag.tag}.${ext}`
                const imagePath = functions.link.getTagPath("tag", filename)
                if (buffer) {
                    if (unverified) {
                        await serverFunctions.files.uploadUnverifiedFile(imagePath, buffer)
                    } else {
                        await this.updateTagImageHistory(newTag.tag!, filename, buffer, username)
                        await serverFunctions.files.uploadFile(imagePath, buffer, false)
                    }
                    bulkObj.image = filename
                    bulkObj.imageHash = serverFunctions.util.md5(buffer)
                }
            }
            bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < artists.length; i++) {
            let artist = artists[i]
            if (!artist.tag) continue
            let bulkObj = {tag: artist.tag, type: "artist", description: "Artist.", image: null, imageHash: null} as BulkTag
            if (!noImageUpdate && artist.image) {
                let ext = ""
                let buffer = null as Buffer | null
                if ("ext" in artist && "bytes" in artist) {
                    ext = artist.ext || ""
                    buffer = Buffer.from(Object.values(artist.bytes!))
                } else {
                    ext = path.extname(artist.image || "")
                    const imagePath = functions.link.getTagPath("tag", artist.image || "")
                    buffer = await serverFunctions.files.getFile(imagePath, false, false)
                }
                const filename = `${artist.tag}.${ext}`
                const imagePath = functions.link.getTagPath("artist", filename)
                if (buffer) {
                    if (unverified) {
                        await serverFunctions.files.uploadUnverifiedFile(imagePath, buffer)
                    } else {
                        await this.updateTagImageHistory(artist.tag!, filename, buffer, username)
                        await serverFunctions.files.uploadFile(imagePath, buffer, false)
                    }
                    bulkObj.image = filename
                    bulkObj.imageHash = serverFunctions.util.md5(buffer)
                }
            }
            bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < characters.length; i++) {
            let character = characters[i]
            if (!character.tag) continue
            let bulkObj = {tag: character.tag, type: "character", description: "Character.", image: null, imageHash: null} as BulkTag
            if (!noImageUpdate && character.image) {
                let ext = ""
                let buffer = null as Buffer | null
                if ("ext" in character && "bytes" in character) {
                    ext = character.ext || ""
                    buffer = Buffer.from(Object.values(character.bytes!))
                } else {
                    ext = path.extname(character.image || "")
                    const imagePath = functions.link.getTagPath("tag", character.image || "")
                    buffer = await serverFunctions.files.getFile(imagePath, false, false)
                }
                const filename = `${character.tag}.${ext}`
                const imagePath = functions.link.getTagPath("character", filename)
                if (buffer) {
                    if (unverified) {
                        await serverFunctions.files.uploadUnverifiedFile(imagePath, buffer)
                    } else {
                        await this.updateTagImageHistory(character.tag!, filename, buffer, username)
                        await serverFunctions.files.uploadFile(imagePath, buffer, false)
                    }
                    bulkObj.image = filename
                    bulkObj.imageHash = serverFunctions.util.md5(buffer)
                }
            }
            bulkTagUpdate.push(bulkObj)
        }

        for (let i = 0; i < series.length; i++) {
            let serie = series[i]
            if (!serie.tag) continue
            let bulkObj = {tag: serie.tag, type: "series", description: "Series.", image: null, imageHash: null} as BulkTag
            if (!noImageUpdate && serie.image) {
                let ext = ""
                let buffer = null as Buffer | null
                if ("ext" in serie && "bytes" in serie) {
                    ext = serie.ext || ""
                    buffer = Buffer.from(Object.values(serie.bytes!))
                } else {
                    ext = path.extname(serie.image || "")
                    const imagePath = functions.link.getTagPath("tag", serie.image || "")
                    buffer = await serverFunctions.files.getFile(imagePath, false, false)
                }
                const filename = `${serie.tag}.${ext}`
                const imagePath = functions.link.getTagPath("series", filename)
                if (buffer) {
                    if (unverified) {
                        await serverFunctions.files.uploadUnverifiedFile(imagePath, buffer)
                    } else {
                        await this.updateTagImageHistory(serie.tag!, filename, buffer, username)
                        await serverFunctions.files.uploadFile(imagePath, buffer, false)
                    }
                    bulkObj.image = filename
                    bulkObj.imageHash = serverFunctions.util.md5(buffer)
                }
            }
            bulkTagUpdate.push(bulkObj)
        }

        await serverFunctions.tags.applyImplications(addedTags, tagObjectMapping, newTagsSet, bulkTagUpdate)

        addedTags = functions.util.removeDuplicates(addedTags).filter(Boolean)
        if (unverified) {
            await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate)
            await sql.tag.deleteUnverifiedTagMap(postID, removedTags)
            await sql.tag.insertUnverifiedTagMap(postID, addedTags)
        } else {
            await sql.tag.bulkInsertTags(bulkTagUpdate, username, noImageUpdate ? true : false)
            await sql.tag.deleteTagMap(postID, removedTags)
            await sql.tag.insertTagMap(postID, addedTags)
        }

        if (data.originalPost) {
            let oldTagsSet = new Set<string>(data.originalPost.tags || [])
            let newTagsSet = new Set<string>(combinedTags)
            let addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
            let removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)
            return {addedTags, removedTags}
        }

        return {addedTags, removedTags}
    }

    public static insertPostHistory = async (post: PostFull, data: {artists: UploadTag[] | MiniTag[], characters: UploadTag[] | MiniTag[], 
        series: UploadTag[] | MiniTag[], tags: string[], imgChanged: boolean, addedTags: string[], removedTags: string[], 
        vanillaBuffers: Buffer[], upscaledVanillaBuffers: Buffer[], images: UploadImage[] | Image[], 
        upscaledImages: UploadImage[] | Image[], imageFilenames: string[], upscaledImageFilenames: string[], 
        imageOrders: number[], unverifiedImages?: boolean, tagGroups: MiniTagGroup[], addedTagGroups: string[], 
        removedTagGroups: string[], username: string, reason?: string | null}) => {
        let {artists, characters, series, tags, imgChanged, addedTags, removedTags, vanillaBuffers, 
        upscaledVanillaBuffers, images, upscaledImages, imageFilenames, upscaledImageFilenames, 
        imageOrders, unverifiedImages, tagGroups, addedTagGroups, removedTagGroups, username, reason} = data
        const artistsArr = artists.map((a: MiniTag | UploadTag) => a.tag).filter(tag => tag !== undefined)
        const charactersArr = characters.map((c: MiniTag | UploadTag) => c.tag).filter(tag => tag !== undefined)
        const seriesArr = series.map((s: MiniTag | UploadTag) => s.tag).filter(tag => tag !== undefined)

        const updated = await sql.post.post(post.postID) as PostFull
        let r18 = functions.post.isR18(updated.rating)
        const sourceMap = functions.post.imageSourceMap(updated)
        const linkMap = functions.post.imageLinkMap(updated)

        const changes = functions.compare.parsePostChanges(post, updated)

        const postHistory = await sql.history.postHistory(post.postID)
        const nextKey = await serverFunctions.files.getNextKey("post", String(post.postID), r18)
        if (!postHistory.length) {
            const vanilla = structuredClone(post) as unknown as PostHistory & Omit<PostFull, "upscaledImages">
            vanilla.date = vanilla.uploadDate
            const categories = await serverFunctions.tags.tagCategories(vanilla.tags)
            vanilla.artists = categories.artists.map((a) => a.tag)
            vanilla.characters = categories.characters.map((c) => c.tag)
            vanilla.series = categories.series.map((s) => s.tag)
            vanilla.tags = categories.tags.map((t) => t.tag)
            let vanillaImages = [] as string[]
            let vanillaUpscaledImages = [] as string[]
            for (let i = 0; i < vanilla.images.length; i++) {
                const image = vanilla.images[i]
                if (imgChanged) {
                    let newImagePath = ""
                    let newUpscaledImagePath = ""
                    if (upscaledVanillaBuffers[i]) {
                        newUpscaledImagePath = functions.link.getUpscaledImageHistoryPath(post.postID, 1, image.order, 
                            image.upscaledFilename || image.filename)
                        await serverFunctions.files.uploadFile(newUpscaledImagePath, upscaledVanillaBuffers[i], r18)
                    }
                    if (vanillaBuffers[i]) {
                        newImagePath = functions.link.getImageHistoryPath(post.postID, 1, image.order, image.filename)
                        await serverFunctions.files.uploadFile(newImagePath, vanillaBuffers[i], r18)
                    }
                    vanillaImages.push(newImagePath)
                    vanillaUpscaledImages.push(newUpscaledImagePath)
                } else {
                    vanillaImages.push(functions.link.getImagePath(image.type, post.postID, image.order, image.filename))
                    vanillaUpscaledImages.push(functions.link.getUpscaledImagePath(image.type, post.postID, image.order, 
                    image.upscaledFilename || image.filename))
                }
            }
            await sql.history.insertPostHistory({
                post: vanilla, username: vanilla.uploader, images: vanillaImages, upscaledImages: vanillaUpscaledImages, 
                artists: vanilla.artists, characters: vanilla.characters, series: vanilla.series, tags: vanilla.tags,
                addedTags: [], removedTags: [], tagGroups: JSON.stringify(vanilla.tagGroups), addedTagGroups: [],
                removedTagGroups: [], imageSources: JSON.stringify(sourceMap), imageLinks: JSON.stringify(linkMap), 
                imageChanged: false, changes: null, reason})

            let newImages = [] as string[]
            let newUpscaledImages = [] as string[]
            for (let i = 0; i < images.length; i++) {
                const image = images[i]
                const upscaledImage = upscaledImages[i]
                if (imgChanged) {
                    let newImagePath = ""
                    let newUpscaledImagePath = ""
                    if (upscaledImage) {
                        let buffer = Buffer.from("")
                        if ("bytes" in upscaledImage) {
                            buffer = Buffer.from(Object.values(upscaledImage.bytes))
                        } else {
                            const imagePath = functions.link.getUpscaledImagePath(upscaledImage.type, upscaledImage.postID, 
                            upscaledImage.order, upscaledImage.upscaledFilename || upscaledImage.filename)
                            if (unverifiedImages) {
                                buffer = await serverFunctions.files.getUnverifiedFile(imagePath, false, upscaledImage.pixelHash)
                            } else {
                                buffer = await serverFunctions.files.getFile(imagePath, false, r18, upscaledImage.pixelHash)
                            }
                        }
                        newUpscaledImagePath = functions.link.getUpscaledImageHistoryPath(post.postID, 2, imageOrders[i], 
                            upscaledImageFilenames[i])
                        await serverFunctions.files.uploadFile(newUpscaledImagePath, buffer, r18)
                    }
                    if (image) {
                        let buffer = Buffer.from("")
                        if ("bytes" in image) {
                            buffer = Buffer.from(Object.values(image.bytes))
                        } else {
                            const imagePath = functions.link.getImagePath(image.type, image.postID, image.order, image.filename)
                            if (unverifiedImages) {
                                buffer = await serverFunctions.files.getUnverifiedFile(imagePath, false, image.pixelHash)
                            } else {
                                buffer = await serverFunctions.files.getFile(imagePath, false, r18, image.pixelHash)
                            }
                        }
                        newImagePath = functions.link.getImageHistoryPath(post.postID, 2, imageOrders[i], imageFilenames[i])
                        await serverFunctions.files.uploadFile(newImagePath, buffer, r18)
                    }
                    newImages.push(newImagePath)
                    newUpscaledImages.push(newUpscaledImagePath)
                } else {
                    newImages.push(functions.link.getImagePath(updated.images[i].type, post.postID, updated.images[i].order, 
                    updated.images[i].filename))
                    newUpscaledImages.push(functions.link.getUpscaledImagePath(updated.images[i].type, post.postID, 
                    updated.images[i].order, updated.images[i].upscaledFilename || updated.images[i].filename))
                }
            }
            await sql.history.insertPostHistory({
                post: updated, username, images: newImages, upscaledImages: newUpscaledImages, 
                artists: artistsArr, characters: charactersArr, series: seriesArr, 
                tags, addedTags, removedTags, tagGroups: JSON.stringify(tagGroups), addedTagGroups, removedTagGroups, 
                imageSources: JSON.stringify(sourceMap), imageLinks: JSON.stringify(linkMap), imageChanged: imgChanged, 
                changes: changes ? JSON.stringify(changes) : null, reason})
        } else {
            let newImages = [] as string[]
            let newUpscaledImages = [] as string[]
            for (let i = 0; i < images.length; i++) {
                const image = images[i]
                const upscaledImage = upscaledImages[i]
                if (imgChanged) {
                    let newImagePath = ""
                    let newUpscaledImagePath = ""
                    if (upscaledImage) {
                        let buffer = Buffer.from("")
                        if ("bytes" in upscaledImage) {
                            buffer = Buffer.from(Object.values(upscaledImage.bytes))
                        } else {
                            const imagePath = functions.link.getUpscaledImagePath(upscaledImage.type, upscaledImage.postID, 
                                upscaledImage.order, upscaledImage.upscaledFilename || upscaledImage.filename)
                            if (unverifiedImages) {
                                buffer = await serverFunctions.files.getUnverifiedFile(imagePath, false, upscaledImage.pixelHash)
                            } else {
                                buffer = await serverFunctions.files.getFile(imagePath, false, r18, upscaledImage.pixelHash)
                            }
                        }
                        newUpscaledImagePath = functions.link.getUpscaledImageHistoryPath(post.postID, nextKey, imageOrders[i], 
                        upscaledImageFilenames[i])
                        await serverFunctions.files.uploadFile(newUpscaledImagePath, buffer, r18)
                    }
                    if (image) {
                        let buffer = Buffer.from("")
                        if ("bytes" in image) {
                            buffer = Buffer.from(Object.values(image.bytes))
                        } else {
                            const imagePath = functions.link.getImagePath(image.type, image.postID, image.order, image.filename)
                            if (unverifiedImages) {
                                buffer = await serverFunctions.files.getUnverifiedFile(imagePath, false, image.pixelHash)
                            } else {
                                buffer = await serverFunctions.files.getFile(imagePath, false, r18, image.pixelHash)
                            }
                        }
                        newImagePath = functions.link.getImageHistoryPath(post.postID, nextKey, imageOrders[i], imageFilenames[i])
                        await serverFunctions.files.uploadFile(newImagePath, buffer, r18)
                    }
                    newImages.push(newImagePath)
                    newUpscaledImages.push(newUpscaledImagePath)

                    let result = await sql.history.postHistory(post.postID)
                    if (result.length > 1) {
                        const lastResult = result[result.length - 1]
                        const penultResult = result[result.length - 2]
                        const lastImage = lastResult.images[0]
                        const penultImage = penultResult.images[0]
                        if (penultImage?.startsWith("history/post") && !lastImage?.startsWith("history/post")) {
                            await sql.history.updatePostHistory(lastResult.historyID, "images", penultResult.images)
                        }
                    }
                } else {
                    newImages.push(functions.link.getImagePath(updated.images[i].type, post.postID, updated.images[i].order, 
                        updated.images[i].filename))
                    newUpscaledImages.push(functions.link.getUpscaledImagePath(updated.images[i].type, post.postID, 
                        updated.images[i].order, updated.images[i].upscaledFilename || updated.images[i].filename))
                }
            }
            await sql.history.insertPostHistory({
                post: updated, username, images: newImages, upscaledImages: newUpscaledImages,  
                artists: artistsArr, characters: charactersArr, series: seriesArr, 
                tags, addedTags, removedTags, tagGroups: JSON.stringify(tagGroups), addedTagGroups, removedTagGroups, 
                imageSources: JSON.stringify(sourceMap), imageLinks: JSON.stringify(linkMap), imageChanged: imgChanged, 
                changes: changes ? JSON.stringify(changes) : null, reason})
        }
    }
}