/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import functions from "../functions/Functions"
import {NavigateFunction} from "react-router-dom"
import VerifyEmail from "../emails/VerifyEmail"
import ChangeEmail from "../emails/ChangeEmail"
import ResetPassword from "../emails/ResetPassword"
import ChangedPassword from "../emails/ChangedPassword"
import VerifyLogin from "../emails/VerifyLogin"
import email from "../assets/icons/email.png"
import crown from "../assets/svg/crown.svg"
import curatorStar from "../assets/svg/curator-star.svg"
import contributorPencil from "../assets/svg/pencil.svg"
import premiumStar from "../assets/svg/premium-star.svg"
import enLocale from "../assets/locales/en.json"
import {useInteractionActions} from "../store"
import {Session} from "../types/Types"

let tooltipTimer = null as any
let timerTimeout = 300

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

    public static changedPasswordJSX = (username: string, link: string) => {
        return <ChangedPassword username={username} link={link}/>
    }

    public static verifyLoginJSX = (username: string, link: string, ip: string, region: string) => {
        return <VerifyLogin username={username} link={link} ip={ip} region={region}/>
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
        let jsx = [] as React.ReactElement[]
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
                    items.push({text: null, jsx: <span key={items.length} style={{color: `#${hexColor}`}}>{colorText}</span>})
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
        
        const parts = text.split(/(<<[\s\S]*?\|\|>>)/g)

        parts.forEach((part, index) => {
            if (part.startsWith("<<") && part.endsWith("||>>")) {
                const innerText = part.slice(2, -2)

                const firstDelim = innerText.indexOf("||")
                const lastDelim = innerText.lastIndexOf("||")

                const summary = innerText.slice(0, firstDelim).trim()
                const details = innerText.slice(firstDelim + 2, lastDelim).trim()

                items.push({text: null, jsx: <details key={index}>
                    <summary>{summary}</summary>
                    <div style={{whiteSpace: "pre-wrap"}}>{details}</div>
                </details>})
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
        const parts = text.split(/(@\w+)/g)
        parts.forEach((part, index) => {
            if (part.startsWith("@")) {
                const click = () => {
                    window.open(`/user/${part.slice(1)}`)
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
                items.push({text: null, jsx:<img key={index} src={emojis[key]} title={`:${key}:`} className="emoji"/>})
            } else {
                items.push({text: part, jsx: null})
            }
        })
        return items
    }

    public static linkReplacements = async (text: string, session: Session, setSessionFlag?: (value: boolean) => void) => {
        let domain = functions.config.getDomain()
        let parsed = text

        const postMatches = [...parsed.matchAll(/\bPost\s+#(\d+)\b/gi)]
        for (const match of postMatches) {
            const full = match[0]
            const id = match[1]

            try {
                const post = await functions.http.get(`/api/post`, {postID: id}, session, setSessionFlag)
                const link = `${domain}/post/${id}${post?.slug ? `/${post.slug}` : ""}`
                parsed = parsed.replace(full, link)
            } catch {
                parsed = parsed.replace(full, `${domain}/post/${id}`)
            }
        }

        parsed = parsed.replace(/\b(Thread|Message)\s+#(\d+)\b/gi, (match, type, id) => {
            const lower = type.toLowerCase()
            return `${domain}/${lower}/${id}`
        })

        parsed = parsed.replace(/\[\[([^\]\s]+)\]\]/g, (match, tag) => {
            return `${domain}/tag/${tag}`
        })

        return parsed
    }

    public static undoLinkReplacements = (text: string) => {
        const domain = functions.config.getDomain()
        const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        let parsed = text

        let postRegex = new RegExp(`${escapedDomain}/post/(\\d+)(?:/[^\\s]+)?`, "gi")
        parsed = parsed.replace(postRegex, (match, id) => `Post #${id}`)

        let threadRegex = new RegExp(`${escapedDomain}/thread/(\\d+)`, "gi")
        parsed = parsed.replace(threadRegex, (match, id) => `Thread #${id}`)

        let messageRegex = new RegExp(`${escapedDomain}/message/(\\d+)`, "gi")
        parsed = parsed.replace(messageRegex, (match, id) => `Message #${id}`)

        let userRegex = new RegExp(`${escapedDomain}/user/([^\\s/]+)`, "gi")
        parsed = parsed.replace(userRegex, (match, username) => username)

        let tagRegex = new RegExp(`${escapedDomain}/tag/([^\\s/]+)`, "gi")
        parsed = parsed.replace(tagRegex, (match, tag) => `[[${tag}]]`)

        return parsed
    }

    public static parseLinks = (text: string) => {
        const {setToolTipX, setToolTipY, setToolTipEnabled, setPostTooltipID} = useInteractionActions()
        let items = [] as {text: any, jsx: any}[]
        const parts = text.split(/(\[.*?\]\(.*?\)|https?:\/\/[^\s]+)/g)

        const mouseEnter = async (event: React.MouseEvent, postID: string) => {
            tooltipTimer = setTimeout(() => {
                const toolTipWidth = 420
                const toolTipHeight = 250
                setToolTipX(Math.floor(event.clientX - (toolTipWidth / 2)))
                setToolTipY(Math.floor(event.clientY - (toolTipHeight / 1.05)))
                setPostTooltipID(postID)
                setToolTipEnabled(true)
            }, timerTimeout)
        }
    
        const mouseLeave = () => {
            if (tooltipTimer) clearTimeout(tooltipTimer)
            setToolTipEnabled(false)
        }

        parts.forEach((part, index) => {
            if (part.match(/^\[.*?\]\(.*?\)$/)) {
                const match = part.match(/^\[(.*?)\]\((.*?)\)$/)
                if (match) {
                    const [_, name, link] = match
                    items.push({text: null, jsx: <a className="link" style={{fontWeight: "bold"}} key={index} href={link} target="_blank" rel="noopener">{name}</a>})
                }
            } else if (part.match(/(https?:\/\/[^\s]+)/g)) {
                let name = part
                let domain = functions.config.getDomain()
                let tagLink = false
                let postID = ""
                if (name.includes(`${domain}/post`)) {
                    postID = name.replace(domain, "").match(/\d+/)?.[0] || ""
                    name = `Post #${postID}`
                }
                if (name.includes(`${domain}/thread`)) name = `Thread #${name.replace(domain, "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${domain}/message`)) name = `Message #${name.replace(domain, "").match(/\d+/)?.[0] || ""}`
                if (name.includes(`${domain}/user`)) name = `${name.replace(domain, "").match(/(?<=\/user\/)(.+)/)?.[0] || ""}`
                if (name.includes(`${domain}/tag`)) {
                    name = `${name.replace(domain, "").match(/(?<=\/tag\/)(.+)/)?.[0] || ""}`
                    tagLink = true
                }

                if (functions.util.arrayIncludes(name, ["Post"])) {
                    items.push({text: null, jsx: <a className="link" href={part} target="_blank" rel="noopener" onMouseEnter={(event) => mouseEnter(event, postID)} onMouseLeave={mouseLeave}>{name}</a>})
                } else if (functions.util.arrayIncludes(name, ["Thread", "Message"]) || tagLink) {
                    items.push({text: null, jsx: <a className="link" href={part} target="_blank" rel="noopener">{name}</a>})
                } else if (functions.file.isImage(part) || functions.file.isGIF(part)) {
                    items.push({text: null, jsx: <img key={index} className="comment-image" src={part} crossOrigin="anonymous"/>})
                } else if (functions.file.isVideo(part)) {
                    items.push({text: null, jsx: <video key={index} className="comment-image" src={part} crossOrigin="anonymous" autoPlay loop muted disablePictureInPicture playsInline controls></video>})
                } else {
                    items.push({text: null, jsx: (
                        <span key={index} style={{display: "inline-flex", alignItems: "center", wordBreak: "break-all", flexWrap: "wrap"}}>
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
            "reply": JSXFunctions.renderReplyText,
            "message": JSXFunctions.renderMessageText
        }[type]
        if (type === "message") type = "reply"
        const pieces = functions.render.parsePieces(text)
        let jsx = [] as React.ReactElement[]
        if (r18) jsx.push(<span key={-1} className={`${type}-text`} style={{color: "var(--r18Color)", marginTop: "-38px"}}>[R18]</span>)
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.startsWith(">")) {
                const matchPart = piece.match(/(>>>(\[\d+\])?)(.*?)(?=$|>)/gm)?.[0] ?? ""
                const userPart = matchPart.replace(/(>>>(\[\d+\])?\s*)/, "")
                const id = matchPart.match(/(?<=\[)\d+(?=\])/)?.[0] ?? ""
                let username = ""
                let said = ""
                if (userPart) {
                    username = functions.util.toProperCase(userPart.split(/ +/g)[0])
                    said = userPart.split(/ +/g).slice(1).join(" ")
                }
                const text = piece.replace(matchPart.replace(">>>", ""), "").replaceAll(">", "")
                jsx.push(
                    <div key={i} className={`${type}-quote-container`}>
                        {userPart ? <span className={`${type}-quote-user`} onClick={() => clickFunc?.(id)}>{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className={`${type}-quote-text`}>{renderFunction?.(text, emojis)}</span>
                    </div>
                )
            } else {
                jsx.push(<span key={i} className={`${type}-text`}>{renderFunction?.(piece, emojis)}</span>)
            }
        }
        return jsx
    }

    public static usernameJSX = (userData: {username: string, role: string, banned: boolean | null, deleted: boolean | null, 
        imagePost?: string | null}, classNames: {containerClass: string, textClass: string, imageClass: string, 
        profilePictureClass?: string, recipientClass?: string, editText?: string, date?: string, profilePicture?: string, 
        filter?: string, recipientAmount?: number, session?: Session, setSessionFlag?: (value: boolean) => void}, 
        i18n: typeof enLocale, navigate: NavigateFunction) => {

        const getAdminIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--adminColor")
        }

        const getModIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--modColor")
        }

        const getSystemIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--systemColor")
        }

        const getPremiumIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--premiumColor")
        }

        const getCuratorIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--curatorColor")
        }

        const getContributorIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--contributorColor")
        }

        const getUserIcon = (icon: string) => {
            return functions.color.colorizeSVG(icon, "--userColor")
        }

        let {containerClass, textClass, imageClass, profilePictureClass, recipientClass, editText, date, 
            profilePicture, filter, recipientAmount, session, setSessionFlag} = classNames
        let timeString = editText && date ? `${editText} ${functions.date.timeAgo(date, i18n)} ${i18n.time.by} `  : ""

        const openProfile = (event: React.MouseEvent) => {
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                window.open(`/user/${userData.username}`, "_blank")
            } else {
                navigate(`/user/${userData.username}`)
            }
        }

        const openProfilePost = (event: React.MouseEvent) => {
            if (!userData.imagePost) return
            event.stopPropagation()
            functions.post.openPost(userData.imagePost, event, navigate, session, setSessionFlag)
        }

        if (userData.role === "admin") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} admin-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <img className={imageClass} src={getAdminIcon(crown)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "mod") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} mod-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <img className={imageClass} src={getModIcon(crown)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "system") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} system-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}</span>
                    <img className={imageClass} src={getSystemIcon(crown)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "premium-curator") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} curator-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <img className={imageClass} src={getPremiumIcon(curatorStar)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "curator") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} curator-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <img className={imageClass} src={getCuratorIcon(curatorStar)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "premium-contributor") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} premium-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <img className={imageClass} src={getPremiumIcon(contributorPencil)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "contributor") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} contributor-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <img className={imageClass} src={getContributorIcon(contributorPencil)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        } else if (userData.role === "premium") {
            return (
                <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                    {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                    <span className={`${textClass} premium-color`}>
                        {timeString}{functions.util.toProperCase(userData.username)}
                    </span>
                    <img className={imageClass} src={getPremiumIcon(premiumStar)}/>
                    {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
                </div>
            )
        }
        return (
            <div className={containerClass} onClick={openProfile} onAuxClick={openProfile}>
                {profilePicture ? <img draggable={false} src={profilePicture} className={profilePictureClass} onClick={openProfilePost} onAuxClick={openProfilePost} style={{filter}}/> : null}
                <span className={`${textClass} ${userData.banned ? "banned" : ""} ${userData.deleted ? "deleted" : ""}`}>
                    {timeString}{userData.deleted ? i18n.user.deleted : functions.util.toProperCase(userData.username)}
                </span>
                {(recipientAmount ?? 0) > 1 ? <span className={recipientClass}>(+{recipientAmount! - 1})</span> : null}
            </div>
        )
    }
}