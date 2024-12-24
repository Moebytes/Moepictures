import {PostRating, Post, PostOrdered, PostSearchOrdered} from "./Types"

export interface Favorite {
    postID: string
    username: string
    favoriteDate: string
    post: Post
}

export interface Favgroup {
    username: string
    slug: string
    name: string
    private: boolean
    createDate: string
    rating: PostRating
    posts: PostOrdered[]
    postCount: string
}

export interface FavgroupSearch extends Favgroup {
    posts: PostSearchOrdered[]
}