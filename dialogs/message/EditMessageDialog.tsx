import React, {useEffect, useState, useRef, useReducer} from "react"
import {useThemeSelector, useInteractionActions, useMessageDialogSelector, useMessageDialogActions, useSessionSelector,
useLayoutSelector, useCacheSelector} from "../../store"
import functions from "../../functions/Functions"
import "../dialog.less"
import Draggable from "react-draggable"
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
import permissions from "../../structures/Permissions"
import lewdIcon from "../../assets/icons/lewd.png"
import radioButton from "../../assets/icons/radiobutton.png"
import radioButtonChecked from "../../assets/icons/radiobutton-checked.png"

const EditMessageDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editMessageID, editMessageTitle, editMessageContent, editMessageR18} = useMessageDialogSelector()
    const {setEditMessageID, setEditMessageFlag, setEditMessageTitle, setEditMessageContent, setEditMessageR18} = useMessageDialogActions()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const {emojis} = useCacheSelector()
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.deleteMessage.title
    }, [i18n])

    useEffect(() => {
        if (editMessageID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editMessageID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setEditMessageFlag(true)
        } else {
            setEditMessageID(null)
        }
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        const observer = new ResizeObserver(() => forceUpdate())
        const dialogElement = dialogRef.current
        const textareaElement = textRef.current
        if (dialogElement) observer.observe(dialogElement)
        if (textareaElement) observer.observe(textareaElement)
        return () => {
            observer.disconnect()
        }
    }, [])

    const getEmojiMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -120
        if (mobile) offset += 0
        return `${raw + offset}px`
    }

    const getEmojiMarginBottom = () => {
        if (typeof document === "undefined") return "0px"
        const bodyRect = dialogRef.current?.getBoundingClientRect()
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = window.innerHeight - rect.bottom
        let offset = 40
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
                    setEditMessageContent(editMessageContent + ` :${key}:`)
                    setShowEmojiDropdown(false)
                }
                items.push(
                    <img draggable={false} src={emojis[key]} className="dialog-emoji-big" onClick={appendText}/>
                )
            }
            if (items.length) rows.push(<div className="dialog-emoji-row">{items}</div>)
        }
        return (
            <div className={`dialog-emoji-grid ${showEmojiDropdown ? "" : "hide-dialog-emoji-grid"}`}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}
            style={{marginRight: getEmojiMarginRight(), marginBottom: getEmojiMarginBottom()}}>
                {rows}
            </div>
        )
    }

    if (editMessageID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" ref={dialogRef} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.deleteMessage.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.title}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={editMessageTitle} onChange={(event) => setEditMessageTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.content}: </span>
                        </div>
                        <div className="dialog-textarea-buttons">
                            <button className="dialog-textarea-button"><img src={highlight} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "highlight")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={bold} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "bold")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={italic} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "italic")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={underline} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "underline")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={strikethrough} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "strikethrough")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={spoiler} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "spoiler")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={link} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "link")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={details} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "details")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={hexcolor} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "color")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={codeblock} onClick={() => functions.render.triggerTextboxButton(textRef.current, setEditMessageContent, "code")} style={{filter: getFilter()}}/></button>
                        </div>
                        {previewMode ? <div className="dialog-textarea-preview">{functions.jsx.renderText(editMessageContent, emojis, "message")}</div> : 
                        <div style={{marginTop: "0px"}} className="dialog-row">
                            <textarea className="dialog-textarea" ref={textRef} style={{resize: "vertical", height: "330px"}} spellCheck={false} value={editMessageContent} onChange={(event) => setEditMessageContent(event.target.value)}></textarea>
                        </div>}
                        {session.showR18 ?
                        <div className="dialog-row">
                            <img className="dialog-checkbox" src={editMessageR18 ? radioButtonChecked : radioButton} onClick={() => setEditMessageR18(!editMessageR18)} style={{marginLeft: "0px", filter: getFilter()}}/>
                            <span className="dialog-text" style={{marginLeft: "10px"}}>R18</span>
                            <img className="dialog-title-img" src={lewdIcon} style={{marginLeft: "15px", height: "50px", filter: getFilter()}}/>
                        </div> : null}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button className="dialog-emoji-button" ref={emojiRef} onClick={() => setShowEmojiDropdown((prev: boolean) => !prev)}>
                                <img src={emojiSelect}/>
                            </button>
                            <button className={previewMode ? "dialog-edit-button" : "dialog-preview-button"} onClick={() => setPreviewMode((prev: boolean) => !prev)}>{previewMode ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.edit}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
                {emojiGrid()}
            </div>
        )
    }
    return null
}

export default EditMessageDialog