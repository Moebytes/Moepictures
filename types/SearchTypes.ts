import {PostType, PostRating, PostSort, PostStyle, CommentSort, CategorySort, 
TagSort, TagType, GroupSort, PostSearch, TagCount, CommentSearch, NoteSearch,
TagCategorySearch, TagSearch, GroupSearch, ThreadSearch, MessageSearch, Post, 
Report} from "./Types"

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
    favoriteMode?: boolean
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

export interface SimilarSearchParams {
    bytes: number[]
    useMD5?: boolean
}

export type SearchGetEndpoint<T extends string> = 
    T extends "/api/search/posts" ? {params: PostSearchParams, response: PostSearch[]} :
    T extends "/api/search/artists" ? {params: CategorySearchParams, response: TagCategorySearch[]} :
    T extends "/api/search/characters" ? {params: CategorySearchParams, response: TagCategorySearch[]} :
    T extends "/api/search/series" ? {params: CategorySearchParams, response: TagCategorySearch[]} :
    T extends "/api/search/tags" ? {params: TagSearchParams, response: TagSearch[]} :
    T extends "/api/search/comments" ? {params: CommentSearchParams, response: CommentSearch[]} :
    T extends "/api/search/notes" ? {params: CommentSearchParams, response: NoteSearch[]} :
    T extends "/api/search/groups" ? {params: GroupSearchParams, response: GroupSearch[]} :
    T extends "/api/search/threads" ? {params: CommentSearchParams, response: ThreadSearch[]} :
    T extends "/api/search/messages" ? {params: MessageSearchParams, response: MessageSearch[]} :
    T extends "/api/search/reports" ? {params: {offset?: number} | null, response: Report[]} :
    never

export type SearchPostEndpoint<T extends string> = 
    T extends "/api/search/similar" ? {params: SimilarSearchParams, response: Post[]} :
    // T extends "/api/search/parse-space-search" ? {params: {query?: string}, response: string} :
    never