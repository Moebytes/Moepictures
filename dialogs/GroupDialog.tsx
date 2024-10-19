import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, EnableDragContext, GroupPostIDContext, SessionContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, SessionFlagContext, PostFlagContext} from "../Context"
import functions from "../structures/Functions"
import radioButton from "../assets/icons/radiobutton.png"
import radioButtonChecked from "../assets/icons/radiobutton-checked.png"
import deleteIcon from "../assets/icons/delete.png"
import lockIcon from "../assets/icons/private-lock.png"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const GroupDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {groupPostID, setGroupPostID} = useContext(GroupPostIDContext)
    const {postFlag, setPostFlag} = useContext(PostFlagContext)
    const [submitted, setSubmitted] = useState(false)
    const [name, setName] = useState("")
    const [groups, setGroups] = useState([])
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
        document.title = "Add to Group"
        const savedGroupName = localStorage.getItem("groupName")
        if (savedGroupName) setName(savedGroupName)
    }, [])

    useEffect(() => {
        localStorage.setItem("groupName", name)
    }, [name])

    useEffect(() => {
        if (groupPostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            updateGroups()
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [groupPostID])

    const group = async () => {
        await functions.post("/api/group", {postID: groupPostID, name}, session, setSessionFlag)
        setGroupPostID(null)
        setPostFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            group()
        } else {
            setGroupPostID(null)
        }
    }

    const favgroupJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i] as any
            const deleteFromGroup = async () => {
                await functions.delete("/api/group/post/delete", {postID: groupPostID, name: group.name}, session, setSessionFlag)
                updateGroups()
            }
            jsx.push(
                <div className="dialog-row">
                    <span className="dialog-text">{group.name}</span>
                    <img className="dialog-clickable-icon" src={deleteIcon} onClick={deleteFromGroup}/>
                </div>
            )
        }
        return jsx
    }

    if (groupPostID) {
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
                        {favgroupJSX()}
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
    return null
}

export default GroupDialog