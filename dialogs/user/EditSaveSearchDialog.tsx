/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useContext, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSearchDialogSelector, useSearchDialogActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import "../dialog.less"

const EditSaveSearchDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editSaveSearchName, editSaveSearchKey, editSaveSearchTags} = useSearchDialogSelector()
    const {setEditSaveSearchName, setEditSaveSearchKey, setEditSaveSearchTags} = useSearchDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [error, setError] = useState(false)
    const [tagActive, setTagActive] = useState(false)
    const [posX, setPosX] = useState(0)
    const [posY, setPosY] = useState(0)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const [name, setName] = useState("")
    const errorRef = useRef<HTMLSpanElement>(null!)
    const tagRef = useRef<HTMLDivElement>(null!)
    const controls = useDragControls()

    useEffect(() => {
        const logPosition = (event: MouseEvent) => {
            const element = document.querySelector(".dialog-box")
            if (!element) return
            const rect = element.getBoundingClientRect()
            setPosX(event.clientX - rect.left - 10)
            setPosY(event.clientY - rect.top + 10)
        }
        window.addEventListener("mousemove", logPosition)
        return () => {
            window.removeEventListener("mousemove", logPosition)
        }
    }, [])

    useEffect(() => {
        if (editSaveSearchName) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
    }, [editSaveSearchName])

    const saveSearch = async () => {
        if (!editSaveSearchKey) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.nameReq
            await functions.timeout(2000)
            return setError(false)
        }
        if (!editSaveSearchTags) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.dialogs.editSaveSearch.tagsReq
            await functions.timeout(2000)
            return setError(false)
        }
        let parsedTags = await functions.native.parseSpaceEnabledSearch(editSaveSearchTags, session, setSessionFlag)
        await functions.http.put("/api/user/savesearch", {name: editSaveSearchName, key: editSaveSearchKey, tags: parsedTags}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const deleteSaveSearch = async () => {
        await functions.http.delete("/api/user/savesearch/delete", {name: editSaveSearchName}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject" | "delete") => {
        if (button === "accept") {
            saveSearch()
        }
        if (button === "delete") {
            deleteSaveSearch()
        } 
        setEditSaveSearchName("")
    }

    useEffect(() => {
        const tagX = posX
        const tagY = posY
        setTagX(tagX)
        setTagY(tagY)
    }, [editSaveSearchTags])

    useEffect(() => {
        if (tagActive) {
            const tagX = posX
            const tagY = posY
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [tagActive])

    const handleTagClick = (tag: string) => {
        const parts = functions.util.cleanHTML(editSaveSearchTags).split(/ +/g)
        parts[parts.length - 1] = tag
        const newTags = parts.join(" ")
        setEditSaveSearchTags(newTags)
    }

    if (editSaveSearchName) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.editSaveSearch.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.name}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={editSaveSearchKey} onChange={(event) => setEditSaveSearchKey(event.target.value)} style={{width: "max-content"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.navbar.tags}: </span>
                        </div>
                        <div className="dialog-row">
                            <SearchSuggestions active={tagActive} text={functions.util.cleanHTML(editSaveSearchTags)} x={tagX} y={tagY} width={200} click={handleTagClick} type="all"/>
                            <ContentEditable innerRef={tagRef} className="dialog-textarea-small" spellCheck={false} html={editSaveSearchTags} onChange={(event) => setEditSaveSearchTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button style={{backgroundColor: "#ff0eac"}} onClick={() => click("delete")} className="dialog-button">{i18n.buttons.delete}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.edit}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default EditSaveSearchDialog