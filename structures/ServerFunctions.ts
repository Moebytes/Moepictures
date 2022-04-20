import nodemailer from "nodemailer"
import handlebars from "handlebars"
import path from "path"
import fs from "fs"

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
}