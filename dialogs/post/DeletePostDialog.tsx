/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import {PostSearch, PostHistory, UnverifiedPost} from "../../types/Types"
import "../dialog.less"


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
    const navigate = useNavigate()
    const controls = useDragControls()

    useEffect(() => {
        if (deletePostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deletePostID])

    const deletePost = async () => {
        if (!deletePostID) return
        if (deletePostID.unverified) {
            await functions.http.delete("/api/post/delete/unverified", {postID: deletePostID.post.postID}, session, setSessionFlag)
            return deletePostID.post.deleted ? navigate("/posts") : setPostFlag(deletePostID.post.postID)
        }
        if (permissions.isAdmin(session)) {
            await functions.http.delete("/api/post/delete", {postID: deletePostID.post.postID}, session, setSessionFlag)
            return deletePostID.post.deleted ? navigate("/posts") : setPostFlag(deletePostID.post.postID)
        } else {
            const badReason = functions.validation.validateReason(reason, i18n)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            await functions.http.post("/api/post/delete/request", {postID: deletePostID.post.postID, reason}, session, setSessionFlag)
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
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.deletePost.request}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.deleteGroup.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </motion.div>
                </div>
            )
        }

        if (deletePostID.unverified || permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
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
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "500px", height: submitted ? "125px" : "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
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
                </motion.div>
            </div>
        )
        
    }
    return null
}

export default DeletePostDialog