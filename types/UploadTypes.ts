import {PostType, PostRating, PostStyle} from "./Types"

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
    mirrors: string | null
}

export interface UploadTag {
    tag?: string
    description?: string
    image?: string
    ext?: string
    bytes?: number[]
}

export interface UploadImageFile {
    file: File
    ext: string
    originalLink: string
    bytes: number[]
}

export interface UploadImage {
    name: string
    link: string
    originalLink: string
    ext: string
    size: number
    thumbnail: string
    width: number
    height: number
    bytes: number[]
}

export interface UploadParams {
    images: UploadImage[]
    upscaledImages: UploadImage[]
    type: PostType
    rating: PostRating
    style: PostStyle
    source: SourceData
    parentID?: string | null
    artists: UploadTag[]
    characters: UploadTag[]
    series: UploadTag[]
    tags: string[]
    newTags: UploadTag[]
    unverifiedID?: string
    noImageUpdate?: boolean
}

export interface EditParams extends UploadParams {
    postID: string
    preserveChildren?: boolean
    updatedDate?: string
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

export interface UnverifiedEditParams extends Omit<UploadParams, "noImageUpdate"> {
    postID: string
    reason?: string
}

export type UploadPostEndpoint<T extends string> = 
    T extends "/api/post/upload" ? {params: UploadParams, response: string} :
    T extends "/api/post/upload/unverified" ? {params: UnverifiedUploadParams, response: string} :
    T extends "/api/post/approve" ? {params: ApproveParams, response: string} :
    T extends "/api/post/reject" ? {params: {postID: string}, response: string} :
    never

export type UploadPutEndpoint<T extends string> = 
    T extends "/api/post/edit" ? {params: EditParams, response: string} :
    T extends "/api/post/edit/unverified" ? {params: UnverifiedEditParams, response: string} :
    never