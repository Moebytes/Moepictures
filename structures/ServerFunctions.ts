import nodemailer from "nodemailer"
import {Request, Response, NextFunction} from "express"
import path from "path"
import fs from "fs"
import FormData from "form-data"
import crypto from "crypto"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import {render} from "@react-email/components"
import S3 from "aws-sdk/clients/s3"
import CSRF from "csrf"
import axios from "axios"
import sharp from "sharp"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import child_process from "child_process"
import util from "util"
import Pixiv from "pixiv.ts"
import DeviantArt from "deviantart.ts"
import googleTranslate from "@vitalets/google-translate-api"
import Kuroshiro from "kuroshiro"
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji"
import tagConvert from "../assets/json/tag-convert.json"
import {MiniTag, Image, UploadImage, DeletedPost, PostFull, PostTagged, Attachment, Note, PostType, PostStyle,
UnverifiedPost, Tag, PostRating, UploadTag, PixivResponse, SaucenaoResponse, WDTaggerResponse, PostCuteness} from "../types/Types"

const csrf = new CSRF()
const exec = util.promisify(child_process.exec)
const pixiv = await Pixiv.refreshLogin(process.env.PIXIV_TOKEN!)
const deviantart = await DeviantArt.login(process.env.DEVIANTART_CLIENT_ID!, process.env.DEVIANTART_CLIENT_SECRET!)

let local = process.env.MOEPICTURES_LOCAL
let localR18 = process.env.MOEPICTURES_LOCAL_R18
let localUnverified = process.env.MOEPICTURES_LOCAL_UNVERIFIED

const s3 = new S3({region: "us-east-1", credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!
}})

export const keyGenerator = (req: Request, res: Response) => {
    return req.session.username || req.ip
}

export const handler = (req: Request, res: Response) => {
    req.session.captchaNeeded = true
    return res.status(429).send("Too many requests, try again later.")
}

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.apiKey) return next()
    if (!ServerFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
    next()
}

export const apiKeyLogin = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.username) return next()
    const apiKey = req.headers["x-api-key"] as string
    if (apiKey) {
        const hashedKey = cryptoFunctions.hashAPIKey(apiKey)
        const apiToken = await sql.token.apiKey(hashedKey)
        if (apiToken) {
            const user = await sql.user.user(apiToken.username)
            if (!user) return next()
            let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress
            ip = ip?.toString().replace("::ffff:", "") || ""
            req.session.$2fa = user.$2fa
            req.session.email = user.email
            req.session.emailVerified = user.emailVerified
            req.session.username = user.username
            req.session.joinDate = user.joinDate
            req.session.image = user.image 
            req.session.bio = user.bio
            req.session.publicFavorites = user.publicFavorites
            req.session.image = user.image
            req.session.imageHash = user.imageHash
            req.session.imagePost = user.imagePost
            req.session.role = user.role
            req.session.banned = user.banned
            const ips = functions.removeDuplicates([ip, ...(user.ips || [])].filter(Boolean))
            await sql.user.updateUser(user.username, "ips", ips)
            req.session.ips = ips
            const {secret, token} = ServerFunctions.generateCSRF()
            req.session.csrfSecret = secret
            req.session.csrfToken = token
            req.session.showRelated = user.showRelated
            req.session.showTooltips = user.showTooltips
            req.session.showTagBanner = user.showTagBanner
            req.session.downloadPixivID = user.downloadPixivID
            req.session.autosearchInterval = user.autosearchInterval
            req.session.upscaledImages = user.upscaledImages
            req.session.savedSearches = user.savedSearches
            req.session.showR18 = user.showR18
            req.session.postCount = user.postCount
            req.session.premiumExpiration = user.premiumExpiration
            req.session.banExpiration = user.banExpiration
            req.session.apiKey = true
        }
    }
    next()
}

export default class ServerFunctions {
    public static generateCSRF = () => {
        const secret = csrf.secretSync()
        const token = csrf.create(secret)
        return {secret, token}
    }

    public static validateCSRF = (req: Request) => {
        const csrfToken = req.headers["x-csrf-token"] as string
        return csrf.verify(req.session.csrfSecret!, csrfToken)
    }

    public static sendEncrypted = (data: any, req: Request, res: Response) => {
        if (req.session.apiKey) return res.status(200).send(data)
        if (permissions.noEncryption(req.session)) return res.status(200).send(data)
        if (!req.session.publicKey) return res.status(401).send("No public key")
        const encrypted = cryptoFunctions.encryptAPI(data, req.session.publicKey, req.session)
        return res.status(200).send(encrypted)
    }

    public static email = async (email: string, subject: string, jsx: React.ReactElement) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD,
            }
        })
        const html = await render(jsx)
        return transporter.sendMail({
            from: {name: "Moepictures", address: process.env.EMAIL_ADDRESS},
            to: email,
            subject: subject,
            html
        })
    }

    public static contactEmail = async (email: string, subject: string, message: string, attachments?: Attachment[]) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD,
            }
        })
        return transporter.sendMail({
            from: {name: "Moepictures", address: process.env.EMAIL_ADDRESS},
            to: process.env.EMAIL_ADDRESS,
            replyTo: email,
            subject: subject,
            text: message,
            attachments
        })
    }

    public static systemMessage = async (username: string, subject: string, message: string) => {
        const userMessages = await sql.message.userMessages(username)
        if (userMessages[0]?.creator === "moepictures" && userMessages[0]?.title === subject && userMessages[0]?.content === message) {
            const timeDifference = new Date().getTime() - new Date(userMessages[0].createDate).getTime()
            if (timeDifference < 10000) return
        }
        const messageID = await sql.message.insertMessage("moepictures", subject, message, false)
        await sql.message.bulkInsertRecipients(messageID, [username])
    }

    public static getFirstHistoryFile = async (file: string, upscaled: boolean, r18: boolean) => {
        const defaultBuffer = Buffer.from("")
        if (file.includes("artist/") || file.includes("character/") || file.includes("series/") || 
            file.includes("tag/") || file.includes("pfp/")) {
            if (functions.useLocalFiles()) {
                let folder = r18 ? localR18 : local
                const id = file.split("-")?.[0]?.match(/\d+/)?.[0]
                if (!id) return defaultBuffer
                const historyFolder = `${folder}/history/tag/${id}`
                if (!fs.existsSync(historyFolder)) return defaultBuffer
                let folders = fs.readdirSync(historyFolder)
                if (!folders.length) return defaultBuffer
                folders = folders.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstHistory = `${folder}/history/tag/${id}/${folders[0]}`
                let files = fs.readdirSync(firstHistory)
                if (!files.length) return defaultBuffer
                files = files.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstFile = `${folder}/history/tag/${id}/${folders[0]}/${files[0]}`
                return fs.readFileSync(firstFile)
            } else {
                return defaultBuffer
            }
        } else {
            if (functions.useLocalFiles()) {
                let folder = r18 ? localR18 : local
                let scaleFolder = upscaled ? "upscaled" : "original"
                const id = file.split("-")?.[0]?.match(/\d+/)?.[0]
                if (!id) return defaultBuffer
                const historyFolder = `${folder}/history/post/${id}/${scaleFolder}`
                if (!fs.existsSync(historyFolder)) return defaultBuffer
                let folders = fs.readdirSync(historyFolder)
                if (!folders.length) return defaultBuffer
                folders = folders.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstHistory = `${folder}/history/post/${id}/${scaleFolder}/${folders[0]}`
                let files = fs.readdirSync(firstHistory)
                if (!files.length) return defaultBuffer
                files = files.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstFile = `${folder}/history/post/${id}/${scaleFolder}/${folders[0]}/${files[0]}`
                return fs.readFileSync(firstFile)
            } else {
                return defaultBuffer
            }
        }
    }

    public static getFile = async (file: string, upscaled: boolean, r18: boolean) => {
        if (functions.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            let originalKey = `${folder}/${decodeURIComponent(file)}`
            let upscaledFile = `${file.split("/")[0].replace("-upscaled", "")}-upscaled/${file.split("/")[1]}`
            let upscaledKey = `${folder}/${decodeURIComponent(upscaledFile)}`
            if (file.includes("history/post")) {
                originalKey = originalKey.replace("upscaled/", "original/")
                upscaledKey = upscaledKey.replace("original/", "upscaled/")
            }
            if (!fs.existsSync(upscaled ? upscaledKey : originalKey)) return ServerFunctions.getFirstHistoryFile(file, upscaled, r18)
            if (upscaled) return fs.existsSync(upscaledKey) ? fs.readFileSync(upscaledKey) : Buffer.from("")
            return fs.existsSync(originalKey) ? fs.readFileSync(originalKey) : Buffer.from("")
        }
        return s3.getObject({Key: decodeURIComponent(file), Bucket: "moepictures"}).promise().then((r) => r.Body) as unknown as Buffer
    }

    public static uploadFile = async (file: string, content: any, r18: boolean) => {
        if (functions.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            const dir = path.dirname(`${folder}/${file}`)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(`${folder}/${file}`, content)
            return `${folder}/${file}`
        }
        const upload = await s3.upload({Body: content, Key: file, Bucket: "moepictures"}).promise()
        return upload.Location
    }

    public static deleteFile = async (file: string, r18: boolean) => {
        if (functions.useLocalFiles()) {
            try {
                let folder = r18 ? localR18 : local
                fs.unlinkSync(`${folder}/${file}`)
            } catch {}
            return
        }
        await s3.deleteObject({Key: file, Bucket: "moepictures"}).promise()
    }

    public static deleteIfEmpty = async (folderPath: string, r18: boolean) => {
        if (functions.useLocalFiles()) {
            try {
                let folder = r18 ? localR18 : local
                fs.rmdirSync(`${folder}/${folderPath}`)
            } catch {}
            return
        }
    }

    private static removeLocalDirectory = (dir: string) => {
        if (!fs.existsSync(dir)) return
        fs.readdirSync(dir).forEach((file) => {
            const current = path.join(dir, file)
            if (fs.lstatSync(current).isDirectory()) {
                ServerFunctions.removeLocalDirectory(current)
            } else {
                fs.unlinkSync(current)
            }
        })
        try {
            fs.rmdirSync(dir)
        } catch (error) {
            console.log(error)
        }
    }

    public static deleteFolder = async (folderPath: string, r18: boolean) => {
        if (functions.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            const dir = `${folder}/${folderPath}`
            return ServerFunctions.removeLocalDirectory(dir)
        }
        const listedObjects = await s3.listObjectsV2({Bucket: "moepictures", Prefix: folderPath}).promise()
        if (listedObjects.Contents?.length === 0) return
    
        const deleteParams = {Bucket: "moepictures", Delete: {Objects: [] as any}}
    
        listedObjects.Contents?.forEach(({Key}) => {
            deleteParams.Delete.Objects.push({Key});
        })
        await s3.deleteObjects(deleteParams).promise()
        if (listedObjects.IsTruncated) await ServerFunctions.deleteFolder(folderPath, r18)
    }

    public static renameFile = async (oldFile: string, newFile: string, oldR18: boolean, newR18: boolean) => {
        if (functions.useLocalFiles()) {
            let oldFolder = oldR18 ? localR18 : local
            let newFolder = newR18 ? localR18 : local
            try {
                fs.renameSync(`${oldFolder}/${oldFile}`, `${newFolder}/${newFile}`)
            } catch {}
            return
        }
        try {
            await s3.copyObject({CopySource: `moepictures/${oldFile}`, Key: newFile, Bucket: "moepictures"}).promise()
        } catch {
            await s3.copyObject({CopySource: `moepictures/${encodeURI(oldFile)}`, Key: newFile, Bucket: "moepictures"}).promise()
        }
        await s3.deleteObject({Key: oldFile, Bucket: "moepictures"}).promise()
    }

    public static renameFolder = async (oldFolder: string, newFolder: string, r18: boolean) => {
        if (functions.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            try {
                fs.renameSync(`${folder}/${oldFolder}`, `${folder}/${newFolder}`)
            } catch {
                fs.renameSync(`${folder}/${encodeURI(oldFolder)}`, `${folder}/${encodeURI(newFolder)}`)
            }
            return
        }
        try {
            const listedObjects = await s3.listObjectsV2({Bucket: "moepictures", Prefix: `${oldFolder}/`}).promise()
    
            if (listedObjects.Contents?.length === 0) return
            const renamePromises = listedObjects.Contents!.map(async (obj) => {
                const oldKey = obj.Key 
                if (!oldKey) return
                const newKey = oldKey.replace(`${oldFolder}/`, `${newFolder}/`)
                try {
                    await s3.copyObject({CopySource: `moepictures/${oldKey}`, Key: newKey, Bucket: "moepictures"}).promise()
                } catch {
                    await s3.copyObject({CopySource: `moepictures/${encodeURI(oldKey)}`, Key: newKey, Bucket: "moepictures"}).promise()
                }
                await s3.deleteObject({Key: oldKey, Bucket: "moepictures"}).promise()
            })
            await Promise.all(renamePromises)
        } catch (error) {
            console.error("Error renaming folder in S3:", error)
        }
    }

    public static getNextKey = async (type: string, name: string, r18: boolean) => {
        const key = `history/${type}/${name}`
        if (functions.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            if (!fs.existsSync(`${folder}/${key}`)) return 1
            const objects = fs.readdirSync(`${folder}/${key}`)
            let nextKey = 0
            for (let i = 0; i < objects.length; i++) {
                const object = objects[i]
                if (!object) continue
                const keyMatch = object.replace(key, "").match(/\d+/)?.[0]
                const keyNumber = Number(keyMatch)
                if (keyNumber >= nextKey) nextKey = keyNumber
            }
            return nextKey + 1
        }
        const objects = await s3.listObjects({Prefix: key, Bucket: "moepictures"}).promise()
        let nextKey = 0
        for (let i = 0; i < (objects.Contents || []).length; i++) {
            const object = objects.Contents?.[i]
            if (!object) continue
            const keyMatch = object.Key?.replace(key, "").match(/\d+/)?.[0]
            const keyNumber = Number(keyMatch)
            if (keyNumber >= nextKey) nextKey = keyNumber
        }
        return nextKey + 1
    }

    public static getUnverifiedFile = async (file: string, upscaled?: boolean) => {
        if (functions.useLocalFiles()) {
            let originalKey = `${localUnverified}/${decodeURIComponent(file)}`
            let upscaledFile = `${file.split("/")[0].replace("-upscaled", "")}-upscaled/${file.split("/")[1]}`
            let upscaledKey = `${localUnverified}/${decodeURIComponent(upscaledFile)}`
            if (upscaled) return fs.existsSync(upscaledKey) ? fs.readFileSync(upscaledKey) : Buffer.from("")
            return fs.existsSync(originalKey) ? fs.readFileSync(originalKey) : Buffer.from("")
        }
        return s3.getObject({Key: decodeURIComponent(file), Bucket: "moepictures-unverified"}).promise().then((r) => r.Body) as unknown as Buffer
    }

    public static uploadUnverifiedFile = async (file: string, content: any) => {
        if (functions.useLocalFiles()) {
            const dir = path.dirname(`${localUnverified}/${file}`)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(`${localUnverified}/${file}`, content)
            return `${localUnverified}/${file}`
        }
        const upload = await s3.upload({Body: content, Key: file, Bucket: "moepictures-unverified"}).promise()
        return upload.Location
    }

    public static deleteUnverifiedFile = async (file: string) => {
        if (functions.useLocalFiles()) {
            const dir = path.dirname(`${localUnverified}/${file}`)
            try {
                fs.unlinkSync(`${localUnverified}/${file}`)
                //fs.rmdirSync(dir)
            } catch {}
            return
        }
        await s3.deleteObject({Key: file, Bucket: "moepictures-unverified"}).promise()
    }

    public static tagCategories = async (tags: string[] | undefined) => {
        if (!tags) tags = []
        let result = await sql.tag.tags(tags.filter(Boolean))
        let artists = [] as MiniTag[] 
        let characters = [] as MiniTag[] 
        let series = [] as MiniTag[] 
        let newTags = [] as MiniTag[] 
        for (let i = 0; i < tags.length; i++) {
            const index = result.findIndex((r: any) => tags[i] === r.tag)
            const obj = {} as MiniTag 
            obj.tag = tags[i]
            obj.type = result[index].type
            obj.image = result[index].image
            obj.imageHash = result[index].imageHash
            obj.description = result[index].description 
            obj.social = result[index].social
            obj.twitter = result[index].twitter
            obj.website = result[index].website
            obj.fandom = result[index].fandom
            if (result[index].type === "artist") {
                artists.push(obj)
            } else if (result[index].type === "character") {
                characters.push(obj)
            } else if (result[index].type === "series") {
                series.push(obj)
            } else {
                newTags.push(obj)
            }
        }
        return {artists, characters, series, tags: newTags}
    }

    public static unverifiedTagCategories = async (tags: string[] | undefined) => {
        if (!tags) tags = []
        let result = await sql.tag.unverifiedTags(tags.filter(Boolean))
        let artists = [] as MiniTag[] 
        let characters = [] as MiniTag[] 
        let series = [] as MiniTag[] 
        let newTags = [] as MiniTag[]
        for (let i = 0; i < tags.length; i++) {
            const index = result.findIndex((r: any) => tags[i] === r.tag)
            const obj = {} as MiniTag 
            obj.tag = tags[i]
            obj.type = result[index].type
            obj.image = result[index].image
            obj.imageHash = result[index].imageHash
            obj.description = result[index].description 
            obj.social = result[index].social
            obj.twitter = result[index].twitter
            obj.website = result[index].website
            obj.fandom = result[index].fandom
            if (result[index].type === "artist") {
                artists.push(obj)
            } else if (result[index].type === "character") {
                characters.push(obj)
            } else if (result[index].type === "series") {
                series.push(obj)
            } else {
                newTags.push(obj)
            }
        }
        return {artists, characters, series, tags: newTags}
    }

    public static imagesChanged = async (oldImages: Image[], newImages: UploadImage[], upscaled: boolean, r18: boolean) => {
        if (oldImages?.length !== newImages?.length) return true
        for (let i = 0; i < oldImages.length; i++) {
            const oldImage = oldImages[i]
            let oldPath = ""
            if (upscaled) {
                oldPath = functions.getUpscaledImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.upscaledFilename || oldImage.filename)
            } else {
                oldPath = functions.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            }
            const oldBuffer = await ServerFunctions.getFile(oldPath, false, r18) as any
            if (!oldBuffer) continue
            const newImage = newImages[i]
            const newBuffer = Buffer.from(newImage.bytes) as any
            const imgMD5 = crypto.createHash("md5").update(oldBuffer).digest("hex")
            const currentMD5 = crypto.createHash("md5").update(newBuffer).digest("hex")
            if (imgMD5 !== currentMD5) return true
        }
        return false
    }

    public static imagesChangedUnverified = async (oldImages: Image[], newImages: Image[] | UploadImage[], upscaled: boolean, isEdit?: boolean, r18?: boolean) => {
        if (oldImages?.length !== newImages?.length) return true
        for (let i = 0; i < oldImages.length; i++) {
            const oldImage = oldImages[i]
            const newImage = newImages[i]
            if (!oldImage || !newImage) continue
            let oldPath = ""
            if (upscaled) {
                oldPath = functions.getUpscaledImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.upscaledFilename || oldImage.filename)
            } else {
                oldPath = functions.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            }
            const oldBuffer = isEdit ? await ServerFunctions.getFile(oldPath, false, r18 ?? false) : await ServerFunctions.getUnverifiedFile(oldPath, false) as any
            if (!oldBuffer) continue
            let newBuffer = null as Buffer | null
            if ("bytes" in newImage) {
                newBuffer = Buffer.from(newImage.bytes)
            } else {
                let newPath = ""
                let postImage = newImage as Image
                if (upscaled) {
                    newPath = functions.getUpscaledImagePath(postImage.type, postImage.postID, postImage.order, postImage.upscaledFilename || postImage.filename)
                } else {
                    newPath = functions.getImagePath(postImage.type, postImage.postID, postImage.order, postImage.filename)
                }
                newBuffer = await ServerFunctions.getUnverifiedFile(newPath, false)
            }
            if (!newBuffer) continue
            const imgMD5 = crypto.createHash("md5").update(oldBuffer).digest("hex")
            const currentMD5 = crypto.createHash("md5").update(newBuffer as any).digest("hex")
            if (imgMD5 !== currentMD5) return true
        }
        return false
    }

    public static buffersChanged = (oldBuffer: Buffer, currentBuffer: Buffer) => {
        if (!oldBuffer && !currentBuffer) return false
        if (!oldBuffer && currentBuffer) return true
        const imgMD5 = crypto.createHash("md5").update(oldBuffer as any).digest("hex")
        const currentMD5 = crypto.createHash("md5").update(currentBuffer as any).digest("hex")
        if (imgMD5 !== currentMD5) return true
        return false
    }

    public static migratePost = async (post: PostFull, oldType: string, newType: string, oldR18: boolean, newR18: boolean) => {
        if (oldType === newType && oldR18 === newR18) return
        for (let i = 0; i < post.images.length; i++) {
            if ((post.images[i].type === "image" || post.images[i].type === "comic") && 
            (newType === "image" || newType === "comic")) {
                await sql.post.updateImage(post.images[i].imageID, "type", newType)
            }
        }
        const updated = await sql.post.post(post.postID) as PostFull
        for (let i = 0; i < post.images.length; i++) {
            const imagePath = functions.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
            const upscaledImagePath = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
            const updatedImagePath = functions.getImagePath(updated.images[i].type, updated.postID, updated.images[i].order, updated.images[i].filename)
            const updatedUpscaledImagePath = functions.getUpscaledImagePath(updated.images[i].type, updated.postID, updated.images[i].order, updated.images[i].upscaledFilename || updated.images[i].filename)
            if (oldR18 !== newR18 || imagePath !== updatedImagePath || upscaledImagePath !== updatedUpscaledImagePath) {
                ServerFunctions.renameFile(imagePath, updatedImagePath, oldR18, newR18)
                ServerFunctions.renameFile(upscaledImagePath, updatedUpscaledImagePath, oldR18, newR18)
            } 
        }
        if (oldR18 !== newR18) {
            ServerFunctions.renameFile(`history/post/${post.postID}`, `history/post/${post.postID}`, oldR18, newR18)
        }
    }

    public static orderHashes = async (oldImages: Image[], newImages: Image[] | UploadImage[], r18: boolean, unverified?: boolean) => {
        let oldHashes = [] as {hash: string, order: number}[]
        let newHashes = [] as {hash: string, order: number}[]
        for (let i = 0; i < oldImages.length; i++) {
            const oldImage = oldImages[i]
            const newImage = newImages[i]
            if (!oldImage || !newImage) continue
            let oldPath = functions.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            const oldBuffer = unverified ? await ServerFunctions.getUnverifiedFile(oldPath, false)
            : await ServerFunctions.getFile(oldPath, false, r18)
            let newBuffer = null as Buffer | null
            if ("bytes" in newImage) {
                newBuffer = Buffer.from(newImage.bytes)
            } else {
                let postImage = newImage as Image
                let newPath = functions.getImagePath(postImage.type, postImage.postID, postImage.order, postImage.filename)
                newBuffer = unverified ? await ServerFunctions.getUnverifiedFile(newPath, false)
                : await ServerFunctions.getFile(newPath, false, r18)
            }
            let oldHash = await phash(oldBuffer).then((hash: string) => functions.binaryToHex(hash))
            let newHash = await phash(newBuffer).then((hash: string) => functions.binaryToHex(hash))
            oldHashes.push({hash: oldHash, order: oldImages[i].order})
            newHashes.push({hash: newHash, order: (newImages[i] as Image)?.order || i + 1})
        }
        return {oldHashes, newHashes}
    }

    public static migrateNotes = async (oldImages: Image[], newImages: Image[] | UploadImage[], r18: boolean, unverified?: boolean) => {
        const {oldHashes, newHashes} = await ServerFunctions.orderHashes(oldImages, newImages, r18, unverified)
        let changedNotes = [] as {noteID: string, oldOrder: number, newOrder: number}[]
        let deletedNotes = [] as {noteID: string}[]
        const postID = oldImages[0].postID
        let postNotes = [] as Note[]
        if (unverified) {
            postNotes = await sql.note.unverifiedPostNotes(postID)
        } else {
            postNotes = await sql.note.postNotes(postID)
        }
        for (const note of postNotes) {
            const hash = note.imageHash
            const oldOrder = oldHashes.find((o) => dist(o.hash, hash) < 7)?.order
            if (!oldOrder) continue
            const newOrder = newHashes.find((n) => dist(n.hash, hash) < 7)?.order
            if (newOrder === undefined) {
                deletedNotes.push({noteID: note.noteID})
            } else if (oldOrder !== newOrder) {
                changedNotes.push({noteID: note.noteID, oldOrder, newOrder})
            }
        }
        for (const changed of changedNotes) {
            if (unverified) {
                await sql.note.updateUnverifiedNote(changed.noteID, "order", changed.newOrder)
            } else {
                await sql.note.updateNote(changed.noteID, "order", changed.newOrder)
            }
        }
        for (const deleted of deletedNotes) {
            if (unverified) {
                await sql.note.deleteUnverifiedNote(deleted.noteID)
            } else {
                await sql.note.deleteNote(deleted.noteID)
            }
        }
    }

    public static deletePost = async (post: DeletedPost | PostCuteness) => {
        let r18 = functions.isR18(post.rating)
        await sql.post.deletePost(post.postID)
        for (let i = 0; i < post.images.length; i++) {
            const file = functions.getImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].filename)
            const upscaledFile = functions.getUpscaledImagePath(post.images[i].type, post.postID, post.images[i].order, post.images[i].upscaledFilename || post.images[i].filename)
            const thumbnail = functions.getThumbnailImagePath(post.images[i].type, post.images[i].thumbnail)
            await ServerFunctions.deleteFile(file, r18)
            await ServerFunctions.deleteFile(upscaledFile, r18)
            await ServerFunctions.deleteFile(thumbnail, r18)
        }
        await ServerFunctions.deleteFolder(`history/post/${post.postID}`, r18).catch(() => null)
    }

    public static deleteUnverifiedPost = async (unverified: UnverifiedPost) => {
        await sql.post.deleteUnverifiedPost(unverified.postID)
        for (let i = 0; i < unverified.images.length; i++) {
            const file = functions.getImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].filename)
            const upscaledFile = functions.getUpscaledImagePath(unverified.images[i].type, unverified.postID, unverified.images[i].order, unverified.images[i].upscaledFilename || unverified.images[i].filename)
            const thumbnail = functions.getThumbnailImagePath(unverified.images[i].type, unverified.images[i].thumbnail)
            await ServerFunctions.deleteUnverifiedFile(file)
            await ServerFunctions.deleteUnverifiedFile(upscaledFile)
            await ServerFunctions.deleteUnverifiedFile(thumbnail)
        }
    }

    public static deleteTag = async (tag: Tag) => {
        await ServerFunctions.deleteFolder(`history/tag/${tag.tag}`, false).catch(() => null)
        if (tag.image) {
            await ServerFunctions.deleteFile(functions.getTagPath(tag.type, tag.image), false).catch(() => null)
        }
        await sql.tag.deleteTag(tag.tag)
    }

    public static updateImplications = async (posts: PostTagged[], implications: string[]) => {
        for (const post of posts) {
            for (const implication of implications) {
                if (!post.tags.includes(implication)) {
                    await sql.tag.insertTagMap(post.postID, [implication])
                }
            }
        }
    }

    public static batchUpdateImplications = async () => {
        console.log("Updating all tag implications...")
        const posts = await sql.search.posts()
        for (let i = 0; i < posts.length; i++) {
            const postID = posts[i].postID
            let tagMap = posts[i].tags
            for (let i = 0; i < tagMap.length; i++) {
                const implications = await sql.tag.implications(tagMap[i])
                if (implications?.[0]) tagMap.push(...implications.map(((i: any) => i.implication)))
            }
            tagMap = functions.removeDuplicates(tagMap)
            //await sql.tag.purgeTagMap(postID)
            //await sql.tag.insertTagMap(postID, tagMap)
        }
        console.log("Done")
    }

    public static updateHashes = async () => {
        console.log("Updating all hashes...")
        const modelPosts = await sql.search.search([], "model", "all", "all", "date")
        const audioPosts = await sql.search.search([], "audio", "all", "all", "date")
        const posts = [...modelPosts, ...audioPosts]
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i]
            for (let j = 0; j < post.images.length; j++) {
                const image = post.images[j]
                const imgPath = functions.getImagePath(image.type, post.postID, image.order, image.filename)
                const buffer = await ServerFunctions.getFile(imgPath, false, false) as any
                const md5 = crypto.createHash("md5").update(buffer).digest("hex")
                await sql.post.updateImage(image.imageID, "hash", md5)
            }
        }
        console.log("Done")
    }

    public static md5 = (buffer: Buffer) => {
        return crypto.createHash("md5").update(new Uint8Array(buffer)).digest("hex")
    }

    public static tagMap = async () => {
        let result = await sql.tag.tags([])
        const tagMap = {} as {[key: string]: Tag}
        for (const tag of result) {
            tagMap[tag.tag] = tag
        }
        return tagMap
    }

    public static ipRegion = async (ip: string) => {
        const ipInfo = await axios.get(`http://ip-api.com/json/${ip}`).then((r) => r.data).catch(() => null)
        let region = ipInfo?.regionName || "unknown"
        if (ip === "127.0.0.1" || ip.startsWith("192.168.68")) region = "localhost"
        return region
    }

    public static getPixivIllust = async (link: string) => {
        let resolvable = link as string | number
        if (link.includes("pximg.net")) {
            const id = path.basename(link).match(/(\d+)(?=_)/)?.[0]
            resolvable = Number(id)
        }
        const illust = await pixiv.illust.get(resolvable) as PixivResponse
        const user = await pixiv.user.webDetail(illust.user.id)
        const twitter = user.social?.twitter?.url?.trim().match(/(?<=com\/).*?(?=\?|$)/)?.[0]
        illust.user.twitter = twitter || ""
        illust.user.profile_image_urls.medium = user.imageBig
        return illust
    }

    public static getDeviantartDeviation = async (link: string) => {
        const deviationRSS = await deviantart.rss.get(link)
        const deviation = await deviantart.extendRSSDeviations([deviationRSS]).then((r) => r[0])
        return deviation
    }

    public static translate = async (words: string[]) => {
        const translate = async (text: string) => {
            try {
                const translated = await googleTranslate(text, {from: "ja", to: "en"})
                return translated.text
            } catch {
                return text
            }
        }
        let translated = await Promise.all(words.map((w) => translate(w)))
        return translated
    }

    public static romajinize = async (words: string[]) => {
        const kuroshiro = new Kuroshiro()
        await kuroshiro.init(new KuromojiAnalyzer())
        const romajinize = async (text: string) => {
            const result = await kuroshiro.convert(text, {mode: "spaced", to: "romaji"})
            return result.replace(/<\/?[^>]+(>|$)/g, "")
        }
        let romajinized = await Promise.all(words.map((w) => romajinize(w)))
        return romajinized as string[]
    }

    public static followRedirect = async (link: string) => {
        const redirect = await axios.head(link).then((r) => r.request.res.responseUrl)
        return redirect as string
    }

    public static saucenaoLookup = async (bytes: number[]) => {
        const form = new FormData()
        form.append("db", "999")
        form.append("api_key", process.env.SAUCENAO_KEY)
        form.append("output_type", 2)
        const inputType = functions.bufferFileType(bytes)?.[0]
        form.append("file", Buffer.from(bytes), {
            filename: `file.${inputType.extension}`,
            contentType: inputType.mime
        })
        let result = await axios.post("https://saucenao.com/search.php", form, {headers: form.getHeaders()})
        .then((r) => r.data.results) as SaucenaoResponse[]
        result = result.sort((a, b) => Number(b.header.similarity) - Number(a.header.similarity))
        result = result.filter((r) => Number(r.header.similarity) > 70)
        return result
    }

    public static squareCrop = async (buffer: Buffer) => {
        const metadata = await sharp(buffer).metadata()
        const size = Math.min(metadata.width!, metadata.height!)
        const centerPosition = Math.max(0, Math.floor((metadata.width! - size) / 2))
        return sharp(buffer).extract({width: size, height: size, left: centerPosition, top: 0}).toBuffer()
    }

    public static booruLinks = async (bytes: number[], pixivID: string) => {
        const handleFallback = async () => {
            if (!pixivID) return Promise.reject("No pixivID")
            const getDanbooruLink = async (pixivID: number) => {
                const req = await axios.get(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixivID}&z=5`).then((r) => r.data)
                if (!req[0]) return {danbooru: "", url: ""}
                return {danbooru: `https://danbooru.donmai.us/posts/${req[0].id}`, md5: req[0].md5}
            }
            const getGelbooruLink = async (md5: string) => {
                const req = await axios.get(`https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=md5%3a${md5}`).then((r) => r.data)
                return req.post?.[0] ? `https://gelbooru.com/index.php?page=post&s=view&id=${req.post[0].id}` : ""
            }
            const getSafebooruLink = async (md5: string) => {
                const req = await axios.get(`https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=md5%3a${md5}`).then((r) => r.data)
                return req[0] ? `https://safebooru.org/index.php?page=post&s=view&id=${req[0].id}` : ""
            }
            const getYandereLink = async (md5: string) => {
                const req = await axios.get(`https://yande.re/post.json?tags=md5%3A${md5}`).then((r) => r.data)
                return req[0] ? `https://yande.re/post/show/${req[0].id}` : ""
            }
            const getKonachanLink = async (md5: string) => {
                const req = await axios.get(`https://konachan.net/post.json?tags=md5%3A${md5}`).then((r) => r.data)
                return req[0] ? `https://konachan.net/post/show/${req[0].id}` : ""
            }
            const {danbooru, md5} = await getDanbooruLink(Number(pixivID)).catch(() => ({danbooru: "", md5: ""}))
            const gelbooru = await getGelbooruLink(md5).catch(() => "")
            const safebooru = await getSafebooruLink(md5).catch(() => "")
            const yandere = await getYandereLink(md5).catch(() => "")
            const konachan = await getKonachanLink(md5).catch(() => "")
            let mirrors = [] as string[]
            if (danbooru) mirrors.push(danbooru)
            if (gelbooru) mirrors.push(gelbooru)
            if (safebooru) mirrors.push(safebooru)
            if (yandere) mirrors.push(yandere)
            if (konachan) mirrors.push(konachan)
            return mirrors
        }
        if (!bytes) return Promise.reject("Image bytes must be provided")
        const html = await axios.get("https://danbooru.donmai.us/iqdb_queries")
        const csrfToken = html.data.match(/(?<=csrf-token" content=")(.*?)(?=")/)[0]
        const cookie = html.headers["set-cookie"]?.[0] || ""
        const oldBuffer = Buffer.from(bytes)
        const oldHash = await phash(oldBuffer).then((hash: any) => functions.binaryToHex(hash))
        const form = new FormData()
        form.append("authenticity_token", csrfToken)
        form.append("search[file]", oldBuffer, {filename: "image.png"})
        const result = await axios.post("https://danbooru.donmai.us/iqdb_queries.json", form, {headers: {cookie, ...form.getHeaders()}}).then((r) => r.data)
        if (result[0]?.score < 70) return []
        const original = result[0].post.file_url
        if (!original || path.extname(original) === ".zip" || path.extname(original) === ".mp4") return handleFallback()
        const buffer = await fetch(original).then((r) => r.arrayBuffer())
        const hash = await phash(Buffer.from(buffer)).then((hash: any) => functions.binaryToHex(hash))
        if (dist(hash, oldHash) < 7) {
            const mediaId = result[0].post.media_asset.id
            const html = await axios.get(`https://danbooru.donmai.us/media_assets/${mediaId}`).then((r) => r.data)
            const links = html.match(/(?<=Source<\/th>\s*<td class="break-all"><a [^>]*href=").*?(?=")/gm)
            let mirrors = [] as string[]
            let danbooruLink = `https://danbooru.donmai.us/posts/${result[0].post.id}`
            mirrors.push(danbooruLink)
            for (let link of links) {
                link = link.replaceAll("&amp;", "&")
                if (link.includes("twitter") || link.includes("x.com")) {
                    const id = link.match(/(?<=status\/).*?(?=$)/)?.[0]
                    mirrors.push(`https://twitter.com/i/web/status/${id}`)
                }
                if (link.includes("gelbooru")) {
                    const redirect = await axios.get(link)
                    mirrors.push(redirect.request.res.responseUrl)
                }
                if (link.includes("safebooru")) mirrors.push(link)
                if (link.includes("yande.re")) mirrors.push(link)
                if (link.includes("konachan")) mirrors.push(link)
                if (link.includes("zerochan")) mirrors.push(link)
            }
            return mirrors
        } else {
            return []
        }
    }

    public static sourceLookup = async (current: UploadImage, rating: PostRating) => {
        let bytes = [] as number[]
        if (current.thumbnail) {
            bytes = await functions.base64toUint8Array(current.thumbnail).then((r) => Object.values(r))
        } else {
            bytes = current.bytes
        }
        let source = ""
        let artist = ""
        let title = ""
        let englishTitle = ""
        let commentary = ""
        let englishCommentary = ""
        let posted = ""
        let bookmarks = ""
        let danbooruLink = ""
        let artistIcon = ""
        let artists = [{}] as UploadTag[]
        let mirrors = [] as string[]

        let basename = path.basename(current.name, path.extname(current.name)).trim()
        if (/^\d+(?=$|_p)/.test(basename)) {
            const pixivID = basename.match(/^\d+(?=$|_p)/gm)?.[0] ?? ""
            source = `https://www.pixiv.net/artworks/${pixivID}`
            const result = await functions.fetch(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixivID}`)
            if (result.length) {
                danbooruLink = `https://danbooru.donmai.us/posts/${result[0].id}.json`
                if (result[0].rating === "q") rating = functions.r17()
                if (result[0].rating === "e") rating = functions.r18()
            }
            try {
                const illust = await ServerFunctions.getPixivIllust(source)
                commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                posted = functions.formatDate(new Date(illust.create_date), true)
                source = illust.url!
                title = illust.title
                artist = illust.user.name
                bookmarks = String(illust.total_bookmarks)
                const translated = await ServerFunctions.translate([title, commentary])
                if (translated) {
                    englishTitle = translated[0]
                    englishCommentary = translated[1]
                }
                if (illust.x_restrict !== 0) {
                    if (rating === functions.r13()) rating = functions.r17()
                }
                artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await ServerFunctions.romajinize([artist]).then((r) => r[0])
                artistIcon = illust.user.profile_image_urls.medium
                artists.push({})
            } catch (e) {
                console.log(e)
            }
            mirrors = await ServerFunctions.booruLinks(bytes, pixivID)
            const mirrorStr = mirrors?.length ? mirrors.join("\n") : ""
            return {
                rating,
                artists,
                danbooruLink,
                source: {
                    title,
                    englishTitle,
                    artist,
                    source,
                    commentary,
                    englishCommentary,
                    bookmarks,
                    posted,
                    mirrors: mirrorStr
                }
            }
        } else {
            let results = await ServerFunctions.saucenaoLookup(bytes)
            if (results.length) {
                const pixiv = results.filter((r) => r.header.index_id === 5)
                const twitter = results.filter((r) => r.header.index_id === 41)
                const artstation = results.filter((r) => r.header.index_id === 39)
                const deviantart = results.filter((r) => r.header.index_id === 34)
                const danbooru = results.filter((r) => r.header.index_id === 9)
                const gelbooru = results.filter((r) => r.header.index_id === 25)
                const konachan = results.filter((r) => r.header.index_id === 26)
                const yandere = results.filter((r) => r.header.index_id === 12)
                const anime = results.filter((r) => r.header.index_id === 21)
                if (pixiv.length) mirrors.push(`https://www.pixiv.net/artworks/${pixiv[0].data.pixiv_id}`)
                if (twitter.length) mirrors.push(twitter[0].data.ext_urls[0])
                if (deviantart.length) {
                    let redirectedLink = ""
                    try {
                        redirectedLink = await ServerFunctions.followRedirect(deviantart[0].data.ext_urls[0])
                    } catch {
                        // ignore
                    }
                    mirrors.push(redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0])
                }
                if (artstation.length) mirrors.push(artstation[0].data.ext_urls[0])
                if (danbooru.length) mirrors.push(danbooru[0].data.ext_urls[0])
                if (gelbooru.length) mirrors.push(gelbooru[0].data.ext_urls[0])
                if (yandere.length) mirrors.push(yandere[0].data.ext_urls[0])
                if (konachan.length) mirrors.push(konachan[0].data.ext_urls[0])
                if (danbooru.length) danbooruLink = `https://danbooru.donmai.us/posts/${danbooru[0].data.danbooru_id}.json`
                if (pixiv.length) {
                    source = `https://www.pixiv.net/artworks/${pixiv[0].data.pixiv_id}`
                    if (!danbooru.length) {
                        const result = await functions.fetch(`https://danbooru.donmai.us/posts.json?tags=pixiv_id%3A${pixiv[0].data.pixiv_id}`)
                        if (result.length) {
                            danbooruLink = `https://danbooru.donmai.us/posts/${result[0].id}.json`
                            if (result[0].rating === "q") rating = functions.r17()
                            if (result[0].rating === "e") rating = functions.r18()
                        }
                    }
                    artist = pixiv[0].data.author_name || ""
                    title = pixiv[0].data.title || ""
                    try {
                        const illust = await ServerFunctions.getPixivIllust(source)
                        commentary = `${functions.decodeEntities(illust.caption.replace(/<\/?[^>]+(>|$)/g, ""))}` 
                        posted = functions.formatDate(new Date(illust.create_date), true)
                        source = illust.url!
                        title = illust.title
                        artist = illust.user.name 
                        bookmarks = String(illust.total_bookmarks)
                        const translated = await ServerFunctions.translate([title, commentary])
                        if (translated) {
                            englishTitle = translated[0]
                            englishCommentary = translated[1]
                        }
                        if (illust.x_restrict !== 0) {
                            if (rating === functions.r13()) rating = functions.r17()
                        }
                        artists[artists.length - 1].tag = illust.user.twitter ? functions.fixTwitterTag(illust.user.twitter) : await ServerFunctions.romajinize([artist]).then((r) => r[0])
                        artistIcon = illust.user.profile_image_urls.medium
                        artists.push({})
                    } catch (e) {
                        console.log(e)
                    }
                } else if (deviantart.length) {
                    let redirectedLink = ""
                    try {
                        redirectedLink = await ServerFunctions.followRedirect(deviantart[0].data.ext_urls[0])
                    } catch {
                        // ignore
                    }
                    source = redirectedLink ? redirectedLink : deviantart[0].data.ext_urls[0]
                    artist = deviantart[0].data.member_name || ""
                    title = deviantart[0].data.title || ""
                    try {
                        const deviation = await ServerFunctions.getDeviantartDeviation(source)
                        title = deviation.title
                        artist = deviation.author.user.username
                        source = deviation.url
                        commentary = deviation.description
                        posted = functions.formatDate(new Date(deviation.date), true)
                        if (deviation.rating === "adult") {
                            if (rating === functions.r13()) rating = functions.r17()
                        }
                        artists[artists.length - 1].tag = artist
                        artistIcon = deviation.author.user.usericon
                        artists.push({})
                    } catch (e) {
                        console.log(e)
                    } 
                } else if (anime.length) {
                    title = anime[0].data.source || ""
                    source = `https://myanimelist.net/anime/${anime[0].data.mal_id}/`
                } else if (twitter.length) {
                    source = twitter[0].data.ext_urls[0]
                    artist = twitter[0].data.twitter_user_handle || ""
                } else if (danbooru.length) {
                    source = danbooru[0].data.ext_urls[0]
                    artist = danbooru[0].data.creator || ""
                    title = danbooru[0].data.characters || ""
                } else if (gelbooru.length) {
                    source = gelbooru[0].data.ext_urls[0]
                    artist = gelbooru[0].data.creator || ""
                    title = gelbooru[0].data.characters || ""
                } else if (yandere.length) {
                    source = yandere[0].data.ext_urls[0]
                    artist = yandere[0].data.creator || ""
                    title = yandere[0].data.characters || ""
                } else if (konachan.length) {
                    source = konachan[0].data.ext_urls[0]
                    artist = konachan[0].data.creator || ""
                    title = konachan[0].data.characters || ""
                }
            }
            mirrors = functions.removeItem(mirrors, source)
            const mirrorStr = mirrors?.length ? mirrors.join("\n") : ""
            return {
                rating,
                artists,
                danbooruLink,
                artistIcon,
                source: {
                    title,
                    englishTitle,
                    artist,
                    source,
                    commentary,
                    englishCommentary,
                    bookmarks,
                    posted,
                    mirrors: mirrorStr
                }
            }
        }
    }

    public static revdanbooru = async (bytes: number[]) => {
        const html = await axios.get("https://danbooru.donmai.us/iqdb_queries")
        const csrfToken = html.data.match(/(?<=csrf-token" content=")(.*?)(?=")/)[0]
        const cookie = html.headers["set-cookie"]?.[0] || ""
        const oldBuffer = Buffer.from(bytes)
        const oldHash = await phash(oldBuffer).then((hash: any) => functions.binaryToHex(hash))
        const form = new FormData()
        form.append("authenticity_token", csrfToken)
        form.append("search[file]", oldBuffer, {filename: "image.png"})
        const result = await axios.post("https://danbooru.donmai.us/iqdb_queries.json", form, {headers: {cookie, ...form.getHeaders()}}).then((r) => r.data)
        if (result[0]?.score < 70) return ""
        const original = result[0].post.file_url
        if (!original || path.extname(original) === ".zip" || path.extname(original) === ".mp4") return ""
        const buffer = await fetch(original).then((r) => r.arrayBuffer())
        const hash = await phash(Buffer.from(buffer)).then((hash: any) => functions.binaryToHex(hash))
        if (dist(hash, oldHash) < 7) {
            return `https://danbooru.donmai.us/posts/${result[0].post.id}.json`
        } else {
            return ""
        }
    }

    public static wdtagger = async (bytes: number[]) => {
        const buffer = Buffer.from(bytes)
        const folder = path.join(__dirname, "./dump")
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})

        const filename = `${Math.floor(Math.random() * 100000000)}.jpg`
        const imagePath = path.join(folder, filename)
        fs.writeFileSync(imagePath, buffer)
        const scriptPath = path.join(__dirname, "../../assets/misc/wdtagger.py")
        let command = `python3 "${scriptPath}" -i "${imagePath}" -m "${process.env.WDTAGGER_PATH}"`
        const str = await exec(command).then((s: any) => s.stdout).catch((e: any) => e.stderr)
        const json = JSON.parse(str) as WDTaggerResponse
        fs.unlinkSync(imagePath)
        return json
    }

    public static tagLookup = async (current: UploadImage, type: PostType, rating: PostRating, style: PostStyle, hasUpscaled?: boolean) => {
        let tagArr = [] as string[]
        let blockedTags = tagConvert.blockedTags
        let tagReplaceMap = tagConvert.tagReplaceMap
        let artists = [{}] as UploadTag[]
        let characters = [{}] as UploadTag[]
        let series = [{}] as UploadTag[]
        let meta = [] as string[]
        let tags = [] as string[]
        let newTags = [] as UploadTag[]
        const tagMap = await ServerFunctions.tagMap()

        let bytes = [] as number[]
        if (current.thumbnail) {
            bytes = await functions.base64toUint8Array(current.thumbnail).then((r) => Object.values(r))
        } else {
            bytes = current.bytes
        }

        let danbooruLink = await ServerFunctions.revdanbooru(bytes)

        if (danbooruLink) {
            const json = await functions.fetch(danbooruLink)
            if (json.rating === "q") rating = functions.r17()
            if (json.rating === "e") rating = functions.r18()
            tagArr = json.tag_string_general.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            tagArr.push("autotags")
            if (hasUpscaled) tagArr.push("upscaled")
            let artistStrArr = json.tag_string_artist.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            let charStrArr = json.tag_string_character.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            let seriesStrArr = json.tag_string_copyright.split(" ").map((tag: string) => tag.replaceAll("_", "-"))
            if (seriesStrArr?.includes("original")) {
                charStrArr = ["original"]
                seriesStrArr = ["no-series"]
            }

            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel-art")) style = "pixel"
            if (tagArr.includes("dakimakura")) style = "daki"
            if (tagArr.includes("sketch")) style = "sketch"
            if (tagArr.includes("lineart")) style = "lineart"
            if (tagArr.includes("ad")) style = "promo"
            if (tagArr.includes("comic")) {
                if (type === "image") type = "comic"
            }

            tagArr = tagArr.map((tag: string) => functions.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                tagArr = tagArr.map((tag: string) => tag.replaceAll(key, value))
            }
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)

            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }

            artistStrArr = artistStrArr.map((tag: string) => functions.cleanTag(tag))
            charStrArr = charStrArr.map((tag: string) => functions.cleanTag(tag))
            seriesStrArr = seriesStrArr.map((tag: string) => functions.cleanTag(tag))

            for (let i = 0; i < artistStrArr.length; i++) {
                artists[artists.length - 1].tag = artistStrArr[i]
                artists.push({})
            }

            for (let i = 0; i < charStrArr.length; i++) {
                characters[characters.length - 1].tag = charStrArr[i]
                const seriesName = charStrArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "")
                seriesStrArr.push(seriesName)
                characters.push({})
            }

            seriesStrArr = functions.removeDuplicates(seriesStrArr)

            for (let i = 0; i < seriesStrArr.length; i++) {
                series[series.length - 1].tag = seriesStrArr[i]
                series.push({})
            }

            tagArr = functions.cleanHTML(tagArr.join(" ")).split(/[\n\r\s]+/g)

            let notExists = [] as UploadTag[]
            for (let i = 0; i < tagArr.length; i++) {
                const exists = tagMap[tagArr[i]]
                if (exists) {
                    if (exists.type === "meta") {
                        meta.push(tagArr[i])
                    } else {
                        tags.push(tagArr[i])
                    }
                } else {
                    tags.push(tagArr[i])
                    notExists.push({tag: tagArr[i], description: `${functions.toProperCase(tagArr[i]).replaceAll("-", " ")}.`})
                }
            }
            newTags = notExists
        } else {
            let result = await ServerFunctions.wdtagger(bytes)

            let tagArr = result.tags
            let characterArr = result.characters

            if (tagArr.includes("chibi")) style = "chibi"
            if (tagArr.includes("pixel-art")) style = "pixel"
            if (tagArr.includes("dakimakura")) style = "daki"
            if (tagArr.includes("sketch")) style = "sketch"
            if (tagArr.includes("lineart")) style = "lineart"
            if (tagArr.includes("ad")) style = "promo"
            if (tagArr.includes("comic")) {
                if (type === "image") type = "comic"
            }

            tagArr = tagArr.map((tag: string) => functions.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                tagArr = tagArr.map((tag: string) => tag.replaceAll(key, value))
            }
            for (let i = 0; i < blockedTags.length; i++) {
                tagArr = tagArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }
            tagArr = tagArr.filter((tag: string) => tag.length >= 3)

            characterArr = characterArr.map((tag: string) => functions.cleanTag(tag))
            for (let i = 0; i < Object.keys(tagReplaceMap).length; i++) {
                const key = Object.keys(tagReplaceMap)[i]
                const value = Object.values(tagReplaceMap)[i]
                characterArr = characterArr.map((tag: string) => tag.replaceAll(key, value))
            }
            for (let i = 0; i < blockedTags.length; i++) {
                characterArr = characterArr.filter((tag: string) => !tag.includes(blockedTags[i]))
            }
            characterArr = characterArr.filter((tag: string) => tag.length >= 3)

            tagArr.push("autotags")
            tagArr.push("needscheck")
            if (hasUpscaled) tagArr.push("upscaled")

            let seriesArr = [] as string[]

            for (let i = 0; i < characterArr.length; i++) {
                const seriesName = characterArr[i].match(/(\()(.*?)(\))/)?.[0].replace("(", "").replace(")", "") || ""
                seriesArr.push(seriesName)
            }

            seriesArr = functions.removeDuplicates(seriesArr)

            for (let i = 0; i < characterArr.length; i++) {
                characters[characters.length - 1].tag = characterArr[i]
                characters.push({})
            }

            for (let i = 0; i < seriesArr.length; i++) {
                series[series.length - 1].tag = seriesArr[i]
                series.push({})
            }
            tagArr = functions.cleanHTML(tagArr.join(" ")).split(/[\n\r\s]+/g)

            let notExists = [] as UploadTag[]
            for (let i = 0; i < tagArr.length; i++) {
                const exists = tagMap[tagArr[i]]
                if (exists) {
                    if (exists.type === "meta") {
                        meta.push(tagArr[i])
                    } else {
                        tags.push(tagArr[i])
                    }
                } else {
                    tags.push(tagArr[i])
                    notExists.push({tag: tagArr[i], description: `${functions.toProperCase(tagArr[i]).replaceAll("-", " ")}.`})
                }
            }
            newTags = notExists
        }
        return {
            type,
            rating,
            style,
            artists,
            characters,
            series,
            meta,
            tags,
            newTags,
            danbooruLink
        }
    }

    public static resizeImage = async (buffer: Buffer, maxSize = 1000) => {
        return sharp(buffer).resize(maxSize, maxSize, {fit: "inside"}).toBuffer()
    }
}