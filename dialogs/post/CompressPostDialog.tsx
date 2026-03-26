/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useContext, useState, useRef} from "react"
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
import {ImageFormat} from "../../types/Types"
import "../dialog.less"

const CompressPostDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {compressPostID} = usePostDialogSelector()
    const {setCompressPostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [quality, setQuality] = useState("95")
    const [format, setFormat] = useState("jpg" as ImageFormat)
    const [maxDimension, setMaxDimension] = useState("2000")
    const [maxUpscaledDimension, setMaxUpscaledDimension] = useState("8000")
    const [original, setOriginal] = useState(true)
    const [upscaled, setUpscaled] = useState(true)
    const controls = useDragControls()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    useEffect(() => {
        if (compressPostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setFormat(compressPostID.post.type === "animation" ? "webp" : "jpg" as ImageFormat)
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [compressPostID])

    const compressPost = async () => {
        if (!compressPostID) return
        if (permissions.isMod(session)) {
            await functions.http.post("/api/post/compress",  {postID: compressPostID.post.postID, 
            quality: functions.util.safeNumber(quality) || 95, format, maxDimension: functions.util.safeNumber(maxDimension) || 2000, 
            maxUpscaledDimension: functions.util.safeNumber(maxUpscaledDimension) || 8000, original, upscaled}, session, setSessionFlag)
            setPostFlag(compressPostID.post.postID)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            compressPost()
        }
        setCompressPostID(null)
    }

    if (compressPostID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "300px", height: "290px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.compress.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.quality}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={quality} onChange={(event) => setQuality(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                                {compressPostID.post.type === "image" || compressPostID.post.type === "comic" ? <>
                                {format === "jpg" ? 
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setFormat("jpg")} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setFormat("jpg")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">jpg</span>
                                {format === "png" ? 
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setFormat("png")} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setFormat("png")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">png</span></> : null}
                                {compressPostID.post.type === "animation" ? <>
                                {format === "gif" ? 
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setFormat("gif")} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setFormat("gif")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">gif</span></> : null}
                                {format === "webp" ? 
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setFormat("webp")} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setFormat("webp")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">webp</span>
                                {format === "avif" ? 
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setFormat("avif")} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setFormat("avif")} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">avif</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.maxDimension}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={maxDimension} onChange={(event) => setMaxDimension(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.maxUpscaled}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={maxUpscaledDimension} onChange={(event) => setMaxUpscaledDimension(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">{i18n.labels.original}</span>
                                {original ?
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setOriginal((prev: boolean) => !prev)} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setOriginal((prev: boolean) => !prev)} style={{marginRight: "10px"}}/>}
                                <span className="dialog-text">{i18n.labels.upscaled}</span>
                                {upscaled ?
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setUpscaled((prev: boolean) => !prev)}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setUpscaled((prev: boolean) => !prev)}/>}
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.compress}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default CompressPostDialog