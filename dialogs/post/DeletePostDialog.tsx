import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"
import permissions from "../../structures/Permissions"
import {PostSearch, PostHistory, UnverifiedPost} from "../../types/Types"


const DeletePostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {deletePostID} = usePostDialogSelector()
    const {setDeletePostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = i18n.dialogs.deletePost.title
    }, [i18n])

    useEffect(() => {
        if (deletePostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deletePostID])

    const deletePost = async () => {
        if (!deletePostID) return
        if (deletePostID.unverified) {
            await functions.delete("/api/post/delete/unverified", {postID: deletePostID.post.postID}, session, setSessionFlag)
            return deletePostID.post.deleted ? history.push("/posts") : setPostFlag(true)
        }
        if (permissions.isAdmin(session)) {
            await functions.delete("/api/post/delete", {postID: deletePostID.post.postID}, session, setSessionFlag)
            return deletePostID.post.deleted ? history.push("/posts") : setPostFlag(true)
        } else {
            const badReason = functions.validateReason(reason, i18n)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            await functions.post("/api/post/delete/request", {postID: deletePostID.post.postID, reason}, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deletePost()
        }
        if (!keep) setDeletePostID(null)
    }

    const close = () => {
        setDeletePostID(null)
        setSubmitted(false)
        setReason("")
    }

    if (deletePostID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.deletePost.request}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.deleteGroup.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (deletePostID.unverified || permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.deletePost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.deletePost.header}</span>
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

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "500px", height: submitted ? "125px" : "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.deletePost.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteGroup.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text-small">{i18n.dialogs.deletePost.reasonHeader}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept", true)} className="dialog-button">{i18n.buttons.submitRequest}</button>
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