import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector, 
useSessionActions, useFlagActions} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"

const AddFavgroupPostDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {addFavgroupPostObj} = useGroupDialogSelector()
    const {setAddFavgroupPostObj} = useGroupDialogActions()
    const {setGroupFlag} = useFlagActions()
    const [postID, setPostID] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.addFavgroupPost.title
    }, [i18n])

    useEffect(() => {
        if (addFavgroupPostObj) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [addFavgroupPostObj])

    const addPost = async () => {
        if (!postID) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.dialogs.addGroupPost.noPostID
            await functions.timeout(2000)
            return setError(false)
        }
        await functions.post("/api/favgroup/update", {postID, name: addFavgroupPostObj.slug, isPrivate: addFavgroupPostObj.private}, session, setSessionFlag)
        setAddFavgroupPostObj(null)
        setGroupFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            addPost()
        } else {
            setAddFavgroupPostObj(null)
        }
    }

    if (addFavgroupPostObj) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "350px", marginTop: "-150px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.addFavgroupPost.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.postID}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={postID} onChange={(event) => setPostID(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.add}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default AddFavgroupPostDialog