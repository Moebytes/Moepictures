import {UserRole, Post} from "./Types"

export interface Comment {
    commentID: string
    postID: string
    username: string
    comment: string
    postDate: string
    editedDate: string | null
    image: string | null
    imagePost: string | null
    imageHash: string | null
    role: UserRole
    banned: boolean | null
}

export interface CommentSearch extends Comment {
    post: Post
    commentCount: number
    fake?: boolean
}