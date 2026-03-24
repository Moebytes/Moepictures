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
import radioButton from "../../assets/svg/radiobutton.svg"
import radioButtonChecked from "../../assets/svg/radiobutton-checked.svg"
import deleteIcon from "../../assets/svg/delete.svg"
import lockIcon from "../../assets/svg/lock.svg"
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

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    const getRedIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "#f71e75")
    }

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
                    {favgroup.private ? <img className="dialog-icon" src={getIcon(lockIcon)} style={{marginRight: "5px", height: "18px", filter}}/> : null}
                    <span className="dialog-text">{favgroup.name}</span>
                    <img className="dialog-clickable-icon" src={getRedIcon(deleteIcon)} onClick={deleteFromFavGroup}/>
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
                            <img className="dialog-checkbox" src={isPrivate ? getIcon(radioButton) : getIcon(radioButtonChecked)} onClick={() => setIsPrivate(false)} style={{marginRight: "10px", filter}}/>
                            <span className="dialog-text">{i18n.labels.public}</span>
                            <img className="dialog-checkbox" src={isPrivate ? getIcon(radioButtonChecked) : getIcon(radioButton)} onClick={() => setIsPrivate(true)} style={{marginRight: "10px", filter}}/>
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