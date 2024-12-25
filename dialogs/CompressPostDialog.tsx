import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions, useFlagActions} from "../store"
import {useThemeSelector} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"
import radioButton from "../assets/icons/radiobutton.png"
import radioButtonChecked from "../assets/icons/radiobutton-checked.png"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import {PostSearch, PostHistory, ImageFormat} from "../types/Types"

interface Props {
    post: PostSearch | PostHistory 
}

const CompressPostDialog: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {showCompressingDialog} = usePostDialogSelector()
    const {setShowCompressingDialog} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [quality, setQuality] = useState("95")
    const [format, setFormat] = useState(props.post.type === "animation" ? "webp" : "jpg" as ImageFormat)
    const [maxDimension, setMaxDimension] = useState("2000")
    const [maxUpscaledDimension, setMaxUpscaledDimension] = useState("8000")
    const [original, setOriginal] = useState(true)
    const [upscaled, setUpscaled] = useState(true)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.compress.title
    }, [i18n])

    useEffect(() => {
        if (showCompressingDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showCompressingDialog])

    const compressPost = async () => {
        if (permissions.isMod(session)) {
            await functions.post("/api/post/compress",  {postID: props.post.postID, 
            quality: functions.safeNumber(quality) || 95, format, maxDimension: functions.safeNumber(maxDimension) || 2000, 
            maxUpscaledDimension: functions.safeNumber(maxUpscaledDimension) || 8000, original, upscaled}, session, setSessionFlag)
            setPostFlag(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            compressPost()
        }
        setShowCompressingDialog(null)
    }

    if (showCompressingDialog) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "300px", height: "290px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.compress.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.quality}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={quality} onChange={(event) => setQuality(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                                {props.post.type === "image" || props.post.type === "comic" ? <>
                                <img className="dialog-checkbox" src={format === "jpg" ? radioButtonChecked : radioButton} onClick={() => setFormat("jpg")} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">jpg</span>
                                <img className="dialog-checkbox" src={format === "png" ? radioButtonChecked : radioButton} onClick={() => setFormat("png")} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">png</span></> : null}
                                {props.post.type === "animation" ? <>
                                <img className="dialog-checkbox" src={format === "gif" ? radioButtonChecked : radioButton} onClick={() => setFormat("gif")} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">gif</span></> : null}
                                <img className="dialog-checkbox" src={format === "webp" ? radioButtonChecked : radioButton} onClick={() => setFormat("webp")} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">webp</span>
                                <img className="dialog-checkbox" src={format === "avif" ? radioButtonChecked : radioButton} onClick={() => setFormat("avif")} style={{marginRight: "10px", filter: getFilter()}}/>
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
                                <img className="dialog-checkbox" src={original ? checkboxChecked : checkbox} onClick={() => setOriginal((prev: boolean) => !prev)} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">{i18n.labels.upscaled}</span>
                                <img className="dialog-checkbox" src={upscaled ? checkboxChecked : checkbox} onClick={() => setUpscaled((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.compress}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }
    }
    return null
}

export default CompressPostDialog