import enLocale from "../assets/locales/en.json"
import commonPasswords from "../assets/json/common-passwords.json"
import bannedUsernames from "../assets/json/banned-usernames.json"
import badWords from "../assets/json/bad-words.json"
import tempMails from "../assets/json/temp-email.json"
import gibberish from "../structures/Gibberish"
import functions from "./Functions"
import {PostType, PostRating, PostStyle, PostSort, CategorySort, TagSort, GroupSort, 
TagType, CommentSort, UserRole, UploadTag, FileFormat} from "../types/Types"

export default class ValidationFunctions {
    public static maxFileSize = (format: FileFormat = {}) => {
        const {jpg, png, avif, mp3, wav, gif, webp, glb, fbx, obj, vrm, mp4, webm} = format
        const maxSize = jpg ? 10 :
                        png ? 10 :
                        avif ? 10 :
                        mp3 ? 10 :
                        wav ? 10 :
                        gif ? 25 :
                        webp ? 25 :
                        glb ? 30 :
                        fbx ? 30 :
                        obj ? 30 :
                        vrm ? 30 :
                        mp4 ? 50 :
                        webm ? 50 : 50
        return maxSize
    }

    public static maxTagFileSize = (format: FileFormat) => {
        const {jpg, png, avif, gif, webp} = format
        const maxSize = jpg ? 3 :
                        png ? 3 :
                        avif ? 3 :
                        gif ? 5 :
                        webp ? 5 : 5
        return maxSize
    }

    public static isProfane = (text: string) => {
        const words = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        for (const word of words) {
            for (const badWord of badWords) {
                if (atob(badWord).length <= word.length 
                && atob(badWord).includes(word.toLowerCase())) return true
            }
        }
        return false
    }

    public static validateUsername = (username: string, i18n: typeof enLocale) => {
        if (!username) return i18n.errors.username.empty
        const alphaNumeric = functions.util.alphaNumeric(username)
        if (!alphaNumeric || /[\n\r\s]+/g.test(username)) return i18n.errors.username.alphanumeric
        if (this.isProfane(username)) return i18n.errors.username.profane
        if (bannedUsernames.includes(username.toLowerCase())) return i18n.errors.username.disallowed
        return null
    }

    public static passwordStrength = (password: string) => {
        let counter = 0
        if (/[a-z]/.test(password)) counter++
        if (/[A-Z]/.test(password)) counter++
        if (/[0-9]/.test(password)) counter++
        if (!/^[a-zA-Z0-9]+$/.test(password)) counter++
        if (password.length < 10 || counter < 3) return "weak"
        if (password.length < 15) return "decent"
        return "strong"
    }

    public static validatePassword = (username: string, password: string, i18n: typeof enLocale) => {
        if (!password) return i18n.errors.password.empty
        if (password.toLowerCase().includes(username.toLowerCase())) return i18n.errors.password.username
        if (commonPasswords.includes(password)) return i18n.errors.password.common
        if (/ +/.test(password)) return i18n.errors.password.spaces
        if (password.length < 10) return i18n.errors.password.length
        const strength = this.passwordStrength(password)
        if (strength === "weak") return i18n.errors.password.weak
        return null
    }

    public static validateEmail = (email: string, i18n: typeof enLocale) => {
        if (!email) return i18n.errors.email.empty
        const regex = /^[a-zA-Z0-9.!#$%&"*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        if (!regex.test(email)) return i18n.errors.email.invalid
        const domain = email.split("@")[1] || ""
        if (functions.util.arrayIncludes(domain, tempMails)) return i18n.errors.email.invalid
        return null
    }

    public static validateComment = (comment: string, i18n: typeof enLocale) => {
        if (!comment) return i18n.errors.comment.empty
        if (comment.length > 1000) return i18n.errors.comment.length
        const pieces = functions.render.parsePieces(comment)
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.includes(">")) {
                const username = piece.match(/(>>>)(.*?)(?=$|>)/gm)?.[0].replace(">>>", "") ?? ""
                const text = piece.replace(username, "").replaceAll(">", "")
                if (!text && !username) continue
                //if (gibberish(Functions.stripLinks(text))) return i18n.errors.comment.gibberish
            } else {
                //if (gibberish(Functions.stripLinks(piece))) return i18n.errors.comment.gibberish
            }
        }
        if (this.isProfane(comment)) return i18n.errors.comment.profane
        return null
    }

    public static validateReply = (reply: string, i18n: typeof enLocale) => {
        if (!reply) return i18n.errors.reply.empty
        if (this.isProfane(reply)) return i18n.errors.reply.profane
        return null
    }

    public static validateMessage = (message: string, i18n: typeof enLocale) => {
        if (!message) return i18n.errors.message.empty
        const words = message.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        if (this.isProfane(message)) return i18n.errors.message.profane
        return null
    }

    public static validateTitle = (title: string, i18n: typeof enLocale) => {
        if (!title) return i18n.errors.title.empty
        const words = title.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        if (this.isProfane(title)) return i18n.errors.title.profane
        return null
    }

    public static validateThread = (thread: string, i18n: typeof enLocale) => {
        if (!thread) return i18n.errors.thread.empty
        const words = thread.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/ +/g)
        if (this.isProfane(thread)) return i18n.errors.thread.profane
        return null
    }

    public static validateReason = (reason: string | null | undefined, i18n: typeof enLocale) => {
        if (!reason) return i18n.errors.reason.empty
        //if (gibberish(reason)) return i18n.errors.reason.gibberish
        return null
    }

    public static validateBio = (bio: string, i18n: typeof enLocale) => {
        if (!bio) return i18n.errors.bio.empty
        //if (gibberish(Functions.stripLinks(bio))) return i18n.errors.bio.gibberish
        if (this.isProfane(bio)) return i18n.errors.bio.profane
        return null
    }

    public static validType = (type: PostType, all?: boolean) => {
        if (all) if (type === "all") return true
        if (type === "image" ||
            type === "animation" ||
            type === "video" ||
            type === "comic" ||
            type === "audio" ||
            type === "model" ||
            type === "live2d") return true 
        return false
    }
      
    public static validRating = (rating: PostRating, all?: boolean) => {
        if (all) if (rating === "all" || rating === "all+h") return true
        if (rating === "cute" ||
            rating === "hot" ||
            rating === "erotic" ||
            rating === "hentai") return true 
        return false
    }

    public static validStyle = (style: PostStyle, all?: boolean) => {
        if (all) if (style === "all" || style === "all+s") return true
        if (style === "2d" ||
            style === "3d" ||
            style === "pixel" ||
            style === "chibi" ||
            style === "daki" ||
            style === "sketch" ||
            style === "lineart" ||
            style === "promo") return true 
        return false
    }

    public static parseSort = <T>(sortType: T, sortReverse: boolean) => {
        if (sortType === "random") return "random"
        if (sortReverse) {
            return `reverse ${sortType}` as T
        } else {
            return sortType as T
        }
    }

    public static validSort = (sort: PostSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date" ||
            sort === "posted" ||
            sort === "reverse posted" || 
            sort === "bookmarks" || 
            sort === "reverse bookmarks" ||
            sort === "favorites" || 
            sort === "reverse favorites" ||
            sort === "cuteness" ||
            sort === "reverse cuteness" ||
            sort === "variations" || 
            sort === "reverse variations" ||
            sort === "parent" || 
            sort === "reverse parent" ||
            sort === "child" || 
            sort === "reverse child" ||
            sort === "groups" || 
            sort === "reverse groups" ||
            sort === "popularity" || 
            sort === "reverse popularity" ||
            sort === "tagcount" || 
            sort === "reverse tagcount" ||
            sort === "filesize" || 
            sort === "reverse filesize" ||
            sort === "aspectRatio" || 
            sort === "reverse aspectRatio" ||
            sort === "hidden" || 
            sort === "reverse hidden" ||
            sort === "locked" || 
            sort === "reverse locked" ||
            sort === "private" || 
            sort === "reverse private") return true 
        return false
    }

    public static validCategorySort = (sort: CategorySort) => {
        if (sort === "random" ||
            sort === "cuteness" ||
            sort === "reverse cuteness" ||
            sort === "posts" ||
            sort === "reverse posts" || 
            sort === "alphabetic" ||
            sort === "reverse alphabetic") return true 
        return false
    }

    public static validTagSort = (sort: TagSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date" ||
            sort === "image" ||
            sort === "reverse image" ||
            sort === "aliases" ||
            sort === "reverse aliases" ||
            sort === "posts" ||
            sort === "reverse posts" || 
            sort === "alphabetic" ||
            sort === "reverse alphabetic" ||
            sort === "length" ||
            sort === "reverse length") return true 
        return false
    }

    public static validTagType = (type: TagType, noAll?: boolean) => {
        if (type === "all" && !noAll) return true
        if (type === "tags" && !noAll) return true
        if (type === "artist" ||
            type === "character" ||
            type === "series" ||
            type === "meta" ||
            type === "appearance" ||
            type === "outfit" ||
            type === "accessory" ||
            type === "action" ||
            type === "scenery" ||
            type === "tag") return true 
        return false
    }

    public static validCommentSort = (sort: CommentSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date") return true 
        return false
    }

    public static validGroupSort = (sort: GroupSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date" ||
            sort === "posts" ||
            sort === "reverse posts") return true 
        return false
    }

    public static validThreadSort = (sort: CommentSort) => {
        if (sort === "random" ||
            sort === "date" ||
            sort === "reverse date") return true 
        return false
    }

    public static validRole = (role: UserRole) => {
        if (role === "admin" ||
            role === "mod" ||
            role === "premium-curator" ||
            role === "curator" ||
            role === "premium-contributor" ||
            role === "contributor" ||
            role === "premium" ||
            role === "user") return true 
        return false
    }

    public static invalidTags = (characters: UploadTag[] | string[], series: UploadTag[] | string[], tags: string[]) => {
        const characterArr = characters.map((c: UploadTag | string) => typeof c === "string" ? c : c.tag)
        const seriesArr = series.map((s: UploadTag | string) => typeof s === "string" ? s : s.tag)
        let rawTags = `${characterArr.join(" ")} ${seriesArr.join(" ")} ${tags.join(" ")}`
        if (rawTags.includes("_") || rawTags.includes("/") || rawTags.includes("\\") || rawTags.includes(",")) {
            return "Invalid characters in tags: , _ / \\"
        }
        return null
    }

    public static isDemotion = (oldRole: UserRole, newRole: UserRole) => {
        if (oldRole === newRole) return false
        let hierarchy = {
            "admin": 5,
            "mod": 4,
            "curator": 3,
            "contributor": 2,
            "user": 1
        }
        let premiumHierarchy = {
            "admin": 5,
            "mod": 4,
            "premium-curator": 3,
            "premium-contributor": 2,
            "premium": 1
        }
        if (oldRole.includes("premium")) {
            if (!newRole.includes("premium")) return true
            if (premiumHierarchy[oldRole] && premiumHierarchy[newRole]) {
                return premiumHierarchy[newRole] < premiumHierarchy[oldRole]
            }
        }
        if (hierarchy[oldRole] && hierarchy[newRole]) {
            return hierarchy[newRole] < hierarchy[oldRole]
        }
        return false
    }
}