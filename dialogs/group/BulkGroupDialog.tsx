/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useInteractionActions, useSessionSelector, useSessionActions, useGroupDialogSelector, useGroupDialogActions,
useSearchSelector, useSearchActions} from "../../store"
import {useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

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
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()
    
    useEffect(() => {
        const savedGroupName = localStorage.getItem("groupName")
        if (savedGroupName) setName(savedGroupName)
    }, [])

    useEffect(() => {
        localStorage.setItem("groupName", name)
    }, [name])

    useEffect(() => {
        if (bulkGroupDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [bulkGroupDialog])

    const bulkGroup = async () => {
        if (!permissions.isContributor(session)) return setBulkGroupDialog(false)
        if (!selectionMode) return setBulkGroupDialog(false)
        await functions.http.post("/api/group", {postIDs: Array.from(selectionItems.values()), name}, session, setSessionFlag)
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
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
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
                </motion.div>
            </div>
        )
    }
    return null
}

export default BulkGroupDialog