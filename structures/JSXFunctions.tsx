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

    public static parseEmojis = (text: string, emojis: any) => {
        const parts = text.split(/(emoji:[^\s]+)/g)
        const elements = parts.map((part, index) => {
            if (part.match(/(emoji:[^\s]+)/g)) {
                let key = part.split(":")[1]
                return (<img src={emojis[key]} className="emoji"/>)
            } else {
                return <span key={index}>{part}</span>
            }
        })
        return elements
    }

    public static parseTextLinks = (text: string, emojis?: any) => {
        const parts = text.split(/(https?:\/\/[^\s]+)/g)
        const elements = parts.map((part, index) => {
            if (part.match(/(https?:\/\/[^\s]+)/g)) {
                let name = part
                if (name.includes(`${functions.getDomain()}/post`)) name = `Post #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/thread`)) name = `Thread #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/message`)) name = `Message #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/user`)) name = `User ${name.replace(functions.getDomain(), "").match(/(?<=\/user\/)(.+)/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/tag`)) name = `Tag ${name.replace(functions.getDomain(), "").match(/(?<=\/tag\/)(.+)/)?.[0] || ""}`
                if (functions.isImage(part) || functions.isGIF(part)) return (<img className="comment-image" src={part} crossOrigin="anonymous"/>)
                if (functions.isVideo(part)) return (<video className="comment-image" src={part} crossOrigin="anonymous" autoPlay loop muted disablePictureInPicture playsInline controls></video>)
                return (<a key={index} href={part} target="_blank" rel="noopener">{name}</a>)
            } else {
                return emojis ? JSXFunctions.parseEmojis(part, emojis) : <span key={index}>{part}</span>
            }
        })
        return elements
    }
}