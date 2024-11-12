import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, usePostDialogSelector, usePostDialogActions, useFlagActions, useSessionSelector, useSessionActions} from "../store"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

interface Props {
    post: any
}

const PrivatePostDialog: React.FunctionComponent<Props> = (props) => {
    const {setEnableDrag} = useInteractionActions()
    const {privatePostObj} = usePostDialogSelector()
    const {setPrivatePostObj} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Private Post"
    }, [])

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
            return "Unprivate Post"
        } else {
            return "Private Post"
        }
    }

    const getPrompt = () => {
        if (props.post.private) {
            return "Do you want to unprivate this post?"
        } else {
            return "Do you want to set this post to private?"
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
                                <button onClick={() => click("reject")} className="dialog-button">{"No"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Yes"}</button>
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