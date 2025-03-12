import {ServerSession, MiniTag} from "../types/Types"

export default class Permissions {
    public static isAdmin = (session: ServerSession) => {
        return session.role === "admin" ? true : false
    }

    public static isMod = (session: ServerSession) => {
        if (Permissions.isAdmin(session)) return true
        if (session.role === "mod") return true 
        return false
    }

    public static isCurator = (session: ServerSession) => {
        if (Permissions.isMod(session)) return true
        if (session.role === "premium-curator") return true
        if (session.role === "curator") return true
        return false
    }

    public static isContributor = (session: ServerSession) => {
        if (Permissions.isMod(session)) return true
        if (Permissions.isCurator(session)) return true
        if (session.role === "premium-contributor") return true
        if (session.role === "contributor") return true
        return false
    }

    public static isPremium = (session: ServerSession) => {
        if (!Permissions.isPremiumEnabled()) return true
        if (Permissions.isMod(session)) return true 
        if (Permissions.isSystem(session)) return true
        if (session.role === "premium-curator") return true
        if (session.role === "premium-contributor") return true
        if (session.role === "premium") return true
        return false
    }

    public static isSystem = (session: ServerSession) => {
        if (session.role === "system") return true
        return false
    }

    public static canPrivate = (session: ServerSession, artists?: MiniTag[] | string[]) => {
        if (Permissions.isMod(session)) return true
        const artistTags = artists?.map((a: MiniTag | string) => a.hasOwnProperty("tag") ? (a as MiniTag).tag : a) || []
        if (artistTags.includes(session.username || "")) return true
        return false
    }

    public static getUploadLimit = (session: ServerSession) => {
        if (Permissions.isCurator(session)) return Infinity
        if (Permissions.isContributor(session)) return 50
        return 25
    }

    public static noEncryption = (session: ServerSession) => {
        if (Permissions.isAdmin(session)) return true
        return false
    }

    public static isPremiumEnabled = () => {
        return false
    }
}