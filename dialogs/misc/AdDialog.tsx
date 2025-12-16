import React, {useEffect} from "react"
import {useThemeSelector, useInteractionActions, useMiscDialogSelector, useMiscDialogActions} from "../../store"
import Draggable from "react-draggable"
import img from "../../assets/icons/favicon.png"
import "../dialog.less"

const AdDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {showAdDialog} = useMiscDialogSelector()
    const {setShowAdDialog} = useMiscDialogActions()

    useEffect(() => {
        if (showAdDialog) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [showAdDialog])

    const click = async (button: "accept" | "reject") => {
        setShowAdDialog(false)
    }

    if (showAdDialog) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "380px", height: "300px", padding: "17px 60px"}} 
                    onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <img className="dialog-img" src={img} draggable={false} style={{height: "75px"}}/>
                        </div>
                        <div className="dialog-center-row">
                            <span className="dialog-title" style={{color: "var(--progressText)", fontSize: "20px", 
                                fontWeight: "normal"}}>
                                {i18n.dialogs.ad.title}
                            </span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text" style={{fontSize: "17px"}}>{i18n.dialogs.ad.header}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-ad-button">
                                {i18n.dialogs.ad.pageTitle}
                            </button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default AdDialog