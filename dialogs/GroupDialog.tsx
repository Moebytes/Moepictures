import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, EnableDragContext, GroupPostIDContext, SessionContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, SessionFlagContext, PostFlagContext,
ActionBannerContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import radioButton from "../assets/icons/radiobutton.png"
import radioButtonChecked from "../assets/icons/radiobutton-checked.png"
import deleteIcon from "../assets/icons/delete.png"
import lockIcon from "../assets/icons/private-lock.png"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const GroupDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {actionBanner, setActionBanner} = useContext(ActionBannerContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {groupPostID, setGroupPostID} = useContext(GroupPostIDContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const [name, setName] = useState("")
    const [groups, setGroups] = useState([] as any[])
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [removalItems, setRemovalItems] = useState([] as any[])
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateGroups = async () => {
        const groups = await functions.get("/api/groups", {postID: groupPostID}, session, setSessionFlag)
        setGroups(groups)
    }

    useEffect(() => {
        document.title = removalItems.length ? "Remove from Group" : "Add to Group"
        const savedGroupName = localStorage.getItem("groupName")
        if (savedGroupName) setName(savedGroupName)
    }, [removalItems])

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
        if (permissions.isContributor(session)) {
            if (!name) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = "No name."
                await functions.timeout(2000)
                return setError(false)
            }
            await functions.post("/api/group", {postID: groupPostID, name}, session, setSessionFlag)
            setGroupPostID(null)
            setPostFlag(true)
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
            if (removalItems.length) {
                await functions.post("/api/group/post/delete/request", {reason, removalItems}, session, setSessionFlag)
                setSubmitted(true)
            } else {
                if (!name) {
                    setError(true)
                    if (!errorRef.current) await functions.timeout(20)
                    errorRef.current!.innerText = "No name."
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
        let jsx = [] as any
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i] as any
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
                                <span className="dialog-title">Add to Group</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot group.</span>
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
                    <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Add to Group</span>
                            </div>
                            {<div className="dialog-row">
                                <span className="dialog-text">Enter the group name. A group will be created if it doesn't exist.</span>
                            </div>}
                            <div className="dialog-row">
                                <span className="dialog-text">Group Name: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            {groupJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Add"}</button>
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
                            <span className="dialog-title">{removalItems.length ? "Remove from Group Request" : "Add to Group Request"}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Your request was submitted.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div>
                        </> : <>
                        {removalItems.length ? 
                        <div className="dialog-row">
                            <span className="dialog-text">The post will be submitted for removal from the deleted groups.</span>
                        </div> :
                        <div className="dialog-row">
                            <span className="dialog-text">Enter the group name. A group will be created if it doesn't exist.</span>
                        </div>}
                        {!removalItems.length ? <div className="dialog-row">
                            <span className="dialog-text">Group Name: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                        </div> : null}
                        {groupJSX()}
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

export default GroupDialog