import nodemailer from "nodemailer"
import handlebars from "handlebars"
import path from "path"
import fs from "fs"
import crypto from "crypto"
import {Upload} from "@aws-sdk/lib-storage"
import {S3Client, DeleteObjectCommand} from "@aws-sdk/client-s3"
import Evaporate from "evaporate"

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

    public static uploadFile = async (file: string, content: any) => {
        const s3 = new S3Client({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        const upload = new Upload({
            client: s3,
            params: {Body: content, Key: file, Bucket: "moebooru"}
        })
        return upload.done()
    }

    public static deleteFile = async (file: string) => {
        const s3 = new S3Client({region: "us-east-1", credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY!,
            secretAccessKey: process.env.AWS_SECRET_KEY!
        }})
        await s3.send(new DeleteObjectCommand({Key: file, Bucket: "moebooru"}))
    }
}