/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector, 
useSessionActions} from "../../store"
import {useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import RadioButtonIcon from "../../assets/svg/radiobutton.svg"
import RadioButtonCheckedIcon from "../../assets/svg/radiobutton-checked.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import LockIcon from "../../assets/svg/lock.svg"
import {motion, useDragControls} from "framer-motion"
import {Favgroup} from "../../types/Types"
import "../dialog.less"

const FavgroupDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {favGroupID} = useGroupDialogSelector()
    const {setFavGroupID} = useGroupDialogActions()
    const [submitted, setSubmitted] = useState(false)
    const [name, setName] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [favGroups, setFavGroups] = useState([] as Favgroup[])
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    const updateFavGroups = async () => {
        if (!favGroupID) return
        const favgroups = await functions.http.get("/api/favgroups", {postID: favGroupID}, session, setSessionFlag)
        setFavGroups(favgroups)
        setSessionFlag(true)
    }

    useEffect(() => {
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
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            updateFavGroups()
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [favGroupID])

    const addFavGroup = async () => {
        if (!favGroupID) return
        await functions.http.post("/api/favgroup/update", {postIDs: [favGroupID], name, isPrivate}, session, setSessionFlag)
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
        let jsx = [] as React.ReactElement[]
        if (!favGroupID) return jsx
        for (let i = 0; i < favGroups.length; i++) {
            const favgroup = favGroups[i]
            const deleteFromFavGroup = async () => {
                await functions.http.delete("/api/favgroup/post/delete", {postID: favGroupID, name: favgroup.name}, session, setSessionFlag)
                updateFavGroups()
            }
            jsx.push(
                <div className="dialog-row">
                    {favgroup.private ? <LockIcon className="dialog-icon" style={{marginRight: "5px", height: "18px"}}/> : null}
                    <span className="dialog-text">{favgroup.name}</span>
                    <DeleteIcon className="dialog-clickable-icon" onClick={deleteFromFavGroup}/>
                </div>
            )
        }
        return jsx
    }

    if (favGroupID) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.favgroup.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text nowrap">{i18n.labels.favoriteGroup}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                            <span className="dialog-text" style={{marginTop: "-4px"}}>{i18n.labels.privacy}: </span>
                            {isPrivate ? 
                            <RadioButtonIcon className="dialog-checkbox" onClick={() => setIsPrivate(false)} style={{marginRight: "10px"}}/> :
                            <RadioButtonCheckedIcon className="dialog-checkbox" onClick={() => setIsPrivate(false)} style={{marginRight: "10px"}}/>}
                            <span className="dialog-text">{i18n.labels.public}</span>
                            {isPrivate ? 
                            <RadioButtonCheckedIcon className="dialog-checkbox" onClick={() => setIsPrivate(true)} style={{marginRight: "10px"}}/> :
                            <RadioButtonIcon className="dialog-checkbox" onClick={() => setIsPrivate(true)} style={{marginRight: "10px"}}/>}
                            <span className="dialog-text">{i18n.sort.private}</span>
                        </div>
                        {favgroupJSX()}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.add}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default FavgroupDialog