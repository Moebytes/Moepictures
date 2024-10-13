import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, EnableDragContext, FavGroupDialogContext, SessionContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import radioButton from "../assets/icons/radiobutton.png"
import radiobuttonChecked from "../assets/icons/radiobutton-checked.png"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const FavGroupDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {favGroupDialog, setFavGroupDialog} = useContext(FavGroupDialogContext)
    const [submitted, setSubmitted] = useState(false)
    const [groupName, setGroupName] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Add to Favorite Group"
    }, [])

    useEffect(() => {
        if (favGroupDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [favGroupDialog])

    const addFavGroup = async () => {
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            addFavGroup()
        }
        setFavGroupDialog(null)
    }

    if (favGroupDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "350px", marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Add to Favorite Group</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Favorite Group: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={groupName} onChange={(event) => setGroupName(event.target.value)} style={{width: "50%"}}/>
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

export default FavGroupDialog