import {UserRole} from "./Types"

export interface Recipient {
    recipientID: string
    messageID: string
    recipient: string | null
    read: boolean
    delete: boolean
}

export interface Message {
    messageID: string
    creator: string
    createDate: string
    updater: string
    updatedDate: string
    title: string
    content: string
    read: boolean | null
    delete: boolean | null
    r18: boolean | null
    recipients: Array<string | null>
    recipientData: Recipient[]
    role: UserRole
    image: string | null
    imagePost: string | null
    imageHash: string | null
    banned: boolean | null 
    deleted: boolean | null
}

export interface MessageUser extends Message {
    role: UserRole
    image: string | null
    imagePost: string | null
    imageHash: string | null
    banned: boolean | null 
    deleted: boolean | null
}

export interface MessageSearch extends Message {
    messageCount: number
    fake?: boolean
}

export interface MessageUserReply {
    replyID: string
    messageID: string
    creator: string
    createDate: string
    updater: string
    updatedDate: string
    content: string
    r18: boolean
    role: UserRole
    image: string | null
    imagePost: string | null
    imageHash: string | null
    banned: boolean | null
    deleted: boolean | null
    replyCount: string
    fake?: boolean
}

export interface MessageCreateParams {
    title: string
    content: string
    r18: boolean
    recipients: string[]
}

export interface MessageEditParams {
    messageID: string
    title: string
    content: string
    r18: boolean
}

export interface MessageReplyParams {
    messageID: string
    content: string
    r18: boolean
}

export interface MessageReplyEditParams {
    replyID: string
    content: string
    r18: boolean
}

export interface MessageForwardParams {
    messageID: string
    recipients: string[]
}

export type MessageGetEndpoint<T extends string> = 
    T extends "/api/message" ? {params: {messageID: string}, response: MessageUser | undefined} :
    T extends "/api/message/replies" ? {params: {messageID: string, offset?: number}, response: MessageUserReply[]} :
    T extends "/api/notifications" ? {params: null, response: string} :
    never

export type MessagePostEndpoint<T extends string> = 
    T extends "/api/message/create" ? {params: MessageCreateParams, response: string} :
    T extends "/api/message/reply" ? {params: MessageReplyParams, response: string} :
    T extends "/api/message/softdelete" ? {params: {messageID: string}, response: string} :
    T extends "/api/message/read" ? {params: {messageID: string, forceRead?: boolean}, response: string} :
    T extends "/api/message/bulkread" ? {params: {readStatus: boolean}, response: string} :
    T extends "/api/message/forward" ? {params: MessageForwardParams, response: string} :
    never

export type MessagePutEndpoint<T extends string> = 
    T extends "/api/message/edit" ? {params: MessageEditParams, response: string} :
    T extends "/api/message/reply/edit" ? {params: MessageReplyEditParams, response: string} :
    never

export type MessageDeleteEndpoint<T extends string> = 
    T extends "/api/message/delete" ? {params: {messageID: string}, response: string} :
    T extends "/api/message/reply/delete" ? {params: {messageID: string, replyID: string}, response: string} :
    never