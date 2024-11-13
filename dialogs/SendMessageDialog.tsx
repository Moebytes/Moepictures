import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useMessageDialogSelector, useMessageDialogActions, useSessionSelector, 
useSessionActions, useCacheSelector, useLayoutSelector} from "../store"
import {useThemeSelector} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import emojiSelect from "../assets/icons/emoji-select.png"
import lewdIcon from "../assets/icons/lewd.png"
import radioButton from "../assets/icons/radiobutton.png"
import radioButtonChecked from "../assets/icons/radiobutton-checked.png"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const SendMessageDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {dmTarget} = useMessageDialogSelector()
    const {setDMTarget} = useMessageDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {emojis} = useCacheSelector()
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [recipients, setRecipients] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [r18, setR18] = useState(false)
    const [error, setError] = useState(false)
    const emojiRef = useRef(null) as any
    const dialogRef = useRef(null) as any
    const textAreaRef = useRef(null) as any
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Send Message"
    }, [])

    useEffect(() => {
        if (dmTarget) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            setRecipients(dmTarget)
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            setRecipients("")
        }
    }, [dmTarget])

    const sendMessage = async () => {
        let cleanedRecipients = recipients.split(/\s+/g).map((r: any) => r.trim())
        if (cleanedRecipients.length < 1) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "At least 1 recipient is required."
            await functions.timeout(2000)
            return setError(false)
        }
        if (cleanedRecipients.length > 5 && !permissions.isMod(session)) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "You can't send to more than 5 recipients."
            await functions.timeout(2000)
            return setError(false)
        }
        const badTitle = functions.validateTitle(title)
        if (badTitle) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badTitle
            await functions.timeout(2000)
            return setError(false)
        }
        const badContent = functions.validateThread(content)
        if (badContent) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badContent
            await functions.timeout(2000)
            return setError(false)
        }
        try {
            const message = await functions.post("/api/message/create", {title, content, r18, recipients: cleanedRecipients}, session, setSessionFlag)
            setDMTarget(null)
            if (message.messageID) history.push(`/message/${message.messageID}`)
        } catch (err: any) {
            setError(true)
            let errMsg = "Bad title or content."
            if (err.response?.data.includes("Cannot send r18 message")) errMsg = "Cannot send this message."
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = errMsg
            await functions.timeout(2000)
            setError(false)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            sendMessage()
        } else {
            setDMTarget(null)
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
                    setContent((prev: string) => prev + ` emoji:${key}`)
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

    if (dmTarget) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" ref={dialogRef} style={{width: "500px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Send Message</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Recipients: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={recipients} onChange={(event) => setRecipients(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Title: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={title} onChange={(event) => setTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Content: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" ref={textAreaRef} style={{resize: "vertical", height: "200px"}} spellCheck={false} value={content} onChange={(event) => setContent(event.target.value)}></textarea>
                        </div>
                        {session.showR18 ?
                        <div className="dialog-row">
                            <img className="dialog-checkbox" src={r18 ? radioButtonChecked : radioButton} onClick={() => setR18((prev: boolean) => !prev)} style={{marginLeft: "0px", filter: getFilter()}}/>
                            <span className="dialog-text" style={{marginLeft: "10px"}}>R18</span>
                            <img className="dialog-title-img" src={lewdIcon} style={{marginLeft: "15px", height: "50px", filter: getFilter()}}/>
                        </div> : null}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button className="dialog-emoji-button" ref={emojiRef} onClick={() => setShowEmojiDropdown((prev: boolean) => !prev)}>
                                <img src={emojiSelect}/>
                            </button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Send"}</button>
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

export default SendMessageDialog