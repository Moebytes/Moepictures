import {Express, NextFunction, Request, Response} from "express"
import sql from "../sql/SQLQuery"
import path from "path"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../structures/ServerFunctions"
import rateLimit from "express-rate-limit"
import sharp from "sharp"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import {PostHistory, UploadParams, UploadImage, EditParams, BulkTag, UnverifiedUploadParams,
UnverifiedEditParams, PostFull, UnverifiedPost, ApproveParams, TagHistory, UploadTag,
PostType, SourceData, PostRating, Image, PostStyle, MiniTag, ChildPost,
MiniTagGroup} from "../types/Types"

const uploadLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 60,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false,
  keyGenerator,
  handler
})

const editLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 60,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const modLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 300,
	message: "Too many requests, try again later.",
	standardHeaders: true,
	legacyHeaders: false
})

const validImages = (images: UploadImage[], skipMBCheck?: boolean) => {
  if (!images.length) return false
  for (let i = 0; i < images.length; i++) {
    if (functions.isModel(images[i].link) || functions.isLive2D(images[i].link)) {
      const MB = images[i].size / (1024*1024)
      const maxSize = functions.isModel(images[i].link) ? 10 : 50
      if (skipMBCheck || MB <= maxSize) continue
      return false
    }
    const result = functions.bufferFileType(images[i].bytes)?.[0]
    const jpg = result?.mime === "image/jpeg"
    const png = result?.mime === "image/png"
    const webp = result?.mime === "image/webp"
    const avif = result?.mime === "image/avif"
    const gif = result?.mime === "image/gif"
    const mp4 = result?.mime === "video/mp4"
    const mp3 = result?.mime === "audio/mpeg"
    const wav = result?.mime === "audio/x-wav"
    const webm = (path.extname(images[i].link) === ".webm" && result?.typename === "mkv")
    if (jpg || png || webp || avif || gif || mp4 || webm || mp3 || wav) {
      const MB = images[i].size / (1024*1024)
      const maxSize = functions.maxFileSize({jpg, png, avif, mp3, wav, gif, webp, mp4, webm})
      let type = result.typename === "mkv" ? "webm" : result.typename
      if (images[i].ext !== type) return false
      if (skipMBCheck || MB <= maxSize) continue
    }
    return false
  }
  return true
}

const updateTagImageHistory = async (targetTag: string, filename: string, newBuffer: Buffer, username: string) => {
  const tag = await sql.tag.tag(targetTag)
  if (!tag) return
  let oldBuffer = null as Buffer | null
  if (tag.image) {
    const imgPath = functions.getTagPath(tag.type, tag.image)
    oldBuffer = await serverFunctions.getFile(imgPath, false, false)
    let oldHash = await phash(oldBuffer).then((hash: string) => functions.binaryToHex(hash))
    let newHash = await phash(newBuffer).then((hash: string) => functions.binaryToHex(hash))
    if (dist(oldHash, newHash) < 7) return
  }

  const newHash = serverFunctions.md5(newBuffer)

  const tagHistory = await sql.history.tagHistory(targetTag)
  const nextKey = await serverFunctions.getNextKey("tag", targetTag, false)
  if (!tagHistory.length) {
      let vanilla = tag as unknown as TagHistory
      vanilla.date = tag.createDate 
      vanilla.user = tag.creator
      vanilla.aliases = vanilla.aliases.map((alias: any) => alias?.alias)
      vanilla.implications = vanilla.implications.map((implication: any) => implication?.implication)
      if (vanilla.image && oldBuffer) {
            const newImagePath = functions.getTagHistoryPath(targetTag, 1, vanilla.image)
            await serverFunctions.uploadFile(newImagePath, oldBuffer, false)
            vanilla.image = newImagePath
      } else {
          vanilla.image = null
      }
      await sql.history.insertTagHistory({username: vanilla.user, tag: targetTag, key: targetTag, type: vanilla.type, image: vanilla.image, imageHash: vanilla.imageHash,
          description: vanilla.description, aliases: functions.filterNulls(vanilla.aliases), implications: functions.filterNulls(vanilla.implications), 
          pixivTags: functions.filterNulls(vanilla.pixivTags), website: vanilla.website, social: vanilla.social, twitter: vanilla.twitter, fandom: vanilla.fandom, 
          r18: vanilla.r18, featuredPost: vanilla.featuredPost?.postID, imageChanged: false, changes: null})
      
      const imagePath = functions.getTagHistoryPath(targetTag, 2, filename)
      await serverFunctions.uploadFile(imagePath, newBuffer, false)

      await sql.history.insertTagHistory({username, image: filename, imageHash: newHash, tag: targetTag, key: targetTag, type: tag.type, description: tag.description, 
      aliases: functions.filterNulls(tag.aliases).map((a) => a.alias), implications: functions.filterNulls(tag.implications).map((i) => i.implication), 
      pixivTags: functions.filterNulls(tag.pixivTags), website: tag.website, social: tag.social, twitter: tag.twitter, fandom: tag.fandom, r18: tag.r18, 
      featuredPost: tag.featuredPost?.postID, imageChanged: true, changes: null, reason: null})
  } else {
      const imagePath = functions.getTagHistoryPath(targetTag, nextKey, filename)
      await serverFunctions.uploadFile(imagePath, newBuffer, false)

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
      await sql.history.insertTagHistory({username, image: filename, imageHash: newHash, tag: targetTag, key: targetTag, type: tag.type, description: tag.description, 
      aliases: functions.filterNulls(tag.aliases).map((a) => a.alias), implications: functions.filterNulls(tag.implications).map((i) => i.implication), 
      pixivTags: functions.filterNulls(tag.pixivTags), website: tag.website, social: tag.social, twitter: tag.twitter, fandom: tag.fandom, r18: tag.r18, 
      featuredPost: tag.featuredPost?.postID, imageChanged: true, changes: null, reason: null})
  }
}

export const deleteImages = async (post: PostFull, data: {imgChanged: boolean, r18: boolean}) => {
  let {imgChanged, r18} = data
  let vanillaBuffers = [] as Buffer[]
  let upscaledVanillaBuffers = [] as Buffer[]
  for (let i = 0; i < post.images.length; i++) {
    const image = post.images[i]
    const imagePath = functions.getImagePath(image.type, post.postID, image.order, image.filename)
    const upscaledImagePath = functions.getUpscaledImagePath(image.type, post.postID, image.order, image.upscaledFilename || image.filename)
    const thumbnailPath = functions.getThumbnailImagePath(image.type, image.thumbnail)
    const oldImage = await serverFunctions.getFile(imagePath, false, r18, image.pixelHash) as Buffer
    const oldUpscaledImage = await serverFunctions.getFile(upscaledImagePath, false, r18, image.pixelHash) as Buffer
    vanillaBuffers.push(oldImage)
    upscaledVanillaBuffers.push(oldUpscaledImage)
    if (imgChanged) {
      await sql.post.deleteImage(image.imageID)
      await serverFunctions.deleteFile(imagePath, r18)
      await serverFunctions.deleteFile(upscaledImagePath, r18)
      await serverFunctions.deleteFile(thumbnailPath, r18)
    }
  }
  return {vanillaBuffers, upscaledVanillaBuffers}
}

export const insertImages = async (postID: string, data: {images: UploadImage[] | Image[], upscaledImages: UploadImage[] | Image[], type: PostType,
  rating: PostRating, source: SourceData, characters: UploadTag[] | MiniTag[], imgChanged: boolean, unverified?: boolean, unverifiedImages?: boolean,
  thumbnail?: string | null, thumbnailFilename?: string}) => {
  let {images, upscaledImages, type, rating, source, characters, imgChanged, unverified, unverifiedImages, thumbnail, thumbnailFilename} = data

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
  let r18 = functions.isR18(rating)

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
        const imagePath = functions.getImagePath(image.type, image.postID, image.order, image.filename)
        if (unverifiedImages) {
          buffer = await serverFunctions.getUnverifiedFile(imagePath, false, image.pixelHash)
        } else {
          buffer = await serverFunctions.getFile(imagePath, false, r18, image.pixelHash)
        }
      }
    }
    if (upscaledImage) {
      if ("bytes" in upscaledImage) {
        upscaledBuffer = Buffer.from(upscaledImage.bytes)
      } else if ("type" in upscaledImage) {
        const upscaledImagePath = functions.getUpscaledImagePath(upscaledImage.type, upscaledImage.postID, upscaledImage.order, 
        upscaledImage.upscaledFilename || upscaledImage.filename)
        if (unverifiedImages) {
          upscaledBuffer = await serverFunctions.getUnverifiedFile(upscaledImagePath, false, upscaledImage.pixelHash)
        } else {
          upscaledBuffer = await serverFunctions.getFile(upscaledImagePath, false, r18, upscaledImage.pixelHash)
        }
      }
    }
    if (image.thumbnail) {
      if (functions.isBase64(image.thumbnail)) {
        thumbBuffer = functions.base64ToBuffer(image.thumbnail)
      } else {
        let thumbnailImagePath = functions.getThumbnailImagePath((image as Image).type, image.thumbnail)
        if (unverifiedImages) {
          thumbBuffer = await serverFunctions.getUnverifiedFile(thumbnailImagePath)
        } else {
          thumbBuffer = await serverFunctions.getFile(thumbnailImagePath, false, r18)
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
    const cleanTitle = functions.cleanTitle(source.title)
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
      characters[0].tag !== "unknown-character" ? `${characters[0].tag}.${ext}` :
      `${postID}.${ext}`
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
    } else if (functions.isWebP(`.${ext}`)) {
      const animated = functions.isAnimatedWebp(bufferFallback)
      if (animated) {
        kind = "animation"
      } else {
        kind = "image"
      }
    } else if (functions.isImage(`.${ext}`)) {
      kind = "image"
    } else if (functions.isGIF(`.${ext}`)) {
      kind = "animation"
    } else if (functions.isVideo(`.${ext}`)) {
      kind = "video"
    } else if (functions.isAudio(`.${ext}`)) {
      kind = "audio"
    } else if (functions.isModel(`.${ext}`)) {
      kind = "model"
    } else if (functions.isLive2D(`.${ext}`)) {
      kind = "live2d"
    }
    if (imgChanged) {
      if (buffer?.byteLength) {
        let imagePath = functions.getImagePath(kind, postID, Number(order), filename)
        if (unverified) {
          await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
        } else {
          await serverFunctions.uploadFile(imagePath, buffer, r18)
        }
        hasOriginal = true
        originalCheck.push(imagePath)
      }

      if (upscaledBuffer?.byteLength) {
        let imagePath = functions.getUpscaledImagePath(kind, postID, Number(order), upscaledFilename)
        if (unverified) {
          await serverFunctions.uploadUnverifiedFile(imagePath, upscaledBuffer)
        } else {
          await serverFunctions.uploadFile(imagePath, upscaledBuffer, r18)
        }
        hasUpscaled = true
        upscaledCheck.push(imagePath)
      }

      if (thumbBuffer?.byteLength && thumbnailFilename) {
        let thumbPath = functions.getThumbnailImagePath(kind, thumbnailFilename)
        if (unverified) {
          await serverFunctions.uploadUnverifiedFile(thumbPath, thumbBuffer)
        } else {
          await serverFunctions.uploadFile(thumbPath, thumbBuffer, r18)
        }
      }
  
      let dimensions = {} as {width?: number, height?: number}
      let upscaledDimensions = {} as {width?: number, height?: number}
      let hash = ""
      let pixelHash = ""
      if (kind === "video" || kind === "audio" || kind === "model" || kind === "live2d") {
          hash = await phash(thumbBuffer || bufferFallback).then((hash: string) => functions.binaryToHex(hash))
          pixelHash = await serverFunctions.pixelHash(thumbBuffer || bufferFallback)
          dimensions.width = original.width
          dimensions.height = original.height
          upscaledDimensions.width = upscaled.width
          upscaledDimensions.height = upscaled.height
      } else {
          hash = await phash(bufferFallback).then((hash: string) => functions.binaryToHex(hash))
          pixelHash = await serverFunctions.pixelHash(bufferFallback)
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
      if (unverified) {
        await sql.post.insertUnverifiedImage(postID, filename, upscaledFilename, kind, order, hash, pixelHash,
        width, height, upscaledWidth, upscaledHeight, size, upscaledSize, duration, thumbnailFilename)
      } else {
        await sql.post.insertImage(postID, filename, upscaledFilename, kind, order, hash, pixelHash,
        width, height, upscaledWidth, upscaledHeight, size, upscaledSize, duration, thumbnailFilename)
      }
    }
  }
  if (upscaledCheck?.length > originalCheck?.length) hasOriginal = false
  if (originalCheck?.length > upscaledCheck?.length) hasUpscaled = false

  return {hasOriginal, hasUpscaled, imageFilenames, upscaledImageFilenames, imageOrders}
}

export const updatePost = async (postID: string, data: {artists: UploadTag[] | MiniTag[], type: PostType, rating: PostRating, 
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

  const newSlug = functions.postSlug(source.title, source.englishTitle)

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
      mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
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
      mirrors: source.mirrors ? functions.mirrorsJSON(source.mirrors) : null,
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

export const updateTagGroups = async (postID: string, data: {oldTagGroups?: MiniTagGroup[], 
  newTagGroups?: MiniTagGroup[], unverified?: boolean}) => {
  let {oldTagGroups, newTagGroups, unverified} = data
  let {addedTagGroups, removedTagGroups} = functions.tagGroupChanges(oldTagGroups, newTagGroups)
  if (!oldTagGroups) oldTagGroups = []
  if (!newTagGroups) newTagGroups = []
  let oldTagsSet = new Set<string>(oldTagGroups.filter(Boolean).map((o) => o.name))
  let newTagsSet = new Set<string>(newTagGroups.filter(Boolean).map((n) => n.name))
  let addedGroups = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
  let removedGroups = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)

  for (const tagGroup of addedTagGroups) {
    if (!tagGroup) continue
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

export const insertTags = async (postID: string, data: {tags: string[], artists: UploadTag[] | MiniTag[], username: string,
  characters: UploadTag[] | MiniTag[], series: UploadTag[] | MiniTag[], newTags: UploadTag[] | MiniTag[], noImageUpdate?: boolean,
  post?: PostFull | UnverifiedPost | null, unverified?: boolean}) => {
  let {artists, characters, series, newTags, tags, username, noImageUpdate, post, unverified} = data

  let combinedTags = [...artists.map((a: MiniTag | UploadTag) => a.tag), ...characters.map((c: MiniTag | UploadTag) => c.tag), 
  ...series.map((s: MiniTag | UploadTag) => s.tag), ...newTags.map((n: MiniTag | UploadTag) => n.tag), ...tags] as string[]
  let oldTagsSet = new Set<string>(post?.tags || [])
  let newTagsSet = new Set<string>(combinedTags)
  let addedTags = [...newTagsSet].filter(tag => !oldTagsSet.has(tag)).filter(Boolean)
  let removedTags = [...oldTagsSet].filter(tag => !newTagsSet.has(tag)).filter(Boolean)

  let bulkTagUpdate = [] as BulkTag[]
  let tagObjectMapping = await serverFunctions.tagMap()

  if (unverified) {
    for (let i = 0; i < addedTags.length; i++) {
      bulkTagUpdate.push({tag: addedTags[i], type: tagObjectMapping[addedTags[i]]?.type || "tag", description: null, image: null, imageHash: null})
    }
  }

  for (let i = 0; i < newTags.length; i++) {
    let newTag = newTags[i]
    if (!newTag.tag) continue
    let bulkObj = {tag: newTag.tag, type: tagObjectMapping[newTag.tag]?.type || "tag", description: null, image: null, imageHash: null} as BulkTag
    if (newTag.description) bulkObj.description = newTag.description
    if (!noImageUpdate && newTag.image) {
      let ext = ""
      let buffer = null as Buffer | null
      if ("ext" in newTag && "bytes" in newTag) {
        ext = newTag.ext || ""
        buffer = Buffer.from(Object.values(newTag.bytes!))
      } else {
        ext = path.extname(newTag.image || "")
        const imagePath = functions.getTagPath("tag", newTag.image || "")
        buffer = await serverFunctions.getFile(imagePath, false, false)
      }
      const filename = `${newTag.tag}.${ext}`
      const imagePath = functions.getTagPath("tag", filename)
      if (buffer) {
        if (unverified) {
          await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
        } else {
          await updateTagImageHistory(newTag.tag!, filename, buffer, username)
          await serverFunctions.uploadFile(imagePath, buffer, false)
        }
        bulkObj.image = filename
        bulkObj.imageHash = serverFunctions.md5(buffer)
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
        const imagePath = functions.getTagPath("tag", artist.image || "")
        buffer = await serverFunctions.getFile(imagePath, false, false)
      }
      const filename = `${artist.tag}.${ext}`
      const imagePath = functions.getTagPath("artist", filename)
      if (buffer) {
        if (unverified) {
          await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
        } else {
          await updateTagImageHistory(artist.tag!, filename, buffer, username)
          await serverFunctions.uploadFile(imagePath, buffer, false)
        }
        bulkObj.image = filename
        bulkObj.imageHash = serverFunctions.md5(buffer)
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
        const imagePath = functions.getTagPath("tag", character.image || "")
        buffer = await serverFunctions.getFile(imagePath, false, false)
      }
      const filename = `${character.tag}.${ext}`
      const imagePath = functions.getTagPath("character", filename)
      if (buffer) {
        if (unverified) {
          await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
        } else {
          await updateTagImageHistory(character.tag!, filename, buffer, username)
          await serverFunctions.uploadFile(imagePath, buffer, false)
        }
        bulkObj.image = filename
        bulkObj.imageHash = serverFunctions.md5(buffer)
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
        const imagePath = functions.getTagPath("tag", serie.image || "")
        buffer = await serverFunctions.getFile(imagePath, false, false)
      }
      const filename = `${serie.tag}.${ext}`
      const imagePath = functions.getTagPath("series", filename)
      if (buffer) {
        if (unverified) {
          await serverFunctions.uploadUnverifiedFile(imagePath, buffer)
        } else {
          await updateTagImageHistory(serie.tag!, filename, buffer, username)
          await serverFunctions.uploadFile(imagePath, buffer, false)
        }
        bulkObj.image = filename
        bulkObj.imageHash = serverFunctions.md5(buffer)
      }
    }
    bulkTagUpdate.push(bulkObj)
  }

  for (let i = 0; i < addedTags.length; i++) {
    const implications = await sql.tag.implications(addedTags[i])
    if (implications?.[0]) {
      for (const i of implications) {
        if (!oldTagsSet.has(i.implication)) addedTags.push(i.implication)
        const tag = await sql.tag.tag(i.implication)
        bulkTagUpdate.push({tag: i.implication, type: tagObjectMapping[i.implication]?.type || "tag", 
        description: tag?.description || null, image: tag?.image || null, imageHash: tag?.imageHash || null})
      }
    }
  }

  addedTags = functions.removeDuplicates(addedTags).filter(Boolean)
  if (unverified) {
    await sql.tag.bulkInsertUnverifiedTags(bulkTagUpdate)
    await sql.tag.deleteUnverifiedTagMap(postID, removedTags)
    await sql.tag.insertUnverifiedTagMap(postID, addedTags)
  } else {
    await sql.tag.bulkInsertTags(bulkTagUpdate, username, noImageUpdate ? true : false)
    await sql.tag.deleteTagMap(postID, removedTags)
    await sql.tag.insertTagMap(postID, addedTags)
  }

  return {addedTags, removedTags}
}

const insertPostHistory = async (post: PostFull, data: {artists: UploadTag[] | MiniTag[], characters: UploadTag[] | MiniTag[], 
  series: UploadTag[] | MiniTag[], tags: string[], imgChanged: boolean, addedTags: string[], removedTags: string[], 
  vanillaBuffers: Buffer[], upscaledVanillaBuffers: Buffer[], images: UploadImage[] | Image[], upscaledImages: UploadImage[] | Image[], 
  imageFilenames: string[], upscaledImageFilenames: string[], imageOrders: number[], unverifiedImages?: boolean, tagGroups: MiniTagGroup[],
  addedTagGroups: string[], removedTagGroups: string[], username: string, reason?: string | null}) => {
  let {artists, characters, series, tags, imgChanged, addedTags, removedTags, vanillaBuffers, 
  upscaledVanillaBuffers, images, upscaledImages, imageFilenames, upscaledImageFilenames, 
  imageOrders, unverifiedImages, tagGroups, addedTagGroups, removedTagGroups, username, reason} = data
  const artistsArr = artists.map((a: MiniTag | UploadTag) => a.tag).filter(tag => tag !== undefined)
  const charactersArr = characters.map((c: MiniTag | UploadTag) => c.tag).filter(tag => tag !== undefined)
  const seriesArr = series.map((s: MiniTag | UploadTag) => s.tag).filter(tag => tag !== undefined)

  const updated = await sql.post.post(post.postID) as PostFull
  let r18 = functions.isR18(updated.rating)

  const changes = functions.parsePostChanges(post, updated)

  const postHistory = await sql.history.postHistory(post.postID)
  const nextKey = await serverFunctions.getNextKey("post", String(post.postID), r18)
  if (!postHistory.length) {
      const vanilla = structuredClone(post) as unknown as PostHistory & PostFull
      vanilla.date = vanilla.uploadDate
      vanilla.user = vanilla.uploader
      const categories = await serverFunctions.tagCategories(vanilla.tags)
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
              newUpscaledImagePath = functions.getUpscaledImageHistoryPath(post.postID, 1, image.order, image.upscaledFilename || image.filename)
              await serverFunctions.uploadFile(newUpscaledImagePath, upscaledVanillaBuffers[i], r18)
            }
            if (vanillaBuffers[i]) {
              newImagePath = functions.getImageHistoryPath(post.postID, 1, image.order, image.filename)
              await serverFunctions.uploadFile(newImagePath, vanillaBuffers[i], r18)
            }
            vanillaImages.push(newImagePath)
            vanillaUpscaledImages.push(newUpscaledImagePath)
          } else {
            vanillaImages.push(functions.getImagePath(image.type, post.postID, image.order, image.filename))
            vanillaUpscaledImages.push(functions.getUpscaledImagePath(image.type, post.postID, image.order, image.upscaledFilename || image.filename))
          }
      }
      await sql.history.insertPostHistory({
        postID: post.postID, username: vanilla.user, images: vanillaImages, upscaledImages: vanillaUpscaledImages, uploader: vanilla.uploader, 
        updater: vanilla.updater, uploadDate: vanilla.uploadDate, updatedDate: vanilla.updatedDate, type: vanilla.type, rating: vanilla.rating, 
        style: vanilla.style, parentID: vanilla.parentID, title: vanilla.title, englishTitle: vanilla.englishTitle, slug: vanilla.slug,
        posted: vanilla.posted, artist: vanilla.artist, source: vanilla.source, commentary: vanilla.commentary, englishCommentary: vanilla.englishCommentary, 
        bookmarks: vanilla.bookmarks, buyLink: vanilla.buyLink, mirrors: vanilla.mirrors ? JSON.stringify(vanilla.mirrors) : null, 
        hasOriginal: vanilla.hasOriginal, hasUpscaled: vanilla.hasUpscaled, artists: vanilla.artists, characters: vanilla.characters, 
        series: vanilla.series, tags: vanilla.tags, addedTags: [], removedTags: [], tagGroups: JSON.stringify(vanilla.tagGroups), addedTagGroups: [],
        removedTagGroups: [], imageChanged: false, changes: null, reason})

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
                const imagePath = functions.getUpscaledImagePath(upscaledImage.type, upscaledImage.postID, upscaledImage.order, upscaledImage.upscaledFilename || upscaledImage.filename)
                if (unverifiedImages) {
                  buffer = await serverFunctions.getUnverifiedFile(imagePath, false, upscaledImage.pixelHash)
                } else {
                  buffer = await serverFunctions.getFile(imagePath, false, r18, upscaledImage.pixelHash)
                }
              }
              newUpscaledImagePath = functions.getUpscaledImageHistoryPath(post.postID, 2, imageOrders[i], upscaledImageFilenames[i])
              await serverFunctions.uploadFile(newUpscaledImagePath, buffer, r18)
            }
            if (image) {
              let buffer = Buffer.from("")
              if ("bytes" in image) {
                buffer = Buffer.from(Object.values(image.bytes))
              } else {
                const imagePath = functions.getImagePath(image.type, image.postID, image.order, image.filename)
                if (unverifiedImages) {
                  buffer = await serverFunctions.getUnverifiedFile(imagePath, false, image.pixelHash)
                } else {
                  buffer = await serverFunctions.getFile(imagePath, false, r18, image.pixelHash)
                }
              }
              newImagePath = functions.getImageHistoryPath(post.postID, 2, imageOrders[i], imageFilenames[i])
              await serverFunctions.uploadFile(newImagePath, buffer, r18)
            }
            newImages.push(newImagePath)
            newUpscaledImages.push(newUpscaledImagePath)
          } else {
            newImages.push(functions.getImagePath(updated.images[i].type, post.postID, updated.images[i].order, updated.images[i].filename))
            newUpscaledImages.push(functions.getUpscaledImagePath(updated.images[i].type, post.postID, updated.images[i].order, updated.images[i].upscaledFilename || updated.images[i].filename))
          }
      }
      await sql.history.insertPostHistory({
        postID: post.postID, username, images: newImages, upscaledImages: newUpscaledImages, uploader: updated.uploader, updater: updated.updater, 
        uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, style: updated.style, 
        parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, posted: updated.posted, artist: updated.artist, 
        source: updated.source, commentary: updated.commentary, slug: updated.slug, englishCommentary: updated.englishCommentary, 
        bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: updated.mirrors ? JSON.stringify(updated.mirrors) : null, 
        hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: artistsArr, characters: charactersArr, series: seriesArr, 
        tags, addedTags, removedTags, tagGroups: JSON.stringify(tagGroups), addedTagGroups, removedTagGroups, imageChanged: imgChanged, 
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
              const imagePath = functions.getUpscaledImagePath(upscaledImage.type, upscaledImage.postID, upscaledImage.order, upscaledImage.upscaledFilename || upscaledImage.filename)
              if (unverifiedImages) {
                buffer = await serverFunctions.getUnverifiedFile(imagePath, false, upscaledImage.pixelHash)
              } else {
                buffer = await serverFunctions.getFile(imagePath, false, r18, upscaledImage.pixelHash)
              }
            }
            newUpscaledImagePath = functions.getUpscaledImageHistoryPath(post.postID, nextKey, imageOrders[i], upscaledImageFilenames[i])
            await serverFunctions.uploadFile(newUpscaledImagePath, buffer, r18)
          }
          if (image) {
            let buffer = Buffer.from("")
            if ("bytes" in image) {
              buffer = Buffer.from(Object.values(image.bytes))
            } else {
              const imagePath = functions.getImagePath(image.type, image.postID, image.order, image.filename)
              if (unverifiedImages) {
                buffer = await serverFunctions.getUnverifiedFile(imagePath, false, image.pixelHash)
              } else {
                buffer = await serverFunctions.getFile(imagePath, false, r18, image.pixelHash)
              }
            }
            newImagePath = functions.getImageHistoryPath(post.postID, nextKey, imageOrders[i], imageFilenames[i])
            await serverFunctions.uploadFile(newImagePath, buffer, r18)
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
          newImages.push(functions.getImagePath(updated.images[i].type, post.postID, updated.images[i].order, updated.images[i].filename))
          newUpscaledImages.push(functions.getUpscaledImagePath(updated.images[i].type, post.postID, updated.images[i].order, updated.images[i].upscaledFilename || updated.images[i].filename))
        }
      }
      await sql.history.insertPostHistory({
        postID: post.postID, username, images: newImages, upscaledImages: newUpscaledImages, uploader: updated.uploader, updater: updated.updater, 
        uploadDate: updated.uploadDate, updatedDate: updated.updatedDate, type: updated.type, rating: updated.rating, style: updated.style, 
        parentID: updated.parentID, title: updated.title, englishTitle: updated.englishTitle, posted: updated.posted, artist: updated.artist, 
        source: updated.source, commentary: updated.commentary, slug: updated.slug, englishCommentary: updated.englishCommentary, 
        bookmarks: updated.bookmarks, buyLink: updated.buyLink, mirrors: updated.mirrors ? JSON.stringify(updated.mirrors) : null,
        hasOriginal: updated.hasOriginal, hasUpscaled: updated.hasUpscaled, artists: artistsArr, characters: charactersArr, series: seriesArr, 
        tags, addedTags, removedTags, tagGroups: JSON.stringify(tagGroups), addedTagGroups, removedTagGroups, imageChanged: imgChanged, 
        changes: changes ? JSON.stringify(changes) : null, reason})
  }
}

const CreateRoutes = (app: Express) => {
    app.post("/api/post/upload", csrfProtection, uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {images, upscaledImages, type, rating, style, parentID, source, artists, characters, series,
        tags, tagGroups, newTags, unverifiedID, noImageUpdate} = req.body as UploadParams

        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isCurator(req.session)) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        artists = functions.cleanTags(artists, "artists")
        characters = functions.cleanTags(characters, "characters")
        series = functions.cleanTags(series, "series")
        newTags = functions.cleanTags(newTags, "newTags")
        tags = functions.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.invalidTags(characters, series, tags)
        if (invalidTags) return res.status(400).send(invalidTags)
        
        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")

        const postID = await sql.post.insertPost()
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertChild(postID, parentID)

        const {hasOriginal, hasUpscaled} = await insertImages(postID, {images, upscaledImages, type, rating, source, characters, imgChanged: true})
        await updatePost(postID, {artists, type, rating, style, source, parentID, hasOriginal, hasUpscaled, uploader: req.session.username,
        updater: req.session.username, approver: req.session.username})
        let {addedTags, removedTags} = await insertTags(postID, {artists, characters, series, newTags, tags, noImageUpdate, username: req.session.username})
        await sql.cuteness.updateCuteness(postID, req.session.username, 500)

        await updateTagGroups(postID, {oldTagGroups: [], newTagGroups: tagGroups})

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(unverifiedID)
          if (unverifiedPost) await serverFunctions.deleteUnverifiedPost(unverifiedPost)
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit", csrfProtection, editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, images, upscaledImages, type, rating, style, parentID, source, artists, characters, series,
        tags, tagGroups, newTags, unverifiedID, reason, noImageUpdate, preserveChildren, updatedDate, silent} = req.body as EditParams

        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isContributor(req.session)) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")
        if (!permissions.isMod(req.session)) noImageUpdate = true

        artists = functions.cleanTags(artists, "artists")
        characters = functions.cleanTags(characters, "characters")
        series = functions.cleanTags(series, "series")
        newTags = functions.cleanTags(newTags, "newTags")
        tags = functions.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.invalidTags(characters, series, tags)
        if (invalidTags) return res.status(400).send(invalidTags)

        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const post = await sql.post.post(postID)
        if (!post) return res.status(400).send("Bad request")
        if (post.locked && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")
        let oldR18 = functions.isR18(post.rating)
        let newR18 = functions.isR18(rating)
        let oldType = post.type
        let newType = type

        let imgChanged = await serverFunctions.imagesChanged(post.images, images, false, oldR18)
        if (!imgChanged) imgChanged = await serverFunctions.imagesChanged(post.images, upscaledImages, true, oldR18)

        if (imgChanged) {
          if (!permissions.isMod(req.session)) return res.status(403).send("No permission to modify images")
          await serverFunctions.migrateNotes(post.images, images, oldR18)
        }

        let {vanillaBuffers, upscaledVanillaBuffers} = await deleteImages(post, {imgChanged, r18: oldR18})

        if (String(preserveChildren) !== "true") {
          await sql.post.deleteChild(postID)
          if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertChild(postID, parentID)
        }

        let {hasOriginal, hasUpscaled, imageFilenames, upscaledImageFilenames, imageOrders} = 
        await insertImages(postID, {images, upscaledImages, type, rating, source, characters, imgChanged})
        let {newSlug} = await updatePost(postID, {artists, type, rating, style, source, parentID, hasOriginal, hasUpscaled,
        updater: req.session.username, updatedDate})

        if (post.slug && post.slug !== newSlug) {
          await sql.report.insertRedirect(postID, post.slug)
        }

        let {addedTags, removedTags} = await insertTags(postID, {artists, characters, series, newTags, tags, noImageUpdate, 
        post, username: req.session.username})
        
        let {addedTagGroups, removedTagGroups} = await updateTagGroups(postID, {oldTagGroups: post.tagGroups, newTagGroups: tagGroups})

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(unverifiedID)
          if (unverifiedPost) await serverFunctions.deleteUnverifiedPost(unverifiedPost)
        }

        await serverFunctions.migratePost(post, oldType, newType, oldR18, newR18)

        if (permissions.isMod(req.session)) {
          if (silent) return res.status(200).send("Success")
        }

        await insertPostHistory(post, {artists, characters, series, tags, imgChanged, addedTags, removedTags, vanillaBuffers, 
        upscaledVanillaBuffers, images, upscaledImages, imageFilenames, upscaledImageFilenames, imageOrders, tagGroups,
        addedTagGroups, removedTagGroups, username: req.session.username, reason})

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/upload/unverified", csrfProtection, uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {images, upscaledImages, type, rating, style, parentID, source, artists, characters, series, 
        tags, tagGroups, newTags, duplicates} = req.body as UnverifiedUploadParams

        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")
        const pending = await sql.search.unverifiedUserPosts(req.session.username)
        if (functions.currentUploads(pending) >= permissions.getUploadLimit(req.session)) return res.status(403).send("Upload limit reached")

        artists = functions.cleanTags(artists, "artists")
        characters = functions.cleanTags(characters, "characters")
        series = functions.cleanTags(series, "series")
        newTags = functions.cleanTags(newTags, "newTags")
        tags = functions.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.invalidTags(characters, series, tags)
        if (invalidTags) {
          return res.status(400).send(invalidTags)
        }

        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const postID = await sql.post.insertUnverifiedPost()
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertUnverifiedChild(postID, parentID)

        let {hasOriginal, hasUpscaled} = await insertImages(postID, {unverified: true, images, upscaledImages, type, rating, source, characters, imgChanged: true})

        await updatePost(postID, {unverified: true, artists, newTags, type, rating, style,
        source, hasOriginal, hasUpscaled, duplicates, parentID, uploader: req.session.username,
        updater: req.session.username})

        await insertTags(postID, {unverified: true, tags, artists, characters, series, newTags, username: req.session.username})

        await updateTagGroups(postID, {unverified: true, oldTagGroups: [], newTagGroups: tagGroups})

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit/unverified", csrfProtection, editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, unverifiedID, images, upscaledImages, type, rating, style, parentID, source, artists, characters, series,
        tags, tagGroups, newTags, reason} = req.body as UnverifiedEditParams

        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (unverifiedID && Number.isNaN(unverifiedID)) return res.status(400).send("Bad unverifiedID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (req.session.banned) return res.status(403).send("You are banned")

        artists = functions.cleanTags(artists, "artists")
        characters = functions.cleanTags(characters, "characters")
        series = functions.cleanTags(series, "series")
        newTags = functions.cleanTags(newTags, "newTags")
        tags = functions.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.invalidTags(characters, series, tags)
        if (invalidTags) {
          return res.status(400).send(invalidTags)
        }

        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!validImages(images, skipMBCheck)) return res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!validImages(upscaledImages, skipMBCheck)) return res.status(400).send("Invalid upscaled images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return res.status(400).send("Invalid size")
        if (!functions.validType(type)) return res.status(400).send("Invalid type")
        if (!functions.validRating(rating)) return res.status(400).send("Invalid rating")
        if (!functions.validStyle(style)) return res.status(400).send("Invalid style")

        const originalPostID = postID
        postID = unverifiedID ? unverifiedID : await sql.post.insertUnverifiedPost()
        const unverifiedPost = await sql.post.unverifiedPost(postID)
        if (!unverifiedPost) return res.status(400).send("Bad unverifiedID")
        let oldR18 = functions.isR18(unverifiedPost.rating)
        let newR18 = functions.isR18(rating)

        let post = null as PostFull | null
        if (originalPostID) {
          post = await sql.post.post(originalPostID) as PostFull
          if (!post) return res.status(400).send("Bad postID")
        }

        let imgChanged = true
        if (unverifiedID) {
          if (unverifiedPost.uploader !== req.session.username && !permissions.isMod(req.session)) return res.status(403).send("Unauthorized")

          imgChanged = await serverFunctions.imagesChangedUnverified(unverifiedPost.images, images, false)
          if (!imgChanged) imgChanged = await serverFunctions.imagesChangedUnverified(unverifiedPost.images, upscaledImages, true)
          if (imgChanged) {
            await serverFunctions.migrateNotes(unverifiedPost.images, images, oldR18, true)

            for (let i = 0; i < unverifiedPost.images.length; i++) {
              await sql.post.deleteUnverifiedImage(unverifiedPost.images[i].imageID)
              await serverFunctions.deleteUnverifiedFile(functions.getImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].filename))
              await serverFunctions.deleteUnverifiedFile(functions.getUpscaledImagePath(unverifiedPost.images[i].type, unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].upscaledFilename || unverifiedPost.images[i].filename))
            }
          }
        }

        if (unverifiedID) await sql.post.deleteUnverifiedChild(postID)
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertUnverifiedChild(postID, parentID)

        let {hasOriginal, hasUpscaled} = await insertImages(postID, {unverified: true, images, upscaledImages, characters, imgChanged, rating, source, type})

        await updatePost(postID, {unverified: true, originalID: originalPostID, reason, hasUpscaled, hasOriginal, 
        artists, rating, source, type, style, updater: req.session.username, newTags, parentID})

        let {addedTags, removedTags} = await insertTags(postID, {unverified: true, post: unverifiedPost, tags,
        artists, characters, series, newTags, username: req.session.username})

        let {addedTagGroups, removedTagGroups} = await updateTagGroups(postID, {unverified: true, 
          oldTagGroups: unverifiedPost.tagGroups, newTagGroups: tagGroups})


        if (post && originalPostID) {
          const updated = await sql.post.unverifiedPost(postID) as UnverifiedPost
          const changes = functions.parsePostChanges(post, updated)
          
          await sql.post.bulkUpdateUnverifiedPost(postID, {
            uploader: post.uploader,
            uploadDate: post.uploadDate,
            addedTags,
            removedTags,
            addedTagGroups,
            removedTagGroups,
            imageChanged: imgChanged,
            changes
          })
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/approve", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, reason, noImageUpdate} = req.body as ApproveParams
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (!permissions.isMod(req.session)) return res.status(403).end()
        const unverified = await sql.post.unverifiedPost(postID)
        if (!unverified) return res.status(400).send("Bad request")

        const targetUser = await sql.user.user(unverified.uploader)
        if (targetUser) {
          const deletedPosts = functions.removeItem(targetUser.deletedPosts || [], postID)
          await sql.user.updateUser(targetUser.username, "deletedPosts", deletedPosts)
        }

        const newPostID = unverified.originalID ? unverified.originalID : await sql.post.insertPost()

        let post = unverified.originalID ? await sql.post.post(unverified.originalID) : null
        let oldR18 = post ? functions.isR18(post.rating) : functions.isR18(unverified.rating)
        let newR18 = functions.isR18(unverified.rating)
        let oldType = post ? post.type : unverified.type
        let newType = unverified.type

        let imgChanged = true
        if (post && unverified.originalID) {
          imgChanged = await serverFunctions.imagesChangedUnverified(post.images, unverified.images, false, true, oldR18)
          if (!imgChanged) imgChanged = await serverFunctions.imagesChangedUnverified(post.images, unverified.images, true, true, oldR18)
        }

        let vanillaBuffers = [] as Buffer[]
        let upscaledVanillaBuffers = [] as Buffer[]
        if (unverified.originalID) {
          if (!post) return res.status(400).send("Bad postID")
          const deletionResult = await deleteImages(post, {imgChanged, r18: oldR18})
          vanillaBuffers = deletionResult.vanillaBuffers
          upscaledVanillaBuffers = deletionResult.upscaledVanillaBuffers
        }

        if (unverified.parentID) {
          await sql.post.insertChild(newPostID, unverified.parentID)
        }

        let sourceData = {
          title: unverified.title,
          englishTitle: unverified.englishTitle,
          commentary: unverified.commentary,
          englishCommentary: unverified.englishCommentary,
          artist: unverified.artist,
          bookmarks: unverified.bookmarks,
          buyLink: unverified.buyLink,
          mirrors: unverified.mirrors ? Object.values(unverified.mirrors).join("\n") : "",
          posted: unverified.posted,
          source: unverified.source
        } as SourceData

        const {artists, characters, series, tags: allTags} = await serverFunctions.unverifiedTagCategories(unverified.tags)
        let newTags = allTags.filter((t) => unverified.newTags?.includes(t.tag))
        let tags = allTags.map((t) => t.tag)

        let type = unverified.type
        let rating = unverified.rating
        let style = unverified.style
        let {hasOriginal, hasUpscaled, imageOrders, imageFilenames, upscaledImageFilenames} = 
        await insertImages(newPostID, {unverifiedImages: true, images: unverified.images, 
        upscaledImages: unverified.images, type, rating, source: sourceData, characters, imgChanged})

        let {newSlug} = await updatePost(newPostID, {artists, type, rating, style, hasOriginal, hasUpscaled,
        source: sourceData, uploader: unverified.uploader, updater: unverified.updater, uploadDate: unverified.uploadDate,
        parentID: unverified.parentID, updatedDate: unverified.updatedDate, approver: req.session.username})

        if (post) {
          if (post.slug && post.slug !== newSlug) {
            await sql.report.insertRedirect(newPostID, post.slug)
          }
        }

        let {addedTags, removedTags} = await insertTags(newPostID, {post, tags, artists, characters, series, newTags, username: unverified.uploader, noImageUpdate})

        let {addedTagGroups, removedTagGroups} = await updateTagGroups(newPostID, {oldTagGroups: [], newTagGroups: unverified.tagGroups})

        // Approve notes
        for (let i = 0; i < unverified.images.length; i++) {
          const order = unverified.images[i].order
          const unverifiedNotes = await sql.note.unverifiedNotes(unverified.postID, order)
          for (const item of unverifiedNotes) {
              await sql.note.insertNote(newPostID, unverified.uploader, order, item.transcript, item.translation,
              item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, item.overlay,
              item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, item.bold, item.italic,
              item.strokeColor, item.strokeWidth, item.breakWord, item.rotation, item.borderRadius, item.character, item.characterTag || null)
              await sql.note.deleteUnverifiedNote(item.noteID)
          }
        }

        const unverifiedPost = await sql.post.unverifiedPost(postID)
        if (unverifiedPost) await serverFunctions.deleteUnverifiedPost(unverifiedPost)

        if (post) {
          await serverFunctions.migratePost(post, oldType, newType, oldR18, newR18)
        }

        if (post && unverified.originalID) {
          await insertPostHistory(post, {artists, characters, series, tags, imgChanged, addedTags, removedTags, vanillaBuffers, 
          upscaledVanillaBuffers, images: unverified.images, upscaledImages: unverified.images, imageFilenames, upscaledImageFilenames, 
          imageOrders, unverifiedImages: true, tagGroups: post.tagGroups, addedTagGroups, removedTagGroups, username: req.session.username, reason})
        }

        let subject = "Notice: Post has been approved"
        let message = `${functions.getDomain()}/post/${newPostID} has been approved. Thanks for the submission!`
        if (unverified.originalID) {
          subject = "Notice: Post edit request has been approved"
          message = `Post edit request on ${functions.getDomain()}/post/${newPostID} has been approved. Thanks for the contribution!`
        }
        await serverFunctions.systemMessage(unverified.uploader, subject, message)
        
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/reject", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let postID = req.body.postID as string
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!permissions.isMod(req.session)) return res.status(403).end()
        const unverified = await sql.post.unverifiedPost(postID)
        if (!unverified) return res.status(400).send("Bad postID")

        const targetUser = await sql.user.user(unverified.uploader)
        if (targetUser) {
          const deletedPosts = functions.removeDuplicates([postID, ...(targetUser.deletedPosts || [])].filter(Boolean))
          await sql.user.updateUser(targetUser.username, "deletedPosts", deletedPosts)
        }

        if (unverified.deleted) {
          await serverFunctions.deleteUnverifiedPost(unverified)
          return res.status(200).send("Success")
        }

        if (unverified.appealed) {
          if (unverified.uploader !== unverified.appealer) {
            await sql.post.updateUnverifiedPost(unverified.postID, "appealed", false)
          }
        }
        
        let deletionDate = new Date()
        deletionDate.setDate(deletionDate.getDate() + 30)
        await sql.post.updateUnverifiedPost(unverified.postID, "deleted", true)
        await sql.post.updateUnverifiedPost(unverified.postID, "deletionDate", deletionDate.toISOString())

        let subject = "Notice: Post has been rejected"
        let rejectionText = "A post you submitted has been rejected."
        if (unverified.title) rejectionText = `Post ${unverified.title} ${unverified.source ? `(${unverified.source}) ` : ""}has been rejected.`
        let message = `${rejectionText}\n\nThe most common rejection reason is that the post is not "moe" enough. If you would like to upload something other than cute anime girls, a different imageboard would be better suited!`

        if (unverified.originalID) {
          subject = "Notice: Post edit request has been rejected"
          message = `Post edit request on ${functions.getDomain()}/post/${unverified.originalID} has been rejected.\n\nMake sure you go over the submission guidelines on ${functions.getDomain()}/help#uploading`
          // Delete post edits immediately
          await serverFunctions.deleteUnverifiedPost(unverified)
        }

        // await serverFunctions.systemMessage(unverified.uploader, subject, message)
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/split", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, order} = req.body as {postID: string, order: number | null}
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!permissions.isAdmin(req.session)) return res.status(403).end()
        const post = await sql.post.post(postID)
        if (!post) return res.status(400).send("Bad postID")

        for (let i = 0; i < post.images.length; i++) {
          if (i === 0) {
            // Always keep the first image
            continue
          } else {
            let image = post.images[i]
            if (order) {
              if (image.order !== Number(order)) continue
            }
            let images = [image]
            let upscaledImages = [image]
            let type = image.type
            let rating = post.rating
            let style = post.style
            let parentID = post.postID
            let r18 = functions.isR18(post.rating)
            let source = {
              title: post.title,
              englishTitle: post.englishTitle,
              commentary: post.commentary,
              englishCommentary: post.englishCommentary,
              artist: post.artist,
              bookmarks: post.bookmarks,
              buyLink: post.buyLink,
              mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : "",
              posted: post.posted,
              source: post.source
            } as SourceData
            let {artists, characters, series, tags: allTags} = await serverFunctions.tagCategories(post.tags)
            let tags = allTags.map((t) => t.tag)

            const newPostID = await sql.post.insertPost()
            await sql.post.insertChild(newPostID, parentID)

            const {hasOriginal, hasUpscaled} = await insertImages(newPostID, {images, upscaledImages, type, rating, source, characters, imgChanged: true})
            await updatePost(newPostID, {artists, type, rating, style, source, parentID, hasOriginal, hasUpscaled, uploader: req.session.username,
            updater: req.session.username, approver: req.session.username})
            await insertTags(newPostID, {artists, characters, series, newTags: [], tags, noImageUpdate: true, username: req.session.username})
            await updateTagGroups(newPostID, {oldTagGroups: [], newTagGroups: post.tagGroups})
            await sql.cuteness.updateCuteness(newPostID, req.session.username, 500)

            const imagePath = functions.getImagePath(image.type, post.postID, image.order, image.filename)
            const upscaledImagePath = functions.getUpscaledImagePath(image.type, post.postID, image.order, image.upscaledFilename || image.filename)
            await sql.post.deleteImage(image.imageID)
            await serverFunctions.deleteFile(imagePath, r18)
            await serverFunctions.deleteFile(upscaledImagePath, r18)
          }
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/join", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, nested} = req.body as {postID: string, nested: boolean}
        if (!req.session.username) return res.status(403).send("Unauthorized")
        if (Number.isNaN(postID)) return res.status(400).send("Bad postID")
        if (!permissions.isAdmin(req.session)) return res.status(403).end()
        const post = await sql.post.post(postID)
        if (!post) return res.status(400).send("Bad postID")

        const childPosts = await sql.post.childPosts(postID)

        let maxOrder = Math.max(...post.images.map((image) => image.order))
        let r18 = functions.isR18(post.rating)

        const joinChildPosts = async (childPosts: ChildPost[]) => {
          for (const child of childPosts) {
            if (nested) {
              const nestedChildren = await sql.post.childPosts(child.postID)
              if (nestedChildren.length) await joinChildPosts(nestedChildren)
            }
            for (const image of child.post.images) {
              let order = ++maxOrder
              const imagePath = functions.getImagePath(image.type, image.postID, image.order, image.filename)
              const buffer = await serverFunctions.getFile(imagePath, false, r18, image.pixelHash)
              const upscaledImagePath = functions.getUpscaledImagePath(image.type, image.postID, image.order, image.upscaledFilename || image.filename)
              const upscaledBuffer = await serverFunctions.getFile(upscaledImagePath, false, r18, image.pixelHash)

              if (buffer.byteLength) {
                let imagePath = functions.getImagePath(image.type, postID, order, image.filename)
                await serverFunctions.uploadFile(imagePath, buffer, r18)
              }

              if (upscaledBuffer.byteLength) {
                let imagePath = functions.getUpscaledImagePath(image.type, postID, order, image.upscaledFilename || image.filename)
                await serverFunctions.uploadFile(imagePath, upscaledBuffer, r18)
              }

              await sql.post.insertImage(postID, image.filename, image.upscaledFilename, image.type, order, image.hash, image.pixelHash, 
              image.width, image.height, image.upscaledWidth, image.upscaledHeight, image.size, image.upscaledSize, image.duration, 
              image.thumbnail)
            }
            await serverFunctions.deletePost(child.post)
          }
        }

        await joinChildPosts(childPosts)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })
}

export default CreateRoutes