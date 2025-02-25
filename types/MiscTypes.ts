import {PixivIllust} from "pixiv.ts"
import {DeviationRSSExtended} from "deviantart.ts"
import {Banner, PostRating, PostStyle, PostType, UploadImage, UploadTag} from "./Types"

export interface GIFFrame {
    frame: HTMLCanvasElement
    delay: number
}

export interface SaucenaoResponse {
    header: {
        similarity: string
        thumbnail: string
        index_id: number
        index_name: string
        dupes: number
        hidden: number
    },
    data: {
        ext_urls: string[]
        title?: string
        pixiv_id?: number
        member_name?: string
        member_id?: number
        da_id?: string
        author_name?: string
        author_url?: string
        danbooru_id?: number
        yandere_id?: number
        gelbooru_id?: number
        konachan_id?: number
        creator?: string
        material?: string
        characters?: string
        source?: string
        eng_name?: string
        jp_name?: string
        as_project?: string
        published?: string
        service?: string
        service_name?: string
        id?: string
        user_id?: string
        user_name?: string
        created_at?: string
        tweet_id?: string
        twitter_user_id?: string
        twitter_user_handle?: string
        mal_id?: string
    }
}

export type PixivResponse = PixivIllust & {user: {twitter: string}}

export interface Attachment {
    filename: string
    content: Buffer
}

export interface FileUpload {
    name: string
    bytes: number[]
}

export interface ContactParams {
    email: string
    subject: string 
    message: string 
    files?: FileUpload[]
}

export interface CopyrightParams {
    name: string 
    email: string 
    artistTag: string 
    socialMediaLinks: string 
    postLinks: string 
    removeAllRequest: boolean 
    proofLinks?: string
    files?: {name: string, bytes: number[]}[]
}

export interface WDTaggerResponse {
    tags: string[]
    characters: string[]
}

export interface OCRResponse {
    transcript: string
    translation: string
    x: number
    y: number
    width: number
    height: number
    imageWidth: number 
    imageHeight: number
}

export interface CoinbaseEvent {
    id: string
    type: string
    resource: string
    api_version: string
    created_at: string
    data: {
        id: string
        code: string
        metadata: {
            username: string
            email: string
        }
    }
}

export interface SourceLookupParams {
    current: UploadImage
    rating: PostRating
}

export interface SourceLookup {
    rating: PostRating
    artists: UploadTag[]
    danbooruLink: string
    artistIcon: string
    source: {
        title: string
        englishTitle: string
        artist: string
        source: string
        commentary: string
        englishCommentary: string
        bookmarks: string
        posted: string
        mirrors: string
    }
}

export interface TagLookupParams {
    current: UploadImage
    type: PostType
    rating: PostRating
    style: PostStyle
    hasUpscaled: boolean
}

export interface TagLookup {
    type: PostType
    rating: PostRating
    style: PostStyle
    artists: UploadTag[]
    characters: UploadTag[]
    series: UploadTag[]
    meta: string[]
    tags: string[]
    newTags: UploadTag[]
    danbooruLink: string
}

export interface PixelateOptions {
    isAnimation?: boolean
    isVideo?: boolean
    directWidth?: boolean
}

export interface SplatterOptions {
    isAnimation?: boolean
    isVideo?: boolean
    lineMultiplier?: number
    minOpacity?: number
    maxOpacity?: number
    minLineWidth?: number
    maxLineWidth?: number
    minLineLength?: number
    maxLineLength?: number
    maxAngle?: number
    imageExpand?: boolean
}

export type MiscGetEndpoint<T extends string> = 
    T extends "/api/misc/captcha/create" ? {params: {color: string}, response: string} :
    T extends "/api/misc/pixiv" ? {params: {url: string}, response: PixivResponse} :
    T extends "/api/misc/deviantart" ? {params: {url: string}, response: DeviationRSSExtended} :
    T extends "/api/misc/redirect" ? {params: {url: string}, response: string} :
    T extends "/api/misc/emojis" ? {params: null, response: {[key: string]: string}} :
    T extends "/api/misc/banner" ? {params: null, response: Banner | undefined} :
    T extends "/api/misc/api-key/status" ? {params: null, response: boolean} :
    never

export type MiscPostEndpoint<T extends string> = 
    T extends "/api/misc/captcha" ? {params: {captchaResponse: string}, response: null} :
    T extends "/api/misc/saucenao" ? {params: number[], response: SaucenaoResponse[]} :
    T extends "/api/misc/boorulinks" ? {params: {bytes: number[], pixivID: string}, response: string[]} :
    T extends "/api/misc/revdanbooru" ? {params: number[], response: string} :
    T extends "/api/misc/proxy" ? {params: {url: string}, response: {data: number[]}[]} :
    T extends "/api/misc/translate" ? {params: string[], response: string[]} :
    T extends "/api/misc/romajinize" ? {params: string[], response: string[]} :
    T extends "/api/misc/contact" ? {params: ContactParams, response: string} :
    T extends "/api/misc/copyright" ? {params: CopyrightParams, response: string} :
    T extends "/api/misc/wdtagger" ? {params: number[], response: WDTaggerResponse} :
    T extends "/api/misc/ocr" ? {params: number[], response: OCRResponse[]} :
    T extends "/api/premium/paymentlink" ? {params: null, response: {hosted_url: string}} :
    T extends "/api/premium/payment" ? {params: {event: CoinbaseEvent}, response: string} :
    T extends "/api/misc/setbanner" ? {params: {text: string, link: string}, response: string} :
    T extends "/api/misc/litterbox" ? {params: number[], response: string} :
    T extends "/api/client-key" ? {params: {publicKey: string}, response: string} :
    T extends "/api/server-key" ? {params: null, response: {publicKey: string}} :
    T extends "/api/misc/blacklistip" ? {params: {ip: string, reason: string}, response: string} :
    T extends "/api/misc/imghash" ? {params: number[], response: string} :
    T extends "/api/misc/api-key" ? {params: null, response: string} :
    T extends "/api/misc/sourcelookup" ? {params: SourceLookupParams, response: SourceLookup} :
    T extends "/api/misc/taglookup" ? {params: TagLookupParams, response: TagLookup} :
    T extends "/storage" ? {params: {link: string, songCover?: boolean}, response: string} :
    never

export type MiscDeleteEndpoint<T extends string> = 
    T extends "/api/misc/unblacklistip" ? {params: {ip: string}, response: string} :
    T extends "/api/misc/api-key/delete" ? {params: null, response: string} :
    never