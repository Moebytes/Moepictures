/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useInteractionActions, useMessageDialogSelector, useMessageDialogActions, useSessionSelector, 
useSessionActions} from "../../store"
import {useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import emojiSelect from "../../assets/svg/emoji-select.svg"
import MiniTextBox, {MiniTextBoxRef} from "../../ui/MiniTextBox"
import lewdIcon from "../../assets/icons/lewdgirl.png"
import radioButton from "../../assets/svg/radiobutton.svg"
import radioButtonChecked from "../../assets/svg/radiobutton-checked.svg"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const SendMessageDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {dmTarget} = useMessageDialogSelector()
    const {setDMTarget} = useMessageDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [recipients, setRecipients] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [r18, setR18] = useState(false)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const errorRef = useRef<HTMLSpanElement>(null)
    const textBoxRef = useRef<MiniTextBoxRef>(null)
    const navigate = useNavigate()
    const controls = useDragControls()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--titleButtons")
    }

    useEffect(() => {
        if (dmTarget) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setRecipients(dmTarget)
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
            setRecipients("")
        }
    }, [dmTarget])

    const sendMessage = async () => {
        const content = await textBoxRef.current!.resolveReplacements()
        let cleanedRecipients = recipients.split(/\s+/g).map((r) => r.trim())
        if (cleanedRecipients.length < 1) {
            textBoxRef.current?.showError(i18n.dialogs.forwardMessage.recipientRequired)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        if (cleanedRecipients.length > 5 && !permissions.isMod(session)) {
            textBoxRef.current?.showError(i18n.dialogs.forwardMessage.recipientLimit)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        const badTitle = functions.validation.validateTitle(title, i18n)
        if (badTitle) {
            textBoxRef.current?.showError(badTitle)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        const badContent = functions.validation.validateThread(content, i18n)
        if (badContent) {
            textBoxRef.current?.showError(badContent)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        try {
            const messageID = await functions.http.post("/api/message/create", {title, content, r18, recipients: cleanedRecipients}, session, setSessionFlag)
            if (Number.isNaN(Number(messageID))) throw new Error(messageID)
            setDMTarget(null)
            if (messageID) navigate(`/message/${messageID}`)
        } catch (err: any) {
            let errMsg = i18n.dialogs.sendMessage.error
            if (err.message.includes("Cannot send r18 message")) errMsg = i18n.dialogs.sendMessage.errorR18
            textBoxRef.current?.showError(errMsg)
            await functions.timeout(2000)
            textBoxRef.current?.clearError()
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            sendMessage()
        } else {
            setDMTarget(null)
        }
    }

    if (dmTarget) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" ref={dialogRef} style={{width: "500px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.labels.sendMessage}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.recipients}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={recipients} onChange={(event) => setRecipients(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.title}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={title} onChange={(event) => setTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.content}: </span>
                        </div>
                        <MiniTextBox ref={textBoxRef} type="message" height={200} text={content} setText={setContent} textRef={textRef} emojiRef={emojiRef}/>
                        {session.showR18 ?
                        <div className="dialog-row">
                            <img className="dialog-checkbox" src={r18 ? getIcon(radioButtonChecked) : getIcon(radioButton)} onClick={() => setR18((prev: boolean) => !prev)} style={{marginLeft: "0px", filter}}/>
                            <span className="dialog-text" style={{marginLeft: "10px"}}>R18</span>
                            <img className="dialog-title-img" src={lewdIcon} style={{marginLeft: "15px", height: "50px", filter}}/>
                        </div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button className="dialog-emoji-button" ref={emojiRef} onClick={() => textBoxRef.current?.toggleEmojiDropdown()}>
                                <img src={emojiSelect}/>
                            </button>
                            <button className={textBoxRef.current?.getPreviewMode() ? "dialog-edit-button" : "dialog-preview-button"} 
                            onClick={() => textBoxRef.current?.togglePreviewMode()}>
                            {textBoxRef.current?.getPreviewMode() ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.send}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default SendMessageDialog