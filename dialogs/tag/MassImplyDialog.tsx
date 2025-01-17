import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useTagDialogSelector, useTagDialogActions,
useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import "../dialog.less"
import Draggable from "react-draggable"
import permissions from "../../structures/Permissions"

const MassImplyDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {massImplyDialog} = useTagDialogSelector()
    const {setMassImplyDialog} = useTagDialogActions()
    const {setTagSearchFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [wildcard, setWildcard] = useState("")
    const [implyTo, setImplyTo] = useState("")
    const history = useHistory()

    useEffect(() => {
        document.title = i18n.dialogs.massImply.title
    }, [i18n])

    useEffect(() => {
        if (massImplyDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
            setWildcard("")
            setImplyTo("")
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [massImplyDialog])

    const massImply = async () => {
        if (!massImplyDialog) return
        if (permissions.isAdmin(session)) {
            await functions.post("/api/tag/massimply", {wildcard, implyTo}, session, setSessionFlag)
            setTagSearchFlag(implyTo)
        }
    }

    const click = (button: "accept" | "reject", keep?: boolean) => {
        if (button === "accept") {
            massImply()
            setMassImplyDialog(false)
        } else {
            setMassImplyDialog(false)
        }
    }

    if (massImplyDialog) {
        if (permissions.isAdmin(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{width: "360px", height: "300px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.massImply.title}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.massImply.header}</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.massImply.wildcard}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={wildcard} onChange={(event) => setWildcard(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">{i18n.dialogs.massImply.implyTo}: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={implyTo} onChange={(event) => setImplyTo(event.target.value)} style={{width: "50%"}}/>
                            </div>
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button style={{backgroundColor: "var(--buttonBG)"}} onClick={() => click("accept")} className="dialog-button">{i18n.dialogs.massImply.title}</button>
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

export default MassImplyDialog