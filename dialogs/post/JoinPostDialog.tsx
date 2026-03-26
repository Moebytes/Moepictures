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
import CheckboxIcon from "../../assets/svg/checkbox.svg"
import CheckboxCheckedIcon from "../../assets/svg/checkbox-checked.svg"
import {motion, useDragControls} from "framer-motion"
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
    const controls = useDragControls()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    useEffect(() => {
        if (joinPostID) {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [joinPostID])

    const joinPost = async () => {
        if (!joinPostID) return
        if (permissions.isAdmin(session)) {
            await functions.http.post("/api/post/join", {postID: joinPostID.post.postID, nested: nestedChildren}, session, setSessionFlag)
            setPostFlag(joinPostID.post.postID)
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
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "320px"}} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.joinPost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.joinPost.header}
                                <span style={{color: "var(--text-strong)"}}>{i18n.dialogs.joinPost.lostData}</span>
                                </span>
                            </div>
                            <div className="dialog-row" style={{justifyContent: "center"}}>
                                <span className="dialog-text">{i18n.dialogs.joinPost.nestedChildren}?</span>
                                {nestedChildren ?
                                <CheckboxCheckedIcon className="dialog-checkbox" onClick={() => setNestedChildren((prev: boolean) => !prev)} style={{marginRight: "10px"}}/> :
                                <CheckboxIcon className="dialog-checkbox" onClick={() => setNestedChildren((prev: boolean) => !prev)} style={{marginRight: "10px"}}/>}
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.join}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default JoinPostDialog