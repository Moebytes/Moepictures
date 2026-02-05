import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, usePostDialogSelector, usePostDialogActions, useFlagActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
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

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    useEffect(() => {
        if (privatePostID) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
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
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "280px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
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
                    </div>
                    </Draggable>
                </div>
            )
        }
    }
    return null
}

export default PrivatePostDialog