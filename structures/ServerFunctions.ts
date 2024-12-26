import nodemailer from "nodemailer"
import {Request, Response, NextFunction} from "express"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import sql from "../sql/SQLQuery"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import {render} from "@react-email/components"
import S3 from "aws-sdk/clients/s3"
import CSRF from "csrf"
import axios from "axios"
import phash from "sharp-phash"
import dist from "sharp-phash/distance"
import {MiniTag, Image, UploadImage, PostFull, PostTagged, Attachment, Note} from "../types/Types"

const csrf = new CSRF()

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
    if (ServerFunctions.validateAPIKey(req)) return next()
    if (!ServerFunctions.validateCSRF(req)) return res.status(400).send("Bad CSRF token")
    next()
}

export const apiKeyLogin = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.username) return next()
    if (ServerFunctions.validateAPIKey(req)) {
        const user = await sql.user.user(process.env.API_USERNAME!)
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
        await sql.user.updateUser(user.username, "ip", ip as string)
        req.session.ip = ip as string
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

    public static validateAPIKey = (req: Request) => {
        const apiKey = req.headers["x-api-key"] as string
        return apiKey === process.env.API_KEY
    }

    public static sendEncrypted = (data: any, req: Request, res: Response) => {
        if (ServerFunctions.validateAPIKey(req)) return res.status(200).send(data)
        if (!req.session.publicKey) return res.status(401).send("No public key")
        const encrypted = cryptoFunctions.encryptAPI(data, req.session.publicKey)
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

    public static getFirstHistoryFile = async (file: string, r18: boolean) => {
        const defaultBuffer = Buffer.from("")
        if (file.includes("artist") || file.includes("character") || file.includes("series") || file.includes("pfp")) {
            if (functions.useLocalFiles()) {
                let folder = r18 ? localR18 : local
                const id = file.split("-")?.[0]?.match(/\d+/)?.[0]
                if (!id) return defaultBuffer
                const historyFolder = `${folder}/history/post/${id}`
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
                const id = file.split("-")?.[0]?.match(/\d+/)?.[0]
                if (!id) return defaultBuffer
                const historyFolder = `${folder}/history/post/${id}`
                if (!fs.existsSync(historyFolder)) return defaultBuffer
                let folders = fs.readdirSync(historyFolder)
                if (!folders.length) return defaultBuffer
                folders = folders.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstHistory = `${folder}/history/post/${id}/${folders[0]}`
                let files = fs.readdirSync(firstHistory)
                if (!files.length) return defaultBuffer
                files = files.sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
                const firstFile = `${folder}/history/post/${id}/${folders[0]}/${files[0]}`
                return fs.readFileSync(firstFile)
            } else {
                return defaultBuffer
            }
        }
    }

    public static getFile = async (file: string, upscaled: boolean, r18: boolean) => {
        if (file.includes("history/post")) upscaled = false
        if (functions.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            let originalKey = `${folder}/${decodeURIComponent(file)}`
            let upscaledKey = `${folder}/${decodeURIComponent(`${file.split("/")[0]}-upscaled/${file.split("/")[1]}`)}`
            if (!fs.existsSync(upscaled ? upscaledKey : originalKey)) return ServerFunctions.getFirstHistoryFile(file, r18)
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
            let upscaledKey = `${localUnverified}/${decodeURIComponent(`${file.split("/")[0]}-upscaled/${file.split("/")[1]}`)}`
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
            let oldPath = ""
            if (upscaled) {
                oldPath = functions.getUpscaledImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.upscaledFilename || oldImage.filename)
            } else {
                oldPath = functions.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            }
            const oldBuffer = isEdit ? await ServerFunctions.getFile(oldPath, false, r18 ?? false) : await ServerFunctions.getUnverifiedFile(oldPath, false) as any
            if (!oldBuffer) continue
            const newImage = newImages[i]
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
            let oldPath = functions.getImagePath(oldImage.type, oldImage.postID, oldImage.order, oldImage.filename)
            const oldBuffer = unverified ? await ServerFunctions.getUnverifiedFile(oldPath, false)
            : await ServerFunctions.getFile(oldPath, false, r18)
            const newImage = newImages[i]
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
        const tagMap = {} as {[key: string]: any}
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
}