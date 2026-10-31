/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions, useFlagActions} from "../../store"
import {useInvalidatePost} from "../../api"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import CheckboxIcon from "../../assets/svg/checkbox.svg"
import CheckboxCheckedIcon from "../../assets/svg/checkbox-checked.svg"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const SplitGroupsDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {splitGroupPostID} = usePostDialogSelector()
    const {setPostFlag} = useFlagActions()
    const {setSplitGroupPostID} = usePostDialogActions()
    const [currentOnly, setCurrentOnly] = useState(false)
    const controls = useDragControls()
    const invalidatePost = useInvalidatePost()

    useEffect(() => {
        if (splitGroupPostID) {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [splitGroupPostID])

    const splitGroups = async () => {
        if (!splitGroupPostID) return
        if (permissions.isAdmin(session)) {
            let order = currentOnly ? splitGroupPostID.order : null
            await functions.http.post("/api/post/split-groups", {postID: splitGroupPostID.post.postID, order}, session, setSessionFlag)
            invalidatePost(splitGroupPostID.post.postID)
            setPostFlag(splitGroupPostID.post.postID)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            splitGroups()
        }
        setSplitGroupPostID(null)
    }

    const toggleCheckbox = (type: "currentOnly") => {
        if (type === "currentOnly") {
            setCurrentOnly((prev: boolean) => {
                const newValue = !prev
                return newValue
            })
        }
    }

    if (permissions.isAdmin(session)) {
        if (splitGroupPostID) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "320px"}} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.splitGroups.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.splitGroups.header}</span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">{i18n.dialogs.splitGroups.currentOnly}?</span>
                                {currentOnly ?
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => toggleCheckbox("currentOnly")} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => toggleCheckbox("currentOnly")} style={{marginRight: "10px"}}/>}
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.split}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default SplitGroupsDialog