/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
usePostDialogSelector, usePostDialogActions,
useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import "../dialog.less"

const UndeletePostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {undeletePostID} = usePostDialogSelector()
    const {setUndeletePostID} = usePostDialogActions()
    const {setHistoryFlag, setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const controls = useDragControls()

    useEffect(() => {
        if (undeletePostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [undeletePostID])

    const undeletePost = async () => {
        if (!undeletePostID?.postID) return
        if (undeletePostID.unverified) {
            await functions.http.put("/api/post/undelete/unverified", {postID: undeletePostID.postID}, session, setSessionFlag)
        } else {
            await functions.http.put("/api/post/undelete", {postID: undeletePostID.postID}, session, setSessionFlag)
        }
        setUndeletePostID(null)
        setPostFlag(undeletePostID.postID)
        setHistoryFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            undeletePost()
        } else {
            setUndeletePostID(null)
        }
    }


    if (undeletePostID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.dialogs.undeletePost.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.undeletePost.header}</span>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.no}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.yes}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }
    }
    return null
}

export default UndeletePostDialog