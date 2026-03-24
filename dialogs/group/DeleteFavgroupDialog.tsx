/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, 
useGroupDialogSelector, useGroupDialogActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const DeleteFavgroupDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {deleteFavGroupObj} = useGroupDialogSelector()
    const {setDeleteFavGroupObj} = useGroupDialogActions()
    const navigate = useNavigate()
    const controls = useDragControls()

    useEffect(() => {
        if (deleteFavGroupObj) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [deleteFavGroupObj])

    const deleteFavgroup = async () => {
        if (!deleteFavGroupObj) return
        await functions.http.delete("/api/favgroup/delete", {name: deleteFavGroupObj.name}, session, setSessionFlag)
        setDeleteFavGroupObj(null)
        setSessionFlag(true)
        navigate("/profile")
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            deleteFavgroup()
        } else {
            setDeleteFavGroupObj(null)
        }
    }

    if (deleteFavGroupObj) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.deleteFavgroup.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.deleteFavgroup.header}</span>
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
    return null
}

export default DeleteFavgroupDialog