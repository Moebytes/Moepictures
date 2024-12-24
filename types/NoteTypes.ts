import {UserRole, Post, UnverifiedPost} from "./Types"

export interface Note {
    noteID: string
    postID: string
    order: number
    updater: string
    updatedDate: string
    transcript: string
    translation: string
    x: number
    y: number
    width: number
    height: number
    imageWidth: number
    imageHeight: number
    imageHash: string
    overlay: boolean
}

export interface NoteSearch {
    noteID: string
    postID: string
    updater: string
    updatedDate: string
    order: number
    notes: Note[]
    noteCount: number
    post: Post
    image: string | null
    imageHash: string | null
    imagePost: string | null
    role: UserRole
    banned: boolean | null
    row: string
    fake?: boolean
}

export interface UnverifiedNote extends Note {
    originalID: string
    addedEntries: string[]
    removedEntries: string[]
    reason: string | null
}

export interface UnverifiedNoteSearch extends NoteSearch {
    notes: UnverifiedNote[]
    post: UnverifiedPost
    originalID: string
    addedEntries: string[]
    removedEntries: string[]
    reason: string | null
}