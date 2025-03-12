import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"

const PermaDeletePostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {permaDeletePostID, permaDeletePostFlag} = usePostDialogSelector()
    const {setPermaDeletePostID, setPermaDeletePostFlag} = usePostDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()

    useEffect(() => {
        document.title = i18n.dialogs.permaDeletePost.title
    }, [i18n])

    useEffect(() => {
        if (permaDeletePostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [permaDeletePostID])

    const deletePost = async () => {
        setPermaDeletePostFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deletePost()
        } else {
            setPermaDeletePostID(null)
        }
    }


    if (permaDeletePostID) {
        if (permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.permaDeletePost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.permaDeletePost.header}</span>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} style={{backgroundColor: "var(--deletedColor)"}} 
                                className="dialog-button">{i18n.buttons.delete}</button>
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

export default PermaDeletePostDialog