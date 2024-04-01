import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, ShowDeletePostDialogContext, HideTitlebarContext,
SessionContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import "./styles/deletepostdialog.less"
import permissions from "../structures/Permissions"
import axios from "axios"

interface Props {
    post: any
}

const DeletePostDialog: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {showDeletePostDialog, setShowDeletePostDialog} = useContext(ShowDeletePostDialogContext)
    const {session, setSession} = useContext(SessionContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Delete Post"
    }, [])

    useEffect(() => {
        if (showDeletePostDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showDeletePostDialog])

    const deletePost = async () => {
        if (permissions.isStaff(session)) {
            await axios.delete("/api/post/delete", {params: {postID: props.post.postID}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            history.push("/posts")
        } else {
            const badReason = functions.validateReason(reason)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            await axios.post("/api/post/delete/request", {postID: props.post.postID, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deletePost()
        }
        if (!keep) setShowDeletePostDialog(false)
    }

    const close = () => {
        setShowDeletePostDialog(false)
        setSubmitted(false)
        setReason("")
    }

    if (showDeletePostDialog) {
        if (permissions.isStaff(session)) {
            return (
                <div className="deletepost-dialog">
                    <Draggable handle=".deletepost-dialog-title-container">
                    <div className="deletepost-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="deletepost-container">
                            <div className="deletepost-dialog-title-container">
                                <span className="deletepost-dialog-title">Delete Post</span>
                            </div>
                            <div className="deletepost-dialog-row">
                                <span className="deletepost-dialog-text">Are you sure that you want to delete this post?</span>
                            </div>
                            <div className="deletepost-dialog-row">
                                <button onClick={() => click("reject")} className="download-button">{"No"}</button>
                                <button onClick={() => click("accept")} className="download-button">{"Yes"}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="deletepost-dialog">
                <Draggable handle=".deletepost-dialog-title-container">
                <div className="deletepost-dialog-box" style={{width: "500px", height: submitted ? "125px" : "250px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="deletepost-container">
                        <div className="deletepost-dialog-title-container">
                            <span className="deletepost-dialog-title">Delete Post Request</span>
                        </div>
                        {submitted ? <>
                        <div className="deletepost-dialog-row">
                            <span className="deletepost-dialog-text">Your delete request was submitted.</span>
                        </div>
                        <div className="deletepost-dialog-row">
                            <button onClick={() => close()} className="download-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="download-button">{"OK"}</button>
                        </div>
                        </> : <>
                        <div className="deletepost-dialog-row">
                            <span className="deletepost-dialog-text-small">If you think that a post is low-quality, you may request it's deletion and it will get re-reviewed by staff. If you want to delete a post for a copyright reason, please use the contact form instead. Why do you want to delete this post?</span>
                        </div>
                        <div className="deletepost-dialog-row">
                            <span className="deletepost-dialog-text">Reason: </span>
                            <input className="deletepost-dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="deletepost-dialog-validation-container"><span className="deletepost-dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="deletepost-dialog-row">
                            <button onClick={() => click("reject")} className="download-button">{"Cancel"}</button>
                            <button onClick={() => click("accept", true)} className="download-button">{"Submit Request"}</button>
                        </div> </> }
                    </div>
                </div>
                </Draggable>
            </div>
        )
        
    }
    return null
}

export default DeletePostDialog