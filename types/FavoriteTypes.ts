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

export interface FavgroupUpdateParams {
    postID: string
    name: string
    isPrivate: boolean
}

export interface FavgroupEditParams {
    key: string
    name: string
    isPrivate: boolean
}

export interface FavgroupReorderParams {
    name: string
    posts: {postID: string, order: number}[]
}

export type FavoriteGetEndpoint<T extends string> = 
    T extends "/api/favorite" ? {params: {postID: string}, response: Favorite | undefined} :
    T extends "/api/favgroups" ? {params: {postID: string}, response: Favgroup[]} :
    T extends "/api/favgroup" ? {params: {username: string, name: string}, response: FavgroupSearch | undefined} :
    never

export type FavoritePostEndpoint<T extends string> = 
    T extends "/api/favorite/toggle" ? {params: {postID: string}, response: string} :
    T extends "/api/favorite/update" ? {params: {postID: string, favorited: boolean}, response: string} :
    T extends "/api/favgroup/update" ? {params: FavgroupUpdateParams, response: string} :
    never

export type FavoritePutEndpoint<T extends string> = 
    T extends "/api/favgroup/edit" ? {params: FavgroupEditParams, response: string} :
    T extends "/api/favgroup/reorder" ? {params: FavgroupReorderParams, response: string} :
    never

export type FavoriteDeleteEndpoint<T extends string> = 
    T extends "/api/favgroup/post/delete" ? {params: {postID: string, name: string}, response: string} :
    T extends "/api/favgroup/delete" ? {params: {name: string}, response: string} :
    never