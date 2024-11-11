import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, ShowCompressingDialogContext, HideTitlebarContext,
SessionContext, SessionFlagContext, PostFlagContext} from "../Context"
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

const CompressPostDialog: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showCompressingDialog, setShowCompressingDialog} = useContext(ShowCompressingDialogContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [quality, setQuality] = useState("95")
    const [format, setFormat] = useState(props.post.type === "animation" ? "webp" : "jpg")
    const [maxDimension, setMaxDimension] = useState("2000")
    const [maxUpscaledDimension, setMaxUpscaledDimension] = useState("8000")
    const [original, setOriginal] = useState(true)
    const [upscaled, setUpscaled] = useState(true)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Compress Post"
    }, [])

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
            await functions.post("/api/post/compress",  {postID: props.post.postID, quality, format, maxDimension, maxUpscaledDimension, original, upscaled}, session, setSessionFlag)
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
                                <span className="dialog-title">Compress Post</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Quality: </span>
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
                                <span className="dialog-text">Max Dimension: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={maxDimension} onChange={(event) => setMaxDimension(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Max Upscaled: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={maxUpscaledDimension} onChange={(event) => setMaxUpscaledDimension(event.target.value)} style={{width: "30%"}}/>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">Original</span>
                                <img className="dialog-checkbox" src={original ? checkboxChecked : checkbox} onClick={() => setOriginal((prev: boolean) => !prev)} style={{marginRight: "10px", filter: getFilter()}}/>
                                <span className="dialog-text">Upscaled</span>
                                <img className="dialog-checkbox" src={upscaled ? checkboxChecked : checkbox} onClick={() => setUpscaled((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Compress"}</button>
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