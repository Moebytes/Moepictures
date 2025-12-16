import React, {useEffect, useState, useRef, useReducer} from "react"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector, 
useSessionActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import Draggable from "react-draggable"
import "../dialog.less"

const AddGroupPostDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {addGroupPostObj} = useGroupDialogSelector()
    const {setAddGroupPostObj} = useGroupDialogActions()
    const {setGroupFlag} = useFlagActions()
    const [postIDs, setPostIDs] = useState("")
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    useEffect(() => {
        if (addGroupPostObj) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [addGroupPostObj])

    const addPost = async () => {
        if (!addGroupPostObj) return
        if (permissions.isContributor(session)) {
            if (!postIDs) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.dialogs.addGroupPost.noPostIDs
                await functions.timeout(2000)
                return setError(false)
            }
            setAddGroupPostObj(null)
            await functions.http.post("/api/group", {postIDs: postIDs.split(/\s+/g), name: addGroupPostObj.slug}, session, setSessionFlag)
            setGroupFlag(true)
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
            if (!postIDs) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.dialogs.addGroupPost.noPostIDs
                await functions.timeout(2000)
                return setError(false)
            }
            let existingPosts = addGroupPostObj.posts.map((p) => p.postID)
            let newPosts = postIDs.split(/\s+/g)
            let newPostIDs = [...existingPosts, ...newPosts]
            await functions.http.post("/api/group/request", {postIDs: newPostIDs, name: addGroupPostObj.slug, reason}, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            addPost()
        } else {
            setAddGroupPostObj(null)
        }
    }

    const close = () => {
        setAddGroupPostObj(null)
        setSubmitted(false)
        setReason("")
    }

    if (addGroupPostObj) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.addGroupPost.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.addGroupPost.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.addGroupPost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.postIDs}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={postIDs} onChange={(event) => setPostIDs(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.add}</button>
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
                <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.addGroupPost.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.group.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.postID}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={postIDs} onChange={(event) => setPostIDs(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submitRequest}</button>
                        </div> </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default AddGroupPostDialog