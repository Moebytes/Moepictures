/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Express, NextFunction, Request, Response} from "express"
import functions from "../functions/Functions"
import serverFunctions, {csrfProtection, keyGenerator, handler} from "../server/ServerFunctions"
import {SignedDataVerifier, Environment} from "@apple/app-store-server-library"
import {google} from "googleapis"
import rateLimit from "express-rate-limit"
import sql from "../sql/SQLQuery"
import enLocale from "../assets/locales/en.json"
import fs from "fs"
import path from "path"
import {PurchaseParams, PubSubMessage, DecodedPubSubMessage, NotificationType} from "../types/Types"

const bundleID = "com.moebytes.moepictures"
const appleID = 6762224302

const appleCertificates = [
    fs.readFileSync(path.join(__dirname, "../../assets/certificates/AppleIncRootCertificate.cer")),
    fs.readFileSync(path.join(__dirname, "../../assets/certificates/AppleRootCA-G2.cer")),
    fs.readFileSync(path.join(__dirname, "../../assets/certificates/AppleRootCA-G3.cer"))
]

const iosVerifier = new SignedDataVerifier(appleCertificates, true, 
    Environment.PRODUCTION, bundleID, appleID)

const iosVerifierSandbox = new SignedDataVerifier(appleCertificates, true, 
    Environment.SANDBOX, bundleID)

const googleAuth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,"\n")
    },
    scopes: ["https://www.googleapis.com/auth/androidpublisher"]
})

const androidPublisher = google.androidpublisher({version: "v3", auth: googleAuth})

const paymentLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler
})

const notificationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler
})

const PaymentRoutes = (app: Express) => {
    app.post("/api/premium/verify-purchase", csrfProtection, paymentLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {platform, purchaseToken} = req.body as PurchaseParams
            if (!req.session.username) return void res.status(200).send(false)

            if (platform === "ios") {
                let transaction = await iosVerifier.verifyAndDecodeTransaction(purchaseToken).catch(() => null)

                if (!transaction) {
                    transaction = await iosVerifierSandbox.verifyAndDecodeTransaction(purchaseToken).catch(() => null)
                }

                if (transaction) {
                    if (!transaction.appAccountToken) return void res.status(200).send(false)
                    if (transaction.productId !== "com.moebytes.moepictures.premium.yearly" &&
                        transaction.productId !== "com.moebytes.moepictures.premium.monthly") {
                        return void res.status(200).send(false)
                    }

                    const user = await sql.user.userByAccountToken(transaction.appAccountToken)
                    if (user?.username !== req.session.username) return void res.status(200).send(false)

                    if (transaction.revocationDate) {
                        let revocationDate = new Date(transaction.revocationDate!).toISOString()

                        await sql.user.updateUser(user.username, "premium", false)
                        await sql.user.updateUser(user.username, "premiumExpiration", revocationDate)

                        return void res.status(200).send(false)
                    }

                    if (transaction.expiresDate! > Date.now()) {
                        let premiumExpiration = new Date(transaction.expiresDate!).toISOString()

                        await sql.user.updateUser(user.username, "premium", true)
                        await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                        await sql.token.insertSubscription(user.username, transaction.appAccountToken,
                            transaction.originalTransactionId!, "ios",  transaction.productId, premiumExpiration)

                        return void res.status(200).send(true)
                    }
                }
            } else if (platform === "android") {
                const transaction = await androidPublisher.purchases.subscriptionsv2.get({packageName: bundleID, 
                    token: purchaseToken}).then((result) => result.data).catch(() => null)
                if (transaction) {
                    if (!transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId) return void res.status(200).send(false)

                    const lineItem = transaction.lineItems?.[0]
                    if (lineItem?.productId !== "com.moebytes.moepictures.premium" &&
                        lineItem?.offerDetails?.basePlanId !== "premium-yearly" &&
                        lineItem?.offerDetails?.basePlanId !== "premium-monthly") {
                        return void res.status(200).send(false)
                    }

                    const user = await sql.user.userByAccountToken(transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId)
                    if (user?.username !== req.session.username) return void res.status(200).send(false)

                    if (transaction.subscriptionState !== "SUBSCRIPTION_STATE_ACTIVE") {
                        let premiumExpiration = new Date(lineItem.expiryTime!).toISOString()

                        await sql.user.updateUser(user.username, "premium", false)
                        await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                        return void res.status(200).send(false)
                    }

                    if (Date.parse(lineItem.expiryTime!) > Date.now()) {
                        let premiumExpiration = new Date(lineItem.expiryTime!).toISOString()

                        await sql.user.updateUser(user.username, "premium", true)
                        await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                        await sql.token.insertSubscription(user.username, 
                            transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId,
                            purchaseToken, "android", lineItem?.offerDetails?.basePlanId!, premiumExpiration)

                        return void res.status(200).send(true)
                    }
                }
            }

            res.status(200).send(false)
        } catch (e) {
            console.log(e)
            res.status(400).send(false)
        }
    })

    app.post("/api/apple/notifications", notificationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {signedPayload} = req.body as {signedPayload: string}

            let notification = await iosVerifier.verifyAndDecodeNotification(signedPayload).catch(() => null)
            if (!notification) {
                notification = await iosVerifierSandbox.verifyAndDecodeNotification(signedPayload).catch(() => null)
            }
            if (!notification) return void res.status(200).end()

            let transaction = await iosVerifier.verifyAndDecodeTransaction(notification.data?.signedTransactionInfo!)
            if (!transaction) {
                transaction = await iosVerifierSandbox.verifyAndDecodeTransaction(notification.data?.signedTransactionInfo!)
            }
            if (!transaction.appAccountToken) return void res.status(200).end()

            if (transaction.productId !== "com.moebytes.moepictures.premium.yearly" &&
                transaction.productId !== "com.moebytes.moepictures.premium.monthly") {
                return void res.status(200).end()
            }

            const user = await sql.user.userByAccountToken(transaction.appAccountToken)
            if (!user) return void res.status(200).end()

            let premiumExpiration = new Date(transaction.expiresDate!).toISOString()
            let updateDB = false

            switch(notification.notificationType) {
                case "SUBSCRIBED":
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const message = `Your account has been upgraded to premium. You can now access all the premium features. Thank you for supporting us!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your account was upgraded to premium", message)
                    updateDB = true
                    break

                case "DID_RENEW":
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const renewMsg = `Your premium subscription was renewed. Thanks for your continued support!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium subscription was renewed", renewMsg)
                    updateDB = true
                    break

                case "EXPIRED":
                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const expireMsg = `Unfortunately, it seems like your premium membership has expired. We appreciate your time spent as a premium member and we hope that you are interested in renewing it again.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership expired", expireMsg)
                    updateDB = true
                    break

                case "REFUND":
                case "REVOKE":
                    let revocationDate = new Date(transaction.revocationDate!).toISOString()
                    premiumExpiration = revocationDate

                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", revocationDate)

                    const revokeMsg = `Unfortunately, it seems like your premium membership was revoked. This could be due to it being refunded.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership was revoked", revokeMsg)
                    updateDB = true
                    break
            }

            if (updateDB) {
                await sql.token.insertSubscription(user.username, transaction.appAccountToken,
                    transaction.originalTransactionId!, "ios",  transaction.productId, premiumExpiration)
            }

            res.status(200).end()
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })

    app.post("/api/google/notifications", notificationLimiter, async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {message} = req.body as PubSubMessage
            if (!message?.data) return void res.status(200).end()

            const decoded = JSON.parse(Buffer.from(message.data, "base64").toString("utf8")) as DecodedPubSubMessage
            const notification = decoded.subscriptionNotification
            if (!notification) return void res.status(200).end()

            const purchaseToken = notification.purchaseToken
            if (!purchaseToken) return void res.status(200).end()

            const transaction = await androidPublisher.purchases.subscriptionsv2.get({packageName: bundleID, 
                token: purchaseToken}).then((result) => result.data).catch(() => null)
            if (!transaction) return void res.status(200).end()

            if (!transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId) return void res.status(200).end()

            const lineItem = transaction.lineItems?.[0]
            if (lineItem?.productId !== "com.moebytes.moepictures.premium" &&
                lineItem?.offerDetails?.basePlanId !== "premium-yearly" &&
                lineItem?.offerDetails?.basePlanId !== "premium-monthly") {
                return void res.status(200).end()
            }

            const user = await sql.user.userByAccountToken(transaction.externalAccountIdentifiers.obfuscatedExternalAccountId)
            if (!user) return void res.status(200).end()

            let premiumExpiration = new Date(lineItem.expiryTime!).toISOString()
            let updateDB = false

            switch (notification.notificationType) {
                case NotificationType.SUBSCRIPTION_PURCHASED:
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const message = `Your account has been upgraded to premium. You can now access all the premium features. Thank you for supporting us!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your account was upgraded to premium", message)
                    updateDB = true
                    break

                case NotificationType.SUBSCRIPTION_RECOVERED:
                case NotificationType.SUBSCRIPTION_RENEWED:
                    await sql.user.updateUser(user.username, "premium", true)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const renewMsg = `Your premium subscription was renewed. Thanks for your continued support!\n\nYour membership will last until ${functions.date.prettyDate(premiumExpiration, enLocale)}.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium subscription was renewed", renewMsg)
                    updateDB = true
                    break

                case NotificationType.SUBSCRIPTION_EXPIRED:
                case NotificationType.SUBSCRIPTION_PAUSED:
                case NotificationType.SUBSCRIPTION_ON_HOLD:
                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const expireMsg = `Unfortunately, it seems like your premium membership has expired. We appreciate your time spent as a premium member and we hope that you are interested in renewing it again.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership expired", expireMsg)
                    updateDB = true
                    break

                case NotificationType.SUBSCRIPTION_REVOKED:
                    await sql.user.updateUser(user.username, "premium", false)
                    await sql.user.updateUser(user.username, "premiumExpiration", premiumExpiration)

                    const revokeMsg = `Unfortunately, it seems like your premium membership was revoked. This could be due to it being refunded.`
                    await serverFunctions.systemMessage(user.username, "Notice: Your premium membership was revoked", revokeMsg)
                    updateDB = true
                    break
            }

            if (updateDB) {
                await sql.token.insertSubscription(user.username, 
                    transaction.externalAccountIdentifiers?.obfuscatedExternalAccountId,
                    purchaseToken, "android", lineItem?.offerDetails?.basePlanId!, premiumExpiration)
            }

            res.status(200).end()
        } catch (e) {
            console.log(e)
            res.status(400).end()
        }
    })
}

export default PaymentRoutes