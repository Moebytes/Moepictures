import {Post, Image, PostType, PostStyle, PostMirrors, PostSearch, AliasHistoryType,
PostRating, Alias, Implication, TagType, Note, AliasHistorySearch} from "./Types"

export type History = 
    | PostHistory 
    | TagHistory 
    | NoteHistory 
    | GroupHistory 
    | AliasHistorySearch 
    | SearchHistory

export interface HistoryID {
    failed: boolean | string
    historyID: string | null
}

export interface AliasHistoryID {
    failed: boolean | string
    historyID: string | null
    type: AliasHistoryType
}

export interface  PostChanges {
    images?: Image[]
    type?: PostType
    rating?: PostRating
    style?: PostStyle
    parentID?: string | null
    title?: string
    englishTitle?: string
    artist?: string
    posted?: string
    source?: string
    mirrors?: PostMirrors | null
    bookmarks?: number
    buyLink?: string | null
    commentary?: string
    englishCommentary?: string
}

export interface PostHistory {
    historyID: string
    postID: string
    user: string
    date: string
    images: string[]
    uploader: string
    uploadDate: string
    updater: string
    updatedDate: string
    type: PostType
    rating: PostRating
    style: PostStyle
    parentID: string | null
    posted: string
    title: string
    slug: string | null
    englishTitle: string
    artist: string
    source: string
    commentary: string
    englishCommentary: string
    artists: string[]
    characters: string[]
    series: string[]
    tags: string[]
    reason: string | null
    mirrors: PostMirrors | null
    bookmarks: number
    hasOriginal: boolean | null
    hasUpscaled: boolean | null
    buyLink: string | null
    addedTags: string[]
    removedTags: string[]
    imageChanged: boolean
    changes: PostChanges
    historyCount: string
    fake?: boolean
    locked: boolean
    hidden: boolean
    private: boolean
    approver: string
    approveDate: string
}

export interface TagChanges {
    tag?: string
    type?: string
    description?: string
    aliases?: Array<Alias | null>
    implications?: Array<Implication | null>
    pixivTags?: string[] | null
    website?: string | null
    social?: string | null
    twitter?: string | null
    fandom?: string | null
    featuredPost?: string | null
    r18?: boolean | null
}

export interface TagHistory {
    historyID: string
    tag: string
    key: string
    type: TagType
    user: string
    date: string
    description: string
    image: string | null
    imageHash: string | null
    website: string | null
    social: string | null
    twitter: string | null
    fandom: string | null
    featuredPost: Post | null
    hidden: boolean | null
    banned: boolean | null
    aliases: string[]
    implications: string[]
    pixivTags: string[] | null
    r18: boolean | null
    reason: string | null
    imageChanged: boolean
    changes: TagChanges
    historyCount: string
    fake?: boolean
}

export interface NoteHistory {
    historyID: string
    postID: string
    updater: string
    updatedDate: string
    order: number
    notes: Note[]
    reason: string | null
    styleChanged: boolean
    addedEntries: string[]
    removedEntries: string[]
    historyCount: string
    post: Post
    fake?: boolean
}

export interface GroupChanges {
    name?: string
    description?: string
    posts?: {postID: string, order: number}[]
}

export interface GroupHistory {
    historyID: string
    groupID: string
    user: string
    date: string
    slug: string
    name: string
    rating: PostRating
    description: string
    posts: {postID: string, order: number}[]
    reason: string | null
    orderChanged: boolean
    changes: GroupChanges
    addedPosts: string[]
    removedPosts: string[]
    historyCount: string
    fake?: boolean
}

export interface SearchHistory extends Omit<PostSearch, "postCount"> {
    postID: string
    username: string
    viewDate: string
    post: PostSearch
    historyCount: string
}