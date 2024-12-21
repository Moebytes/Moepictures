import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useSessionSelector, useSessionActions, useGroupDialogSelector, useGroupDialogActions,
useSearchSelector, useSearchActions} from "../store"
import {useThemeSelector} from "../store"
import functions from "../structures/Functions"
import radioButton from "../assets/icons/radiobutton.png"
import radiobuttonChecked from "../assets/icons/radiobutton-checked.png"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const BulkGroupDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {bulkGroupDialog} = useGroupDialogSelector()
    const {setBulkGroupDialog} = useGroupDialogActions()
    const {selectionMode, selectionItems} = useSearchSelector()
    const {setSelectionMode} = useSearchActions()
    const [name, setName] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const savedGroupName = localStorage.getItem("groupName")
        if (savedGroupName) setName(savedGroupName)
    }, [])

    useEffect(() => {
        document.title = i18n.dialogs.bulkGroup.title
    }, [i18n])

    useEffect(() => {
        localStorage.setItem("groupName", name)
    }, [name])

    useEffect(() => {
        if (bulkGroupDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [bulkGroupDialog])

    const bulkGroup = async () => {
        if (!permissions.isContributor(session)) return setBulkGroupDialog(false)
        if (!selectionMode) return setBulkGroupDialog(false)
        for (const postID of selectionItems.values()) {
            await functions.post("/api/group", {postID, name}, session, setSessionFlag)
        }
        setBulkGroupDialog(false)
        setSelectionMode(false)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            bulkGroup()
        } else {
            setBulkGroupDialog(false)
        }
    }

    if (bulkGroupDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.bulkGroup.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.groupName}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.bulkAdd}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default BulkGroupDialog