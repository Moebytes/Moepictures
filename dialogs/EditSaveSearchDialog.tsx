import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSearchDialogSelector, useSearchDialogActions, useSessionSelector, useSessionActions} from "../store"
import functions from "../structures/Functions"
import uploadIcon from "../assets/icons/upload.png"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import SearchSuggestions from "../components/SearchSuggestions"
import ContentEditable from "react-contenteditable"
import xButton from "../assets/icons/x-button.png"

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
    const errorRef = useRef<any>(null)
    const tagRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        const logPosition = (event: any) => {
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
        document.title = i18n.dialogs.editSaveSearch.title
    }, [i18n])

    useEffect(() => {
        if (editSaveSearchName) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
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
        await functions.put("/api/user/savesearch", {name: editSaveSearchName, key: editSaveSearchKey, tags: editSaveSearchTags}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const deleteSaveSearch = async () => {
        await functions.delete("/api/user/savesearch/delete", {name: editSaveSearchName}, session, setSessionFlag)
        setSessionFlag(true)
    }

    const click = (button: "accept" | "reject" | "delete") => {
        if (button === "accept") {
            saveSearch()
        }
        if (button === "delete") {
            deleteSaveSearch()
        } 
        setEditSaveSearchName(null)
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
        const parts = functions.cleanHTML(editSaveSearchTags).split(/ +/g)
        parts[parts.length - 1] = tag
        const newTags = parts.join(" ")
        setEditSaveSearchTags(newTags)
    }

    if (editSaveSearchName) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
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
                            <SearchSuggestions active={tagActive} text={functions.cleanHTML(editSaveSearchTags)} x={tagX} y={tagY} width={200} click={handleTagClick} type="all"/>
                            <ContentEditable innerRef={tagRef} className="dialog-textarea-small" spellCheck={false} html={editSaveSearchTags} onChange={(event) => setEditSaveSearchTags(event.target.value)} onFocus={() => setTagActive(true)} onBlur={() => setTagActive(false)}/>
                        </div>
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button style={{backgroundColor: "#ff0eac"}} onClick={() => click("delete")} className="dialog-button">{i18n.buttons.delete}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.edit}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditSaveSearchDialog