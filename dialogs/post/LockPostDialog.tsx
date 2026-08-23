/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, usePostDialogSelector, usePostDialogActions, useFlagActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import LockIcon from "../../assets/svg/lock.svg"
import UnlockIcon from "../../assets/svg/unlock.svg"
import "../dialog.less"

const LockPostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {lockPostID} = usePostDialogSelector()
    const {setLockPostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const controls = useDragControls()

    useEffect(() => {
        if (lockPostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [lockPostID])

    const lockPost = async () => {
        if (!lockPostID) return
        if (permissions.isMod(session)) {
            await functions.http.post("/api/post/lock",  {postID: lockPostID.post.postID}, session, setSessionFlag)
            setPostFlag(lockPostID.post.postID)
            localStorage.removeItem("savedPost")
            localStorage.removeItem("savedTagCategories")
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            lockPost()
        }
        if (!keep) setLockPostID(null)
    }

    const getTitle = () => {
        if (lockPostID?.post.locked) {
            return i18n.sidebar.unlockPost
        } else {
            return i18n.dialogs.lockPost.title
        }
    }

    const getPrompt = () => {
        if (lockPostID?.post.locked) {
            return i18n.dialogs.lockPost.unlockHeader
        } else {
            return i18n.dialogs.lockPost.header
        }
    }

    const getLockIcon = () => {
        if (lockPostID?.post.locked) {
            return <UnlockIcon className="dialog-icon" style={{color: "var(--lockColor)"}}/>
        } else {
            return <LockIcon className="dialog-icon" style={{color: "var(--lockColor)"}}/>
        }
    }

    if (lockPostID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                {getLockIcon()}
                                <span className="dialog-title">{getTitle()}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{getPrompt()}</span>
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

export default LockPostDialog