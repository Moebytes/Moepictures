import React, {useEffect, useState} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
usePostDialogSelector, usePostDialogActions, useActiveActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import Draggable from "react-draggable"
import "../dialog.less"

const ImageSourceDialog: React.FunctionComponent = () => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {imgSourceID} = usePostDialogSelector()
    const {setImgSourceID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {setActionBanner} = useActiveActions()
    const [submitted, setSubmitted] = useState(false)
    const [source, setSource] = useState("")
    const [reason, setReason] = useState("")

    useEffect(() => {
        document.title = i18n.sidebar.editThumbnail
    }, [i18n])

    useEffect(() => {
        if (imgSourceID) {
            document.body.style.pointerEvents = "all"
            setSource(imgSourceID.image.source || "")
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            setSource("")
            setReason("")
        }
    }, [imgSourceID, session])

    const updateSource = async () => {
        if (!imgSourceID) return
        if (permissions.isContributor(session)) {
            await functions.http.put("/api/image/source", {imageID: imgSourceID.image.imageID, 
            unverified: imgSourceID.unverified, source, reason}, session, setSessionFlag)
            setPostFlag(imgSourceID.image.postID)
            setActionBanner("image-source")
            setImgSourceID(null)
        } else {
            let imageSources = functions.post.imageSourceMap(imgSourceID.post) || {}
            imageSources[imgSourceID.image.order] = source
            const data = {
                postID: imgSourceID.post.postID,
                type: imgSourceID.post.type,
                rating: imgSourceID.post.rating,
                style: imgSourceID.post.style,
                imageSources,
                reason
            }
            await functions.http.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            updateSource()
        } else {
            setImgSourceID(null)
        }
    }

    const close = () => {
        setImgSourceID(null)
        setSubmitted(false)
        setReason("")
    }

    const mainJSX = () => {
        return (
            <>
            <div className="dialog-row">
                <span className="dialog-validation">{i18n.dialogs.imageSource.reminder}</span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.source}: </span>
                <input className="dialog-input" type="text" spellCheck={false} value={source} onChange={(event) => setSource(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.reason}: </span>
                <input style={{width: "100%"}} className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
            </div>
            </>
        )
    }

    if (imgSourceID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.imageSource.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (imgSourceID.unverified || permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "480px", marginTop: "-25px", paddingLeft: "20px", paddingRight: "20px"}} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.imageSource.title}</span>
                            </div>
                            {mainJSX()}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.set}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "480px", marginTop: "-25px", paddingLeft: "20px", paddingRight: "20px"}} onMouseEnter={() => setEnableDrag(false)} 
                onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.imageSource.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.editGroup.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div> 
                        </> : <>
                        {mainJSX()}
                        <div className="dialog-row" style={{marginLeft: "0px"}}>
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submitRequest}</button>
                        </div>
                        </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default ImageSourceDialog