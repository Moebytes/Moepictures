import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, usePostDialogSelector, usePostDialogActions, useFlagActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"
import {PostSearch, PostHistory} from "../../types/Types"

const LockPostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {lockPostID} = usePostDialogSelector()
    const {setLockPostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        document.title = getTitle()
    }, [i18n])

    useEffect(() => {
        if (lockPostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [lockPostID])

    const lockPost = async () => {
        if (!lockPostID) return
        if (permissions.isMod(session)) {
            await functions.post("/api/post/lock",  {postID: lockPostID.post.postID}, session, setSessionFlag)
            setPostFlag(true)
            localStorage.removeItem("savedPost")
            localStorage.removeItem("savedPosts")
            localStorage.removeItem("savedTagCategories")
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            lockPost()
        }
        if (!keep) setLockPostID(null)
    }

    const getTitle = () => {
        if (lockPostID?.post.locked) {
            return i18n.sidebar.unlockPost
        } else {
            return i18n.dialogs.lockPost.title
        }
    }

    const getPrompt = () => {
        if (lockPostID?.post.locked) {
            return i18n.dialogs.lockPost.unlockHeader
        } else {
            return i18n.dialogs.lockPost.header
        }
    }

    if (lockPostID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{getPrompt()}</span>
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

export default LockPostDialog