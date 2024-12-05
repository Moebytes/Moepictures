import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useTagDialogSelector, useTagDialogActions, useFlagActions} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"

const CategorizeTagDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {categorizeTag} = useTagDialogSelector()
    const {setCategorizeTag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setTagFlag} = useFlagActions()
    const [category, setCategory] = useState("tag")
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.categorizeTag.title
    }, [i18n])

    useEffect(() => {
        if (categorizeTag) {
            document.body.style.pointerEvents = "none"
            setCategory(categorizeTag.type)
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [categorizeTag])

    const categorize = async () => {
        if (permissions.isContributor(session)) {
            await functions.put("/api/tag/edit", {tag: categorizeTag.tag, type: category}, session, setSessionFlag)
            setTagFlag(categorizeTag.tag)
            setCategorizeTag(null)
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
            await functions.post("/api/tag/edit/request", {tag: categorizeTag.tag, type: category, reason}, session, setSessionFlag)
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
                <img className="dialog-checkbox" src={category === "artist" ? checkboxChecked : checkbox} onClick={() => setCategory("artist")} style={{filter: "hue-rotate(53deg) saturate(100%) brightness(120%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text character-tag-color">{i18n.tag.character}:</span>
                <img className="dialog-checkbox" src={category === "character" ? checkboxChecked : checkbox} onClick={() => setCategory("character")} style={{filter: "hue-rotate(38deg) saturate(100%) brightness(120%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text series-tag-color">{i18n.tag.series}:</span>
                <img className="dialog-checkbox" src={category === "series" ? checkboxChecked : checkbox} onClick={() => setCategory("series")} style={{filter: "hue-rotate(15deg) saturate(100%) brightness(120%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text meta-tag-color">{i18n.tag.meta}:</span>
                <img className="dialog-checkbox" src={category === "meta" ? checkboxChecked : checkbox} onClick={() => setCategory("meta")} style={{filter: "hue-rotate(-70deg) saturate(100%) brightness(200%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text appearance-tag-color">{i18n.tag.appearance}:</span>
                <img className="dialog-checkbox" src={category === "appearance" ? checkboxChecked : checkbox} onClick={() => setCategory("appearance")} style={{filter: "hue-rotate(-5deg) saturate(100%) brightness(200%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text outfit-tag-color">{i18n.tag.outfit}:</span>
                <img className="dialog-checkbox" src={category === "outfit" ? checkboxChecked : checkbox} onClick={() => setCategory("outfit")} style={{filter: "hue-rotate(75deg) saturate(80%) brightness(400%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text accessory-tag-color">{i18n.tag.accessory}:</span>
                <img className="dialog-checkbox" src={category === "accessory" ? checkboxChecked : checkbox} onClick={() => setCategory("accessory")} style={{filter: "hue-rotate(-120deg) saturate(100%) brightness(200%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text action-tag-color">{i18n.tag.action}:</span>
                <img className="dialog-checkbox" src={category === "action" ? checkboxChecked : checkbox} onClick={() => setCategory("action")} style={{filter: "hue-rotate(160deg) saturate(100%) brightness(500%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text scenery-tag-color">{i18n.tag.scenery}:</span>
                <img className="dialog-checkbox" src={category === "scenery" ? checkboxChecked : checkbox} onClick={() => setCategory("scenery")} style={{filter: "hue-rotate(-40deg) saturate(100%) brightness(200%)"}}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text tag-color">{i18n.tag.tag}:</span>
                <img className="dialog-checkbox" src={category === "tag" ? checkboxChecked : checkbox} onClick={() => setCategory("tag")}/>
            </div>
            </>
        )
    }

    if (categorizeTag) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.categorizeTag.title}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.dialogs.categorizeTag.banText}</span>
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
                    <div className="dialog-box" style={{width: "220px", height: "max-content"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.categorizeTag.title}</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.categorize}</button>
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
                <div className="dialog-box" style={{marginTop: "-30px", width: "270px", height: submitted ? "165px" : "max-content"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
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
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default CategorizeTagDialog