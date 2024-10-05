export default class Permissions {
    public static isAdmin = (session: any) => {
        return session.role === "admin" ? true : false
    }

    public static isMod = (session: any) => {
        return session.role === "mod" ? true : false
    }

    public static isElevated = (session: any) => {
        if (session.role === "admin") return true 
        if (session.role === "mod") return true 
        return false
    }

    public static isPremium = (session: any) => {
        if (session.role === "admin") return true 
        if (session.role === "mod") return true
        if (session.role === "system") return true
        if (session.role === "premium") return true
        return false
    }
}