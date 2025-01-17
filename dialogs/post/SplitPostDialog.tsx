import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import checkbox from "../../assets/icons/checkbox.png"
import checkboxChecked from "../../assets/icons/checkbox-checked.png"
import Draggable from "react-draggable"
import "../dialog.less"

const SplitPostDialog: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {splitPostID} = usePostDialogSelector()
    const {setPostFlag} = useFlagActions()
    const {setSplitPostID} = usePostDialogActions()
    const [currentOnly, setCurrentOnly] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.splitPost.title
    }, [i18n])

    useEffect(() => {
        if (splitPostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "all"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [splitPostID])

    const splitPost = async () => {
        if (!splitPostID) return
        if (permissions.isAdmin(session)) {
            let order = currentOnly ? splitPostID.order : null
            await functions.post("/api/post/split", {postID: splitPostID.post.postID, order}, session, setSessionFlag)
            setPostFlag(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            splitPost()
        }
        setSplitPostID(null)
    }

    if (permissions.isAdmin(session)) {
        if (splitPostID) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "320px"}} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.splitPost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.splitPost.header}</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">{i18n.dialogs.splitPost.currentOnly}?</span>
                                <img className="dialog-checkbox" src={currentOnly ? checkboxChecked : checkbox} onClick={() => setCurrentOnly((prev: boolean) => !prev)} style={{marginRight: "10px", filter: getFilter()}}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.split}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }
    }
    return null
}

export default SplitPostDialog