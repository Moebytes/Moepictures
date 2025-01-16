import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useThreadDialogSelector, useThreadDialogActions, useSessionSelector,
useLayoutSelector, useCacheSelector} from "../../store"
import functions from "../../structures/Functions"
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
import jsxFunctions from "../../structures/JSXFunctions"
import permissions from "../../structures/Permissions"
import lewdIcon from "../../assets/icons/lewd.png"
import radioButton from "../../assets/icons/radiobutton.png"
import radioButtonChecked from "../../assets/icons/radiobutton-checked.png"

const EditReplyDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editReplyID, editReplyContent, editReplyR18} = useThreadDialogSelector()
    const {setEditReplyID, setEditReplyFlag, setEditReplyContent, setEditReplyR18} = useThreadDialogActions()
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
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.editReply.title
    }, [i18n])

    useEffect(() => {
        if (editReplyID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editReplyID])

    const editReply = async () => {
        setEditReplyFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editReply()
        } else {
            setEditReplyID(null)
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
                    setEditReplyContent(editReplyContent + ` :${key}:`)
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

    if (editReplyID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" ref={dialogRef} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.editReply.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.content}: </span>
                        </div>
                        <div className="dialog-textarea-buttons">
                            <button className="dialog-textarea-button"><img src={highlight} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "highlight")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={bold} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "bold")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={italic} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "italic")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={underline} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "underline")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={strikethrough} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "strikethrough")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={spoiler} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "spoiler")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={link} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "link")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={details} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "details")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={hexcolor} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "color")} style={{filter: getFilter()}}/></button>
                            <button className="dialog-textarea-button"><img src={codeblock} onClick={() => functions.triggerTextboxButton(textRef.current, setEditReplyContent, "code")} style={{filter: getFilter()}}/></button>
                        </div>
                        {previewMode ? <div className="dialog-textarea-preview">{jsxFunctions.renderText(editReplyContent, emojis, "reply")}</div> : 
                        <div style={{marginTop: "0px"}} className="dialog-row">
                            <textarea className="dialog-textarea" ref={textRef} style={{resize: "vertical", height: "200px"}} spellCheck={false} value={editReplyContent} onChange={(event) => setEditReplyContent(event.target.value)}></textarea>
                        </div>}
                        {session.showR18 ?
                        <div className="dialog-row">
                            <img className="dialog-checkbox" src={editReplyR18 ? radioButtonChecked : radioButton} onClick={() => setEditReplyR18(!editReplyR18)} style={{marginLeft: "0px", filter: getFilter()}}/>
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

export default EditReplyDialog