/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {S3} from "@aws-sdk/client-s3"
import mime from "mime-types"
import axios from "axios"
import fs from "fs"
import path from "path"
import functions from "../functions/Functions"

let local = process.env.MOEPICTURES_LOCAL
let localR18 = process.env.MOEPICTURES_LOCAL_R18
let localUnverified = process.env.MOEPICTURES_LOCAL_UNVERIFIED

let remote = process.env.MOEPICTURES_BUCKET!
let remoteR18 = process.env.MOEPICTURES_BUCKET_R18!
let remoteUnverified = process.env.MOEPICTURES_BUCKET_UNVERIFIED!

let publicRemote = process.env.MOEPICTURES_PUBLIC_BUCKET!
let publicRemoteR18 = process.env.MOEPICTURES_PUBLIC_BUCKET_R18!
let publicRemoteUnverified = process.env.MOEPICTURES_PUBLIC_BUCKET_UNVERIFIED!

const s3 = new S3({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!
    }
})

export default class ServerFiles {
    public static getFirstHistoryFile = async (file: string, upscaled: boolean, r18: boolean, pixelHash?: string) => {
        const defaultBuffer = Buffer.from("") 
        const isTag = file.includes("artist/") || file.includes("character/") || file.includes("series/") || file.includes("tag/") || file.includes("pfp/")
        const id = file.split("-")?.[0]?.match(/\d+/)?.[0]
        if (!id) return defaultBuffer

        if (functions.config.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            const historyFolder = isTag ? `${folder}/history/tag/${encodeURIComponent(id)}` : `${folder}/history/post/${id}/${upscaled ? "upscaled" : "original"}`
            if (!fs.existsSync(historyFolder)) return defaultBuffer
            let folders = fs.readdirSync(historyFolder).filter((f) => f !== ".DS_Store").sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
            if (!folders.length) return defaultBuffer
            let firstHistory = `${historyFolder}/${folders[0]}`
            let files = fs.readdirSync(firstHistory).filter(f => f !== ".DS_Store").sort(new Intl.Collator(undefined, {numeric: true, sensitivity: "base"}).compare)
            if (!files.length) return defaultBuffer
            return fs.readFileSync(`${firstHistory}/${files[0]}`)
        } else {
            let bucket = r18 ? remoteR18 : remote
            let publicBucket = r18 ? publicRemoteR18 : publicRemote
            const prefix = isTag ? `history/tag/${encodeURIComponent(id)}` : `history/post/${id}/${upscaled ? "upscaled" : "original"}`
            const fileName = file.split("/").pop()

            for (let i = 0; i < 10; i++) {
                let testKey = `${prefix}/${i}/${fileName}`
                try {
                    let body = undefined as Buffer | Uint8Array | undefined
                    if (publicBucket) {
                        body = await axios.get(functions.util.appendURLParams(`${publicBucket}/${encodeURIComponent(testKey)}`, 
                        {hash: pixelHash}), {responseType: "arraybuffer"}).then(r => r.data)
                    } else {
                        body = await s3.getObject({Key: decodeURIComponent(testKey), Bucket: bucket}).then((r) => r.Body?.transformToByteArray())
                    }
                    return Buffer.from(body ?? "")
                } catch {}
            }
            return defaultBuffer
        }
    }

    public static getFile = async (file: string, upscaled: boolean, r18: boolean, pixelHash?: string) => {
        if (functions.config.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            let originalKey = `${folder}/${decodeURIComponent(file)}`
            let upscaledFile = `${file.split("/")[0].replace("-upscaled", "")}-upscaled/${file.split("/").slice(1).join("/")}`
            let upscaledKey = `${folder}/${decodeURIComponent(upscaledFile)}`
            if (file.includes("history/post")) {
                originalKey = originalKey.replace("upscaled/", "original/")
                upscaledKey = upscaledKey.replace("original/", "upscaled/").replace("history-upscaled", "history")
            }
            if (!fs.existsSync(upscaled ? upscaledKey : originalKey)) return this.getFirstHistoryFile(file, upscaled, r18, pixelHash)
            if (upscaled) return fs.existsSync(upscaledKey) ? fs.readFileSync(upscaledKey) : Buffer.from("")
            return fs.existsSync(originalKey) ? fs.readFileSync(originalKey) : Buffer.from("")
        } else {
            let bucket = r18 ? remoteR18 : remote
            let publicBucket = r18 ? publicRemoteR18 : publicRemote
            let originalKey = `${decodeURIComponent(file)}`
            let upscaledFile = `${file.split("/")[0].replace("-upscaled", "")}-upscaled/${file.split("/").slice(1).join("/")}`
            let upscaledKey = `${decodeURIComponent(upscaledFile)}`
            if (file.includes("history/post")) {
                originalKey = originalKey.replace("upscaled/", "original/")
                upscaledKey = upscaledKey.replace("original/", "upscaled/").replace("history-upscaled", "history")
            }
            let body = undefined as Buffer | Uint8Array | undefined
            let key = upscaled ? upscaledKey : originalKey

            if (publicBucket) {
                body = await axios.get(functions.util.appendURLParams(`${publicBucket}/${encodeURIComponent(key)}`, {hash: pixelHash}), 
                {responseType: "arraybuffer"}).then((r) => r.data).catch(() => null)
            } else {
                body = await s3.getObject({Key: decodeURIComponent(key), Bucket: bucket}).then((r) => r.Body?.transformToByteArray())
            }
            if (!body) return this.getFirstHistoryFile(file, upscaled, r18, pixelHash)
            return Buffer.from(body)
        }
    }

    public static uploadFile = async (file: string, content: any, r18: boolean) => {
        if (functions.config.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            const dir = path.dirname(`${folder}/${file}`)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(`${folder}/${file}`, content)
            return `${folder}/${file}`
        } else {
            let bucket = r18 ? remoteR18 : remote
            const mimeType = mime.lookup(file) || "application/octet-stream"
            await s3.putObject({Bucket: bucket, Key: file, Body: content, ContentType: mimeType})
            return `${bucket}/${file}`
        }
    }

    public static deleteFile = async (file: string, r18: boolean) => {
        if (functions.config.useLocalFiles()) {
            try {
                let folder = r18 ? localR18 : local
                fs.unlinkSync(`${folder}/${file}`)
            } catch {}
        } else {
            try {
                let bucket = r18 ? remoteR18 : remote
                await s3.deleteObject({Key: file, Bucket: bucket})
            } catch {}
        }
    }

    public static deleteIfEmpty = async (folderPath: string, r18: boolean) => {
        if (functions.config.useLocalFiles()) {
            try {
                let folder = r18 ? localR18 : local
                fs.rmdirSync(`${folder}/${folderPath}`)
            } catch {}
        } else {
            try {
                let bucket = r18 ? remoteR18 : remote
                const objects = await s3.listObjectsV2({Bucket: bucket, Prefix: `${folderPath}/`, Delimiter: "/"})
                if (objects.Contents?.length === 0) {
                    await s3.deleteObject({Bucket: bucket, Key: `${folderPath}/`})
                }
            } catch {}
        }
    }

    private static removeLocalDirectory = (dir: string) => {
        if (!fs.existsSync(dir)) return
        fs.readdirSync(dir).forEach((file) => {
            const current = path.join(dir, file)
            if (fs.lstatSync(current).isDirectory()) {
                this.removeLocalDirectory(current)
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
        if (functions.config.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            const dir = `${folder}/${folderPath}`
            return this.removeLocalDirectory(dir)
        } else {
            let bucket = r18 ? remoteR18 : remote
            let isTruncated = true
            let continuationToken: string | undefined = undefined

            while (isTruncated) {
                const objects = await s3.listObjectsV2({Bucket: bucket, Prefix: `${folderPath}/`, Delimiter: "/", ContinuationToken: continuationToken})
                if (objects.Contents?.length) {
                    const deleteParams = {Bucket: bucket, Delete: {Objects: [] as {Key: string | undefined}[]}}
                    objects.Contents.forEach(({Key}) => {
                        deleteParams.Delete.Objects.push({Key})
                    })
                    await s3.deleteObjects(deleteParams)
                }
                isTruncated = objects.IsTruncated
                continuationToken = objects.NextContinuationToken
            }  
            await s3.deleteObject({Bucket: bucket, Key: `${folderPath}/`})
        }
    }

    public static renameFile = async (oldFile: string, newFile: string, oldR18: boolean, newR18: boolean) => {
        if (functions.config.useLocalFiles()) {
            let oldFolder = oldR18 ? localR18 : local
            let newFolder = newR18 ? localR18 : local
            try {
                fs.renameSync(`${oldFolder}/${oldFile}`, `${newFolder}/${newFile}`)
            } catch {}
            return
        } else {
            const oldBucket = oldR18 ? remoteR18 : remote
            const newBucket = newR18 ? remoteR18 : remote

            const mimeType = mime.lookup(newFile) || "application/octet-stream"
            await s3.copyObject({Bucket: newBucket, CopySource: encodeURI(`/${oldBucket}/${oldFile}`), Key: newFile, ContentType: mimeType})
            await s3.deleteObject({Bucket: oldBucket, Key: oldFile})
        }
    }

    public static renameFolder = async (oldFolder: string, newFolder: string, r18: boolean) => {
        if (functions.config.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            try {
                fs.renameSync(`${folder}/${oldFolder}`, `${folder}/${newFolder}`)
            } catch {
                try {
                    fs.renameSync(`${folder}/${encodeURI(oldFolder)}`, `${folder}/${encodeURI(newFolder)}`)
                } catch {}
            }
            return
        } else {
            const bucket = r18 ? remoteR18 : remote
            let isTruncated = true
            let continuationToken: string | undefined = undefined

            while (isTruncated) {
                const listObjectsResponse = await s3.listObjectsV2({Bucket: bucket, 
                Prefix: `${oldFolder}/`, Delimiter: "/", ContinuationToken: continuationToken})

                if (listObjectsResponse.Contents) {
                    for (const {Key} of listObjectsResponse.Contents) {
                        if (Key) {
                            const newKey = Key.replace(`${oldFolder}/`, `${newFolder}/`)
                            const mimeType = mime.lookup(newKey) || "application/octet-stream"
                            await s3.copyObject({Bucket: bucket, CopySource: encodeURI(`/${bucket}/${Key}`), Key: newKey, ContentType: mimeType})
                            await s3.deleteObject({Bucket: bucket, Key: Key})
                        }
                    }
                }
                isTruncated = listObjectsResponse.IsTruncated
                continuationToken = listObjectsResponse.NextContinuationToken
            }
        }
    }

    public static getNextKey = async (type: string, name: string, r18: boolean) => {
        const key = `history/${type}/${name}`
        if (functions.config.useLocalFiles()) {
            let folder = r18 ? localR18 : local
            let targetFolder = `${folder}/${key}`
            if (type === "post") {
                targetFolder = fs.existsSync(`${folder}/${key}/original`) ?
                `${folder}/${key}/original` : `${folder}/${key}/upscaled`
            }
            if (!fs.existsSync(targetFolder)) return 1
            const objects = fs.readdirSync(targetFolder)
            let nextKey = 0
            for (let i = 0; i < objects.length; i++) {
                const object = objects[i]
                if (!object) continue
                const keyMatch = object.replace(key, "").match(/\d+/)?.[0]
                const keyNumber = Number(keyMatch)
                if (keyNumber >= nextKey) nextKey = keyNumber
            }
            return nextKey + 1
        } else {
            const bucket = r18 ? remoteR18 : remote
            let nextKey = 0

            let prefixes = type === "post"  ?[`${key}/original`, `${key}/upscaled`] : [`${key}/`]

            for (const prefix of prefixes) {
                let isTruncated = true
                let continuationToken: string | undefined = undefined

                while (isTruncated) {
                    const objects = await s3.listObjectsV2({Bucket: bucket,
                    Prefix: prefix, Delimiter: "/", ContinuationToken: continuationToken})
    
                    if (objects.Contents) {
                        for (const {Key} of objects.Contents) {
                            const keyMatch = Key?.replace(key + "/", "").match(/\d+/)?.[0]
                            const keyNumber = Number(keyMatch)
                            if (keyNumber >= nextKey) nextKey = keyNumber
                        }
                    }
                    isTruncated = objects.IsTruncated
                    continuationToken = objects.NextContinuationToken
                }
            }
            return nextKey + 1
        }
    }

    public static getUnverifiedFile = async (file: string, upscaled?: boolean, pixelHash?: string) => {
        if (functions.config.useLocalFiles()) {
            let originalKey = `${localUnverified}/${decodeURIComponent(file)}`
            let upscaledFile = `${file.split("/")[0].replace("-upscaled", "")}-upscaled/${file.split("/").slice(1).join("/")}`
            let upscaledKey = `${localUnverified}/${decodeURIComponent(upscaledFile)}`
            if (upscaled) return fs.existsSync(upscaledKey) ? fs.readFileSync(upscaledKey) : Buffer.from("")
            return fs.existsSync(originalKey) ? fs.readFileSync(originalKey) : Buffer.from("")
        } else {
            let bucket = remoteUnverified
            let publicBucket = publicRemoteUnverified
            let originalKey = `${decodeURIComponent(file)}`
            let upscaledFile = `${file.split("/")[0].replace("-upscaled", "")}-upscaled/${file.split("/").slice(1).join("/")}`
            let upscaledKey = `${decodeURIComponent(upscaledFile)}`

            let body = undefined as Buffer | Uint8Array | undefined
            let key = upscaled ? upscaledKey : originalKey
            if (publicBucket) {
                body = await axios.get(functions.util.appendURLParams(`${publicBucket}/${encodeURIComponent(key)}`, {hash: pixelHash}), 
                {responseType: "arraybuffer"}).then((r) => r.data).catch(() => null)
            } else {
                body = await s3.getObject({Key: decodeURIComponent(key), Bucket: bucket}).then((r) => r.Body?.transformToByteArray())
            }
            if (!body) return Buffer.from("")
            return Buffer.from(body)
        }
    }

    public static uploadUnverifiedFile = async (file: string, content: any) => {
        if (functions.config.useLocalFiles()) {
            const dir = path.dirname(`${localUnverified}/${file}`)
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true})
            fs.writeFileSync(`${localUnverified}/${file}`, content)
            return `${localUnverified}/${file}`
        } else {
            let bucket = remoteUnverified
            const mimeType = mime.lookup(file) || "application/octet-stream"
            await s3.putObject({Bucket: bucket, Key: file, Body: content, ContentType: mimeType})
            return `${bucket}/${file}`
        }
    }

    public static deleteUnverifiedFile = async (file: string) => {
        if (functions.config.useLocalFiles()) {
            const dir = path.dirname(`${localUnverified}/${file}`)
            try {
                fs.unlinkSync(`${localUnverified}/${file}`)
                //fs.rmdirSync(dir)
            } catch {}
            return
        } else {
            try {
                let bucket = remoteUnverified
                await s3.deleteObject({Key: file, Bucket: bucket})
            } catch {}
        }
    }

    public static uploadBackup = async (file: string, content: Buffer) => {
        let bucket = process.env.MOEPICTURES_BACKUP_BUCKET!
        await s3.putObject({Bucket: bucket, Key: file, Body: content,
        Expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)})
    }
}