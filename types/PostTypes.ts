import {PostType, PostRating, PostStyle, PostChanges, MiniTag, PostDeleteRequest, PostHistory,
ImageFormat, Upscaler, SourceData, UserComment, Redirect, MiniTagGroup} from "./Types"

export type PostUpdateColumns = "type" | "rating" | "style" | "parentID" | "posted" |
"title" | "englishTitle" | "artist" | "source" | "commentary" | "englishCommentary" |
"bookmarks" | "mirrors" | "buyLink" | "pixivTags" | "hidden" | "locked" | "private" | 
"deleted" | "deletionDate" | "userProfile" | "drawingTools" | "sourceImageCount" | "slug"

export type ImageUpdateColumns = "type" | "order" | "filename" | "upscaledFilename" |
"width" | "height" | "upscaledWidth" | "upscaledHeight" | "size" | "upscaledSize" |
"duration" | "thumbnail" | "hash" | "pixelHash" | "directLink" | "altSource"

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
    eshuushuu?: string
    animepictures?: string
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
    upscaledWidth: number
    upscaledHeight: number
    size: number
    upscaledSize: number
    duration: number
    thumbnail: string
    hash: string
    pixelHash: string
    directLink: string
    altSource: string
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
    pixivTags: string[] | null
    userProfile: string | null
    drawingTools: string[] | null
    sourceImageCount: number | null
    approver: string
    approveDate: string
    hasOriginal: boolean
    hasUpscaled: boolean
    hidden: boolean | null
    locked: boolean | null
    private: boolean | null
    images: Image[]
    upscaledImages: undefined
    deleted: boolean | null
    deletionDate: string | null
    postCount?: string
    fake?: boolean
}

export interface PostCuteness extends Post {
    cuteness: string
}

export interface PostTagged extends Post {
    tags: string[]
}

export interface PostFull extends Post {
    tags: string[]
    tagGroups: MiniTagGroup[]
    favoriteCount: string
    cuteness: string
}

export interface PostSearch extends Post {
    tags: string[]
    tagGroups: MiniTagGroup[]
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
    favoriteDate: string
    favgrouped: boolean
    postCount: string
}

export interface UnverifiedPost extends Post {
    originalID: string
    duplicates: boolean | null
    tags: string[]
    tagGroups: MiniTagGroup[]
    newTags: string[] | null
    addedTags: string[] | null
    removedTags: string[] | null
    addedTagGroups: string[] | null
    removedTagGroups: string[] | null
    imageSources?: {[key: string]: string | null} | null
    imageLinks?: {[key: string]: string | null} | null
    imageChanged: boolean | null
    changes: PostChanges
    reason: string | null
    isNote: boolean
    appealed: boolean | null
    appealer: string | null
    appealReason: string | null
    postCount: string
}

export interface DeletedPost extends Post {
    historyCount: number
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
    tagGroups?: MiniTagGroup[]
    imageSources?: {[key: string]: string | null} | null
    imageLinks?: {[key: string]: string | null} | null
    reason?: string | null
    silent?: boolean
}

export interface PostQuickEditUnverifiedParams extends Omit<PostQuickEditParams, "unverified" | "silent"> {}

export interface PostMetadata {
    format: string
    width?: number
    height?: number
    size?: number
    colorSpace?: string
    colorChannels?: number
    progressive?: boolean
    alpha?: boolean
    dpi?: number
    bitdepth?: number
    chromaSubsampling?: string
    frames?: number
    duration?: number
    bitrate?: number
    audioChannels?: number
    sampleRate?: number
    framerate?: number
    encoder?: string
    scanType?: string
    colorMatrix?: string
}

export interface ThumbnailUpdate {
    order: number
    thumbnail: string
    thumbnailExt: string
}

export type PostGetEndpoint<T extends string> = 
    T extends "/api/post" ? {params: {postID: string}, response: PostFull | undefined} :
    T extends "/api/posts" ? {params: {postIDs: string[]}, response: PostFull[]} :
    T extends "/api/post/tags" ? {params: {postID: string}, response: MiniTag[]} :
    T extends "/api/post/comments" ? {params: {postID: string}, response: UserComment[]} :
    T extends "/api/post/children" ? {params: {postID: string}, response: ChildPost[]} :
    T extends "/api/post/parent" ? {params: {postID: string}, response: ChildPost | undefined} :
    T extends "/api/post/unverified" ? {params: {postID: string}, response: UnverifiedPost | undefined} :
    T extends "/api/post/list/unverified" ? {params: {offset?: number} | null, response: UnverifiedPost[]} :
    T extends "/api/post/deleted" ? {params: {query?: string, offset?: number} | null, response: DeletedPost[]} :
    T extends "/api/post/deleted/unverified" ? {params: {offset?: number} | null, response: UnverifiedPost[]} :
    T extends "/api/post-edits/list/unverified" ? {params: {offset?: number} | null, response: UnverifiedPost[]} :
    T extends "/api/post/children/unverified" ? {params: {postID: string}, response: ChildPost[]} :
    T extends "/api/post/parent/unverified" ? {params: {postID: string}, response: ChildPost | undefined} :
    T extends "/api/post/delete/request/list" ? {params: {offset?: number} | null, response: PostDeleteRequest[]} :
    T extends "/api/post/history" ? {params: PostHistoryParams | null, response: PostHistory[]} :
    T extends "/api/post/pending" ? {params: null, response: UnverifiedPost[]} :
    T extends "/api/post/rejected" ? {params: null, response: UnverifiedPost[]} :
    T extends "/api/post/redirects" ? {params: {postID: string}, response: Redirect[]} :
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
    T extends "/api/post/appeal" ? {params: {postID: string, reason: string}, response: string} :
    T extends "/api/post/metadata" ? {params: {postID: string, order: number}, response: PostMetadata} :
    T extends "/api/thumbnail/regenerate" ? {params: {postID: string}, response: string} :
    never

export type PostPutEndpoint<T extends string> = 
    T extends "/api/post/quickedit" ? {params: PostQuickEditParams, response: string} :
    T extends "/api/post/quickedit/unverified" ? {params: PostQuickEditUnverifiedParams, response: string} :
    T extends "/api/post/undelete" ? {params: {postID: string}, response: string} :
    T extends "/api/post/undelete/unverified" ? {params: {postID: string}, response: string} :
    T extends "/api/post/thumbnail" ? {params: {postID: string, thumbnails: ThumbnailUpdate[], unverified?: boolean}, response: string} :
    T extends "/api/image/source" ? {params: {imageID: string, directLink: string, altSource: string, unverified?: boolean, reason?: string}, response: string} :
    T extends "/api/post/update" ? {params: {postID: string, column: PostUpdateColumns, value: any}, response: string} :
    T extends "/api/image/update" ? {params: {imageID: string, column: ImageUpdateColumns, value: any}, response: string} :
    T extends "/api/post/addtags" ? {params: {postID: string, tags?: string[], tagGroups?: MiniTagGroup[]}, response: string} :
    T extends "/api/post/removetags" ? {params: {postID: string, tags?: string[], tagGroups?: MiniTagGroup[]}, response: string} :
    never

export type PostDeleteEndpoint<T extends string> = 
    T extends "/api/post/delete" ? {params: {postID: string}, response: string} :
    T extends "/api/post/delete/unverified" ? {params: {postID: string}, response: string} :
    T extends "/api/post/history/delete" ? {params: {postID: string, historyID: string}, response: string} :
    T extends "/api/post/emptybin" ? {params: null, response: string} :
    never