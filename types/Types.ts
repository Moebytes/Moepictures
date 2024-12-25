import {CommentGetEndpoint, CommentPostEndpoint, CommentPutEndpoint, CommentDeleteEndpoint} from "./CommentTypes"
import {CutenessGetEndpoint, CutenessPostEndpoint, CutenessDeleteEndpoint} from "./CutenessTypes"
import {FavoriteGetEndpoint, FavoritePostEndpoint, FavoritePutEndpoint, FavoriteDeleteEndpoint} from "./FavoriteTypes"
import {GroupGetEndpoint, GroupPostEndpoint, GroupPutEndpoint, GroupDeleteEndpoint} from "./GroupTypes"
import {MessageGetEndpoint, MessagePostEndpoint, MessagePutEndpoint, MessageDeleteEndpoint} from "./MessageTypes"
import {MiscGetEndpoint, MiscPostEndpoint, MiscDeleteEndpoint} from "./MiscTypes"
import {NoteGetEndpoint, NotePostEndpoint, NotePutEndpoint, NoteDeleteEndpoint} from "./NoteTypes"
import {PostGetEndpoint, PostPostEndpoint, PostPutEndpoint, PostDeleteEndpoint} from "./PostTypes"
import {SearchGetEndpoint, SearchPostEndpoint} from "./SearchTypes"
import {TagGetEndpoint, TagPostEndpoint, TagPutEndpoint, TagDeleteEndpoint} from "./TagTypes"
import {ThreadGetEndpoint, ThreadPostEndpoint, ThreadPutEndpoint, ThreadDeleteEndpoint} from "./ThreadTypes"
import {TokenPostEndpoint, TokenDeleteEndpoint} from "./TokenTypes"
import {UploadPostEndpoint, UploadPutEndpoint} from "./UploadTypes"
import {UserGetEndpoint, UserPostEndpoint, UserPutEndpoint, UserDeleteEndpoint} from "./UserTypes"

export type GetEndpoint<T extends string> = 
    | CommentGetEndpoint<T>
    | CutenessGetEndpoint<T>
    | FavoriteGetEndpoint<T>
    | GroupGetEndpoint<T>
    | MessageGetEndpoint<T>
    | MiscGetEndpoint<T>
    | NoteGetEndpoint<T>
    | PostGetEndpoint<T>
    | SearchGetEndpoint<T>
    | TagGetEndpoint<T>
    | ThreadGetEndpoint<T>
    | UserGetEndpoint<T>

export type PostEndpoint<T extends string> = 
    | CommentPostEndpoint<T>
    | CutenessPostEndpoint<T>
    | FavoritePostEndpoint<T>
    | GroupPostEndpoint<T>
    | MessagePostEndpoint<T>
    | MiscPostEndpoint<T>
    | NotePostEndpoint<T>
    | PostPostEndpoint<T>
    | SearchPostEndpoint<T>
    | TagPostEndpoint<T>
    | ThreadPostEndpoint<T>
    | TokenPostEndpoint<T>
    | UploadPostEndpoint<T>
    | UserPostEndpoint<T>

export type PutEndpoint<T extends string> = 
    | CommentPutEndpoint<T>
    | FavoritePutEndpoint<T>
    | GroupPutEndpoint<T>
    | MessagePutEndpoint<T>
    | NotePutEndpoint<T>
    | PostPutEndpoint<T>
    | TagPutEndpoint<T>
    | ThreadPutEndpoint<T>
    | UploadPutEndpoint<T>
    | UserPutEndpoint<T>

export type DeleteEndpoint<T extends string> = 
    | CommentDeleteEndpoint<T> 
    | CutenessDeleteEndpoint<T>
    | FavoriteDeleteEndpoint<T>
    | GroupDeleteEndpoint<T>
    | MessageDeleteEndpoint<T>
    | MiscDeleteEndpoint<T>
    | NoteDeleteEndpoint<T>
    | PostDeleteEndpoint<T>
    | TagDeleteEndpoint<T>
    | ThreadDeleteEndpoint<T>
    | TokenDeleteEndpoint<T>
    | UserDeleteEndpoint<T>

export * from "./CommentTypes"
export * from "./CutenessTypes"
export * from "./FavoriteTypes"
export * from "./GroupTypes"
export * from "./HistoryTypes"
export * from "./MessageTypes"
export * from "./MiscTypes"
export * from "./NoteTypes"
export * from "./ParamTypes"
export * from "./PostTypes"
export * from "./ReportTypes"
export * from "./RequestTypes"
export * from "./SearchTypes"
export * from "./TagTypes"
export * from "./ThreadTypes"
export * from "./TokenTypes"
export * from "./UploadTypes"
export * from "./UserTypes"