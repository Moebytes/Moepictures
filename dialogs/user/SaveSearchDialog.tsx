/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSearchDialogSelector, useSearchDialogActions, useSessionSelector, 
useSessionActions, useSearchSelector} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import "../dialog.less"

const SaveSearchDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {saveSearchDialog} = useSearchDialogSelector()
    const {setSaveSearchDialog} = useSearchDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {search} = useSearchSelector()
    const [error, setError] = useState(false)
    const [tagActive, setTagActive] = useState(false)
    const [posX, setPosX] = useState(0)
    const [posY, setPosY] = useState(0)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const [name, setName] = useState("")
    const [tags, setTags] = useState("")
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

    const initItems = () => {
        if (saveSearchDialog) {
            const nameString = search.split(/ +/g).map((s: string) => s.split("-")[0]).join(" ")
            setName(nameString)
            setTags(search)
        } else {
            setName("")
            setTags("")
        }
    }

    useEffect(() => {
        if (saveSearchDialog) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
        }
        initItems()
    }, [saveSearchDialog])

    const saveSearch = async () => {
        if (!name) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.copyrightRemoval.nameReq
            await functions.timeout(2000)
            return setError(false)
        }
        if (!tags) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.dialogs.editSaveSearch.tagsReq
            await functions.timeout(2000)
            return setError(false)
        }
        let parsedTags = await functions.native.parseSpaceEnabledSearch(tags, session, setSessionFlag)
        await functions.http.post("/api/user/savesearch", {name, tags: parsedTags}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            saveSearch()
        } 
        setSaveSearchDialog(false)
    }

    useEffect(() => {
        const tagX = posX
        const tagY = posY
        setTagX(tagX)
        setTagY(tagY)
    }, [tags])

    useEffect(() => {
        if (tagActive) {
            const tagX = posX
            const tagY = posY
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [tagActive])

    const handleTagClick = (tag: string) => {
        setTags((prev: string) => {
            const parts = functions.util.cleanHTML(prev).split(/ +/g)
            parts[parts.length - 1] = tag
            return parts.join(" ")
        })
    }

    if (saveSearchDialog) {
        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.sidebar.saveSearch}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.name}: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={name} onChange={(event) => setName(event.target.value)} style={{width: "max-content"}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.navbar.tags}: </span>
                        </div>
                        <div className="dialog-row">
                            <SearchSuggestions active={tagActive} text={functions.util.cleanHTML(tags)} x={tagX} y={tagY} width={200} click={handleTagClick} type="all"/>
                            <ContentEditable innerRef={tagRef} className="dialog-textarea-small" spellCheck={false} html={tags} onChange={(event) => setTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.save}</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default SaveSearchDialog