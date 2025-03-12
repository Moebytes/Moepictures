import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions} from "../../store"
import functions from "../../structures/Functions"
import {PostMetadata} from "../../types/PostTypes"
import "../dialog.less"
import Draggable from "react-draggable"

const PostInfoDialog: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {postInfoID} = usePostDialogSelector()
    const {setPostInfoID} = usePostDialogActions()
    const [info, setInfo] = useState(null as PostMetadata | null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.postInfo.title
    }, [i18n])

    useEffect(() => {
        if (postInfoID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "all"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [postInfoID])

    const getPostInfo = async () => {
        if (postInfoID?.post) {
            const info = await functions.post("/api/post/metadata", {postID: postInfoID.post.postID, order: postInfoID.order}, session, setSessionFlag)
            setInfo(info)
        } else {
            setInfo(null)
        }
    }

    useEffect(() => {
        getPostInfo()
    }, [postInfoID])

    const click = (button: "accept" | "reject") => {
        setPostInfoID(null)
    }

    const infoJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!info) return jsx
        if (info.format) {
            jsx.push(
                <div key="format" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.format}:</span>
                    <span className="dialog-text-small">{info.format}</span>
                </div>
            )
        }
        if (info.width) {
            jsx.push(
                <div key="width" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.width}:</span>
                    <span className="dialog-text-small">{info.width}</span>
                </div>
            )
        }
        if (info.height) {
            jsx.push(
                <div key="height" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.height}:</span>
                    <span className="dialog-text-small">{info.height}</span>
                </div>
            )
        }
        if (info.dpi) {
            jsx.push(
                <div key="dpi" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.dpi}:</span>
                    <span className="dialog-text-small">{info.dpi}</span>
                </div>
            )
        }
        if (Number(info.frames) > 1) {
            jsx.push(
                <div key="frames" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.frames}:</span>
                    <span className="dialog-text-small">{info.frames}</span>
                </div>
            )
        }
        if (info.framerate) {
            jsx.push(
                <div key="framerate" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.framerate}:</span>
                    <span className="dialog-text-small">{info.framerate}</span>
                </div>
            )
        }
        if (info.duration) {
            jsx.push(
                <div key="duration" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.duration}:</span>
                    <span className="dialog-text-small">{functions.formatSeconds(info.duration)}</span>
                </div>
            )
        }
        if (info.size) {
            jsx.push(
                <div key="size" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.labels.size}:</span>
                    <span className="dialog-text-small">{functions.readableFileSize(info.size)}</span>
                </div>
            )
        }
        if (info.colorSpace) {
            jsx.push(
                <div key="colorSpace" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.colorSpace}:</span>
                    <span className="dialog-text-small">{info.colorSpace}</span>
                </div>
            )
        }
        if (info.bitdepth) {
            jsx.push(
                <div key="bitdepth" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.bitdepth}:</span>
                    <span className="dialog-text-small">{info.bitdepth}</span>
                </div>
            )
        }
        if (info.colorChannels) {
            jsx.push(
                <div key="colorChannels" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.colorChannels}:</span>
                    <span className="dialog-text-small">{info.colorChannels}</span>
                </div>
            )
        }
        if (info.chromaSubsampling) {
            jsx.push(
                <div key="chromaSubsampling" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.chromaSubsampling}:</span>
                    <span className="dialog-text-small">{info.chromaSubsampling}</span>
                </div>
            )
        }
        if (info.audioChannels) {
            jsx.push(
                <div key="audioChannels" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.audioChannels}:</span>
                    <span className="dialog-text-small">{info.audioChannels}</span>
                </div>
            )
        }
        if (info.progressive !== undefined) {
            jsx.push(
                <div key="progressive" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.progressive}:</span>
                    <span className="dialog-text-small">{info.progressive ? i18n.buttons.yes : i18n.buttons.no}</span>
                </div>
            )
        }
        if (info.alpha !== undefined) {
            jsx.push(
                <div key="alpha" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.alpha}:</span>
                    <span className="dialog-text-small">{info.alpha ? i18n.buttons.yes : i18n.buttons.no}</span>
                </div>
            )
        }
        if (info.sampleRate) {
            jsx.push(
                <div key="sampleRate" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.sampleRate}:</span>
                    <span className="dialog-text-small">{functions.formatBitrate(info.sampleRate)}</span>
                </div>
            )
        }
        if (info.bitrate) {
            jsx.push(
                <div key="bitrate" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.bitrate}:</span>
                    <span className="dialog-text-small">{functions.formatBitrate(info.bitrate)}</span>
                </div>
            )
        }
        if (info.encoder) {
            jsx.push(
                <div key="encoder" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.encoder}:</span>
                    <span className="dialog-text-small">{info.encoder}</span>
                </div>
            )
        }
        if (info.scanType) {
            jsx.push(
                <div key="scanType" className="dialog-row2">
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.scanType}:</span>
                    <span className="dialog-text-small">{info.scanType}</span>
                </div>
            )
        }
        if (info.colorMatrix) {
            jsx.push(
                <div key="colorMatrix" className="dialog-row2" >
                    <span className="dialog-text-small" style={{marginRight: "10px"}}>{i18n.dialogs.postInfo.colorMatrix}:</span>
                    <span className="dialog-text-small">{info.colorMatrix}</span>
                </div>
            )
        }
        return jsx
    }

    if (postInfoID && info) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px"}} onMouseEnter={() => setEnableDrag(false)} 
                onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.postInfo.title}</span>
                        </div>
                        <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
                            {infoJSX()}
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default PostInfoDialog