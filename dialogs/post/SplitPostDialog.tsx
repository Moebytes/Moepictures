/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import checkbox from "../../assets/svg/checkbox.svg"
import checkboxChecked from "../../assets/svg/checkbox-checked.svg"
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
    const [mergeSubsequent, setMergeSubsequent] = useState(false)

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    useEffect(() => {
        if (splitPostID) {
            document.body.style.pointerEvents = "all"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [splitPostID])

    const splitPost = async () => {
        if (!splitPostID) return
        if (permissions.isAdmin(session)) {
            let order = currentOnly || mergeSubsequent ? splitPostID.order : null
            await functions.http.post("/api/post/split", {postID: splitPostID.post.postID, order, mergeSubsequent}, session, setSessionFlag)
            setPostFlag(splitPostID.post.postID)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            splitPost()
        }
        setSplitPostID(null)
    }

    const toggleCheckbox = (type: "currentOnly" | "mergeSubsequent") => {
        if (type === "mergeSubsequent") {
            setMergeSubsequent((prev: boolean) => {
                const newValue = !prev
                if (newValue) setCurrentOnly(false)
                return newValue
            })
        } else if (type === "currentOnly") {
            setCurrentOnly((prev: boolean) => {
                const newValue = !prev
                if (newValue) setMergeSubsequent(false)
                return newValue
            })
        }
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
                                <img className="dialog-checkbox" src={currentOnly ? getIcon(checkboxChecked) : getIcon(checkbox)} onClick={() => toggleCheckbox("currentOnly")} style={{marginRight: "10px", filter}}/>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">{i18n.dialogs.splitPost.mergeSubsequent}?</span>
                                <img className="dialog-checkbox" src={mergeSubsequent ? getIcon(checkboxChecked) : getIcon(checkbox)} onClick={() => toggleCheckbox("mergeSubsequent")} style={{marginRight: "10px", filter}}/>
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