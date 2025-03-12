import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions,
useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import "../dialog.less"
import Draggable from "react-draggable"
import permissions from "../../structures/Permissions"

const DeleteTagFavoritesDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {deleteTagFavoritesDialog} = useTagDialogSelector()
    const {setDeleteTagFavoritesDialog} = useTagDialogActions()
    const {setTagFavoriteFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()

    useEffect(() => {
        document.title = i18n.dialogs.deleteTagFavorites.title
    }, [i18n])

    useEffect(() => {
        if (deleteTagFavoritesDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [deleteTagFavoritesDialog])

    const deleteTagFavorites = async () => {
        await functions.delete("/api/tagfavorites/delete", null, session, setSessionFlag)
        setTagFavoriteFlag(true)
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            deleteTagFavorites()
        }
        setDeleteTagFavoritesDialog(false)
    }

    if (deleteTagFavoritesDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.deleteTagFavorites.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteTagFavorites.header}</span>
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
    return null
}

export default DeleteTagFavoritesDialog