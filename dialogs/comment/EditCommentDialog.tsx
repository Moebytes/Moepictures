/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef} from "react"
import {useThemeSelector, useInteractionActions, useCommentDialogSelector, useCommentDialogActions} from "../../store"
import emojiSelect from "../../assets/svg/emoji-select.svg"
import MiniTextBox, {MiniTextBoxRef} from "../../ui/MiniTextBox"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const EditCommentDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editCommentID, editCommentText} = useCommentDialogSelector()
    const {setEditCommentID, setEditCommentFlag, setEditCommentText} = useCommentDialogActions()
    const emojiRef = useRef<HTMLButtonElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const textBoxRef = useRef<MiniTextBoxRef>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (editCommentID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [editCommentID])

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            await textBoxRef.current?.resolveReplacements()
            setEditCommentFlag(true)
        } else {
            setEditCommentID(null)
        }
    }

    if (editCommentID) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" ref={dialogRef} style={{width: "400px"}} 
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.editComment.title}</span>
                        </div>
                        <MiniTextBox ref={textBoxRef} type="comment" height={140} text={editCommentText} setText={setEditCommentText} textRef={textRef} emojiRef={emojiRef}/>
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
                </motion.div>
            </div>
        )
    }
    return null
}

export default EditCommentDialog