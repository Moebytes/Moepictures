export type Themes =
    | "light"
    | "dark"

export type Languages =
    | "en"
    | "ja"

export type PostType =
    | "all"
    | "image"
    | "animation"
    | "video"
    | "comic"
    | "audio"
    | "model"
    | "live2d"

export type PostRating =
    | "all"
    | "all+l"
    | "cute" 
    | "sexy" 
    | "erotic" 
    | "lewd"

export type PostStyle =
    | "all"
    | "all+s"
    | "2d"
    | "3d"
    | "pixel"
    | "chibi"
    | "daki"
    | "sketch"
    | "lineart"
    | "promo"

export type PostSort = 
    | "random"
    | "date"
    | "reverse date"
    | "posted"
    | "reverse posted"
    | "bookmarks"
    | "reverse bookmarks"
    | "favorites"
    | "reverse favorites"
    | "cuteness"
    | "reverse cuteness"
    | "variations"
    | "reverse variations"
    | "parent"
    | "reverse parent"
    | "child"
    | "reverse child"
    | "groups"
    | "reverse groups"
    | "popularity"
    | "reverse popularity"
    | "tagcount"
    | "reverse tagcount"
    | "filesize"
    | "reverse filesize"
    | "aspectRatio"
    | "reverse aspectRatio"
    | "hidden"
    | "reverse hidden"
    | "locked"
    | "reverse locked"
    | "private"
    | "reverse private"

export type PostSize =
    | "tiny"
    | "small"
    | "medium"
    | "large"
    | "massive"

export type CategorySort =
    | "random"
    | "cuteness"
    | "reverse cuteness"
    | "posts"
    | "reverse posts"
    | "alphabetic"
    | "reverse alphabetic"

export type TagSort =
    | "random"
    | "date"
    | "reverse date"
    | "image"
    | "reverse image"
    | "aliases"
    | "reverse aliases"
    | "posts"
    | "reverse posts"
    | "alphabetic"
    | "reverse alphabetic"
    | "length"
    | "reverse length"

export type CommentSort =
    | "random"
    | "date"
    | "reverse date"

export type GroupSort =
    | "random"
    | "date"
    | "reverse date"
    | "posts"
    | "reverse posts"

export type TagType =
    | "all"
    | "tags"
    | "artist"
    | "character"
    | "series"
    | "meta"
    | "appearance"
    | "outfit"
    | "accessory"
    | "action"
    | "scenery"
    | "tag"

export type UserRole =
    | "admin"
    | "mod"
    | "system"
    | "premium-curator"
    | "curator"
    | "premium-contributor"
    | "contributor"
    | "premium"
    | "user"
    | "deleted"

export type AliasHistoryType =
    | "alias" 
    | "implication" 
    | "undo alias" 
    | "undo implication"

export type ImageFormat =
    | "jpg" 
    | "png" 
    | "gif" 
    | "webp"
    | "avif"
    | "jxl"
    | "svg"

export type Upscaler =
    | "real-cugan" 
    | "real-esrgan" 
    | "waifu2x"

export type CanvasDrawable =
    | HTMLCanvasElement 
    | HTMLImageElement 
    | HTMLVideoElement 
    | ImageBitmap

export interface FileFormat {
    jpg?: boolean
    png?: boolean
    webp?: boolean
    avif?: boolean
    gif?: boolean
    mp4?: boolean
    webm?: boolean
    mp3?: boolean
    wav?: boolean
    glb?: boolean
    fbx?: boolean
    obj?: boolean
    vrm?: boolean
    zip?: boolean
}

export interface Dimensions {
    width: number 
    height: number
    size: number
    polycount?: number
    duration?: number
}

export interface Storage {
    secret: string
    key: string
    upscaled: boolean
    r18: boolean
    pixelHash: string
    songCover?: boolean
}