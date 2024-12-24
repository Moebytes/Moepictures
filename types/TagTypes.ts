import {TagType, Post, AliasHistoryType} from "./Types"

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
    description: string
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