import {UserRole} from "./Types"

export interface PrunedUser {
    username: string
    bio: string
    image: string | null
    imageHash: string | null
    imagePost: string | null
    joinDate: string
    postCount: number
    publicFavorites: boolean
    role: UserRole
    banned: boolean | null
    banExpiration: string | null
}

export interface User extends PrunedUser {
    email?: string
    emailVerified?: boolean
    $2fa?: boolean
    ip?: string
    password?: string
    showRelated?: boolean
    showTooltips?: boolean
    showTagBanner?: boolean
    downloadPixivID?: boolean
    autosearchInterval?: number
    upscaledImages?: boolean
    savedSearches?: {[key: string]: string} | null
    showR18?: boolean
    premiumExpiration?: string | null
}

type Require<T> = {
    [K in keyof T]-?: T[K]
}

export interface Session extends Require<Omit<User, "password" | "ip">> {
    cookie: {
        _expires: string
        httpOnly: boolean
        originalMaxAge: number
        path: string
        sameSite: string
        secure: boolean
    }
    captchaNeeded: boolean
    csrfToken: string
    publicKey: string
}

export interface ServerSession extends Omit<User, "password"> {
    captchaNeeded: boolean
    captchaAnswer: string
    csrfToken: string
    csrfSecret: string
    publicKey: string
}

export interface LoginHistory {
    loginID: string
    username: string
    type: string
    ip: string
    timestamp: string
    device: string
    region: string
}

export interface Banner {
    bannerID: string
    date: string | null
    link: string | null
    text: string | null
}