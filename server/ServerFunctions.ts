/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import nodemailer from "nodemailer"
import {Request, Response, NextFunction} from "express"
import sql from "../sql/SQLQuery"
import {ipKeyGenerator} from "express-rate-limit"
import encryption from "../structures/Encryption"
import permissions from "../structures/Permissions"
import {render} from "@react-email/components"
import CSRF from "csrf"
import ServerFiles from "./ServerFiles"
import ServerHTTP from "./ServerHTTP"
import ServerLinks from "./ServerLinks"
import ServerNotifications from "./ServerNotifications"
import ServerPosts from "./ServerPosts"
import ServerSources from "./ServerSources"
import ServerTags from "./ServerTags"
import ServerUsers from "./ServerUsers"
import ServerUtil from "./ServerUtil"
import ServerUpload from "./ServerUpload"
import {Attachment} from "../types/Types"

const csrf = new CSRF()

export const keyGenerator = (req: Request, res: Response) => {
    return req.session.username || ipKeyGenerator(req.ip ?? "")
}

export const handler = (req: Request, res: Response) => {
    req.session.captchaNeeded = true
    return res.status(429).send("Too many requests, try again later.")
}

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
    if (req.session.apiKey) return next()
    if (!ServerFunctions.validateCSRF(req)) return void res.status(400).send("Bad CSRF token")
    next()
}

export const apiKeyLogin = async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.username) return next()
    const apiKey = req.headers["x-api-key"] as string
    if (apiKey) {
        const hashedKey = encryption.hashAPIKey(apiKey)
        const apiToken = await sql.token.apiKey(hashedKey)
        if (apiToken) {
            const user = await sql.user.user(apiToken.username)
            if (!user) return next()
            let ip = ServerUtil.ip(req)
            await ServerUsers.login(req, user, ip)
            req.session.apiKey = true
            await sql.user.destroyOtherAPISessions(req.session.username!, req.sessionID)
        } else {
            return res.status(403).json({message: "A valid API key is required."})
        }
    }
    next()
}

export const csrfGenerator = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.csrfToken) ServerFunctions.generateCSRF(req)
    next()
}

export default class ServerFunctions {
    public static files = ServerFiles
    public static http = ServerHTTP
    public static links = ServerLinks
    public static notifications = ServerNotifications
    public static posts = ServerPosts
    public static sources = ServerSources
    public static tags = ServerTags
    public static users = ServerUsers
    public static util = ServerUtil
    public static upload = ServerUpload

    public static generateCSRF = (req: Request) => {
        if (!req.session.csrfSecret) {
            const secret = csrf.secretSync()
            req.session.csrfSecret = secret
        }
        const token = csrf.create(req.session.csrfSecret)
        req.session.csrfToken = token
    }

    public static validateCSRF = (req: Request) => {
        const csrfToken = req.headers["x-csrf-token"] as string
        return csrf.verify(req.session.csrfSecret!, csrfToken)
    }

    public static verifyCaptcha = (req: Request, captchaResponse: string) => {
        return req.session.captchaAnswer === captchaResponse?.trim() ||
            req.session.previousCaptchaAnswer === captchaResponse?.trim()
    }

    public static sendEncrypted = (data: any, req: Request, res: Response) => {
        if (req.session.apiKey) return res.status(200).send(data)
        if (permissions.noAPIEncryption(req.session)) return res.status(200).send(data)
        if (!req.session.publicKey) return res.status(401).send("No public key")
        const encrypted = encryption.encryptAPI(data, req.session.publicKey, req.session)
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
}