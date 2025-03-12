import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions, useActiveSelector, 
useActiveActions, useLayoutSelector, useFlagSelector, useFlagActions, useCacheSelector} from "../../store"
import functions from "../../structures/Functions"
import emojiSelect from "../../assets/icons/emoji-select.png"
import highlight from "../../assets/icons/highlight.png"
import bold from "../../assets/icons/bold.png"
import italic from "../../assets/icons/italic.png"
import underline from "../../assets/icons/underline.png"
import strikethrough from "../../assets/icons/strikethrough.png"
import spoiler from "../../assets/icons/spoiler.png"
import link from "../../assets/icons/link-purple.png"
import details from "../../assets/icons/details.png"
import hexcolor from "../../assets/icons/hexcolor.png"
import codeblock from "../../assets/icons/codeblock.png"
import Comment from "./Comment"
import jsxFunctions from "../../structures/JSXFunctions"
import "./styles/comments.less"
import {PostSearch, PostHistory, UserComment} from "../../types/Types"

interface Props {
    post: PostSearch | PostHistory
}

const Comments: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {quoteText} = useActiveSelector()
    const {setQuoteText} = useActiveActions()
    const {mobile} = useLayoutSelector()
    const {commentID, commentJumpFlag} = useFlagSelector()
    const {setCommentID, setCommentJumpFlag} = useFlagActions()
    const {emojis} = useCacheSelector()
    const [text, setText] = useState("")
    const [error, setError] = useState(false)
    const [comments, setComments] = useState([] as UserComment[])
    const [commentFlag, setCommentFlag] = useState(false)
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const commentParam = new URLSearchParams(window.location.search).get("comment")
        const onDOMLoaded = async () => {
            if (commentParam) {
                await functions.timeout(500)
                setCommentID(Number(commentParam))
                setCommentJumpFlag(true)
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (comments && commentID && commentJumpFlag) {
            onCommentJump(commentID)
            setCommentJumpFlag(false)
        }
    }, [comments, commentJumpFlag, commentID])

    const onCommentJump = async (commentID: number) => {
        let element = document.querySelector(`[comment-id="${commentID}"]`)
        if (!element) {
            await functions.timeout(1000)
            element = document.querySelector(`[comment-id="${commentID}"]`)
        }
        if (!element) return
        const position = element.getBoundingClientRect()
        const elementTop = position.top + window.scrollY
        window.scrollTo(0, elementTop - (window.innerHeight / 3))
        setCommentID(commentID)
    }

    useEffect(() => {
        if (commentID) navigate(`${location.pathname}?comment=${commentID}`, {replace: true})
    }, [commentID])

    const updateComments = async () => {
        const comments = await functions.get("/api/post/comments", {postID: props.post.postID}, session, setSessionFlag)
        setComments(comments || [])
    }

    useEffect(() => {
        updateComments()
    }, [session, props.post])

    useEffect(() => {
        if (commentFlag) {
            setCommentFlag(false)
            updateComments()
        }
    }, [commentFlag, session])

    useEffect(() => {
        if (quoteText) {
            const prevText = text.trim() ? `${text.trim()}\n` : ""
            setText(`${prevText}${quoteText.trim()}`)
            setQuoteText("") 
            let element = document.querySelector(".comments-textarea")
            if (!element) return
            const position = element.getBoundingClientRect()
            const elementTop = position.top + window.scrollY
            window.scrollTo(0, elementTop - (window.innerHeight / 3))
        }
    }, [quoteText])

    const post = async () => {
        const badComment = functions.validateComment(text, i18n)
        if (badComment) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badComment
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/comment/create", {postID: props.post.postID, comment: text}, session, setSessionFlag)
            errorRef.current!.innerText = i18n.errors.comment.added
            setCommentFlag(true)
            setText("")
            await functions.timeout(2000)
            setError(false)
        } catch {
            errorRef.current!.innerText = i18n.errors.comment.bad
            await functions.timeout(2000)
            setError(false)
        }
    }

    const generateCommentsJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < comments.length; i++) {
            jsx.push(<Comment key={comments[i].commentID} comment={comments[i]} onDelete={updateComments} onEdit={updateComments} onCommentJump={onCommentJump}/>)
        }
        return jsx
    }

    const keyDown = (event: React.KeyboardEvent) => {
        event.stopPropagation()
    }

    const getEmojiMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -145
        if (mobile) offset -= 20
        return `${raw + offset}px`
    }

    const getEmojiMarginBottom = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".comments-textarea"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = 100
        if (mobile) offset += 0
        return `${raw + offset}px`
    }

    const emojiGrid = () => {
        let rows = [] as React.ReactElement[]
        let rowAmount = 7
        for (let i = 0; i < Object.keys(emojis).length; i++) {
            let items = [] as React.ReactElement[]
            for (let j = 0; j < rowAmount; j++) {
                const k = (i*rowAmount)+j
                const key = Object.keys(emojis)[k]
                if (!key) break
                const appendText = () => {
                    setText((prev: string) => prev + ` :${key}:`)
                    setShowEmojiDropdown(false)
                }
                items.push(
                    <img draggable={false} src={emojis[key]} className="emoji-big" onClick={appendText}/>
                )
            }
            if (items.length) rows.push(<div className="emoji-row">{items}</div>)
        }
        return (
            <div className={`emoji-grid ${showEmojiDropdown ? "" : "hide-emoji-grid"}`}
            style={{marginRight: getEmojiMarginRight(), marginBottom: getEmojiMarginBottom()}}>
                {rows}
            </div>
        )
    }

    const getCommentBox = () => {
        if (session.banned) return (
            <div className="comments-input-container">
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: mobile ? "2px" : "10px"}}>You are banned. Cannot comment.</span>
            </div>
        )
        if (session.username) {
            return (
                <div className="comments-input-container">
                    <div className="comments-textarea-buttons">
                        <button className="comments-textarea-button"><img src={highlight} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "highlight")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={bold} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "bold")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={italic} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "italic")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={underline} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "underline")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={strikethrough} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "strikethrough")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={spoiler} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "spoiler")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={link} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "link")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={details} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "details")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={hexcolor} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "color")} style={{filter: getFilter()}}/></button>
                        <button className="comments-textarea-button"><img src={codeblock} onClick={() => functions.triggerTextboxButton(textRef.current, setText, "code")} style={{filter: getFilter()}}/></button>
                    </div>
                    {previewMode ? <div className="comments-preview">{jsxFunctions.renderText(text, emojis, "comment")}</div> : 
                    <div style={{marginTop: "0px"}} className="comments-row-start" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <textarea ref={textRef} className="comments-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={keyDown}></textarea>
                    </div>}
                    {error ? <div className="comments-validation-container"><span className="comments-validation" ref={errorRef}></span></div> : null}
                    <div className="comments-button-container-left">
                    <button className="comments-button" onClick={post}>{i18n.buttons.post}</button>
                    <button className="comments-emoji-button" ref={emojiRef} onClick={() => setShowEmojiDropdown((prev: boolean) => !prev)}>
                        <img src={emojiSelect}/>
                    </button>
                    <button className={previewMode ? "comments-edit-button" : "comments-preview-button"} onClick={() => setPreviewMode((prev: boolean) => !prev)}>{previewMode ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="comments">
            <div className="comments-title">{i18n.navbar.comments}</div>
            {comments.length ? generateCommentsJSX() :
            <div className="comments-text">{i18n.post.noComments}</div>}
            {getCommentBox()}
            {emojiGrid()}
        </div>
    )
}

export default Comments