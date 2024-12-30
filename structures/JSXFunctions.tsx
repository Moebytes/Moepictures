import {useHistory} from "react-router-dom"
import functions from "./Functions"
import VerifyEmail from "../emails/VerifyEmail"
import ChangeEmail from "../emails/ChangeEmail"
import ResetPassword from "../emails/ResetPassword"
import email from "../assets/icons/email.png"

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

    public static parseColor = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        let index = 0
    
        while (index < text.length) {
            const hashIndex = text.indexOf("#", index)
    
            if (hashIndex === -1) {
                items.push({text: text.slice(index), jsx: null})
                break
            }
    
            if (hashIndex > index) {
                items.push({text: text.slice(index, hashIndex), jsx: null})
            }
    
            const hexColor = text.slice(hashIndex + 1, hashIndex + 7)
            if (/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hexColor)) {
                const openingBraceIndex = text.indexOf("{", hashIndex + 7)
                const closingBraceIndex = text.indexOf("}", openingBraceIndex)
    
                if (openingBraceIndex !== -1 && closingBraceIndex !== -1) {
                    const colorText = text.slice(openingBraceIndex + 1, closingBraceIndex)
                    items.push({text: null, jsx: <span key={items.length} style={{ color: `#${hexColor}` }}>{colorText}</span>})
                    index = closingBraceIndex + 1
                    continue
                }
            }
            items.push({text: text.slice(hashIndex, hashIndex + 7), jsx: null})
            index = hashIndex + 7
        }
        return items
    }

    public static parseDetails = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\<\<[^><]+\>\>)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("<<") && part.endsWith(">>")) {
                const innerText = part.slice(2, -2)
                const [summary, details] = innerText.split("|")
                items.push({text: null, jsx: <details key={index}><summary>{summary}</summary>{details}</details>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseCode = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\`\`\`[\s\S]*?\`\`\`)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("```") && part.endsWith("```")) {
                const codeText = part.slice(3, -3)
                items.push({text: null, jsx: <code style={{color: "inherit"}} key={index}>{codeText}</code>})
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
        const parts = text.split(/(:[^\s]+:)/g)
        parts.forEach((part, index) => {
            if (part.match(/(:[^\s]+:)/g)) {
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
        const parts = text.split(/(\[.*?\]\(.*?\)|https?:\/\/[^\s]+)/g)
        parts.forEach((part, index) => {
            if (part.match(/^\[.*?\]\(.*?\)$/)) {
                const match = part.match(/^\[(.*?)\]\((.*?)\)$/)
                if (match) {
                    const [_, name, link] = match
                    items.push({text: null, jsx: <a style={{fontWeight: "bold"}} key={index} href={link} target="_blank" rel="noopener">{name}</a>})
                }
            } else if (part.match(/(https?:\/\/[^\s]+)/g)) {
                let name = part
                if (name.includes(`${functions.getDomain()}/post`)) name = `Post #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/thread`)) name = `Thread #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/message`)) name = `Message #${name.replace(functions.getDomain(), "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/user`)) name = `User ${name.replace(functions.getDomain(), "").match(/(?<=\/user\/)(.+)/)?.[0] || ""}`
                if (name.includes(`${functions.getDomain()}/tag`)) name = `Tag ${name.replace(functions.getDomain(), "").match(/(?<=\/tag\/)(.+)/)?.[0] || ""}`

                if (functions.arrayIncludes(name, ["Post", "Thread", "Message", "User", "Tag"])) {
                    items.push({text: null, jsx: <a href={part} target="_blank" rel="noopener">{name}</a>})
                } else if (functions.isImage(part) || functions.isGIF(part)) {
                    items.push({text: null, jsx: <img key={index} className="comment-image" src={part} crossOrigin="anonymous"/>})
                } else if (functions.isVideo(part)) {
                    items.push({text: null, jsx: <video key={index} className="comment-image" src={part} crossOrigin="anonymous" autoPlay loop muted disablePictureInPicture playsInline controls></video>})
                } else {
                    items.push({text: null, jsx: (
                        <span key={index} style={{display: "inline-flex", alignItems: "center"}}>
                            <img className="link-favicon" src={`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${part}&size=64`}/>
                            <a href={part} target="_blank" rel="noopener">{name}</a>
                        </span>
                    )})
                }
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static parseEmails = (text: string) => {
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\b[A-Za-z0-9._%+-]+[@\uFF20][A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g)
        parts.forEach((part, index) => {
            if (part.match(/\b[A-Za-z0-9._%+-]+[@\uFF20][A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)) {
                items.push({text: null, jsx: (
                    <span key={index}>
                        <img className="link-favicon" src={email}/>
                        <a href={`mailto:${part}`}>{part}</a>
                    </span>
                )})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static renderCommentaryText = (text: string) => {
        let items = JSXFunctions.parseLinks(text)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseEmails)
        return JSXFunctions.generateMarkup(items)
    }

    public static commonChain = (text: string, emojis: any) => {
        let items = JSXFunctions.parseBullets(text)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseLinks)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseEmails)
        items = JSXFunctions.appendParamChain(items, emojis, JSXFunctions.parseEmojis)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseDetails)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseHighlight)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseBold)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseItalic)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseUnderline)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseStrikethrough)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseSpoiler)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseColor)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseCode)
        return items
    }

    public static renderCommentText = (text: string, emojis: any) => {
        let items = JSXFunctions.commonChain(text, emojis)
        return JSXFunctions.generateMarkup(items)
    }

    public static renderReplyText = (text: string, emojis: any) => {
        let items = JSXFunctions.commonChain(text, emojis)
        items = JSXFunctions.appendChain(items, JSXFunctions.parseMention)
        return JSXFunctions.generateMarkup(items)
    }

    public static renderMessageText = (text: string, emojis: any) => {
        let items = JSXFunctions.commonChain(text, emojis)
        return JSXFunctions.generateMarkup(items)
    }

    public static renderText = (text: string, emojis: any, type: string = "comment", clickFunc?: (id: string) => any, r18?: boolean) => {
        const renderFunction = {
            "comment": JSXFunctions.renderCommentText,
            "commentrow": JSXFunctions.renderCommentText,
            "reply": JSXFunctions.renderReplyText,
            "message": JSXFunctions.renderMessageText
        }[type]
        if (type === "message") type = "reply"
        const pieces = functions.parsePieces(text)
        let jsx = [] as any
        if (r18) jsx.push(<span className={`${type}-text`} style={{color: "var(--r18Color)", marginTop: "-38px"}}>[R18]</span>)
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.startsWith(">")) {
                const matchPart = piece.match(/(>>>(\[\d+\])?)(.*?)(?=$|>)/gm)?.[0] ?? ""
                const userPart = matchPart.replace(/(>>>(\[\d+\])?\s*)/, "")
                const id = matchPart.match(/(?<=\[)\d+(?=\])/)?.[0] ?? ""
                let username = ""
                let said = ""
                if (userPart) {
                    username = functions.toProperCase(userPart.split(/ +/g)[0])
                    said = userPart.split(/ +/g).slice(1).join(" ")
                }
                const text = piece.replace(matchPart.replace(">>>", ""), "").replaceAll(">", "")
                jsx.push(
                    <div className={`${type}-quote-container`}>
                        {userPart ? <span className={`${type}-quote-user`} onClick={() => clickFunc?.(id)}>{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className={`${type}-quote-text`}>{renderFunction?.(text, emojis)}</span>
                    </div>
                )
            } else {
                jsx.push(<span className={`${type}-text`}>{renderFunction?.(piece, emojis)}</span>)
            }
        }
        return jsx
    }
}