/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import TakedownIcon from "../../assets/svg/takedown.svg"
import RestoreIcon from "../../assets/svg/restore.svg"
import "../dialog.less"

const TakedownPostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {takedownPostID} = usePostDialogSelector()
    const {setTakedownPostID} = usePostDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setPostFlag} = useFlagActions()
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const controls = useDragControls()

    useEffect(() => {
        if (takedownPostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [takedownPostID])

    const takedownPost = async () => {
        if (!takedownPostID) return
        if (permissions.isMod(session)) {
            await functions.http.post("/api/post/takedown",  {postID: takedownPostID.post.postID}, session, setSessionFlag)
            setPostFlag(takedownPostID.post.postID)
            localStorage.removeItem("savedPost")
            localStorage.removeItem("savedTagCategories")
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            takedownPost()
        }
        if (!keep) setTakedownPostID(null)
    }

    const close = () => {
        setTakedownPostID(null)
        setSubmitted(false)
        setReason("")
    }

    const getTitle = () => {
        if (takedownPostID?.post.hidden) {
            return i18n.dialogs.takedownPost.restoreTitle
        } else {
            return i18n.dialogs.takedownPost.title
        }
    }

    const getPrompt = () => {
        if (takedownPostID?.post.hidden) {
            return i18n.dialogs.takedownPost.restoreHeader
        } else {
            return i18n.dialogs.takedownPost.header
        }
    }

    const getTakedownIcon = () => {
        if (takedownPostID?.post.hidden) {
            return <RestoreIcon className="dialog-icon"/>
        } else {
            return <TakedownIcon className="dialog-icon"/>
        }
    }

    if (takedownPostID) {
        if (permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                {getTakedownIcon()}
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

export default TakedownPostDialog