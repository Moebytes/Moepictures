import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useSessionSelector, useSessionActions, useGroupDialogSelector, useGroupDialogActions,
useSearchSelector, useSearchActions} from "../store"
import {useThemeSelector} from "../store"
import functions from "../structures/Functions"
import radioButton from "../assets/icons/radiobutton.png"
import radiobuttonChecked from "../assets/icons/radiobutton-checked.png"
import deleteIcon from "../assets/icons/delete.png"
import lockIcon from "../assets/icons/private-lock.png"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const BulkFavgroupDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {bulkFavGroupDialog} = useGroupDialogSelector()
    const {setBulkFavGroupDialog} = useGroupDialogActions()
    const {selectionMode, selectionItems} = useSearchSelector()
    const {setSelectionMode} = useSearchActions()
    const [name, setName] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Bulk Favorite Group"
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
        if (bulkFavGroupDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [bulkFavGroupDialog])

    const bulkFavGroup = async () => {
        if (!selectionMode) return setBulkFavGroupDialog(false)
        for (const postID of selectionItems.values()) {
            await functions.post("/api/favgroup/update", {postID, name, isPrivate}, session, setSessionFlag)
        }
        setBulkFavGroupDialog(false)
        setSelectionMode(false)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            bulkFavGroup()
        } else {
            setBulkFavGroupDialog(false)
        }
    }

    if (bulkFavGroupDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Bulk Favorite Group</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Favorite Group: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                            <span className="dialog-text" style={{marginTop: "-4px"}}>Privacy: </span>
                            <img className="dialog-checkbox" src={isPrivate ? radioButton : radiobuttonChecked} onClick={() => setIsPrivate(false)} style={{marginRight: "10px", filter: getFilter()}}/>
                            <span className="dialog-text">Public</span>
                            <img className="dialog-checkbox" src={isPrivate ? radiobuttonChecked : radioButton} onClick={() => setIsPrivate(true)} style={{marginRight: "10px", filter: getFilter()}}/>
                            <span className="dialog-text">Private</span>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Bulk Add"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default BulkFavgroupDialog