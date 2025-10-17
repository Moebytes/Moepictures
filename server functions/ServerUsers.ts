import sql from "../sql/SQLQuery"
import functions from "../functions/Functions"
import serverFunctions from "./ServerFunctions"
import {User} from "../types/Types"

export default class ServerUsers {
    public static deleteUser = async (user: User) => {
        try {
            await sql.token.delete2faToken(user.email!)
            await sql.token.deleteEmailToken(user.email!)
            await sql.token.deletePasswordToken(user.email!)
            await sql.token.deleteIPToken(user.email!)
            await sql.token.deleteAPIKey(user.email!)
            if (user.image) await serverFunctions.files.deleteFile(functions.link.getTagLink("pfp", user.image, user.imageHash), false)
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