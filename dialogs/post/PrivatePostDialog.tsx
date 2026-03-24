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
import privateIcon from "../../assets/svg/private.svg"
import unprivateIcon from "../../assets/svg/unprivate.svg"
import "../dialog.less"

const PrivatePostDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {privatePostID} = usePostDialogSelector()
    const {setPrivatePostID} = usePostDialogActions()
    const {setPostFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const controls = useDragControls()

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    useEffect(() => {
        if (privatePostID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [privatePostID])

    const privatePost = async () => {
        if (!privatePostID) return
        if (permissions.canPrivate(session, privatePostID.artists)) {
            await functions.http.post("/api/post/private",  {postID: privatePostID.post.postID}, session, setSessionFlag)
            setPostFlag(privatePostID.post.postID)
            localStorage.removeItem("savedPost")
            localStorage.removeItem("savedPosts")
            localStorage.removeItem("savedTagCategories")
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            privatePost()
        }
        setPrivatePostID(null)
    }

    const getTitle = () => {
        if (privatePostID?.post.private) {
            return i18n.dialogs.privatePost.unprivateTitle
        } else {
            return i18n.dialogs.privatePost.title
        }
    }

    const getPrompt = () => {
        if (privatePostID?.post.private) {
            return i18n.dialogs.privatePost.unprivateHeader
        } else {
            return i18n.dialogs.privatePost.header
        }
    }

    const getPrivateIcon = () => {
        if (privatePostID?.post.private) {
            return getIcon(unprivateIcon)
        } else {
            return getIcon(privateIcon)
        }
    }

    if (privatePostID) {
        if (permissions.canPrivate(session, privatePostID.artists)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <img draggable={false} className="dialog-icon" src={getPrivateIcon()}/>
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

export default PrivatePostDialog