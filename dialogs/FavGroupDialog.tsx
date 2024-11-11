import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {EnableDragContext, FavGroupIDContext, SessionContext, SessionFlagContext} from "../Context"
import {useThemeSelector} from "../store"
import functions from "../structures/Functions"
import radioButton from "../assets/icons/radiobutton.png"
import radioButtonChecked from "../assets/icons/radiobutton-checked.png"
import deleteIcon from "../assets/icons/delete.png"
import lockIcon from "../assets/icons/private-lock.png"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const FavgroupDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {favGroupID, setFavGroupID} = useContext(FavGroupIDContext)
    const [submitted, setSubmitted] = useState(false)
    const [name, setName] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [favGroups, setFavGroups] = useState([])
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateFavGroups = async () => {
        const favgroups = await functions.get("/api/favgroups", {postID: favGroupID}, session, setSessionFlag)
        setFavGroups(favgroups)
        setSessionFlag(true)
    }

    useEffect(() => {
        document.title = "Add to Favorite Group"
        const savedFavgroupName = localStorage.getItem("favgroupName")
        if (savedFavgroupName) setName(savedFavgroupName)
        const savedFavgroupPrivacy = localStorage.getItem("favgroupPrivacy")
        if (savedFavgroupPrivacy) setIsPrivate(savedFavgroupPrivacy === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("favgroupName", name)
        localStorage.setItem("favgroupPrivacy", String(isPrivate))
    }, [name, isPrivate])

    useEffect(() => {
        if (favGroupID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            updateFavGroups()
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [favGroupID])

    const addFavGroup = async () => {
        await functions.post("/api/favgroup/update", {postID: favGroupID, name, isPrivate}, session, setSessionFlag)
        setFavGroupID(null)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            addFavGroup()
        } else {
            setFavGroupID(null)
        }
    }

    const favgroupJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < favGroups.length; i++) {
            const favgroup = favGroups[i] as any
            const deleteFromFavGroup = async () => {
                await functions.delete("/api/favgroup/post/delete", {postID: favGroupID, name: favgroup.name}, session, setSessionFlag)
                updateFavGroups()
            }
            jsx.push(
                <div className="dialog-row">
                    {favgroup.private ? <img className="dialog-icon" src={lockIcon} style={{marginRight: "5px", height: "18px", filter: getFilter()}}/> : null}
                    <span className="dialog-text">{favgroup.name}</span>
                    <img className="dialog-clickable-icon" src={deleteIcon} onClick={deleteFromFavGroup}/>
                </div>
            )
        }
        return jsx
    }

    if (favGroupID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Add to Favorite Group</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Favorite Group: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                            <span className="dialog-text" style={{marginTop: "-4px"}}>Privacy: </span>
                            <img className="dialog-checkbox" src={isPrivate ? radioButton : radioButtonChecked} onClick={() => setIsPrivate(false)} style={{marginRight: "10px", filter: getFilter()}}/>
                            <span className="dialog-text">Public</span>
                            <img className="dialog-checkbox" src={isPrivate ? radioButtonChecked : radioButton} onClick={() => setIsPrivate(true)} style={{marginRight: "10px", filter: getFilter()}}/>
                            <span className="dialog-text">Private</span>
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

export default FavgroupDialog