import {Express, NextFunction, Request, Response} from "express"
import sql from "../sql/SQLQuery"
import functions from "../functions/Functions"
import permissions from "../structures/Permissions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../server functions/ServerFunctions"
import rateLimit from "express-rate-limit"
import {UploadParams, EditParams, UnverifiedUploadParams, UnverifiedEditParams, 
PostFull, UnverifiedPost, ApproveParams, SourceData, ChildPost} from "../types/Types"
import {addToGroup} from "./GroupRoutes"

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

const CreateRoutes = (app: Express) => {
    app.post("/api/post/upload", csrfProtection, uploadLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {images, upscaledImages, type, rating, style, parentID, groupName, source, artists, characters, series,
        tags, tagGroups, newTags, unverifiedID, noImageUpdate, sourceLinks} = req.body as UploadParams

        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (!permissions.isCurator(req.session)) return void res.status(403).send("Unauthorized")
        if (req.session.banned) return void res.status(403).send("You are banned")
        if (!functions.validation.validType(type)) return void res.status(400).send("Invalid type")
        if (!functions.validation.validRating(rating)) return void res.status(400).send("Invalid rating")
        if (!functions.validation.validStyle(style)) return void res.status(400).send("Invalid style")

        artists = functions.tag.cleanTags(artists, "artists")
        characters = functions.tag.cleanTags(characters, "characters")
        series = functions.tag.cleanTags(series, "series")
        newTags = functions.tag.cleanTags(newTags, "newTags")
        tags = functions.tag.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.tag.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.validation.invalidTags(characters, series, tags)
        if (invalidTags) return void res.status(400).send(invalidTags)
        
        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!await serverFunctions.upload.validImages(images, skipMBCheck)) return void res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!await serverFunctions.upload.validImages(upscaledImages, skipMBCheck)) return void res.status(400).send("Invalid images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return void res.status(400).send("Invalid size")

        // Special handling for bulk uploading. Dynamically get the correct parentID from 
        // the pixivID since it wouldn't be uploaded at the time of making the request object.
        if (parentID?.includes("pixiv")) {
          parentID = await serverFunctions.posts.postIDFromPixivID(parentID)
        }

        const postID = await sql.post.insertPost()
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertChild(postID, parentID)

        const {hasOriginal, hasUpscaled} = await serverFunctions.upload.insertImages(postID, {images, upscaledImages, type, rating, source, 
          characters, imgChanged: true, sourceLinks})
        await serverFunctions.upload.updatePost(postID, {artists, type, rating, style, source, parentID, hasOriginal, hasUpscaled, 
          uploader: req.session.username, updater: req.session.username, approver: req.session.username})

        let {addedTags, removedTags} = await serverFunctions.upload.insertTags(postID, {artists, characters, series, newTags, 
          tags, noImageUpdate, username: req.session.username})
        await sql.cuteness.updateCuteness(postID, req.session.username, 500)

        await serverFunctions.upload.updateTagGroups(postID, {oldTagGroups: [], newTagGroups: tagGroups})

        if (groupName) {
          const post = await sql.post.post(postID)
          await addToGroup(post!, groupName, req.session.username, new Date().toISOString())
        }

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(unverifiedID)
          if (unverifiedPost) await serverFunctions.posts.deleteUnverifiedPost(unverifiedPost)
        }
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit", csrfProtection, editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, images, upscaledImages, type, rating, style, parentID, groupName, source, 
          artists, characters, series, tags, tagGroups, imageSources, imageLinks, newTags, unverifiedID, 
          reason, noImageUpdate, preserveChildren, updatedDate, silent} = req.body as EditParams

        if (Number.isNaN(postID)) return void res.status(400).send("Bad postID")
        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (!permissions.isContributor(req.session)) return void res.status(403).send("Unauthorized")
        if (req.session.banned) return void res.status(403).send("You are banned")
        if (!permissions.isMod(req.session)) noImageUpdate = true

        artists = functions.tag.cleanTags(artists, "artists")
        characters = functions.tag.cleanTags(characters, "characters")
        series = functions.tag.cleanTags(series, "series")
        newTags = functions.tag.cleanTags(newTags, "newTags")
        tags = functions.tag.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.tag.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.validation.invalidTags(characters, series, tags)
        if (invalidTags) return void res.status(400).send(invalidTags)

        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!await serverFunctions.upload.validImages(images, skipMBCheck)) return void res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!await serverFunctions.upload.validImages(upscaledImages, skipMBCheck)) return void res.status(400).send("Invalid images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return void res.status(400).send("Invalid size")
        if (!functions.validation.validType(type)) return void res.status(400).send("Invalid type")
        if (!functions.validation.validRating(rating)) return void res.status(400).send("Invalid rating")
        if (!functions.validation.validStyle(style)) return void res.status(400).send("Invalid style")

        const post = await sql.post.post(postID)
        if (!post) return void res.status(400).send("Bad request")
        if (post.locked && !permissions.isMod(req.session)) return void res.status(403).send("Unauthorized")
        let oldR18 = functions.post.isR18(post.rating)
        let newR18 = functions.post.isR18(rating)
        let oldType = post.type
        let newType = type

        let imgChanged = await serverFunctions.posts.imagesChanged(post.images, images, false, oldR18)
        if (!imgChanged) imgChanged = await serverFunctions.posts.imagesChanged(post.images, upscaledImages, true, oldR18)

        let imageOrderHashes = serverFunctions.posts.imageOrderHashes(post)

        if (imgChanged) {
          if (!permissions.isMod(req.session)) return void res.status(403).send("No permission to modify images")
          await serverFunctions.posts.migrateNotes(post.images, images, oldR18)
        }

        let {vanillaBuffers, upscaledVanillaBuffers} = await serverFunctions.upload.deleteImages(post, {imgChanged, r18: oldR18})

        if (String(preserveChildren) !== "true") {
          await sql.post.deleteChild(postID)
          if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertChild(postID, parentID)
        }

        let {hasOriginal, hasUpscaled, imageFilenames, upscaledImageFilenames, imageOrders} = 
        await serverFunctions.upload.insertImages(postID, {images, upscaledImages, type, rating, source, characters, imgChanged})
        let {newSlug} = await serverFunctions.upload.updatePost(postID, {artists, type, rating, style, source, parentID, hasOriginal, hasUpscaled,
        updater: req.session.username, updatedDate})

        if (post.slug && post.slug !== newSlug) {
          try {
            await sql.report.insertRedirect(postID, post.slug)
          } catch {}
        }

        let {addedTags, removedTags} = await serverFunctions.upload.insertTags(postID, {artists, characters, series, newTags, tags, noImageUpdate, 
        post, username: req.session.username})
        
        let {addedTagGroups, removedTagGroups} = await serverFunctions.upload.updateTagGroups(postID, {oldTagGroups: post.tagGroups, 
          newTagGroups: tagGroups})

        if (groupName) {
          const post = await sql.post.post(postID) as PostFull
          await addToGroup(post, groupName, req.session.username, new Date().toISOString())
        }

        if (imageSources !== undefined) {
          await serverFunctions.posts.applyImageSources(postID, imageSources, false, imageOrderHashes)
        }

        if (imageLinks !== undefined) {
          await serverFunctions.posts.applyImageLinks(postID, imageLinks, false, imageOrderHashes)
        }

        if (unverifiedID) {
          const unverifiedPost = await sql.post.unverifiedPost(unverifiedID)
          if (unverifiedPost) await serverFunctions.posts.deleteUnverifiedPost(unverifiedPost)
        }

        await serverFunctions.posts.migratePost(post.postID, oldType, newType, oldR18, newR18)

        if (permissions.isMod(req.session)) {
          if (silent) return void res.status(200).send("Success")
        }

        await serverFunctions.upload.insertPostHistory(post, {artists, characters, series, tags, imgChanged, addedTags, removedTags, vanillaBuffers, 
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
        let {images, upscaledImages, type, rating, style, parentID, groupName, source, artists, characters, series, 
        tags, tagGroups, newTags, duplicates, sourceLinks} = req.body as UnverifiedUploadParams

        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (req.session.banned) return void res.status(403).send("You are banned")
        const pending = await sql.search.unverifiedUserPosts(req.session.username)
        if (functions.post.currentUploads(pending) >= permissions.getUploadLimit(req.session)) return void res.status(403).send("Upload limit reached")

        artists = functions.tag.cleanTags(artists, "artists")
        characters = functions.tag.cleanTags(characters, "characters")
        series = functions.tag.cleanTags(series, "series")
        newTags = functions.tag.cleanTags(newTags, "newTags")
        tags = functions.tag.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.tag.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.validation.invalidTags(characters, series, tags)
        if (invalidTags) {
          return void res.status(400).send(invalidTags)
        }

        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!await serverFunctions.upload.validImages(images, skipMBCheck)) return void res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!await serverFunctions.upload.validImages(upscaledImages, skipMBCheck)) return void res.status(400).send("Invalid images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return void res.status(400).send("Invalid size")
        if (!functions.validation.validType(type)) return void res.status(400).send("Invalid type")
        if (!functions.validation.validRating(rating)) return void res.status(400).send("Invalid rating")
        if (!functions.validation.validStyle(style)) return void res.status(400).send("Invalid style")

        const postID = await sql.post.insertUnverifiedPost()
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertUnverifiedChild(postID, parentID)

        let {hasOriginal, hasUpscaled} = await serverFunctions.upload.insertImages(postID, {unverified: true, images, upscaledImages, 
          type, rating, source, characters, imgChanged: true, sourceLinks})

        await serverFunctions.upload.updatePost(postID, {unverified: true, artists, newTags, type, rating, style,
        source, hasOriginal, hasUpscaled, duplicates, parentID, uploader: req.session.username,
        updater: req.session.username})

        await serverFunctions.upload.insertTags(postID, {unverified: true, tags, artists, characters, series, newTags, username: req.session.username})

        await serverFunctions.upload.updateTagGroups(postID, {unverified: true, oldTagGroups: [], newTagGroups: tagGroups})

        if (groupName) {
          const post = await sql.post.post(postID)
          await addToGroup(post!, groupName, req.session.username, new Date().toISOString())
        }

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.put("/api/post/edit/unverified", csrfProtection, editLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID, unverifiedID, images, upscaledImages, type, rating, style, parentID, groupName, 
          source, artists, characters, series, tags, tagGroups, newTags, reason} = req.body as UnverifiedEditParams

        if (Number.isNaN(postID)) return void res.status(400).send("Bad postID")
        if (unverifiedID && Number.isNaN(unverifiedID)) return void res.status(400).send("Bad unverifiedID")
        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (req.session.banned) return void res.status(403).send("You are banned")

        artists = functions.tag.cleanTags(artists, "artists")
        characters = functions.tag.cleanTags(characters, "characters")
        series = functions.tag.cleanTags(series, "series")
        newTags = functions.tag.cleanTags(newTags, "newTags")
        tags = functions.tag.cleanStringTags(tags, "tags")

        for (let i = 0; i < (tagGroups?.length || 0); i++) {
          if (tagGroups?.[i]) {
              tagGroups[i].tags = functions.tag.cleanStringTags(tagGroups[i].tags, "tags")
          }
        }

        const invalidTags = functions.validation.invalidTags(characters, series, tags)
        if (invalidTags) {
          return void res.status(400).send(invalidTags)
        }

        let skipMBCheck = permissions.isMod(req.session) ? true : false
        if (!await serverFunctions.upload.validImages(images, skipMBCheck)) return void res.status(400).send("Invalid images")
        if (upscaledImages?.length) if (!await serverFunctions.upload.validImages(upscaledImages, skipMBCheck)) return void res.status(400).send("Invalid images")
        const originalMB = images.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const upscaledMB = upscaledImages.reduce((acc, obj) => acc + obj.size, 0) / (1024*1024)
        const totalMB = originalMB + upscaledMB
        if (!skipMBCheck && totalMB > 300) return void res.status(400).send("Invalid size")
        if (!functions.validation.validType(type)) return void res.status(400).send("Invalid type")
        if (!functions.validation.validRating(rating)) return void res.status(400).send("Invalid rating")
        if (!functions.validation.validStyle(style)) return void res.status(400).send("Invalid style")

        const originalPostID = postID
        postID = unverifiedID ? unverifiedID : await sql.post.insertUnverifiedPost()
        const unverifiedPost = await sql.post.unverifiedPost(postID)
        if (!unverifiedPost) return void res.status(400).send("Bad unverifiedID")
        let oldR18 = functions.post.isR18(unverifiedPost.rating)
        let newR18 = functions.post.isR18(rating)

        let post = null as PostFull | null
        if (originalPostID) {
          post = await sql.post.post(originalPostID) as PostFull
          if (!post) return void res.status(400).send("Bad postID")
        }

        let imgChanged = true
        if (unverifiedID) {
          if (unverifiedPost.uploader !== req.session.username && !permissions.isMod(req.session)) return void res.status(403).send("Unauthorized")

          imgChanged = await serverFunctions.posts.imagesChangedUnverified(unverifiedPost.images, images, false)
          if (!imgChanged) imgChanged = await serverFunctions.posts.imagesChangedUnverified(unverifiedPost.images, upscaledImages, true)
          if (imgChanged) {
            await serverFunctions.posts.migrateNotes(unverifiedPost.images, images, oldR18, true)

            for (let i = 0; i < unverifiedPost.images.length; i++) {
              await sql.post.deleteUnverifiedImage(unverifiedPost.images[i].imageID)
              await serverFunctions.files.deleteUnverifiedFile(functions.link.getImagePath(unverifiedPost.images[i].type, 
                unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].filename))
              await serverFunctions.files.deleteUnverifiedFile(functions.link.getUpscaledImagePath(unverifiedPost.images[i].type, 
                unverifiedID, unverifiedPost.images[i].order, unverifiedPost.images[i].upscaledFilename || 
                unverifiedPost.images[i].filename))
            }
          }
        }

        if (unverifiedID) await sql.post.deleteUnverifiedChild(postID)
        if (parentID && !Number.isNaN(Number(parentID))) await sql.post.insertUnverifiedChild(postID, parentID)

        let {hasOriginal, hasUpscaled} = await serverFunctions.upload.insertImages(postID, {unverified: true, images, upscaledImages, characters, 
          imgChanged, rating, source, type})

        await serverFunctions.upload.updatePost(postID, {unverified: true, originalID: originalPostID, reason, hasUpscaled, hasOriginal, 
        artists, rating, source, type, style, updater: req.session.username, newTags, parentID})

        let {addedTags, removedTags} = await serverFunctions.upload.insertTags(postID, {unverified: true, post: unverifiedPost, tags,
        artists, characters, series, newTags, username: req.session.username})

        let {addedTagGroups, removedTagGroups} = await serverFunctions.upload.updateTagGroups(postID, {unverified: true, 
          oldTagGroups: unverifiedPost.tagGroups, newTagGroups: tagGroups})

        if (groupName) {
          const post = await sql.post.post(postID)
          await addToGroup(post!, groupName, req.session.username, new Date().toISOString())
        }

        if (post && originalPostID) {
          const updated = await sql.post.unverifiedPost(postID) as UnverifiedPost
          const changes = functions.compare.parsePostChanges(post, updated)
          
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
        if (Number.isNaN(postID)) return void res.status(400).send("Bad postID")
        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (!permissions.isMod(req.session)) return void res.status(403).end()
        const unverified = await sql.post.unverifiedPost(postID)
        if (!unverified) return void res.status(400).send("Bad request")

        let updater = unverified.originalID ? unverified.updater : unverified.uploader
        const targetUser = await sql.user.user(updater)
        if (targetUser) {
          const deletedPosts = functions.util.removeItem(targetUser.deletedPosts || [], postID)
          await sql.user.updateUser(targetUser.username, "deletedPosts", deletedPosts)
        }

        const newPostID = unverified.originalID ? unverified.originalID : await sql.post.insertPost()

        let post = unverified.originalID ? await sql.post.post(unverified.originalID) : null
        let oldR18 = post ? functions.post.isR18(post.rating) : functions.post.isR18(unverified.rating)
        let newR18 = functions.post.isR18(unverified.rating)
        let oldType = post ? post.type : unverified.type
        let newType = unverified.type

        let imgChanged = true
        if (post && unverified.originalID) {
          imgChanged = await serverFunctions.posts.imagesChangedUnverified(post.images, unverified.images, false, true, oldR18)
          if (!imgChanged) imgChanged = await serverFunctions.posts.imagesChangedUnverified(post.images, 
            unverified.images, true, true, oldR18)
        }

        let vanillaBuffers = [] as Buffer[]
        let upscaledVanillaBuffers = [] as Buffer[]
        if (unverified.originalID) {
          if (!post) return void res.status(400).send("Bad postID")
          const deletionResult = await serverFunctions.upload.deleteImages(post, {imgChanged, r18: oldR18})
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
          pixivTags: unverified.pixivTags,
          userProfile: unverified.userProfile,
          drawingTools: unverified.drawingTools,
          sourceImageCount: unverified.sourceImageCount,
          mirrors: unverified.mirrors ? Object.values(unverified.mirrors).join("\n") : "",
          posted: unverified.posted,
          source: unverified.source
        } as SourceData

        const {artists, characters, series, tags: allTags} = await serverFunctions.tags.unverifiedTagCategories(unverified.tags)
        let newTags = allTags.filter((t) => unverified.newTags?.includes?.(t.tag))
        let tags = allTags.map((t) => t.tag)

        let type = unverified.type
        let rating = unverified.rating
        let style = unverified.style
        let {hasOriginal, hasUpscaled, imageOrders, imageFilenames, upscaledImageFilenames} = 
        await serverFunctions.upload.insertImages(newPostID, {unverifiedImages: true, images: unverified.images, 
        upscaledImages: unverified.images, type, rating, source: sourceData, characters, imgChanged})

        let {newSlug} = await serverFunctions.upload.updatePost(newPostID, {artists, type, rating, style, hasOriginal, hasUpscaled,
        source: sourceData, uploader: unverified.uploader, updater: unverified.updater, uploadDate: unverified.uploadDate,
        parentID: unverified.parentID, updatedDate: unverified.updatedDate, approver: req.session.username})

        if (post && post.slug && post.slug !== newSlug) {
          try {
            await sql.report.insertRedirect(newPostID, post.slug)
          } catch {}
        }

        let {addedTags, removedTags} = await serverFunctions.upload.insertTags(newPostID, {post, tags, artists, characters, series, 
          newTags, username: updater, noImageUpdate})
        let {addedTagGroups, removedTagGroups} = await serverFunctions.upload.updateTagGroups(newPostID, {oldTagGroups: [], 
          newTagGroups: unverified.tagGroups})

        // Approve image sources/links
        let imageSources = functions.post.imageSourceMap(unverified)
        await serverFunctions.posts.applyImageSources(newPostID, imageSources)
        let imageLinks = functions.post.imageLinkMap(unverified)
        await serverFunctions.posts.applyImageLinks(newPostID, imageLinks)

        // Approve notes
        for (let i = 0; i < unverified.images.length; i++) {
          const order = unverified.images[i].order
          const unverifiedNotes = await sql.note.unverifiedNotes(unverified.postID, order)
          for (const item of unverifiedNotes) {
              await sql.note.insertNote(newPostID, updater, order, item.transcript, item.translation,
              item.x, item.y, item.width, item.height, item.imageWidth, item.imageHeight, item.imageHash, 
              item.overlay, item.fontSize, item.backgroundColor, item.textColor, item.fontFamily, item.backgroundAlpha, 
              item.bold, item.italic, item.strokeColor, item.strokeWidth, item.breakWord, item.rotation, item.borderRadius, 
              item.character, item.characterTag || null)
              await sql.note.deleteUnverifiedNote(item.noteID)
          }
        }

        const unverifiedPost = await sql.post.unverifiedPost(postID)
        if (unverifiedPost) await serverFunctions.posts.deleteUnverifiedPost(unverifiedPost)

        if (post) {
          await serverFunctions.posts.migratePost(post.postID, oldType, newType, oldR18, newR18)
        }

        if (post && unverified.originalID) {
          await serverFunctions.upload.insertPostHistory(post, {artists, characters, series, tags, imgChanged, addedTags, 
          removedTags, vanillaBuffers, upscaledVanillaBuffers, images: unverified.images, upscaledImages: unverified.images, 
          imageFilenames, upscaledImageFilenames, imageOrders, unverifiedImages: true, tagGroups: post.tagGroups, 
          addedTagGroups, removedTagGroups, username: updater, reason})
        }

        let subject = "Notice: Post has been approved"
        let message = `${functions.config.getDomain()}/post/${newPostID} has been approved. Thanks for the submission!`
        if (unverified.originalID) {
          subject = "Notice: Post edit request has been approved"
          message = `Post edit request on ${functions.config.getDomain()}/post/${newPostID} has been approved. Thanks for the contribution!`
        }
        await serverFunctions.systemMessage(updater, subject, message)
        
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/reject", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let postID = req.body.postID as string
        if (Number.isNaN(postID)) return void res.status(400).send("Bad postID")
        if (!permissions.isMod(req.session)) return void res.status(403).end()
        const unverified = await sql.post.unverifiedPost(postID)
        if (!unverified) return void res.status(400).send("Bad postID")

        const targetUser = await sql.user.user(unverified.uploader)
        if (targetUser) {
          const deletedPosts = functions.util.removeDuplicates([postID, ...(targetUser.deletedPosts || [])].filter(Boolean))
          await sql.user.updateUser(targetUser.username, "deletedPosts", deletedPosts)
        }

        if (unverified.deleted) {
          await serverFunctions.posts.deleteUnverifiedPost(unverified)
          return void res.status(200).send("Success")
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
          message = `Post edit request on ${functions.config.getDomain()}/post/${unverified.originalID} has been rejected.\n\nMake sure you go over the submission guidelines on ${functions.config.getDomain()}/help#uploading`
          // Delete post edits immediately
          await serverFunctions.posts.deleteUnverifiedPost(unverified)
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
        let {postID, order, mergeSubsequent} = req.body as {postID: string, order: number | null, mergeSubsequent?: boolean}
        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (Number.isNaN(postID)) return void res.status(400).send("Bad postID")
        if (!permissions.isAdmin(req.session)) return void res.status(403).end()
        const post = await sql.post.post(postID)
        if (!post) return void res.status(400).send("Bad postID")

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
            if (mergeSubsequent) {
              images = post.images.slice(i)
              upscaledImages = post.images.slice(i)
            }
            let type = image.type
            let rating = post.rating
            let style = post.style
            let parentID = post.postID
            let r18 = functions.post.isR18(post.rating)
            let source = {
              title: post.title,
              englishTitle: post.englishTitle,
              commentary: post.commentary,
              englishCommentary: post.englishCommentary,
              artist: post.artist,
              bookmarks: post.bookmarks,
              buyLink: post.buyLink,
              pixivTags: post.pixivTags,
              userProfile: post.userProfile,
              drawingTools: post.drawingTools,
              sourceImageCount: post.sourceImageCount,
              mirrors: post.mirrors ? Object.values(post.mirrors).join("\n") : "",
              posted: post.posted,
              source: post.source
            } as SourceData
            let {artists, characters, series, tags: allTags} = await serverFunctions.tags.tagCategories(post.tags)
            let tags = allTags.map((t) => t.tag)

            const newPostID = await sql.post.insertPost()
            await sql.post.insertChild(newPostID, parentID)

            const {hasOriginal, hasUpscaled} = await serverFunctions.upload.insertImages(newPostID, {images, upscaledImages, type, rating, source, 
              characters, imgChanged: true})
            await serverFunctions.upload.updatePost(newPostID, {artists, type, rating, style, source, parentID, hasOriginal, hasUpscaled, 
              uploader: req.session.username,
            updater: req.session.username, approver: req.session.username})
            await serverFunctions.upload.insertTags(newPostID, {artists, characters, series, newTags: [], tags, 
              noImageUpdate: true, username: req.session.username})
            await serverFunctions.upload.updateTagGroups(newPostID, {oldTagGroups: [], newTagGroups: post.tagGroups})
            await sql.cuteness.updateCuteness(newPostID, req.session.username, 500)

            for (const image of images) {
              const imagePath = functions.link.getImagePath(image.type, post.postID, image.order, image.filename)
              const upscaledImagePath = functions.link.getUpscaledImagePath(image.type, post.postID, 
                image.order, image.upscaledFilename || image.filename)
              await sql.post.deleteImage(image.imageID)
              await serverFunctions.files.deleteFile(imagePath, r18)
              await serverFunctions.files.deleteFile(upscaledImagePath, r18)
            }
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
        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (Number.isNaN(postID)) return void res.status(400).send("Bad postID")
        if (!permissions.isAdmin(req.session)) return void res.status(403).end()
        const post = await sql.post.post(postID)
        if (!post) return void res.status(400).send("Bad postID")

        const childPosts = await sql.post.childPosts(postID)

        let maxOrder = Math.max(...post.images.map((image) => image.order))
        let r18 = functions.post.isR18(post.rating)

        const joinChildPosts = async (childPosts: ChildPost[]) => {
          for (const child of childPosts) {
            if (nested) {
              const nestedChildren = await sql.post.childPosts(child.postID)
              if (nestedChildren.length) await joinChildPosts(nestedChildren)
            }
            for (const image of child.post.images) {
              let order = ++maxOrder
              const imagePath = functions.link.getImagePath(image.type, image.postID, image.order, image.filename)
              const buffer = await serverFunctions.files.getFile(imagePath, false, r18, image.pixelHash)
              const upscaledImagePath = functions.link.getUpscaledImagePath(image.type, image.postID, image.order, 
                image.upscaledFilename || image.filename)
              const upscaledBuffer = await serverFunctions.files.getFile(upscaledImagePath, false, r18, image.pixelHash)

              if (buffer.byteLength) {
                let imagePath = functions.link.getImagePath(image.type, postID, order, image.filename)
                await serverFunctions.files.uploadFile(imagePath, buffer, r18)
              }

              if (upscaledBuffer.byteLength) {
                let imagePath = functions.link.getUpscaledImagePath(image.type, postID, order, image.upscaledFilename || image.filename)
                await serverFunctions.files.uploadFile(imagePath, upscaledBuffer, r18)
              }

              await sql.post.insertImage(postID, image.filename, image.upscaledFilename, image.type, order, image.hash, image.pixelHash, 
              image.width, image.height, image.upscaledWidth, image.upscaledHeight, image.size, image.upscaledSize, image.duration, 
              image.thumbnail, image.directLink, image.altSource)
            }
            await serverFunctions.posts.deletePost(child.post)
          }
        }

        await joinChildPosts(childPosts)

        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })

    app.post("/api/post/flip", csrfProtection, modLimiter, async (req: Request, res: Response, next: NextFunction) => {
      try {
        let {postID} = req.body as {postID: string}
        if (!req.session.username || !req.session.emailVerified) return void res.status(403).send("Unauthorized")
        if (Number.isNaN(postID)) return void res.status(400).send("Bad postID")
        if (!permissions.isAdmin(req.session)) return void res.status(403).end()
        const post = await sql.post.post(postID)
        if (!post) return void res.status(400).send("Bad postID")
        
        if (!post.parentID) return void res.status(400).send("This is not a child post")

        const childPosts = await sql.post.childPosts(post.parentID)
        for (const childPost of childPosts) {
          await sql.post.deleteChild(childPost.postID)
        }

        await sql.post.updatePost(postID, "parentID", null)
        await sql.post.insertChild(post.parentID, postID)
        await sql.post.updatePost(post.parentID, "parentID", postID)
        for (const childPost of childPosts) {
          if (childPost.postID !== postID) {
            await sql.post.insertChild(childPost.postID, postID)
            await sql.post.updatePost(childPost.postID, "parentID", postID)
          }
        }
        
        res.status(200).send("Success")
      } catch (e) {
        console.log(e)
        res.status(400).send("Bad request")
      }
    })
}

export default CreateRoutes