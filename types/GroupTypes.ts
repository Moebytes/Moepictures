import {Post, PostSearch, PostRating, GroupRequest, GroupDeleteRequest,
GroupEditRequest, GroupHistory} from "./Types"

export type GroupUpdateColumns = "name" | "slug" | "rating" | "description" | "updater" | "updatedDate"

export interface PostOrdered extends Post {
    order: number
    fake?: boolean
}

export interface PostSearchOrdered extends PostSearch {
    order: number
}

export interface Group {
    groupID: string
    name: string
    creator: string
    createDate: string
    updater: string
    updatedDate: string
    rating: PostRating
    slug: string
    description: string
}

export interface GroupPosts extends Group {
    posts: PostOrdered[]
    postCount: string
}

export interface GroupSearch extends GroupPosts {
    groupCount: number
    fake?: boolean
}

export interface GroupPost {
    mapID: string
    groupID: string
    postID: string
    order: number
}

export interface GroupItem {
    id: number
    image: string
    live: string
    post: PostOrdered
}

export interface GroupParams {
    postIDs: string[]
    name: string
    username?: string
    date?: string
    remap?: boolean
    silent?: boolean
}

export interface GroupEditParams {
    slug: string
    name: string
    description: string
    username?: string
    date?: string
    reason?: string | null
    silent?: boolean
}

export interface GroupReorderParams {
    slug: string
    posts: {postID: string, order: number}[]
    silent?: boolean
}

export interface GroupRemapParams {
    slug: string
    postIDs: string[]
    silent?: boolean
}

export interface GroupPostDeleteParams {
    postID: string
    name: string
    username?: string
    date?: string
}

export interface GroupRequestParams {
    postIDs: string[]
    name: string
    reason: string | null
}

export interface GroupRequestFulfillParams {
    username: string
    slug: string
    requestID: string
    accepted: boolean
}

export interface GroupDeleteRequestParams {
    slug: string
    reason: string | null
}

export interface GroupPostDeleteRequestParams {
    removalItems: {slug: string, postID: string}[]
    reason: string | null
}

export interface GroupDeleteRequestFulfillParams {
    username: string
    slug: string
    accepted: boolean
}

export interface GroupPostDeleteRequestFulfillParams {
    username: string
    slug: string
    postID: string
    accepted: boolean
}

export interface GroupEditRequestParams {
    slug: string
    name: string
    description: string
    reason: string | null
}

export interface GroupRemapRequestParams {
    slug: string
    postIDs: string[]
    reason: string | null
}

export interface GroupEditRequestFulfillParams {
    username: string
    slug: string
    accepted: boolean
}

export interface GroupHistoryParams {
    slug?: string
    historyID?: string
    username?: string
    query?: string
    offset?: number
}

export type GroupGetEndpoint<T extends string> = 
    T extends "/api/group" ? {params: {name: string}, response: GroupPosts | undefined} :
    T extends "/api/groups" ? {params: {postID: string}, response: GroupPosts[]} :
    T extends "/api/groups/list" ? {params: {slugs: string[]}, response: GroupPosts[]} :
    T extends "/api/group/request/list" ? {params: {offset?: number} | null, response: GroupRequest[]} :
    T extends "/api/group/delete/request/list" ? {params: {offset?: number} | null, response: GroupDeleteRequest[]} :
    T extends "/api/group/edit/request/list" ? {params: {offset?: number} | null, response: GroupEditRequest[]} :
    T extends "/api/group/history" ? {params: GroupHistoryParams | null, response: GroupHistory[]} :
    never

export type GroupPostEndpoint<T extends string> = 
    T extends "/api/group" ? {params: GroupParams, response: string} :
    T extends "/api/group/request" ? {params: GroupRequestParams, response: string} :
    T extends "/api/group/request/fulfill" ? {params: GroupRequestFulfillParams, response: string} :
    T extends "/api/group/delete/request" ? {params: GroupDeleteRequestParams, response: string} :
    T extends "/api/group/post/delete/request" ? {params: GroupPostDeleteRequestParams, response: string} :
    T extends "/api/group/delete/request/fulfill" ? {params: GroupDeleteRequestFulfillParams, response: string} :
    T extends "/api/group/post/delete/request/fulfill" ? {params: GroupPostDeleteRequestFulfillParams, response: string} :
    T extends "/api/group/edit/request" ? {params: GroupEditRequestParams, response: string} :
    T extends "/api/group/edit/request/fulfill" ? {params: GroupEditRequestFulfillParams, response: string} :
    never

export type GroupPutEndpoint<T extends string> = 
    T extends "/api/group/edit" ? {params: GroupEditParams, response: string} :
    T extends "/api/group/reorder" ? {params: GroupReorderParams, response: string} :
    T extends "/api/group/remap" ? {params: GroupRemapParams, response: string} :
    T extends "/api/group/update" ? {params: {slug: string, column: GroupUpdateColumns, value: any}, response: string} :
    never

export type GroupDeleteEndpoint<T extends string> = 
    T extends "/api/group/delete" ? {params: {slug: string}, response: string} :
    T extends "/api/group/post/delete" ? {params: GroupPostDeleteParams, response: string} :
    T extends "/api/group/history/delete" ? {params: {slug: string, historyID: string}, response: string} :
    never