import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, EnableDragContext, CategorizeTagContext, SiteHueContext, SiteLightnessContext, 
SiteSaturationContext, SessionContext, SessionFlagContext, TagFlagContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"

const CategorizeTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {categorizeTag, setCategorizeTag} = useContext(CategorizeTagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [category, setCategory] = useState("tag")
    const {tagFlag, setTagFlag} = useContext(TagFlagContext)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Categorize Tag"
    }, [])

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
        if (!permissions.isMod(session)) return setCategorizeTag(null)
        await functions.put("/api/tag/edit", {tag: categorizeTag.tag, category}, session, setSessionFlag)
        setTagFlag(categorizeTag.tag)
        setCategorizeTag(null)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            categorize()
        } else {
            setCategorizeTag(null)
        }
    }

    if (categorizeTag) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "220px", height: "500px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Categorize Tag</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text artist-tag-color">Artist:</span>
                            <img className="dialog-checkbox" src={category === "artist" ? checkboxChecked : checkbox} onClick={() => setCategory("artist")} style={{filter: "hue-rotate(53deg) saturate(100%) brightness(120%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text character-tag-color">Character:</span>
                            <img className="dialog-checkbox" src={category === "character" ? checkboxChecked : checkbox} onClick={() => setCategory("character")} style={{filter: "hue-rotate(38deg) saturate(100%) brightness(120%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text series-tag-color">Series:</span>
                            <img className="dialog-checkbox" src={category === "series" ? checkboxChecked : checkbox} onClick={() => setCategory("series")} style={{filter: "hue-rotate(15deg) saturate(100%) brightness(120%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text meta-tag-color">Meta:</span>
                            <img className="dialog-checkbox" src={category === "meta" ? checkboxChecked : checkbox} onClick={() => setCategory("meta")} style={{filter: "hue-rotate(-70deg) saturate(100%) brightness(200%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text appearance-tag-color">Appearance:</span>
                            <img className="dialog-checkbox" src={category === "appearance" ? checkboxChecked : checkbox} onClick={() => setCategory("appearance")} style={{filter: "hue-rotate(70deg) saturate(100%) brightness(200%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text outfit-tag-color">Outfit:</span>
                            <img className="dialog-checkbox" src={category === "outfit" ? checkboxChecked : checkbox} onClick={() => setCategory("outfit")} style={{filter: "hue-rotate(160deg) saturate(100%) brightness(500%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text accessory-tag-color">Accessory:</span>
                            <img className="dialog-checkbox" src={category === "accessory" ? checkboxChecked : checkbox} onClick={() => setCategory("accessory")} style={{filter: "hue-rotate(-120deg) saturate(100%) brightness(200%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text action-tag-color">Action:</span>
                            <img className="dialog-checkbox" src={category === "action" ? checkboxChecked : checkbox} onClick={() => setCategory("action")} style={{filter: "hue-rotate(140deg) saturate(80%) brightness(300%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text scenery-tag-color">Scenery:</span>
                            <img className="dialog-checkbox" src={category === "scenery" ? checkboxChecked : checkbox} onClick={() => setCategory("scenery")} style={{filter: "hue-rotate(-40deg) saturate(100%) brightness(200%)"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text tag-color">Tag:</span>
                            <img className="dialog-checkbox" src={category === "tag" ? checkboxChecked : checkbox} onClick={() => setCategory("tag")}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Categorize"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default CategorizeTagDialog