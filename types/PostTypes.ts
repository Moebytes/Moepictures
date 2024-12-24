import {PostType, PostRating, PostStyle, PostChanges} from "./Types"

export interface PostMirrors {
    twitter?: string
    danbooru?: string
    gelbooru?: string
    safebooru?: string
    yandere?: string
    konachan?: string
    zerochan?: string
}

export interface PostImage {
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
    images: PostImage[]
}

export interface PostCuteness extends Post {
    cuteness: string
}

export interface PostTagged extends Post {
    tags: string[]
}

export interface PostFull extends Post {
    cuteness: string
    tags: string[]
    favoriteCount: string
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