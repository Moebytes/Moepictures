import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useCommentDialogSelector, useCommentDialogActions, 
useLayoutSelector, useCacheSelector} from "../store"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import emojiSelect from "../assets/icons/emoji-select.png"
import Draggable from "react-draggable"

const EditCommentDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {setEnableDrag} = useInteractionActions()
    const {editCommentID, editCommentText} = useCommentDialogSelector()
    const {setEditCommentID, setEditCommentFlag, setEditCommentText} = useCommentDialogActions()
    const {mobile} = useLayoutSelector()
    const {emojis} = useCacheSelector()
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const emojiRef = useRef(null) as any
    const dialogRef = useRef(null) as any
    const textAreaRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        document.title = "Edit Comment"
    }, [])

    useEffect(() => {
        if (editCommentID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editCommentID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setEditCommentFlag(true)
        } else {
            setEditCommentID(null)
        }
    }

    useEffect(() => {
        if (typeof window === "undefined") return
        const observer = new ResizeObserver(() => forceUpdate())
        const dialogElement = dialogRef.current
        const textareaElement = textAreaRef.current
        if (dialogElement) observer.observe(dialogElement)
        if (textareaElement) observer.observe(textareaElement)
        return () => {
            observer.disconnect()
        }
    })

    const getEmojiMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -100
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
        let rows = [] as any
        let rowAmount = 7
        for (let i = 0; i < Object.keys(emojis).length; i++) {
            let items = [] as any
            for (let j = 0; j < rowAmount; j++) {
                const k = (i*rowAmount)+j
                const key = Object.keys(emojis)[k]
                if (!key) break
                const appendText = () => {
                    setEditCommentText(editCommentText + ` emoji:${key}`)
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

    if (editCommentID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" ref={dialogRef} style={{width: "400px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Edit Comment</span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" ref={textAreaRef} style={{resize: "vertical", height: "140px"}} spellCheck={false} value={editCommentText} onChange={(event) => setEditCommentText(event.target.value)}></textarea>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button className="dialog-emoji-button" ref={emojiRef} onClick={() => setShowEmojiDropdown((prev: boolean) => !prev)}>
                                <img src={emojiSelect}/>
                            </button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Edit"}</button>
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

export default EditCommentDialog