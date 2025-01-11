export interface Report {
    id: string
    reportID: string
    type: String
    reporter: string
    reportDate: string
    reason: string
    image: string | null
    imagePost: string | null
    imageHash: string | null
    reportCount: string
    fake?: boolean
}

export interface Ban {
    banID: string
    username: string
    banner: string
    banDate: string
    reason: string | null
    active: boolean
    ip: string
}

export interface Blacklist {
    blacklistID: string
    blacklistDate: string
    ip: string
    reason: string | null
}

export interface Redirect {
    redirectID: string
    postID: string
    createDate: string
    oldSlug: string
}