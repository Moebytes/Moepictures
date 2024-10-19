export default class Permissions {
    public static isAdmin = (session: any) => {
        return session.role === "admin" ? true : false
    }

    public static isMod = (session: any) => {
        if (session.role === "admin") return true 
        if (session.role === "mod") return true 
        return false
    }

    public static isCurator = (session: any) => {
        if (session.role === "admin") return true 
        if (session.role === "mod") return true
        if (session.role === "premium-curator") return true
        if (session.role === "curator") return true
        return false
    }

    public static isContributor = (session: any) => {
        if (session.role === "admin") return true 
        if (session.role === "mod") return true
        if (session.role === "premium-curator") return true
        if (session.role === "curator") return true
        if (session.role === "premium-contributor") return true
        if (session.role === "contributor") return true
        return false
    }

    public static isPremium = (session: any) => {
        if (session.role === "admin") return true 
        if (session.role === "mod") return true
        if (session.role === "system") return true
        if (session.role === "premium-curator") return true
        if (session.role === "premium-contributor") return true
        if (session.role === "premium") return true
        return false
    }

    public static isSystem = (session: any) => {
        if (session.role === "system") return true
        return false
    }
}