import functions from "./Functions"
import VerifyEmail from "../emails/VerifyEmail"
import ChangeEmail from "../emails/ChangeEmail"
import ResetPassword from "../emails/ResetPassword"

export default class JSXFunctions {
    public static verifyEmailJSX = (username: string, link: string) => {
        return <VerifyEmail username={username} link={link}/>
    }

    public static changeEmailJSX = (username: string, link: string) => {
        return <ChangeEmail username={username} link={link}/>
    }

    public static resetPasswordJSX = (username: string, link: string) => {
        return <ResetPassword username={username} link={link}/>
    }

    public static parseTextLinks = (text: string) => {
        const parts = text.split(/(https?:\/\/[^\s]+)/g)
        const elements = parts.map((part, index) => {
            if (part.match(/(https?:\/\/[^\s]+)/g)) {
                let name = part
                if (name.includes(`${functions.getDomain()}/post`)) name = `Post #${name.match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/thread`)) name = `Thread #${name.match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/message`)) name = `Message #${name.match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/user`)) name = `User ${name.match(/(?<=\/user\/)(.+)/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/tag`)) name = `Tag ${name.match(/(?<=\/tag\/)(.+)/)?.[0] || ""}`
                return (<a key={index} href={part} target="_blank" rel="noopener">{name}</a>)
            } else {
                return <span key={index}>{part}</span>
            }
        })
        return elements
    }
}