/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions} from "../../store"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import "../dialog.less"

const PermaDeletePostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {permaDeletePostID, permaDeletePostFlag} = usePostDialogSelector()
    const {setPermaDeletePostID, setPermaDeletePostFlag} = usePostDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const controls = useDragControls()

    useEffect(() => {
        if (permaDeletePostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [permaDeletePostID])

    const deletePost = async () => {
        setPermaDeletePostFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deletePost()
        } else {
            setPermaDeletePostID(null)
        }
    }


    if (permaDeletePostID) {
        if (permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.permaDeletePost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.permaDeletePost.header}</span>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => click("accept")} style={{backgroundColor: "var(--deletedColor)"}} 
                                className="dialog-button">{i18n.buttons.delete}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default PermaDeletePostDialog