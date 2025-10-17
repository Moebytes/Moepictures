import {UserRole, Post} from "./Types"

export interface UserComment {
    commentID: string
    postID: string
    username: string
    comment: string
    postDate: string
    editor: string
    editedDate: string | null
    image: string | null
    imagePost: string | null
    imageHash: string | null
    role: UserRole
    banned: boolean | null
    deleted: boolean | null
}

export interface CommentSearch extends UserComment {
    post: Post
    commentCount: number
    fake?: boolean
}

export interface CommentReportFulfillParams {
    reportID: string 
    reporter: string 
    username: string 
    id: string 
    accepted: boolean
}

export type CommentGetEndpoint<T extends string> = 
    T extends "/api/comment" ? {params: {commentID: string}, response: UserComment | undefined} :
    never

export type CommentPostEndpoint<T extends string> = 
    T extends "/api/comment/create" ? {params: {comment: string, postID: string}, response: string} :
    T extends "/api/comment/report" ? {params: {commentID: string, reason: string}, response: string} :
    T extends "/api/comment/report/fulfill" ? {params: CommentReportFulfillParams, response: string} :
    never

export type CommentPutEndpoint<T extends string> = 
    T extends "/api/comment/edit" ? {params: {comment: string, commentID: string}, response: string} :
    never

export type CommentDeleteEndpoint<T extends string> = 
    T extends "/api/comment/delete" ? {params: {commentID: string}, response: string} :
    never