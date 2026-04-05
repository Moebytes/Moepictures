/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useState, useRef, forwardRef, useImperativeHandle, useEffect} from "react"
import {useInteractionActions, useThemeSelector, useSessionSelector,
useLayoutSelector,  useCacheSelector, useSessionActions} from "../store"
import functions from "../functions/Functions"
import moeText from "../moetext/MoeText"
import permissions from "../structures/Permissions"
import lewdIcon from "../assets/icons/lewdgirl.png"
import RadioButtonIcon from "../assets/svg/radiobutton.svg"
import RadioButtonCheckedIcon from "../assets/svg/radiobutton-checked.svg"
import EmojiSelectIcon from "../assets/svg/emoji-select.svg"
import HighlightIcon from "../assets/svg/highlight.svg"
import BoldIcon from "../assets/svg/bold.svg"
import ItalicIcon from "../assets/svg/italic.svg"
import UnderlineIcon from "../assets/svg/underline.svg"
import StrikethroughIcon from "../assets/svg/strikethrough.svg"
import SpoilerIcon from "../assets/svg/spoiler.svg"
import LinkIcon from "../assets/svg/link.svg"
import DetailsIcon from "../assets/svg/details.svg"
import HexcolorIcon from "../assets/svg/hash.svg"
import CodeblockIcon from "../assets/svg/codeblock.svg"
import {ThreadUser, MessageUser} from "../types/Types"
import "./styles/textbox.less"

export interface TextBoxRef {
    getText: () => string
    updateText: (text: string) => void
    getR18: () => boolean
    showError: (msg: string) => void
    clearError: () => void
}

interface Props {
    type: "comment" | "reply" | "message"
    onPost: (text: string) => Promise<void>
    r18Toggle?: boolean
    thread?: ThreadUser
    message?: MessageUser
    manualWidth?: boolean
}

const TextBox = forwardRef<TextBoxRef, Props>((props, ref) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {emojis} = useCacheSelector()
    const [text, setText] = useState("")
    const [r18, setR18] = useState(false)
    const [error, setError] = useState(false)
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [previewText, setPreviewText] = useState("")
    const errorRef = useRef<HTMLSpanElement>(null)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)

    useImperativeHandle(ref, () => ({
        getText: () => {
            return text
        },
        updateText: (text: string) => {
            setText(text)
        },
        getR18: () => {
            return r18
        },
        showError: async (msg: string) => {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = msg
        },
        clearError: () => {
            setError(false)
        }
    }))

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const onPost = async () => {
        const replaced = await moeText.linkReplacements(text, session, setSessionFlag)
        props.onPost(replaced)
    }

    useEffect(() => {
        const updatePreviewText = async () => {
            const replaced = await moeText.linkReplacements(text, session, setSessionFlag)
            setPreviewText(replaced)
        }
        updatePreviewText()
    }, [previewMode])

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
        let elementName = ".textbox-textarea"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = 110
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

    const getBanText = () => {
        if (props.type === "comment") return i18n.pages.comment.banned
        if (props.type === "reply") return i18n.pages.thread.banned
        if (props.type === "message") return i18n.pages.message.banned
    }

    const getButtonText = () => {
        if (props.type === "comment") return i18n.buttons.post
        if (props.type === "reply") return i18n.buttons.reply
        if (props.type === "message") return i18n.buttons.message
    }

    const getTextBox = () => {
        if (props.thread && props.thread.locked && !permissions.isMod(session)) return (
            <div className="textbox-container" style={{justifyContent: "flex-start", marginLeft: props.manualWidth && !mobile ? "190px" : ""}}>
                <span className="textbox-validation" style={{fontSize: "20px", marginLeft: mobile ? "0px" : "15px"}}>{i18n.pages.thread.locked}</span>
            </div>
        )

        if (props.message && props.message.role === "system") return (
            <div className="textbox-container" style={{justifyContent: "flex-start", marginLeft: props.manualWidth && !mobile ? "190px" : ""}}>
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: mobile ? "0px" : "15px"}}>{i18n.pages.message.system}</span>
            </div>
        )

        if (session.banned) return (
            <div className="textbox-container" style={{marginLeft: props.manualWidth && !mobile ? "190px" : ""}}>
                <span className="upload-ban-text" style={{fontSize: "20px", marginLeft: mobile ? "2px" : "10px"}}>{getBanText()}</span>
            </div>
        )

        if (session.username) {
            return (
                <div className="textbox-container" style={{marginLeft: props.manualWidth && !mobile ? "190px" : ""}}>
                    <div className="textbox-textarea-buttons" style={{width: props.manualWidth && !mobile ? "70%" : ""}}>
                        <button className="textbox-textarea-button">
                            <HighlightIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "highlight")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <BoldIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "bold")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <ItalicIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "italic")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <UnderlineIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "underline")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <StrikethroughIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "strikethrough")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <SpoilerIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "spoiler")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <LinkIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "link")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <DetailsIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "details")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <HexcolorIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "color")}/>
                        </button>
                        <button className="textbox-textarea-button">
                            <CodeblockIcon className="textbox-icon" onClick={() => functions.render.triggerTextboxButton(textRef.current, setText, "code")}/>
                        </button>
                    </div>
                    {previewMode ? <div className="textbox-preview" style={{width: props.manualWidth && !mobile ? "70%" : ""}}>{moeText.renderText(previewText, emojis, props.type, undefined, r18)}</div> : 
                    <div style={{marginTop: "0px"}} className="textbox-row-start" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <textarea ref={textRef} className="textbox-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => event.stopPropagation()} style={{width: props.manualWidth && !mobile ? "70%" : ""}}></textarea>
                    </div>}
                    {error ? <div className="textbox-validation-container"><span className="textbox-validation" ref={errorRef}></span></div> : null}
                    <div className="textbox-button-container-left">
                    <button className="textbox-button" onClick={onPost}>{getButtonText()}</button>
                    <button className="textbox-emoji-button" ref={emojiRef} onClick={() => setShowEmojiDropdown((prev: boolean) => !prev)}>
                        <EmojiSelectIcon className="textbox-emoji-icon"/>
                    </button>
                    <button className={previewMode ? "textbox-edit-button" : "textbox-preview-button"} onClick={() => setPreviewMode((prev: boolean) => !prev)}>{previewMode ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
                    {props.r18Toggle && session.showR18 ?
                    <div className="textbox-replybox-row">
                        {r18 ? 
                        <RadioButtonCheckedIcon className="textbox-checkbox" onClick={() => setR18((prev: boolean) => !prev)}/> :
                        <RadioButtonIcon className="textbox-checkbox" onClick={() => setR18((prev: boolean) => !prev)}/>}
                        <span className="textbox-replybox-text" style={{marginLeft: "10px"}}>R18</span>
                        {!mobile ? <img className="textbox-icon" src={lewdIcon} style={{marginLeft: "15px", height: "50px", filter}}/> : null}
                    </div> : null}
                    </div>
                </div>
            )
        }
    }

    return (
        <>
        {getTextBox()}
        {emojiGrid()}
        </>
    )
})

export default TextBox