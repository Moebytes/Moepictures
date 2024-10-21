import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {ThemeContext, EnableDragContext, EditFavGroupObjContext, SessionContext, SiteHueContext, 
SiteLightnessContext, SiteSaturationContext, SessionFlagContext, GroupFlagContext} from "../Context"
import functions from "../structures/Functions"
import Draggable from "react-draggable"
import radioButton from "../assets/icons/radiobutton.png"
import radioButtonChecked from "../assets/icons/radiobutton-checked.png"
import "./styles/dialog.less"

const EditFavgroupDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editFavGroupObj, setEditFavGroupObj} = useContext(EditFavGroupObjContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {groupFlag, setGroupFlag} = useContext(GroupFlagContext)
    const [name, setName] = useState("")
    const [isPrivate, setIsPrivate] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Edit Favgroup"
    }, [])

    useEffect(() => {
        if (editFavGroupObj) {
            document.body.style.pointerEvents = "none"
            setName(editFavGroupObj.name)
            setIsPrivate(editFavGroupObj.private)
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editFavGroupObj])

    const editFavgroup = async () => {
        if (!name) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "No name."
            await functions.timeout(2000)
            return setError(false)
        }
        await functions.put("/api/favgroup/edit", {key: editFavGroupObj.name, name, isPrivate}, session, setSessionFlag)
        const newSlug = functions.generateSlug(name)
        history.push(`/favgroup/${session.username}/${newSlug}`)
        setEditFavGroupObj(null)
        setGroupFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editFavgroup()
        } else {
            setEditFavGroupObj(null)
        }
    }


    if (editFavGroupObj) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box"style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Edit Favorite Group</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Name: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)}/>
                        </div>
                        <div className="dialog-row" style={{justifyContent: "center", paddingRight: "20px"}}>
                            <span className="dialog-text" style={{marginTop: "-4px"}}>Privacy: </span>
                            <img className="dialog-checkbox" src={isPrivate ? radioButton : radioButtonChecked} onClick={() => setIsPrivate(false)} style={{marginRight: "10px", filter: getFilter()}}/>
                            <span className="dialog-text">Public</span>
                            <img className="dialog-checkbox" src={isPrivate ? radioButtonChecked : radioButton} onClick={() => setIsPrivate(true)} style={{marginRight: "10px", filter: getFilter()}}/>
                            <span className="dialog-text">Private</span>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Edit"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditFavgroupDialog