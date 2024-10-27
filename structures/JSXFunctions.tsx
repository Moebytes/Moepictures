import {useHistory} from "react-router-dom"
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

    public static parseBullets = (text: string) => {
        return text.replace(/(^|\n)-\s+/g, "$1▪ ")
    }

    public static parseMention = (text: string) => {
        const history = useHistory()
        const parts = text.split(/(@\w+)/g)
        const elements = parts.map((part, index) => {
            if (part.startsWith("@")) {
                const click = () => {
                    history.push(`/user/${part.slice(1)}`)
                }
                const style = {color: "var(--text-strong)", fontWeight: "bold", cursor: "pointer"}
                return <span style={style} onClick={click} key={index}>{part}</span>
            } else {
                return <span key={index}>{part}</span>
            }
        })
        return elements
    }

    public static parseBold = (text: string) => {
        const parts = text.split(/(\*\*[^*]+\*\*)/g)
        const elements = parts.map((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                const boldText = part.slice(2, -2)
                return <span style={{color: "var(--text-strong)"}} key={index}>{boldText}</span>
            } else {
                return JSXFunctions.parseMention(part)
            }
        })
        return elements
    }

    public static parseEmojis = (text: string, emojis: any) => {
        const parts = text.split(/(emoji:[^\s]+)/g)
        const elements = parts.map((part, index) => {
            if (part.match(/(emoji:[^\s]+)/g)) {
                let key = part.split(":")[1]
                return (<img src={emojis[key]} className="emoji"/>)
            } else {
                return JSXFunctions.parseBold(part)
            }
        })
        return elements
    }

    public static parseTextLinks = (text: string, emojis?: any) => {
        text = JSXFunctions.parseBullets(text)
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
                if (emojis) {
                    return JSXFunctions.parseEmojis(part, emojis)
                } else {
                    return JSXFunctions.parseBold(part)
                }
            }
        })
        return elements
    }
}