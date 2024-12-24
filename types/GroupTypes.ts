import {Post, PostSearch, PostRating} from "./Types"

export interface PostOrdered extends Post {
    order: number
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
    groupID: string
    postID: string
    order: number
}