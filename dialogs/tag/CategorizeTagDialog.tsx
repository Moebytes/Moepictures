/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useTagDialogSelector, useTagDialogActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import checkbox from "../../assets/svg/checkbox.svg"
import checkboxChecked from "../../assets/svg/checkbox-checked.svg"
import {TagType} from "../../types/Types"
import "../dialog.less"

const CategorizeTagDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {categorizeTag} = useTagDialogSelector()
    const {setCategorizeTag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setTagFlag} = useFlagActions()
    const [category, setCategory] = useState("tag" as TagType)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    const getArtistIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--artistTagColor")
    }

    const getCharacterIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--characterTagColor")
    }

    const getSeriesIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--seriesTagColor")
    }

    const getMetaIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--metaTagColor")
    }

    const getAppearanceIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--appearanceTagColor")
    }

    const getOutfitIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--outfitTagColor")
    }

    const getAccessoryIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--accessoryTagColor")
    }

    const getActionIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--actionTagColor")
    }

    const getSceneryIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sceneryTagColor")
    }

    const getTagIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--tagColor")
    }

    useEffect(() => {
        if (categorizeTag) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            setCategory(categorizeTag.type)
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [categorizeTag])

    const categorize = async () => {
        if (!categorizeTag) return
        if (permissions.isContributor(session)) {
            await functions.http.put("/api/tag/edit", {tag: categorizeTag.tag, type: category}, session, setSessionFlag)
            setTagFlag(categorizeTag.tag)
            setCategorizeTag(null)
        } else {
            const badReason = functions.validation.validateReason(reason, i18n)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            await functions.http.post("/api/tag/edit/request", {tag: categorizeTag.tag, type: category, reason}, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            categorize()
        } else {
            setCategorizeTag(null)
        }
    }

    const close = () => {
        setCategorizeTag(null)
        setSubmitted(false)
    }

    const mainJSX = () => {
        return (
            <>
            <div className="dialog-row">
                <span className="dialog-text artist-tag-color">{i18n.tag.artist}:</span>
                <img className="dialog-checkbox" src={category === "artist" ? getArtistIcon(checkboxChecked) : getArtistIcon(checkbox)} onClick={() => setCategory("artist")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text character-tag-color">{i18n.tag.character}:</span>
                <img className="dialog-checkbox" src={category === "character" ? getCharacterIcon(checkboxChecked) : getCharacterIcon(checkbox)} onClick={() => setCategory("character")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text series-tag-color">{i18n.tag.series}:</span>
                <img className="dialog-checkbox" src={category === "series" ? getSeriesIcon(checkboxChecked) : getSeriesIcon(checkbox)} onClick={() => setCategory("series")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text meta-tag-color">{i18n.tag.meta}:</span>
                <img className="dialog-checkbox" src={category === "meta" ? getMetaIcon(checkboxChecked) : getMetaIcon(checkbox)} onClick={() => setCategory("meta")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text appearance-tag-color">{i18n.tag.appearance}:</span>
                <img className="dialog-checkbox" src={category === "appearance" ? getAppearanceIcon(checkboxChecked) : getAppearanceIcon(checkbox)} onClick={() => setCategory("appearance")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text outfit-tag-color">{i18n.tag.outfit}:</span>
                <img className="dialog-checkbox" src={category === "outfit" ? getOutfitIcon(checkboxChecked) : getOutfitIcon(checkbox)} onClick={() => setCategory("outfit")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text accessory-tag-color">{i18n.tag.accessory}:</span>
                <img className="dialog-checkbox" src={category === "accessory" ? getAccessoryIcon(checkboxChecked) : getAccessoryIcon(checkbox)} onClick={() => setCategory("accessory")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text action-tag-color">{i18n.tag.action}:</span>
                <img className="dialog-checkbox" src={category === "action" ? getActionIcon(checkboxChecked) : getActionIcon(checkbox)} onClick={() => setCategory("action")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text scenery-tag-color">{i18n.tag.scenery}:</span>
                <img className="dialog-checkbox" src={category === "scenery" ? getSceneryIcon(checkboxChecked) : getSceneryIcon(checkbox)} onClick={() => setCategory("scenery")}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text tag-color">{i18n.tag.tag}:</span>
                <img className="dialog-checkbox" src={category === "tag" ? getTagIcon(checkboxChecked) : getTagIcon(checkbox)} onClick={() => setCategory("tag")}/>
            </div>
            </>
        )
    }

    if (categorizeTag) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.categorizeTag.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.categorizeTag.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                    </motion.div>
                </div>
            )
        }

        if (permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "220px", height: "max-content", paddingLeft: "20px", paddingRight: "20px"}} 
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.categorizeTag.title}</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.categorize}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{marginTop: "-30px", width: "270px", height: submitted ? "165px" : "max-content", paddingLeft: "20px", 
                    paddingRight: "20px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.categorizeTag.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.categorizeTag.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div> 
                        </> : <>
                        {mainJSX()}
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submitRequest}</button>
                        </div> </>}
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default CategorizeTagDialog