import {PostType, PostRating, PostStyle, MiniTagGroup} from "./Types"

export interface SourceFile extends File {
  altSource?: string
  directLink?: string
}

export interface SourceData {
    title: string | null
    englishTitle: string | null
    artist: string | null
    posted: string | null
    source: string | null
    commentary: string | null
    englishCommentary: string | null
    bookmarks: number | null
    buyLink: string | null
    pixivTags: string[] | null
    userProfile: string | null
    drawingTools: string[] | null
    sourceImageCount: number | null
    mirrors: string | null
}

export interface UploadTag {
    tag?: string
    description?: string
    image?: string
    ext?: string
    bytes?: number[]
}

export interface ImageChunk {
    fileID: string
    index: number
    bytes?: number[]
    name: string
    link: string
    originalLink: string
    ext: string
    size: number
    width: number
    height: number
    thumbnail: string
    thumbnailExt: string
    altSource: string
    directLink: string
    duration?: number
    groupName?: string
    parentID?: string
    username?: string
}

export interface UploadImage {
    name: string
    link: string
    originalLink: string
    ext: string
    size: number
    width: number
    height: number
    bytes: number[]
    thumbnail: string
    thumbnailExt: string
    altSource: string
    directLink: string
    duration?: number
    groupName?: string
    parentID?: string
}

export interface UploadParams {
    imageChunks: ImageChunk[]
    upscaledChunks: ImageChunk[]
    type: PostType
    rating: PostRating
    style: PostStyle
    source: SourceData
    parentID?: string | null
    groupName?: string | null
    artists: UploadTag[]
    characters: UploadTag[]
    series: UploadTag[]
    tags: string[]
    tagGroups: MiniTagGroup[]
    sourceLinks: {link: string, hash: string}[]
    newTags: UploadTag[]
    unverifiedID?: string
    noImageUpdate?: boolean
}

export interface EditParams extends Omit<UploadParams, "sourceLinks"> {
    postID: string
    preserveChildren?: boolean
    updatedDate?: string
    imageSources?: {[key: string]: string | null} | null
    imageLinks?: {[key: string]: string | null} | null
    reason?: string | null
    silent?: boolean
}

export interface ApproveParams {
    postID: string
    reason?: string | null
    noImageUpdate?: boolean
}

export interface UnverifiedUploadParams extends Omit<UploadParams, "unverifiedID" | "noImageUpdate"> {
    duplicates: boolean
}

export interface UnverifiedEditParams extends Omit<UploadParams, "noImageUpdate" | "sourceLinks"> {
    postID: string
    reason?: string | null
}

export type UploadableParams = UploadParams & EditParams & UnverifiedUploadParams & UnverifiedEditParams

export type UploadPostEndpoint<T extends string> = 
    T extends "/api/post/upload" ? {params: UploadParams, response: string} :
    T extends "/api/post/upload/unverified" ? {params: UnverifiedUploadParams, response: string} :
    T extends "/api/post/approve" ? {params: ApproveParams, response: string} :
    T extends "/api/post/reject" ? {params: {postID: string}, response: string} :
    T extends "/api/post/split" ? {params: {postID: string, order: number | null, mergeSubsequent?: boolean}, response: string} :
    T extends "/api/post/join" ? {params: {postID: string, nested: boolean}, response: string} :
    T extends "/api/post/flip" ? {params: {postID: string}, response: string} :
    T extends "/api/post/image-chunk" ? {params: FormData, response: string} :
    never

export type UploadPutEndpoint<T extends string> = 
    T extends "/api/post/edit" ? {params: EditParams, response: string} :
    T extends "/api/post/edit/unverified" ? {params: UnverifiedEditParams, response: string} :
    never