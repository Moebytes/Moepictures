import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions, useFlagActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
import "../dialog.less"

const PageDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag, setMobileScrolling} = useInteractionActions()
    const {showPageDialog} = useMiscDialogSelector()
    const {setShowPageDialog} = useMiscDialogActions()
    const {setPageFlag} = useFlagActions()
    const [pageField, setPageField] = useState("")

    useEffect(() => {
        document.title = i18n.dialogs.page.title
    }, [i18n])

    useEffect(() => {
        if (showPageDialog) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showPageDialog])


    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setPageFlag(Number(pageField))
            setTimeout(() => {
                setMobileScrolling(false)
                // functions.jumpToTop()
            }, 100)
        }
        setShowPageDialog(false)
    }


    if (showPageDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "200px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.page.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.page}:</span>
                            <input className="dialog-input-taller" type="number" spellCheck={false} value={pageField} onChange={(event) => setPageField(event.target.value)}/>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.go}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default PageDialog