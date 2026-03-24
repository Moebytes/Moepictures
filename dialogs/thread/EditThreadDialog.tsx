/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef} from "react"
import {useThemeSelector, useInteractionActions, useThreadDialogSelector, useThreadDialogActions, useSessionSelector} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import emojiSelect from "../../assets/svg/emoji-select.svg"
import MiniTextBox, {MiniTextBoxRef} from "../../ui/MiniTextBox"
import lewdIcon from "../../assets/icons/lewdgirl.png"
import radioButton from "../../assets/svg/radiobutton.svg"
import radioButtonChecked from "../../assets/svg/radiobutton-checked.svg"
import "../dialog.less"

const EditThreadDialog: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editThreadID, editThreadTitle, editThreadContent, editThreadR18} = useThreadDialogSelector()
    const {setEditThreadID, setEditThreadFlag, setEditThreadTitle, setEditThreadContent, setEditThreadR18} = useThreadDialogActions()
    const {session} = useSessionSelector()
    const emojiRef = useRef<HTMLButtonElement>(null)
    const dialogRef = useRef<HTMLDivElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const textBoxRef = useRef<MiniTextBoxRef>(null)
    const controls = useDragControls()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--titleButtons")
    }

    useEffect(() => {
        if (editThreadID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [editThreadID])

    const click = async (button: "accept" | "reject") => {
        if (button === "accept") {
            await textBoxRef.current!.resolveReplacements()
            setEditThreadFlag(true)
        } else {
            setEditThreadID(null)
        }
    }

    if (editThreadID) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" ref={dialogRef} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.editThread.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.title}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={editThreadTitle} onChange={(event) => setEditThreadTitle(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.content}: </span>
                        </div>
                        <MiniTextBox ref={textBoxRef} type="reply" height={200} text={editThreadContent} setText={setEditThreadContent} textRef={textRef} emojiRef={emojiRef}/>
                        {session.showR18 ?
                        <div className="dialog-row">
                            <img className="dialog-checkbox" src={editThreadR18 ? getIcon(radioButtonChecked) : getIcon(radioButton)} onClick={() => setEditThreadR18(!editThreadR18)} style={{marginLeft: "0px", filter}}/>
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
                </motion.div>
            </div>
        )
    }
    return null
}

export default EditThreadDialog