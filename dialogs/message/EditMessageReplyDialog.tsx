/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef} from "react"
import {useThemeSelector, useInteractionActions, useMessageDialogSelector, 
useMessageDialogActions, useSessionSelector} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
import emojiSelect from "../../assets/svg/emoji-select.svg"
import MiniTextBox, {MiniTextBoxRef} from "../../ui/MiniTextBox"
import lewdIcon from "../../assets/icons/lewdgirl.png"
import radioButton from "../../assets/svg/radiobutton.svg"
import radioButtonChecked from "../../assets/svg/radiobutton-checked.svg"
import "../dialog.less"

const EditMessageReplyDialog: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editMsgReplyID, editMsgReplyContent, editMsgReplyR18} = useMessageDialogSelector()
    const {setEditMsgReplyID, setEditMsgReplyFlag, setEditMsgReplyContent, setEditMsgReplyR18} = useMessageDialogActions()
    const {session} = useSessionSelector()
    const emojiRef = useRef<HTMLButtonElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const textBoxRef = useRef<MiniTextBoxRef>(null)

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--titleButtons")
    }

    useEffect(() => {
        if (editMsgReplyID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editMsgReplyID])

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            await textBoxRef.current?.resolveReplacements()
            setEditMsgReplyFlag(true)
        } else {
            setEditMsgReplyID(null)
        }
    }

    if (editMsgReplyID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" ref={dialogRef} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.editMessageReply.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.content}: </span>
                        </div>
                        <MiniTextBox ref={textBoxRef} type="message" height={200} text={editMsgReplyContent} setText={setEditMsgReplyContent} textRef={textRef} emojiRef={emojiRef}/>
                        {session.showR18 ?
                        <div className="dialog-row">
                            <img className="dialog-checkbox" src={editMsgReplyR18 ? getIcon(radioButtonChecked) : getIcon(radioButton)} onClick={() => setEditMsgReplyR18(!editMsgReplyR18)} style={{marginLeft: "0px", filter}}/>
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
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.edit}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditMessageReplyDialog