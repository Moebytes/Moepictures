import React, {useEffect, useState, useRef, useReducer} from "react"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector, 
useSessionActions, useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import radioButton from "../../assets/icons/radiobutton.png"
import radioButtonChecked from "../../assets/icons/radiobutton-checked.png"
import deleteIcon from "../../assets/icons/delete.png"
import lockIcon from "../../assets/icons/private-lock.png"
import "../dialog.less"
import Draggable from "react-draggable"
import {GroupPosts} from "../../types/Types"

const GroupDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {groupPostID} = useGroupDialogSelector()
    const {setGroupPostID} = useGroupDialogActions()
    const {setPostFlag} = useFlagActions()
    const [name, setName] = useState("")
    const [groups, setGroups] = useState([] as GroupPosts[])
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [removalItems, setRemovalItems] = useState([] as {slug: string, postID: string}[])
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateGroups = async () => {
        if (!groupPostID) return
        const groups = await functions.get("/api/groups", {postID: groupPostID}, session, setSessionFlag)
        setGroups(groups)
    }

    useEffect(() => {
        const savedGroupName = localStorage.getItem("groupName")
        if (savedGroupName) setName(savedGroupName)
    }, [])

    useEffect(() => {
        document.title = removalItems.length ? i18n.dialogs.group.titleRemove : i18n.sidebar.addGroup
    }, [removalItems, i18n])

    useEffect(() => {
        localStorage.setItem("groupName", name)
    }, [name])

    useEffect(() => {
        if (groupPostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            updateGroups()
            setRemovalItems([])
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [groupPostID])

    const group = async () => {
        if (!groupPostID) return
        if (permissions.isContributor(session)) {
            if (!name) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = i18n.dialogs.editGroup.noName
                await functions.timeout(2000)
                return setError(false)
            }
            await functions.post("/api/group", {postID: groupPostID, name}, session, setSessionFlag)
            setGroupPostID(null)
            setPostFlag(true)
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
            if (removalItems.length) {
                await functions.post("/api/group/post/delete/request", {reason, removalItems}, session, setSessionFlag)
                setSubmitted(true)
            } else {
                if (!name) {
                    setError(true)
                    if (!errorRef.current) await functions.timeout(20)
                    errorRef.current!.innerText = i18n.dialogs.editGroup.noName
                    await functions.timeout(2000)
                    return setError(false)
                }
                await functions.post("/api/group/request", {postID: groupPostID, name, reason}, session, setSessionFlag)
                setSubmitted(true)
            }
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            group()
        } else {
            setGroupPostID(null)
        }
    }

    const close = () => {
        setGroupPostID(null)
        setSubmitted(false)
        setReason("")
    }

    const groupJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!groupPostID) return jsx
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i]
            const deleteFromGroup = async () => {
                if (permissions.isContributor(session)) {
                    await functions.delete("/api/group/post/delete", {postID: groupPostID, name: group.name}, session, setSessionFlag)
                    updateGroups()
                } else {
                    removalItems.push({postID: groupPostID, slug: group.slug})
                    forceUpdate()
                }
            }
            let strikethrough = false
            const item = removalItems.find((item) => item.slug === group.slug)
            if (item) strikethrough = true
            jsx.push(
                <div className="dialog-row">
                    <span className={`dialog-text ${strikethrough ? "strikethrough" : ""}`}>{group.name}</span>
                    <img className="dialog-clickable-icon" src={deleteIcon} onClick={deleteFromGroup}/>
                </div>
            )
        }
        return jsx
    }

    if (groupPostID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.sidebar.addGroup}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.group.banText}</span>
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
                                <span className="dialog-title">{i18n.sidebar.addGroup}</span>
                            </div>
                            {<div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.group.header}</span>
                            </div>}
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.labels.groupName}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            {groupJSX()}
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
                            <span className="dialog-title">{removalItems.length ? i18n.dialogs.group.requestRemove : i18n.dialogs.group.requestAdd}</span>
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
                        {removalItems.length ? 
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.group.removeHeader}</span>
                        </div> :
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.group.header}</span>
                        </div>}
                        {!removalItems.length ? <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.groupName}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                        </div> : null}
                        {groupJSX()}
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

export default GroupDialog