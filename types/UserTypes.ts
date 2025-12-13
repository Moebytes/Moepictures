import {PostRating, UserRole, PostSearch, Favgroup, CommentSort, CommentSearch, Ban, SearchHistory,
ForumPostSearch} from "./Types"

export type Require<T> = {
    [K in keyof T]-?: T[K]
}

export type Optional<T> = {
    [K in keyof T]?: T[K]
}

export interface TinyUser {
    username: string
    role: UserRole
    banned: boolean | null
    deleted: boolean | null
    imagePost: string | null
}

export interface PrunedUser {
    userID: string
    username: string
    bio: string
    image: string | null
    imageHash: string | null
    imagePost: string | null
    joinDate: string
    postCount: number
    publicFavorites: boolean
    publicTagFavorites: boolean
    role: UserRole
    banned: boolean | null
    deleted: boolean | null
    deletionDate: string | null
    banExpiration: string | null
    deletedPosts?: string[]
}

export interface User extends PrunedUser {
    email?: string
    emailVerified?: boolean
    cookieConsent?: boolean | null
    $2fa?: boolean
    ips?: string[]
    password?: string
    showRelated?: boolean
    showTooltips?: boolean
    showTagTooltips?: boolean
    showTagBanner?: boolean
    downloadPixivID?: boolean
    autosearchInterval?: number
    upscaledImages?: boolean
    forceNoteBubbles?: boolean
    liveAnimationPreview?: boolean
    liveModelPreview?: boolean
    savedSearches?: {[key: string]: string} | null
    blacklist?: string
    showR18?: boolean
    premiumExpiration?: string | null
    lastNameChange?: string | null
}

export interface Session extends Require<Omit<User, "password" | "ip">> {
    cookie: {
        _expires: string
        httpOnly: boolean
        originalMaxAge: number
        path: string
        sameSite: string
        secure: boolean
    }
    captchaNeeded: boolean
    $2faNeeded: boolean
    csrfToken: string
    publicKey: string
}

export interface ServerSession extends Partial<Omit<User, "password">> {
    captchaNeeded?: boolean
    captchaAnswer?: string
    $2faNeeded?: boolean
    csrfToken?: string
    csrfSecret?: string
    publicKey?: string
    apiKey?: boolean
    ip?: string
    url?: string
}

export interface LoginHistory {
    loginID: string
    username: string
    type: string
    ip: string
    timestamp: string
    device: string
    region: string
}

export interface Banner {
    bannerID: string
    date: string | null
    link: string | null
    text: string | null
}

export interface SignupParams {
    username: string
    email: string
    password: string
    captchaResponse: string
}

export interface LoginParams {
    username: string
    password: string
    captchaResponse: string
}

export interface UserPfpParams {
    bytes: number[]
    postID?: string
}

export interface SaveSearchParams {
    name: string
    tags: string
}

export interface SaveSearchEditParams {
    name: string
    key: string
    tags: string
}

export interface ChangeUsernameParams {
    newUsername: string
    captchaResponse: string
}

export interface ChangePasswordParams {
    oldPassword: string
    newPassword: string
}

export interface ChangeEmailParams {
    newEmail: string
    captchaResponse: string
}

export interface VerifyEmailParams {
    email: string
    captchaResponse: string
}

export interface ForgotPasswordParams {
    email: string
    captchaResponse: string
}

export interface ResetPasswordParams {
    username: string
    password: string
    token: string
}

export interface UserFavoritesParams {
    username?: string
    rating: PostRating
    offset?: number
    limit?: number
}

export interface UserCommentsParams {
    username?: string
    query?: string
    sort: CommentSort
    offset?: number
}

export interface BanParams {
    username: string
    reason: string
    deleteUnverifiedChanges: boolean
    deleteHistoryChanges: boolean
    deleteComments: boolean
    deleteMessages: boolean
    days?: number
}

export interface BanResponse {
    revertPostIDs: string[]
    revertTagIDs: string[]
    revertGroupIDs: string[]
    revertNoteIDs: {postID: string, order: number}[]
}

export interface EditCounts {
    postEdits: number
    tagEdits: number
    noteEdits: number
    groupEdits: number
}

export interface ForumPostSearchParams {
    username?: string
    query?: string
    sort?: CommentSort
    offset?: number
}

export type UserGetEndpoint<T extends string> = 
    T extends "/api/user" ? {params: {username: string}, response: PrunedUser | undefined} :
    T extends "/api/user/session" ? {params: null, response: Session} :
    T extends "/api/user/changeemail" ? {params: {token: string}, response: string} :
    T extends "/api/user/verifyemail" ? {params: {token: string}, response: string} :
    T extends "/api/user/verifylogin" ? {params: {token: string}, response: string} :
    T extends "/api/user/favorites" ? {params: UserFavoritesParams, response: PostSearch[]} :
    T extends "/api/user/uploads" ? {params: UserFavoritesParams, response: PostSearch[]} :
    T extends "/api/user/favgroups" ? {params: {username: string} | null, response: Favgroup[]} :
    T extends "/api/user/comments" ? {params: UserCommentsParams, response: CommentSearch[]} :
    T extends "/api/user/ban" ? {params: {username: string}, response: Ban | undefined} :
    T extends "/api/user/checkmail" ? {params: null, response: boolean} :
    T extends "/api/user/history" ? {params: {offset?: number, query?: string}, response: SearchHistory[]} :
    T extends "/api/user/login/history" ? {params: null, response: LoginHistory[]} :
    T extends "/api/user/edit/counts" ? {params: {username: string} | null, response: EditCounts} :
    T extends "/api/user/forumposts" ? {params: ForumPostSearchParams, response: ForumPostSearch[]} :
    never

export type UserPostEndpoint<T extends string> = 
    T extends "/api/user/signup" ? {params: SignupParams, response: string} :
    T extends "/api/user/login" ? {params: LoginParams, response: string} :
    T extends "/api/user/logout" ? {params: null, response: string} :
    T extends "/api/user/logout-sessions" ? {params: null, response: string} :
    T extends "/api/user/pfp" ? {params: UserPfpParams, response: string} :
    T extends "/api/user/favoritesprivacy" ? {params: null, response: string} :
    T extends "/api/user/showrelated" ? {params: null, response: string} :
    T extends "/api/user/showtooltips" ? {params: null, response: string} :
    T extends "/api/user/showtagtooltips" ? {params: null, response: string} :
    T extends "/api/user/showtagbanner" ? {params: null, response: string} :
    T extends "/api/user/downloadpixivid" ? {params: null, response: string} :
    T extends "/api/user/autosearchinterval" ? {params: {interval: number | null}, response: string} :
    T extends "/api/user/upscaledimages" ? {params: {reset: boolean} | null, response: string} :
    T extends "/api/user/forcenotebubbles" ? {params: null, response: string} :
    T extends "/api/user/liveanimationpreview" ? {params: null, response: string} :
    T extends "/api/user/livemodelpreview" ? {params: null, response: string} :
    T extends "/api/user/tagfavoritesprivacy" ? {params: null, response: string} :
    T extends "/api/user/savesearch" ? {params: SaveSearchParams, response: string} :
    T extends "/api/user/blacklist" ? {params: {blacklist: string}, response: string} :
    T extends "/api/user/r18" ? {params: {r18?: boolean}, response: string} :
    T extends "/api/user/changebio" ? {params: {bio: string}, response: string} :
    T extends "/api/user/changeusername" ? {params: ChangeUsernameParams, response: string} :
    T extends "/api/user/changepassword" ? {params: ChangePasswordParams, response: string} :
    T extends "/api/user/changeemail" ? {params: ChangeEmailParams, response: string} :
    T extends "/api/user/verifyemail" ? {params: VerifyEmailParams, response: string} :
    T extends "/api/user/forgotpassword" ? {params: ForgotPasswordParams, response: string} :
    T extends "/api/user/resetpassword" ? {params: ResetPasswordParams, response: string} :
    T extends "/api/user/ban" ? {params: BanParams, response: BanResponse} :
    T extends "/api/user/unban" ? {params: {username: string}, response: string} :
    T extends "/api/user/promote" ? {params: {username: string, role: UserRole}, response: string} :
    T extends "/api/user/cookieconsent" ? {params: {consent: boolean | null}, response: string} :
    never

export type UserPutEndpoint<T extends string> = 
    T extends "/api/user/savesearch" ? {params: SaveSearchEditParams, response: string} :
    T extends "/api/user/undelete" ? {params: null, response: string} :
    never

export type UserDeleteEndpoint<T extends string> = 
    T extends "/api/user/pfp" ? {params: null, response: string} :
    T extends "/api/user/savesearch/delete" ? {params: {name?: string, all?: boolean}, response: string} :
    T extends "/api/user/delete" ? {params: null, response: string} :
    T extends "/api/user/history/delete" ? {params: {postID?: string, all?: boolean}, response: string} :
    never