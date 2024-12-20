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

    public static appendChain = (items: {text: any, jsx: any}[], func: (text: string) => {text: any, jsx: any}[]) => {
        let result = [] as {text: any, jsx: any}[]
        for (const item of items) {
            if (item.jsx) {
                result.push(item)
            } else {
                result.push(...func(item.text))
            }
        }
        return result
    }

    public static appendParamChain = (items: {text: any, jsx: any}[], param: any, func: (text: string, param: any) => {text: any, jsx: any}[]) => {
        let result = [] as {text: any, jsx: any}[]
        for (const item of items) {
            if (item.jsx) {
                result.push(item)
            } else {
                result.push(...func(item.text, param))
            }
        }
        return result
    }

    public static generateMarkup = (items: {text: any, jsx: any}[]) => {
        let jsx = [] as JSX.Element[]
        items.forEach((item, index) => {
            if (item.jsx) {
                jsx.push(item.jsx)
            } else {
                jsx.push(<span key={index}>{item.text}</span>)
            }
        })
        return jsx
    }

    public static parseBullets = (text: string) => {
        return [{text: text.replace(/(^|\n)-\s+/g, "$1▪ "), jsx: null}]
    }

    public static parseBold = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\*\*[^*]+\*\*)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("**") && part.endsWith("**")) {
                const boldText = part.slice(2, -2)
                items.push({text: null, jsx: <span key={index} style={{fontWeight: "bold"}}>{boldText}</span>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseItalic = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\/\/[^/]+\/\/)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("//") && part.endsWith("//")) {
                const italicText = part.slice(2, -2)
                items.push({text: null, jsx: <span key={index} style={{fontStyle: "italic"}}>{italicText}</span>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseUnderline = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\_\_[^_]+\_\_)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("__") && part.endsWith("__")) {
                const underlineText = part.slice(2, -2)
                items.push({text: null, jsx: <span key={index} style={{textDecoration: "underline"}}>{underlineText}</span>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseStrikethrough = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\~\~[^~]+\~\~)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("~~") && part.endsWith("~~")) {
                const strikethroughText = part.slice(2, -2)
                items.push({text: null, jsx: <span key={index} style={{textDecoration: "line-through"}}>{strikethroughText}</span>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseSpoiler = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\|\|[^|]+\|\|)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("||") && part.endsWith("||")) {
                const spoilerText = part.slice(2, -2)
                items.push({text: null, jsx: <span key={index} className="spoiler">{spoilerText}</span>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseHighlight = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\=\=[^=]+\=\=)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("==") && part.endsWith("==")) {
                const highlightText = part.slice(2, -2)
                items.push({text: null, jsx: <span key={index} style={{color: "var(--text-strong)"}}>{highlightText}</span>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseMention = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const history = useHistory()
        const parts = text.split(/(@\w+)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("@")) {
                const click = () => {
                    history.push(`/user/${part.slice(1)}`)
                }
                const style = {color: "var(--text-strong)", fontWeight: "bold", cursor: "pointer"}
                items.push({text: null, jsx: <span key={index} style={style} onClick={click}>{part}</span>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseEmojis = (text: string, emojis: any) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(emoji:[^\s]+)/g)
        parts.forEach((part, index) => {
            if (part.match(/(emoji:[^\s]+)/g)) {
                let key = part.split(":")[1]
                items.push({text: null, jsx:<img key={index} src={emojis[key]} className="emoji"/>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseLinks = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(https?:\/\/[^\s]+)/g)
        parts.forEach((part, index) => {
            if (part.match(/(https?:\/\/[^\s]+)/g)) {
                let name = part
                if (name.includes(`${functions.getDomain()}/post`)) name = `Post #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/thread`)) name = `Thread #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/message`)) name = `Message #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/user`)) name = `User ${name.replace(functions.getDomain(), "").match(/(?<=\/user\/)(.+)/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/tag`)) name = `Tag ${name.replace(functions.getDomain(), "").match(/(?<=\/tag\/)(.+)/)?.[0] || ""}`
                if (functions.isImage(part) || functions.isGIF(part)) items.push({text: null, jsx: <img key={index} className="comment-image" src={part} crossOrigin="anonymous"/>})
                if (functions.isVideo(part)) items.push({text: null, jsx: <video key={index} className="comment-image" src={part} crossOrigin="anonymous" autoPlay loop muted disablePictureInPicture playsInline controls></video>})
                items.push({text: null, jsx: <a key={index} href={part} target="_blank" rel="noopener">{name}</a>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static renderCommentaryText = (text: string) => {
        let items = JSXFunctions.parseLinks(text)
        return JSXFunctions.generateMarkup(items)
    }

    public static renderCommentText = (text: string, emojis: any) => {
        let items = JSXFunctions.parseBullets(text)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseLinks)
        items = JSXFunctions.appendParamChain(items, emojis, JSXFunctions.parseEmojis)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseHighlight)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseBold)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseItalic)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseUnderline)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseStrikethrough)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseSpoiler)
        return JSXFunctions.generateMarkup(items)
    }

    public static renderMessageText = (text: string, emojis: any) => {
        return JSXFunctions.renderCommentText(text, emojis)
    }

    public static renderThreadText = (text: string, emojis: any) => {
        let items = JSXFunctions.parseBullets(text)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseLinks)
        items = JSXFunctions.appendParamChain(items, emojis, JSXFunctions.parseEmojis)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseHighlight)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseBold)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseItalic)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseUnderline)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseStrikethrough)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseSpoiler)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseMention)
        return JSXFunctions.generateMarkup(items)
    }
}