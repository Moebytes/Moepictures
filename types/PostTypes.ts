import {PostType, PostRating, PostStyle, PostChanges, MiniTag, PostDeleteRequest, PostHistory,
ImageFormat, Upscaler, SourceData} from "./Types"

export interface PostMirrors {
    pixiv?: string
    soundcloud?: string
    sketchfab?: string
    twitter?: string
    deviantart?: string
    artstation?: string
    danbooru?: string
    gelbooru?: string
    safebooru?: string
    yandere?: string
    konachan?: string
    zerochan?: string
    youtube?: string
    bandcamp?: string
}

export interface Image {
    imageID: string
    postID: string
    type: PostType
    order: number
    filename: string
    upscaledFilename: string
    width: number
    height: number
    size: number
    hash: string
}

export interface Post {
    postID: string
    type: PostType
    rating: PostRating
    style: PostStyle
    parentID: string | null
    uploader: string
    uploadDate: string
    updater: string
    updatedDate: string
    title: string
    englishTitle: string
    slug: string
    artist: string
    posted: string
    source: string
    commentary: string
    englishCommentary: string
    mirrors: PostMirrors | null
    bookmarks: number
    buyLink: string | null
    approver: string
    approveDate: string
    hasOriginal: boolean
    hasUpscaled: boolean
    hidden: boolean | null
    locked: boolean | null
    private: boolean | null
    images: Image[]
}

export interface PostCuteness extends Post {
    cuteness: string
}

export interface PostTagged extends Post {
    tags: string[]
}

export interface PostFull extends Post {
    tags: string[]
    favoriteCount: string
    cuteness: string
}

export interface PostSearch extends Post {
    tags: string[]
    artists: string[]
    characters: string[]
    series: string[]
    fileSize: number
    aspectRatio: number
    variationCount: string
    favoriteCount: string
    cuteness: string
    hasChildren: boolean
    isGrouped: boolean
    favorited: boolean
    favgrouped: boolean
    postCount: string
    fake?: boolean
}

export interface UnverifiedPost extends Post {
    originalID: string
    duplicates: boolean | null
    thumbnail: string | null
    tags: string[]
    newTags: string[] | null
    addedTags: string[] | null
    removedTags: string[] | null
    imageChanged: boolean | null
    changes: PostChanges
    reason: string | null
    isNote: boolean
}

export interface ChildPost {
    childID: string
    postID: string
    parentID: string
    post: PostCuteness
}

export interface PostDeleteRequestFulfillParams {
    username: string
    postID: string
    accepted: boolean
}

export interface PostHistoryParams {
    postID?: string
    historyID?: string
    username?: string
    query?: string
    offset?: number
}

export interface PostCompressParams {
    postID: string 
    quality: number 
    format: ImageFormat 
    maxDimension: number 
    maxUpscaledDimension: number 
    original: boolean 
    upscaled: boolean
}

export interface PostUpscaleParams {
    postID: string 
    upscaler: Upscaler 
    scaleFactor: number
    compressJPG: boolean
}

export interface PostQuickEditParams {
    postID: string
    unverified?: boolean
    type: PostType
    rating: PostRating
    style: PostStyle
    source?: SourceData
    parentID?: string | null
    artists?: string[]
    characters?: string[]
    series?: string[]
    tags?: string[]
    reason?: string | null
    silent?: boolean
}

export interface PostQuickEditUnverifiedParams extends Omit<PostQuickEditParams, "unverified" | "silent"> {}

export type PostGetEndpoint<T extends string> = 
    T extends "/api/post" ? {params: {postID: string}, response: PostFull | undefined} :
    T extends "/api/posts" ? {params: {postIDs: string[]}, response: PostFull[]} :
    T extends "/api/post/tags" ? {params: {postID: string}, response: MiniTag[]} :
    T extends "/api/post/comments" ? {params: {postID: string}, response: Comment[]} :
    T extends "/api/post/children" ? {params: {postID: string}, response: ChildPost[]} :
    T extends "/api/post/parent" ? {params: {postID: string}, response: ChildPost | undefined} :
    T extends "/api/post/unverified" ? {params: {postID: string}, response: UnverifiedPost | undefined} :
    T extends "/api/post/list/unverified" ? {params: {offset?: number} | null, response: UnverifiedPost[]} :
    T extends "/api/post-edits/list/unverified" ? {params: {offset?: number} | null, response: UnverifiedPost[]} :
    T extends "/api/post/children/unverified" ? {params: {postID: string}, response: ChildPost[]} :
    T extends "/api/post/parent/unverified" ? {params: {postID: string}, response: ChildPost | undefined} :
    T extends "/api/post/delete/request/list" ? {params: {offset?: number} | null, response: PostDeleteRequest[]} :
    T extends "/api/post/history" ? {params: PostHistoryParams | null, response: PostHistory[]} :
    never

export type PostPostEndpoint<T extends string> = 
    T extends "/api/post/takedown" ? {params: {postID: string}, response: string} :
    T extends "/api/post/lock" ? {params: {postID: string}, response: string} :
    T extends "/api/post/private" ? {params: {postID: string}, response: string} :
    T extends "/api/post/delete/request" ? {params: {postID: string, reason: string}, response: string} :
    T extends "/api/post/delete/request/fulfill" ? {params: PostDeleteRequestFulfillParams, response: string} :
    T extends "/api/post/view" ? {params: {postID: string}, response: string} :
    T extends "/api/post/compress" ? {params: PostCompressParams, response: string} :
    T extends "/api/post/upscale" ? {params: PostUpscaleParams, response: string} :
    never

export type PostPutEndpoint<T extends string> = 
    T extends "/api/post/quickedit" ? {params: PostQuickEditParams, response: string} :
    T extends "/api/post/quickedit/unverified" ? {params: PostQuickEditUnverifiedParams, response: string} :
    never

export type PostDeleteEndpoint<T extends string> = 
    T extends "/api/post/delete" ? {params: {postID: string}, response: string} :
    T extends "/api/post/history/delete" ? {params: {postID: string, historyID: string}, response: string} :
    never