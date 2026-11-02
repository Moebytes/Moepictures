/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import functions from "../functions/Functions"
import email from "../assets/icons/email.png"
import {useInteractionActions} from "../store"
import {Session} from "../types/Types"

let tooltipTimer = null as any
let timerTimeout = 300

type MoeTextNode = {
    kind: "format" | "color" | "details" | "code" | "link" | "url"
    value: string
    children: (string | MoeTextNode)[]
    summary?: (string | MoeTextNode)[]
}

type OpenSegment = {
    opener: string
    closer: string
    node: MoeTextNode
    children: (string | MoeTextNode)[]
}

export default class MoeText {
    public static parseMarkup = (text: string) => {
        const root: (string | MoeTextNode)[] = []
        const stack: OpenSegment[] = []
        const children = () => stack.at(-1)?.children ?? root

        const appendText = (value: string) => {
            const target = children()
            if (typeof target.at(-1) === "string") {
                target[target.length - 1] = (target.at(-1) as string) + value
            } else if (value) {
                target.push(value)
            }
        }

        const open = (kind: MoeTextNode["kind"], value: string, opener: string, closer: string) => {
            const node: MoeTextNode = {kind, value, children: []}
            stack.push({opener, closer, node, children: node.children})
        }

        const close = () => {
            const current = stack.pop()!
            if (current.node.kind === "details" && typeof current.node.children[0] === "string") {
                current.node.children[0] = current.node.children[0].trimStart()
            }
            children().push(current.node)
        }

        const tokenPatterns = {
            code: /```/,
            link: /\[[^\]\n]*\]\([^\n)]*\)/,
            url: /https?:\/\/\S+/,
            email: /\b[A-Za-z0-9._%+-]+[@＠][A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
            emoji: /:[^\s:]+:/,
            color: /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\{/,
            detailsEnd: /\|\|>>/,
            detailsStart: /<</,
            bold: /\*\*/,
            italic: /\/\//,
            underline: /__/,
            strikethrough: /~~/,
            spoiler: /\|\|/,
            highlight: /==/,
            colorEnd: /}/
        }

        const tokens = new RegExp(Object.values(tokenPatterns).map((pattern) => pattern.source).join("|"), "g")
        let position = 0
        let match: RegExpExecArray | null

        while ((match = tokens.exec(text))) {
            appendText(text.slice(position, match.index))
            const token = match[0]
            position = tokens.lastIndex
            const current = stack.at(-1)

            if (token === "```") {
                const end = text.indexOf("```", position)
                if (end === -1) {
                    appendText(token)
                } else {
                    children().push({kind: "code", value: text.slice(position, end), children: []})
                    position = tokens.lastIndex = end + 3
                }
            } else if (token.startsWith("[")) {
                const separator = token.indexOf("](")
                const label = token.slice(1, separator)
                const destination = token.slice(separator + 2, -1)
                children().push({kind: "link", value: destination, children: this.parseMarkup(label)})
            } else if (token.startsWith("http://") || token.startsWith("https://")) {
                let end = token.length
                for (const parent of stack) {
                    const index = token.indexOf(parent.closer, token.indexOf("://") + 3)
                    if (index !== -1) end = Math.min(end, index)
                }
                children().push({kind: "url", value: token.slice(0, end), children: []})
                position = tokens.lastIndex = match.index + end
            } else if (token.includes("@") || token.includes("＠") || token.startsWith(":")) {
                appendText(token)
            } else if (current && token === current.closer) {
                if (current.node.kind === "details" && !current.node.summary) {
                    appendText(token)
                } else {
                    close()
                }
            } else if (token === "||" && current?.node.kind === "details" && !current.node.summary) {
                current.node.summary = current.children
                current.node.children = current.children = []
            } else if (token === "<<") {
                open("details", "", token, "||>>")
            } else if (token.startsWith("#")) {
                open("color", token.slice(0, -1), token, "}")
            } else if (token === "}" || token === "||>>") {
                appendText(token)
            } else {
                open("format", token, token, token)
            }
        }
        
        appendText(text.slice(position))

        while (stack.length) {
            const current = stack.pop()!
            appendText(current.opener)
            if (current.node.summary) {
                children().push(...current.node.summary)
                appendText("||")
            }
            children().push(...current.children)
        }

        return root
    }

    public static appendChain = (items: {text: any, jsx: any}[], 
        func: (text: string) => {text: any, jsx: any}[]) => {
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

    public static appendParamChain = (items: {text: any, jsx: any}[], param: any, 
        func: (text: string, param: any) => {text: any, jsx: any}[]) => {
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
        return text.replace(/(^|\n)-\s+/g, "$1▪ ")
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

    public static renderCommentaryText = (text: string, emojis: any) => {
        let items = this.parseLinks(text)
        items = this.appendChain(items, this.parseEmails)
        items = this.appendParamChain(items, emojis, this.parseEmojis)
        return this.generateMarkup(items)
    }

    public static commonChain = (text: string, emojis: any, mentions = false) => {
        const styles: Record<string, React.CSSProperties> = {
            "**": {fontWeight: "bold"},
            "//": {fontStyle: "italic"},
            "__": {textDecoration: "underline"},
            "~~": {textDecoration: "line-through"},
            "==": {color: "var(--text-strong)"}
        }

        const render = (nodes: (string | MoeTextNode)[], inLink = false) => nodes.map((node, index) => {
            if (typeof node === "string") {
                let items = [{text: node, jsx: null}] as {text: any, jsx: any}[]
                if (!inLink) items = this.appendChain(items, this.parseEmails)
                items = this.appendParamChain(items, emojis, this.parseEmojis)
                if (mentions && !inLink) items = this.appendChain(items, this.parseMention)
                return <span key={index}>{this.generateMarkup(items)}</span>
            }
            if (node.kind === "code") {
                return <code key={index} style={{color: "inherit"}}>{node.value}</code>
            }
            if (node.kind === "url") {
                return <span key={index}>{inLink ? node.value : this.generateMarkup(this.parseLinks(node.value))}</span>
            }
            if (node.kind === "link") {
                const label = render(node.children, true)
                if (inLink) return <span key={index}>{label}</span>
                return (
                    <a key={index} className="link" style={{fontWeight: "bold"}} 
                    href={node.value} target="_blank" rel="noopener">{label}</a>
                )
            }
            if (node.kind === "details") {
                return (
                    <details key={index}>
                        <summary>{render(node.summary ?? [], inLink)}</summary>
                        <div style={{whiteSpace: "pre-wrap"}}>{render(node.children, inLink)}</div>
                    </details>
                )
            }
            const style = node.kind === "color" ? {color: node.value} : styles[node.value]
            return (
                <span key={index} style={style} className={node.value === "||" ? "spoiler" : undefined}>
                    {render(node.children, inLink)}
                </span>
            )
        })

        const bullets = this.parseBullets(text)
        const parsedMarkup = this.parseMarkup(bullets)
        return [{text: null, jsx: <>{render(parsedMarkup)}</>}]
    }

    public static renderCommentText = (text: string, emojis: any) => {
        let items = this.commonChain(text, emojis)
        return this.generateMarkup(items)
    }

    public static renderReplyText = (text: string, emojis: any) => {
        let items = this.commonChain(text, emojis, true)
        return this.generateMarkup(items)
    }

    public static renderMessageText = (text: string, emojis: any) => {
        let items = this.commonChain(text, emojis)
        return this.generateMarkup(items)
    }

    public static renderText = (text: string, emojis: any, type: string = "comment", 
        clickFunc?: (id: string) => any, r18?: boolean) => {
        const renderFunction = {
            "comment": this.renderCommentText,
            "reply": this.renderReplyText,
            "message": this.renderMessageText
        }[type]
        if (type === "message") type = "reply"
        const pieces = functions.render.parsePieces(text)
        let jsx = [] as React.ReactElement[]
        if (r18) jsx.push(<span key={-1} className={`${type}-text`} style={{color: "var(--r18Color)", 
            marginTop: "-38px"}}>[R18]</span>)
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
                        {userPart ? <span className={`${type}-quote-user`} 
                        onClick={() => clickFunc?.(id)}>{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className={`${type}-quote-text`}>{renderFunction?.(text, emojis)}</span>
                    </div>
                )
            } else {
                jsx.push(<span key={i} className={`${type}-text`}>{renderFunction?.(piece, emojis)}</span>)
            }
        }
        return jsx
    }
}