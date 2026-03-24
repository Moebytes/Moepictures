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
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const FlipPostDialog: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {flipPostID} = usePostDialogSelector()
    const {setFlipPostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const controls = useDragControls()

    useEffect(() => {
        if (flipPostID) {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [flipPostID])

    const flipPost = async () => {
        if (!flipPostID) return
        if (permissions.isAdmin(session)) {
            await functions.http.post("/api/post/flip", {postID: flipPostID.post.postID}, session, setSessionFlag)
            setPostFlag(flipPostID.post.postID)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            flipPost()
        }
        setFlipPostID(null)
    }

    if (permissions.isAdmin(session)) {
        if (flipPostID) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "320px"}} onMouseEnter={() => setEnableDrag(false)} 
                    onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.flipPost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.flipPost.header}</span>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.flip}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default FlipPostDialog