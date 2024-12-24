import {PostType, PostRating, PostStyle, PostSort,
CommentSort, CategorySort, TagSort, TagType, GroupSort,
Banner, Post, MiniTag, Tag, TagSearch, PostSearch, TagCount, CommentSearch,
NoteSearch, TagCategorySearch, GroupSearch, ThreadSearch, MessageSearch, Favorite,
Session} from "./Types"

export type SidebarTagParams = {
    postIDs?: string[]
    isBanner?: boolean
}

export type PostSearchParams = {
    query?: string
    type?: PostType
    rating?: PostRating
    style?: PostStyle
    sort?: PostSort
    offset?: number
    limit?: number
    showChildren?: boolean
    withTags?: boolean
}

export type CommentSearchParams = {
    query?: string
    sort?: CommentSort
    offset?: number
}

export type CategorySearchParams = {
    query?: string
    sort?: CategorySort
    offset?: number
    limit?: number
}

export type TagSearchParams = {
    query?: string
    sort?: TagSort
    type?: TagType
    offset?: number
    limit?: number
}

export type GroupSearchParams = {
    query?: string
    sort?: GroupSort
    rating?: PostRating
    offset?: number
    limit?: number
}

export type MessageSearchParams = {
    query?: string
    hideSystem?: boolean
    sort?: CommentSort
    offset?: number
}

export type GetEndpoint<T extends string> = {params: any, response: any}

/*
export type GetEndpoint<T extends string> = 
    // Misc Routes
    T extends "/api/misc/captcha/create" ? {params: {color: string}, response: string} :
    T extends "/api/misc/banner" ? {params: null, response: Banner} :
    T extends "/api/misc/emojis" ? {params: null, response: {[key: string]: string}} :
    // Post Routes
    T extends "/api/post" ? {params: {postID: string}, response: Post} :
    T extends "/api/post/tags" ? {params: {postID: string}, response: {tags: MiniTag[]}} :
    // Tag Routes
    T extends "/api/tag/map" ? {params: {tags: string[]}, response: {[key: string]: Tag}} :
    // Search Routes
    T extends "/api/search/posts" ? {params: PostSearchParams, response: PostSearch[]} :
    T extends "/api/search/sidebartags" ? {params: SidebarTagParams, response: TagCount[]} :
    T extends "/api/search/comments" ? {params: CommentSearchParams, response: CommentSearch[]} :
    T extends "/api/search/notes" ? {params: CommentSearchParams, response: NoteSearch[]} :
    T extends "/api/search/artists" ? {params: CategorySearchParams, response: TagCategorySearch[]} :
    T extends "/api/search/characters" ? {params: CategorySearchParams, response: TagCategorySearch[]} :
    T extends "/api/search/series" ? {params: CategorySearchParams, response: TagCategorySearch[]} :
    T extends "/api/search/tags" ? {params: TagSearchParams, response: TagSearch[]} :
    T extends "/api/search/groups" ? {params: GroupSearchParams, response: GroupSearch[]} :
    T extends "/api/search/threads" ? {params: CommentSearchParams, response: ThreadSearch[]} :
    T extends "/api/search/messages" ? {params: MessageSearchParams, response: MessageSearch[]} :
    // Favorite Routes
    T extends "/api/favorite" ? {params: {postID: string}, response: Favorite | undefined} :
    // User Routes
    T extends "/api/user/session" ? {params: null, response: Session} :
    T extends "/api/user/checkmail" ? {params: null, response: boolean} :
    T extends string ? {params: any, response: any} :
    {params: any, response: any}*/