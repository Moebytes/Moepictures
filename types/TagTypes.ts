import {TagType, Post, AliasHistoryType, TagDeleteRequest, AliasRequest, TagEditRequest,
TagHistory} from "./Types"

export interface MiniTag {
    tag: string
    type: TagType
    description: string | null
    image: string | null
    imageHash: string | null
    social: string | null
    twitter: string | null
    website: string | null
    fandom: string | null
    count?: string
}

export interface TagCount {
    tag: string
    type: TagType
    image: string | null
    imageHash: string | null
    count: string
}

export interface Alias {
    tag: string
    alias: string
}

export interface Implication {
    tag: string
    implication: string
}

export interface Tag {
    tag: string
    type: TagType
    creator: string
    createDate: string
    updater: string
    updatedDate: string
    description: string
    image: string | null
    imageHash: string | null
    website: string | null
    social: string | null
    twitter: string | null
    fandom: string | null
    featured: string | null
    hidden: boolean | null
    banned: boolean | null
    aliases: Array<Alias | null>
    implications: Array<Implication | null>
    pixivTags: string[] | null
    r18: boolean | null
}

export interface TagSearch extends Tag {
    aliasCount: string
    postCount: string
    tagCount: string
    variationCount: string
    fake?: boolean
}

export interface TagCategorySearch extends Tag {
    cuteness: string
    posts: Post[]
    postCount: string
    tagCount: string
    fake?: string
}

export interface BulkTag {
    tag: string
    type: TagType
    description: string | null
    image: string | null
    imageHash: string | null
}

export interface AliasHistory {
    historyID: string
    user: string
    date: string
    source: string
    target: string
    type: AliasHistoryType
    affectedPosts: string[]
    sourceData: Tag
    reason: string | null
}

export interface ImplicationHistory extends Omit<AliasHistory, "sourceData"> {}

export interface AliasHistorySearch extends ImplicationHistory {
    sourceData: Tag | null
    historyCount: string
    fake?: boolean
}

export interface AliasToParams {
    tag: string
    aliasTo: string
    username?: string
    reason?: string
}

export interface TagDeleteRequestFulfillParams {
    username: string
    tag: string
    accepted: boolean
}

export interface AliasToRequestParams {
    tag: string
    aliasTo: string
    reason: string
}

export interface AliasToRequestFulfillParams {
    username: string
    tag: string
    aliasTo: string
    accepted: boolean
}

export interface TagEditRequestFulfillParams {
    username: string
    tag: string
    image: string | null
    accepted: boolean
}

export interface TagHistoryParams {
    tag?: string
    historyID?: string
    username?: string
    query?: string
    offset: number
}

export interface TagEditParams {
    tag: string
    key?: string
    type?: TagType
    description?: string
    image?: Uint8Array | ["delete"]
    aliases?: string[]
    implications?: string[]
    pixivTags?: string[] | null
    website?: string | null
    social?: string | null
    twitter?: string | null
    fandom?: string | null
    featured?: string | null
    r18?: boolean
    reason?: string
    updater?: string
    updatedDate?: string
    silent?: boolean
}

export interface TagEditRequestParams extends Omit<TagEditParams, "updater" | "updatedDate" | "silent"> {}

export type TagGetEndpoint<T extends string> = 
    T extends "/api/tag" ? {params: {tag: string}, response: Tag} :
    T extends "/api/tag/related" ? {params: {tag: string}, response: string[]} :
    T extends "/api/tag/unverified" ? {params: {tag: string}, response: Tag} :
    T extends "/api/tag/counts" ? {params: {tags: string[]}, response: TagCount[]} :
    T extends "/api/tag/list" ? {params: {tags: string[]}, response: Tag[]} :
    T extends "/api/tag/map" ? {params: {tags: string[]}, response: {[key: string]: Tag}} :
    T extends "/api/tag/list/unverified" ? {params: {tags: string[]}, response: Tag[]} :
    T extends "/api/tag/delete/request/list" ? {params: {offset: number}, response: TagDeleteRequest[]} :
    T extends "/api/tag/aliasto/request/list" ? {params: {offset: number}, response: AliasRequest[]} :
    T extends "/api/tag/edit/request/list" ? {params: {offset: number}, response: TagEditRequest[]} :
    T extends "/api/tag/history" ? {params: TagHistoryParams, response: TagHistory[]} :
    T extends "/api/alias/history" ? {params: {offset: number, query: string}, response: AliasHistorySearch[]} :
    never

export type TagPostEndpoint<T extends string> = 
    T extends "/api/tag/takedown" ? {params: {tag: string}, response: string} :
    T extends "/api/tag/aliasto" ? {params: AliasToParams, response: string} :
    T extends "/api/tag/aliasto/undo" ? {params: {historyID: string}, response: string} :
    T extends "/api/tag/implication/undo" ? {params: {historyID: string}, response: string} :
    T extends "/api/tag/implication/redo" ? {params: {historyID: string}, response: string} :
    T extends "/api/tag/delete/request" ? {params: {tag: string, reason: string}, response: string} :
    T extends "/api/tag/delete/request/fulfill" ? {params: TagDeleteRequestFulfillParams, response: string} :
    T extends "/api/tag/aliasto/request" ? {params: AliasToRequestParams, response: string} :
    T extends "/api/tag/aliasto/request/fulfill" ? {params: AliasToRequestFulfillParams, response: string} :
    T extends "/api/tag/edit/request" ? {params: any, response: string} :
    T extends "/api/tag/edit/request/fulfill" ? {params: TagEditRequestFulfillParams, response: string} :
    never

export type TagPutEndpoint<T extends string> = 
    T extends "/api/tag/edit" ? {params: TagEditParams, response: string} :
    never

export type TagDeleteEndpoint<T extends string> = 
    T extends "/api/tag/delete" ? {params: {tag: string}, response: string} :
    T extends "/api/tag/history/delete" ? {params: {tag: string, historyID: string}, response: string} :
    T extends "/api/alias/history/delete" ? {params: {type: AliasHistoryType, historyID: string}, response: string} :
    never