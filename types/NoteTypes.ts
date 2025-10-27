import {UserRole, Post, UnverifiedPost, NoteHistory} from "./Types"

export type NoteUpdateColumns = "order" | "transcript" | "translation" | "x" | "y" | "width" |
"height" | "rotation" | "imageWidth" | "imageHeight" | "imageHash" | "overlay" | "fontSize" | "fontFamily" |
"bold" | "italic" | "textColor" | "backgroundColor" | "backgroundAlpha" | "strokeColor" | "strokeWidth" | 
"breakWord" | "borderRadius" | "character" | "characterTag"

export interface Note {
    id?: number
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
    rotation: number
    imageWidth: number
    imageHeight: number
    imageHash: string
    overlay: boolean
    fontSize: number
    backgroundColor: string
    textColor: string
    fontFamily: string
    backgroundAlpha: number
    bold: boolean
    italic: boolean
    strokeColor: string
    strokeWidth: number
    breakWord: boolean
    borderRadius: number
    character: boolean
    characterTag: string
}

export interface BubbleData {
    id?: number
    x: number
    y: number
    width: number
    height: number
    transcript?: string
    translation?: string
    fontFamily?: string
    fontSize?: number
    bold?: boolean
    italic?: boolean
    character?: boolean
    characterTag?: string
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
    deleted: boolean | null
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

export interface NoteSaveParams {
    postID: string
    order: number
    data: Note[]
    reason: string
}

export interface NoteEditParams {
    postID: string
    order: number
    data: Note[]
    silent?: boolean
}

export interface NoteApproveParams {
    postID: string
    originalID: string
    order: number
    username: string
    data: Note[]
}

export interface NoteHistoryParams {
    postID?: string
    order?: number
    historyID?: string
    username?: string
    query?: string
    offset?: number
}

export interface NoteHistoryDeleteParams {
    postID: string
    order: number
    historyID: string
}

export type NoteGetEndpoint<T extends string> = 
    T extends "/api/notes" ? {params: {postID: string}, response: Note[]} :
    T extends "/api/notes/unverified" ? {params: {postID: string}, response: UnverifiedNote[]} :
    T extends "/api/note/list/unverified" ? {params: {offset?: number} | null, response: UnverifiedNoteSearch[]} :
    T extends "/api/note/history" ? {params: NoteHistoryParams | null, response: NoteHistory[]} :
    never

export type NotePostEndpoint<T extends string> = 
    T extends "/api/note/save" ? {params: NoteSaveParams, response: string} :
    T extends "/api/note/save/request" ? {params: NoteSaveParams, response: string} :
    T extends "/api/note/approve" ? {params: NoteApproveParams, response: string} :
    T extends "/api/note/reject" ? {params: NoteApproveParams, response: string} :
    never

export type NotePutEndpoint<T extends string> = 
    T extends "/api/note/save" ? {params: NoteEditParams, response: string} :
    T extends "/api/note/save/unverified" ? {params: NoteSaveParams, response: string} :
    T extends "/api/note/update" ? {params: {noteID: string, column: NoteUpdateColumns, value: any}, response: string} :
    never

export type NoteDeleteEndpoint<T extends string> = 
    T extends "/api/note/history/delete" ? {params: NoteHistoryDeleteParams, response: string} :
    never