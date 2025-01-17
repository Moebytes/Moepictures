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

const JoinPostDialog: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {joinPostID} = usePostDialogSelector()
    const {setPostFlag} = useFlagActions()
    const {setJoinPostID} = usePostDialogActions()
    const [nestedChildren, setNestedChildren] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.joinPost.title
    }, [i18n])

    useEffect(() => {
        if (joinPostID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "all"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [joinPostID])

    const joinPost = async () => {
        if (!joinPostID) return
        if (permissions.isAdmin(session)) {
            await functions.post("/api/post/join", {postID: joinPostID.post.postID, nested: nestedChildren}, session, setSessionFlag)
            setPostFlag(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            joinPost()
        }
        setJoinPostID(null)
    }

    if (permissions.isAdmin(session)) {
        if (joinPostID) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "320px"}} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.joinPost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.joinPost.header}
                                <span style={{color: "var(--text-strong)"}}>{i18n.dialogs.joinPost.lostData}</span>
                                </span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">{i18n.dialogs.joinPost.nestedChildren}?</span>
                                <img className="dialog-checkbox" src={nestedChildren ? checkboxChecked : checkbox} onClick={() => setNestedChildren((prev: boolean) => !prev)} style={{marginRight: "10px", filter: getFilter()}}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.join}</button>
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

export default JoinPostDialog