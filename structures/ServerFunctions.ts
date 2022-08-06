import nodemailer from "nodemailer"
import {Request} from "express"
import handlebars from "handlebars"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import sql from "../structures/SQLQuery"
import functions from "../structures/Functions"
import S3 from "aws-sdk/clients/s3"

export default class ServerFunctions {
    public static email = async (email: string, subject: string, payload: any, template: string) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD,
            }
        })
        const source = fs.readFileSync(path.join(__dirname, `../templates/${template}`), "utf8")
        const compiledTemplate = handlebars.compile(source)
        const html = compiledTemplate(payload)
        return transporter.sendMail({
            from: {name: "Moebooru", address: process.env.EMAIL_ADDRESS},
            to: email,
            subject: subject,
            html
        })
    }

    public static contactEmail = async (email: string, subject: string, message: string, attachments?: any[]) => {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_ADDRESS,
              pass: process.env.EMAIL_PASSWORD,
            }
        })
        return transporter.sendMail({
            from: {name: "Moebooru", address: process.env.EMAIL_ADDRESS},
            to: process.env.EMAIL_ADDRESS,
            replyTo: email,
            subject: subject,
            text: message,
            attachments
        })
    }

    public static getFile = async (file: string) => {
        const s3 = new S3({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        return s3.getObject({Key: decodeURIComponent(file), Bucket: "moebooru"}).promise().then((r) => r.Body)
    }

    public static uploadFile = async (file: string, content: any) => {
        const s3 = new S3({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        const upload = await s3.upload({Body: content, Key: file, Bucket: "moebooru"}).promise()
        return upload.Location
    }

    public static deleteFile = async (file: string) => {
        const s3 = new S3({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        await s3.deleteObject({Key: file, Bucket: "moebooru"}).promise()
    }

    public static renameFile = async (oldFile: string, newFile: string) => {
        const s3 = new S3({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        await s3.copyObject({CopySource: `moebooru/${oldFile}`, Key: newFile, Bucket: "moebooru"}).promise()
        await s3.deleteObject({Key: oldFile, Bucket: "moebooru"}).promise()
    }

    public static uploadUnverifiedFile = async (file: string, content: any) => {
        const s3 = new S3({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        const upload = await s3.upload({Body: content, Key: file, Bucket: "moebooru-unverified"}).promise()
        return upload.Location
    }

    public static getUnverifiedFile = async (file: string) => {
        const s3 = new S3({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        return s3.getObject({Key: decodeURIComponent(file), Bucket: "moebooru-unverified"}).promise().then((r) => r.Body)
    }

    public static deleteUnverifiedFile = async (file: string) => {
        const s3 = new S3({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        await s3.deleteObject({Key: file, Bucket: "moebooru-unverified"}).promise()
    }

    public static unverifiedTagCategories = async (tags: any[]) => {
        let result = await sql.unverifiedTags(tags.filter(Boolean))
        let artists = [] as any 
        let characters = [] as any 
        let series = [] as any 
        let newTags = [] as any
        for (let i = 0; i < tags.length; i++) {
            const index = result.findIndex((r: any) => tags[i] === r.tag)
            const obj = {} as any 
            obj.tag = tags[i]
            obj.image = result[index].image 
            obj.description = result[index].description 
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

    public static batchUpdateImplications = async () => {
        console.log("Updating all tag implications...")
        const posts = await sql.posts()
        for (let i = 0; i < posts.length; i++) {
            const postID = posts[i].postID
            let tagMap = posts[i].tags
            for (let i = 0; i < tagMap.length; i++) {
                const implications = await sql.implications(tagMap[i])
                if (implications?.[0]) tagMap.push(...implications.map(((i: any) => i.implication)))
            }
            tagMap = functions.removeDuplicates(tagMap)
            await sql.purgeTagMap(postID)
            await sql.insertTagMap(postID, tagMap)
        }
        console.log("Done")
    }
}