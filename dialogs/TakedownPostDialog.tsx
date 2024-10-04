import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ShowTakedownPostDialogContext, HideTitlebarContext,
SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/dialog.less"
import permissions from "../structures/Permissions"

interface Props {
    post: any
}

const TakedownPostDialog: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showTakedownPostDialog, setShowTakedownPostDialog} = useContext(ShowTakedownPostDialogContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Takedown Post"
    }, [])

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
        if (permissions.isAdmin(session)) {
            await functions.post("/api/post/takedown",  {postID: props.post.postID}, session, setSessionFlag)
            history.go(0)
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
            return "Restore Post"
        } else {
            return "Takedown Post"
        }
    }

    const getPrompt = () => {
        if (props.post.hidden) {
            return "Do you want to restore this post?"
        } else {
            return "Are you sure that you want to takedown this post?"
        }
    }

    if (showTakedownPostDialog) {
        if (permissions.isAdmin(session)) {
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

export default TakedownPostDialog