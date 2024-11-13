import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector,
useSessionActions, useFlagActions} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import Draggable from "react-draggable"
import "./styles/dialog.less"

const EditGroupDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editGroupObj} = useGroupDialogSelector()
    const {setEditGroupObj} = useGroupDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setGroupFlag} = useFlagActions()
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Edit Group"
    }, [])

    useEffect(() => {
        if (editGroupObj) {
            document.body.style.pointerEvents = "none"
            setName(editGroupObj.name)
            setDescription(editGroupObj.description || "No description.")
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editGroupObj])

    const editGroup = async () => {
        if (permissions.isContributor(session)) {
            if (!name) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = "No name."
                await functions.timeout(2000)
                return setError(false)
            }
            const badDesc = functions.validateDescription(description)
            if (badDesc) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badDesc
                await functions.timeout(2000)
                setError(false)
                return
            }
            await functions.put("/api/group/edit", {slug: editGroupObj.slug, name, description}, session, setSessionFlag)
            const newSlug = functions.generateSlug(name)
            history.push(`/group/${newSlug}`)
            setEditGroupObj(null)
            setGroupFlag(true)
        } else {
            if (!name) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = "No name."
                await functions.timeout(2000)
                return setError(false)
            }
            const badDesc = functions.validateDescription(description)
            if (badDesc) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badDesc
                await functions.timeout(2000)
                setError(false)
                return
            }
            const badReason = functions.validateReason(reason)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            await functions.post("/api/group/edit/request", {slug: editGroupObj.slug, name, description, reason}, session, setSessionFlag)
            setSubmitted(true)
        }
        setEditGroupObj(null)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editGroup()
        } else {
            setEditGroupObj(null)
        }
    }

    const close = () => {
        setEditGroupObj(null)
        setSubmitted(false)
        setReason("")
    }

    const mainJSX = () => {
        return (
            <>
            <div className="dialog-row">
                <span className="dialog-text">Name: </span>
                <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">Description: </span>
            </div>
            <div className="dialog-row">
                <textarea className="dialog-textarea" style={{resize: "vertical"}} spellCheck={false} value={description} onChange={(event) => setDescription(event.target.value)}></textarea>
            </div>
            </>
        )
    }

    if (editGroupObj) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Edit Group</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot edit.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
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
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Edit Group</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Edit"}</button>
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
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Edit Group Request</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Your edit request was submitted.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div>
                        </> : <>
                        {mainJSX()}
                        <div className="dialog-row">
                            <span className="dialog-text">Reason: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Submit Request"}</button>
                        </div> </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditGroupDialog