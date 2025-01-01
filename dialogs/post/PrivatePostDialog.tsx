import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, usePostDialogSelector, usePostDialogActions, useFlagActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"
import {PostSearch, PostHistory} from "../../types/Types"

interface Props {
    post: PostSearch | PostHistory
}

const PrivatePostDialog: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {privatePostObj} = usePostDialogSelector()
    const {setPrivatePostObj} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = getTitle()
    }, [i18n])

    useEffect(() => {
        if (privatePostObj) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [privatePostObj])

    const privatePost = async () => {
        if (!privatePostObj) return
        if (permissions.canPrivate(session, privatePostObj.artists)) {
            await functions.post("/api/post/private",  {postID: props.post.postID}, session, setSessionFlag)
            setPostFlag(true)
            localStorage.removeItem("savedPost")
            localStorage.removeItem("savedPosts")
            localStorage.removeItem("savedTags")
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            privatePost()
        }
        setPrivatePostObj(null)
    }

    const getTitle = () => {
        if (props.post.private) {
            return i18n.dialogs.privatePost.unprivateTitle
        } else {
            return i18n.dialogs.privatePost.title
        }
    }

    const getPrompt = () => {
        if (props.post.private) {
            return i18n.dialogs.privatePost.unprivateHeader
        } else {
            return i18n.dialogs.privatePost.header
        }
    }

    if (privatePostObj) {
        if (permissions.canPrivate(session, privatePostObj.artists)) {
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

export default PrivatePostDialog