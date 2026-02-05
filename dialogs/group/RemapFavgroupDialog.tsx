import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector,
useSessionActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
import "../dialog.less"

const RemapFavgroupDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {remapFavGroupObj} = useGroupDialogSelector()
    const {setRemapFavGroupObj} = useGroupDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setGroupFlag} = useFlagActions()
    const [items, setItems] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()

    useEffect(() => {
        if (remapFavGroupObj) {
            document.body.style.pointerEvents = "none"
            setItems(remapFavGroupObj.posts.map((p) => p.postID).join(" "))
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [remapFavGroupObj])

    const remapFavgroup = async () => {
        if (!remapFavGroupObj) return
        const postIDs = items.trim().split(/\s+/g)
        await functions.http.put("/api/favgroup/remap", {name: remapFavGroupObj.name, postIDs}, session, setSessionFlag)
        setRemapFavGroupObj(null)
        setGroupFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            remapFavgroup()
        } else {
            setRemapFavGroupObj(null)
        }
    }


    if (remapFavGroupObj) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.remapFavgroup.title}</span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea" style={{resize: "vertical"}} spellCheck={false} value={items} onChange={(event) => setItems(event.target.value)}></textarea>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.remap}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default RemapFavgroupDialog