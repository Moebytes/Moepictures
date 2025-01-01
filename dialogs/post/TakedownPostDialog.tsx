import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"
import {PostSearch, PostHistory} from "../../types/Types"

interface Props {
    post: PostSearch | PostHistory
}

const TakedownPostDialog: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {showTakedownPostDialog} = usePostDialogSelector()
    const {setShowTakedownPostDialog} = usePostDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setPostFlag} = useFlagActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const history = useHistory()

    useEffect(() => {
        document.title = getTitle()
    }, [i18n])

    useEffect(() => {
        if (showTakedownPostDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showTakedownPostDialog])

    const takedownPost = async () => {
        if (permissions.isMod(session)) {
            await functions.post("/api/post/takedown",  {postID: props.post.postID}, session, setSessionFlag)
            setPostFlag(true)
            localStorage.removeItem("savedPost")
            localStorage.removeItem("savedPosts")
            localStorage.removeItem("savedTags")
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            takedownPost()
        }
        if (!keep) setShowTakedownPostDialog(false)
    }

    const close = () => {
        setShowTakedownPostDialog(false)
        setSubmitted(false)
        setReason("")
    }

    const getTitle = () => {
        if (props.post.hidden) {
            return i18n.dialogs.takedownPost.restoreTitle
        } else {
            return i18n.dialogs.takedownPost.title
        }
    }

    const getPrompt = () => {
        if (props.post.hidden) {
            return i18n.dialogs.takedownPost.restoreHeader
        } else {
            return i18n.dialogs.takedownPost.header
        }
    }

    if (showTakedownPostDialog) {
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

export default TakedownPostDialog