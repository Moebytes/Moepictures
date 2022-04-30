export default class Permissions {
    public static isAdmin = (session: any) => {
        return session.role === "admin" ? true : false
    }

    public static isMod = (session: any) => {
        return session.role === "mod" ? true : false
    }

    public static isStaff = (session: any) => {
        if (session.role === "admin") return true 
        if (session.role === "mod") return true 
        return false
    }
}