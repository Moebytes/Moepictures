/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef, useReducer} from "react"
import {useThemeSelector, useInteractionActions, useGroupDialogSelector, useGroupDialogActions, useSessionSelector, 
useSessionActions, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import {motion, useDragControls} from "framer-motion"
import "../dialog.less"

const AddFavgroupPostDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {addFavgroupPostObj} = useGroupDialogSelector()
    const {setAddFavgroupPostObj} = useGroupDialogActions()
    const {setGroupFlag} = useFlagActions()
    const [postIDs, setPostIDs] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    useEffect(() => {
        if (addFavgroupPostObj) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [addFavgroupPostObj])

    const addPost = async () => {
        if (!addFavgroupPostObj) return
        if (!postIDs) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.dialogs.addGroupPost.noPostIDs
            await functions.timeout(2000)
            return setError(false)
        }
        setAddFavgroupPostObj(null)
        await functions.http.post("/api/favgroup/update", {postIDs: postIDs.split(/\s+/g), name: addFavgroupPostObj.slug, isPrivate: addFavgroupPostObj.private}, session, setSessionFlag)
        setGroupFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            addPost()
        } else {
            setAddFavgroupPostObj(null)
        }
    }

    if (addFavgroupPostObj) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{width: "350px", marginTop: "-150px"}} 
                onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.addFavgroupPost.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.postIDs}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={postIDs} onChange={(event) => setPostIDs(event.target.value)} style={{width: "50%"}}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.add}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default AddFavgroupPostDialog