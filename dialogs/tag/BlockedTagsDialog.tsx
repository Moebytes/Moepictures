import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useTagDialogSelector, useTagDialogActions} from "../../store"
import functions from "../../functions/Functions"
import Draggable from "react-draggable"
import permissions from "../../structures/Permissions"
import "../dialog.less"

const BlockedTagsDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {blockedTagsDialog} = useTagDialogSelector()
    const {setBlockedTagsDialog} = useTagDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [tagInput, setTagInput] = useState("")
    const [blockedTags, setBlockedTags] = useState([] as string[])

    useEffect(() => {
        document.title = i18n.dialogs.blockedTags.title
    }, [i18n])

    useEffect(() => {
        if (blockedTagsDialog) {
            document.body.style.pointerEvents = "none"
            updateBlockedTags()
            setTagInput("")
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [blockedTagsDialog])

    const updateBlockedTags = async () => {
        const result = await functions.http.get("/api/tag/blockedtags", null, session, setSessionFlag)
        setBlockedTags(result)
    }

    const addTags = async () => {
        if (!blockedTagsDialog) return
        if (permissions.isAdmin(session)) {
            let tags = tagInput.split(/ +/g)
            await functions.http.put("/api/tag/blocktags", {tags}, session, setSessionFlag)
            updateBlockedTags()
            setTagInput("")
        }
    }

    const removeTags = async () => {
        if (!blockedTagsDialog) return
        if (permissions.isAdmin(session)) {
            let tags = tagInput.split(/ +/g)
            await functions.http.put("/api/tag/unblocktags", {tags}, session, setSessionFlag)
            updateBlockedTags()
            setTagInput("")
        }
    }

    const blockedTagsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!blockedTagsDialog) return jsx
        for (let i = 0; i < blockedTags.length; i++) {
            jsx.push(
                <div className="dialog-tag-box">
                    <span className="dialog-text">{blockedTags[i]}</span>
                </div>
            )
        }
        return <div className="dialog-tag-container">{jsx}</div>
    }

    if (blockedTagsDialog) {
        if (permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "360px", height: "max-content"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.blockedTags.title}</span>
                            </div>
                            <div className="dialog-center-row">
                                <span className="dialog-text">{i18n.navbar.tags}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={tagInput} onChange={(event) => setTagInput(event.target.value)} style={{width: "50%"}}/>
                                <button onClick={() => addTags()} className="dialog-button-square" style={{backgroundColor: "#3990ff"}}>+</button>
                                <button onClick={() => removeTags()} className="dialog-button-square" style={{backgroundColor: "#ff3882"}}>-</button>
                            </div>
                            {blockedTagsJSX()}
                            <div className="dialog-row">
                                <button onClick={() => setBlockedTagsDialog(false)} className="dialog-button">{i18n.buttons.back}</button>
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

export default BlockedTagsDialog