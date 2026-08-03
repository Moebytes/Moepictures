/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {SignedDataVerifier, Environment} from "@apple/app-store-server-library"
import {google} from "googleapis"
import fs from "fs"
import path from "path"

const bundleID = "com.moebytes.moepictures"
const appleID = 6762224302

const appleCertificates = [
    fs.readFileSync(path.join(__dirname, "../../assets/certificates/AppleIncRootCertificate.cer")),
    fs.readFileSync(path.join(__dirname, "../../assets/certificates/AppleRootCA-G2.cer")),
    fs.readFileSync(path.join(__dirname, "../../assets/certificates/AppleRootCA-G3.cer"))
]

const verifier = new SignedDataVerifier(appleCertificates, true, 
    Environment.PRODUCTION, bundleID, appleID)


const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g,"\n")
    },
    scopes: ["https://www.googleapis.com/auth/androidpublisher"]
})

const androidPublisher = google.androidpublisher({version: "v3", auth})

export default class ServerPayment {
    public static verifyAppleTransaction = async (signedTransaction: string) => {
        return verifier.verifyAndDecodeTransaction(signedTransaction)
    }

    public static verifyAppleNotification = async (signedPayload: string) => {
        return verifier.verifyAndDecodeNotification(signedPayload)
    }

    public static verifyGoogleTransaction = async (signedTransaction: string) => {
        const result = await androidPublisher.purchases.subscriptionsv2.get({packageName: bundleID, token: signedTransaction})
        return result.data
    }
}