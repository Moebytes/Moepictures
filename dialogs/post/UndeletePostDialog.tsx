import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions,
useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"

const UndeletePostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {undeletePostID} = usePostDialogSelector()
    const {setUndeletePostID} = usePostDialogActions()
    const {setHistoryFlag, setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const history = useHistory()

    useEffect(() => {
        document.title = i18n.dialogs.undeletePost.title
    }, [i18n])

    useEffect(() => {
        if (undeletePostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [undeletePostID])

    const undeletePost = async () => {
        if (!undeletePostID?.postID) return
        if (undeletePostID.unverified) {
            await functions.put("/api/post/undelete/unverified", {postID: undeletePostID.postID}, session, setSessionFlag)
        } else {
            await functions.put("/api/post/undelete", {postID: undeletePostID.postID}, session, setSessionFlag)
        }
        setUndeletePostID(null)
        setPostFlag(true)
        setHistoryFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            undeletePost()
        } else {
            setUndeletePostID(null)
        }
    }


    if (undeletePostID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.undeletePost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.undeletePost.header}</span>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.no}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.yes}</button>
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

export default UndeletePostDialog