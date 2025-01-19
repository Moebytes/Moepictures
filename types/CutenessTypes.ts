import {Post} from "./Types"

export interface Cuteness {
    cutenessID: string
    postID: string
    username: string
    cuteness: number
    cutenessDate: string
    post: Post
}

export type CutenessGetEndpoint<T extends string> = 
    T extends "/api/cuteness" ? {params: {postID: string}, response: Cuteness | undefined} :
    never

export type CutenessPostEndpoint<T extends string> = 
    T extends "/api/cuteness/update" ? {params: {postID: string, cuteness: number}, response: string} :
    never

export type CutenessDeleteEndpoint<T extends string> = 
    T extends "/api/cuteness/delete" ? {params: {postID: string}, response: string} :
    never