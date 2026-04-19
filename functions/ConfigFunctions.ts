/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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

    public static useCDNLinks = () => {
        return process.env.CDN_LINKS === "yes"
    }

    public static backupsEnabled = () => {
        return process.env.DATABASE_BACKUPS === "yes"
    }

    public static getDomain = () => {
        if (this.isLocalHost()) {
            return "http://localhost:8082"
        } else {
            return "https://moepictures.net"
        }
    }
}