import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import Draggable from "react-draggable"
import "../dialog.less"

const FlipPostDialog: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {flipPostID} = usePostDialogSelector()
    const {setFlipPostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.joinPost.title
    }, [i18n])

    useEffect(() => {
        if (flipPostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "all"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [flipPostID])

    const flipPost = async () => {
        if (!flipPostID) return
        if (permissions.isAdmin(session)) {
            await functions.http.post("/api/post/flip", {postID: flipPostID.post.postID}, session, setSessionFlag)
            setPostFlag(flipPostID.post.postID)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            flipPost()
        }
        setFlipPostID(null)
    }

    if (permissions.isAdmin(session)) {
        if (flipPostID) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "320px"}} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.flipPost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.flipPost.header}</span>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.flip}</button>
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

export default FlipPostDialog