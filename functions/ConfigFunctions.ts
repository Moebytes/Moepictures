export default class ConfigFunctions {
    public static isLocalHost = () => {
        if (typeof window === "undefined") return process.env.TESTING === "yes"
        return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    }

    public static useLocalDB = () => {
        return process.env.LOCAL_DATABASE === "yes"
    }

    public static useLocalFiles = () => {
        return process.env.LOCAL_FILES === "yes"
    }

    public static backupsEnabled = () => {
        return process.env.DATABASE_BACKUPS === "yes"
    }

    public static getDomain = () => {
        if (this.isLocalHost()) {
            return "http://localhost:8082"
        } else {
            return "https://moepictures.moe"
        }
    }
}