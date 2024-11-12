import React, {useEffect, useState, useRef} from "react"
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

interface Props {
    post: any
}

const UpscalePostDialog: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {showUpscalingDialog} = usePostDialogSelector()
    const {setShowUpscalingDialog} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [upscaler, setUpscaler] = useState("real-cugan")
    const [scaleFactor, setScaleFactor] = useState("4")
    const [compressJPG, setCompressJPG] = useState(true)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Upscale Post"
    }, [])

    useEffect(() => {
        if (showUpscalingDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showUpscalingDialog])

    const upscalePost = async () => {
        if (permissions.isMod(session)) {
            await functions.post("/api/post/upscale",  {postID: props.post.postID, upscaler, scaleFactor, compressJPG}, session, setSessionFlag)
            setPostFlag(true)
            history.go(0)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            upscalePost()
        }
        setShowUpscalingDialog(null)
    }

    if (showUpscalingDialog) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "320px", height: "220px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Upscale Post</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                                <img className="dialog-checkbox" src={upscaler === "waifu2x" ? radioButtonChecked : radioButton} onClick={() => setUpscaler("waifu2x")} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">waifu2x</span>
                                <img className="dialog-checkbox" src={upscaler === "real-esrgan" ? radioButtonChecked : radioButton} onClick={() => setUpscaler("real-esrgan")} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">esrgan</span>
                                <img className="dialog-checkbox" src={upscaler === "real-cugan" ? radioButtonChecked : radioButton} onClick={() => setUpscaler("real-cugan")} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">cugan</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Scale Factor: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={scaleFactor} onChange={(event) => setScaleFactor(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">Compress to {props.post.type === "animation" ? "WebP" : "JPG"}</span>
                                <img className="dialog-checkbox" src={compressJPG ? checkboxChecked : checkbox} onClick={() => setCompressJPG((prev: boolean) => !prev)} style={{marginRight: "10px", filter: getFilter()}}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Upscale"}</button>
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

export default UpscalePostDialog