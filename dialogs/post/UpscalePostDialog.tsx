/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import {useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import RadioButtonIcon from "../../assets/svg/radiobutton.svg"
import RadioButtonCheckedIcon from "../../assets/svg/radiobutton-checked.svg"
import CheckboxIcon from "../../assets/svg/checkbox.svg"
import CheckboxCheckedIcon from "../../assets/svg/checkbox-checked.svg"
import {Upscaler} from "../../types/Types"
import "../dialog.less"

const UpscalePostDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {upscalePostID} = usePostDialogSelector()
    const {setUpscalePostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [upscaler, setUpscaler] = useState("real-cugan" as Upscaler)
    const [scaleFactor, setScaleFactor] = useState("4")
    const [compressJPG, setCompressJPG] = useState(true)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    useEffect(() => {
        if (upscalePostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [upscalePostID])

    const upscalePost = async () => {
        if (!upscalePostID) return
        if (permissions.isMod(session)) {
            await functions.http.post("/api/post/upscale",  {postID: upscalePostID.post.postID, upscaler, 
            scaleFactor: functions.util.safeNumber(scaleFactor) || 4, compressJPG}, session, setSessionFlag)
            setPostFlag(upscalePostID.post.postID)
            history.go(0)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            upscalePost()
        }
        setUpscalePostID(null)
    }

    if (upscalePostID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "320px", height: "220px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.upscale.title}</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                                {upscaler === "waifu2x" ?
                                <RadioButtonCheckedIcon className="dialog-checkbox" onClick={() => setUpscaler("waifu2x")} style={{marginRight: "10px"}}/> :
                                <RadioButtonIcon className="dialog-checkbox" onClick={() => setUpscaler("waifu2x")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">waifu2x</span>
                                {upscaler === "real-esrgan" ?
                                <RadioButtonCheckedIcon className="dialog-checkbox" onClick={() => setUpscaler("real-esrgan")} style={{marginRight: "10px"}}/> :
                                <RadioButtonIcon className="dialog-checkbox" onClick={() => setUpscaler("real-esrgan")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">esrgan</span>
                                {upscaler === "real-cugan" ?
                                <RadioButtonCheckedIcon className="dialog-checkbox" onClick={() => setUpscaler("real-cugan")} style={{marginRight: "10px"}}/> :
                                <RadioButtonIcon className="dialog-checkbox" onClick={() => setUpscaler("real-cugan")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">cugan</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.scaleFactor}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={scaleFactor} onChange={(event) => setScaleFactor(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">{i18n.labels.compressTo} {upscalePostID.post.type === "animation" ? "WebP" : "JPG"}</span>
                                {compressJPG ?
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setCompressJPG((prev: boolean) => !prev)} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setCompressJPG((prev: boolean) => !prev)} style={{marginRight: "10px"}}/>}
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.upscale}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default UpscalePostDialog