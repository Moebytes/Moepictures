/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import sql from "../sql/SQLQuery"
import {Request} from "express"
import functions from "../functions/Functions"
import serverFunctions from "./ServerFunctions"
import {User} from "../types/Types"

export default class ServerUsers {
    public static login = async (req: Request, user: User, ip: string) => {
        req.session.$2fa = user.$2fa
        req.session.email = user.email
        req.session.emailVerified = user.emailVerified
        req.session.accountToken = user.accountToken
        req.session.cookieConsent = user.cookieConsent
        req.session.username = user.username
        req.session.joinDate = user.joinDate
        req.session.image = user.image
        req.session.imageHash = user.imageHash
        req.session.imagePost = user.imagePost
        req.session.bio = user.bio
        req.session.publicFavorites = user.publicFavorites
        req.session.publicTagFavorites = user.publicTagFavorites
        req.session.role = user.role
        req.session.banned = user.banned
        req.session.showRelated = user.showRelated
        req.session.showTooltips = user.showTooltips
        req.session.showTagTooltips = user.showTagTooltips
        req.session.showTagBanner = user.showTagBanner
        req.session.downloadPixivID = user.downloadPixivID
        req.session.autosearchInterval = user.autosearchInterval
        req.session.upscaledImages = user.upscaledImages
        req.session.forceNoteBubbles = user.forceNoteBubbles
        req.session.liveAnimationPreview = user.liveAnimationPreview
        req.session.liveModelPreview = user.liveModelPreview
        req.session.savedSearches = user.savedSearches
        req.session.blacklist = user.blacklist
        req.session.postCount = user.postCount
        req.session.deletedPosts = user.deletedPosts
        req.session.showR18 = user.showR18
        req.session.premium = user.premium
        req.session.premiumExpiration = user.premiumExpiration
        req.session.banExpiration = user.banExpiration
        req.session.lastNameChange = user.lastNameChange

        const ips = functions.util.appendAndLimit(ip, user.ips, 10)
        await sql.user.updateUser(user.username, "ips", ips)
        req.session.ips = ips
        
        const {secret, token} = serverFunctions.generateCSRF()
        req.session.csrfSecret = secret
        req.session.csrfToken = token
    }

    public static deleteUser = async (user: User) => {
        try {
            await sql.token.delete2faToken(user.email!)
            await sql.token.deleteEmailToken(user.email!)
            await sql.token.deletePasswordToken(user.email!)
            await sql.token.deleteIPToken(user.email!)
            await sql.token.deleteAPIKey(user.email!)
            if (user.image) await serverFunctions.files.deleteFile(functions.link.getFolderLink("pfp", user.image, user.imageHash), false)
        } catch (e) {
            console.log(e)
        }

        const uploads = await sql.user.uploads(user.username)
        let forumPosts = user.postCount ?? 0
        if (!uploads.length && !forumPosts) {
            // If the user has no uploads or forum posts, fully delete them
            await sql.user.deleteUser(user.username)
        } else {
            // Empty their fields and randomize the name to preserve post relationships
            // Keep join date -- await sql.user.updateUser(user.username, "joinDate", null)
            // Keep forum post count -- await sql.user.updateUser(user.username, "postCount", null)
            // Keep deleted post count -- await sql.user.updateUser(user.username, "deletedPosts", null)

            let num = Math.floor(Math.random() * 10000)
            while (true) {
                try {
                    await sql.user.updateUser(user.username, "email", `deleted${num}@email.com`)
                    break
                } catch {
                    num = Math.floor(Math.random() * 10000)
                }
            }

            await sql.user.updateUser(user.username, "deleted", true)
            await sql.user.updateUser(user.username, "role", "deleted")
            await sql.user.updateUser(user.username, "password", null)
            await sql.user.updateUser(user.username, "lastLogin", null)
            await sql.user.updateUser(user.username, "bio", null)
            await sql.user.updateUser(user.username, "emailVerified", null)
            await sql.user.updateUser(user.username, "cookieConsent", null)
            await sql.user.updateUser(user.username, "$2fa", null)
            await sql.user.updateUser(user.username, "publicFavorites", null)
            await sql.user.updateUser(user.username, "publicTagFavorites", null)
            await sql.user.updateUser(user.username, "showRelated", null)
            await sql.user.updateUser(user.username, "showTooltips", null)
            await sql.user.updateUser(user.username, "showTagTooltips", null)
            await sql.user.updateUser(user.username, "showTagBanner", null)
            await sql.user.updateUser(user.username, "downloadPixivID", null)
            await sql.user.updateUser(user.username, "autosearchInterval", null)
            await sql.user.updateUser(user.username, "upscaledImages", null)
            await sql.user.updateUser(user.username, "forceNoteBubbles", null)
            await sql.user.updateUser(user.username, "liveAnimationPreview", null)
            await sql.user.updateUser(user.username, "liveModelPreview", null)
            await sql.user.updateUser(user.username, "savedSearches", null)
            await sql.user.updateUser(user.username, "blacklist", null)
            await sql.user.updateUser(user.username, "showR18", null)
            await sql.user.updateUser(user.username, "premium", null)
            await sql.user.updateUser(user.username, "premiumExpiration", null)
            await sql.user.updateUser(user.username, "image", null)
            await sql.user.updateUser(user.username, "imageHash", null)
            await sql.user.updateUser(user.username, "imagePost", null)
            await sql.user.updateUser(user.username, "ips", null)
            await sql.user.updateUser(user.username, "banned", null)
            await sql.user.updateUser(user.username, "banExpiration", null)
            await sql.user.updateUser(user.username, "lastNameChange", null)

            while (true) {
                try {
                    await sql.user.updateUser(user.username, "username", `deleted${num}`)
                    break
                } catch {
                    num = Math.floor(Math.random() * 10000)
                }
            }
        }
    }
}