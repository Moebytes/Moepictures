import {UserRole} from "./Types"

export interface Thread {
    threadID: string
    creator: string
    createDate: string
    updater: string
    updatedDate: string
    sticky: boolean
    locked: boolean
    title: string
    content: string
    r18: boolean | null
    read?: boolean
    threadCount: string
}

export interface ThreadUser extends Thread {
    role: UserRole
    image: string | null
    imagePost: string | null
    imageHash: string | null
    banned: boolean | null 
    postCount: number
}

export interface ThreadSearch extends Thread {
    fake?: boolean
}

export interface Reply {
    replyID: string
    threadID: string
    creator: string
    createDate: string
    updatedDate: string
    content: string
    r18: boolean
    role: UserRole
    image: string | null
    imagePost: string | null
    imageHash: string | null
    banned: boolean | null
    replyCount: string
    postCount: number
}

export interface ThreadRead {
    threadID: string
    username: string
    read: boolean
}