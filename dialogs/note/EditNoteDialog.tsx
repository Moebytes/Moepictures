import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useNoteDialogSelector, useNoteDialogActions,
useLayoutSelector} from "../../store"
import functions from "../../structures/Functions"
import "./styles/editnotedialog.less"
import Draggable from "react-draggable"
import bold from "../../assets/icons/edit-note-bold.png"
import boldActive from "../../assets/icons/edit-note-bold-active.png"
import italic from "../../assets/icons/edit-note-italic.png"
import italicActive from "../../assets/icons/edit-note-italic-active.png"
import checkbox from "../../assets/icons/checkbox.png"
import checkboxChecked from "../../assets/icons/checkbox-checked.png"
import SearchSuggestions from "../../components/tooltip/SearchSuggestions"
import {defaultNoteData} from "../../reducers/noteDialogReducer"

const EditNoteDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editNoteID, editNoteData} = useNoteDialogSelector()
    const {setEditNoteFlag, setEditNoteID, setEditNoteData} = useNoteDialogActions()
    const [charactersActive, setCharactersActive] = useState(false)
    const [posX, setPosX] = useState(0)
    const [posY, setPosY] = useState(0)
    const [tagX, setTagX] = useState(0)
    const [tagY, setTagY] = useState(0)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const logPosition = (event: MouseEvent) => {
            const element = document.querySelector(".edit-note-dialog-box")
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
        document.title = i18n.dialogs.editNote.title
    }, [i18n])

    useEffect(() => {
        if (editNoteID !== null) {
            document.body.style.pointerEvents = "all"
            setEnableDrag(false)
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editNoteID])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setEditNoteFlag(true)
        } else {
            setEditNoteData({...editNoteData, transcript: "", translation: "", characterTag: ""})
            setEditNoteID(null)
        }
    }

    const reset = () => {
        setEditNoteData({...defaultNoteData, transcript: editNoteData.transcript, translation: editNoteData.translation})
    }

    useEffect(() => {
        const tagX = posX
        const tagY = posY
        setTagX(tagX)
        setTagY(tagY)
    }, [editNoteData.characterTag])

    useEffect(() => {
        if (charactersActive) {
            const tagX = posX
            const tagY = posY
            setTagX(tagX)
            setTagY(tagY)
        }
    }, [charactersActive])

    const handleCharacterClick = (tag: string) => {
        const parts = functions.cleanHTML(editNoteData.characterTag).split(/ +/g)
        parts[parts.length - 1] = tag
        const characterTag = parts.join(" ")
        setEditNoteData({...editNoteData, characterTag})
    }

    const characterNoteJSX = () => {
        return (
            <>
            <div className="edit-note-dialog-row">
                <span className="edit-note-dialog-text">{i18n.labels.characterTag}</span>
            </div>
            <div className="edit-note-dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <SearchSuggestions active={charactersActive} x={tagX} y={tagY} width={mobile ? 100 : 200} fontSize={17} text={functions.cleanHTML(editNoteData.characterTag)} click={(tag) => handleCharacterClick(tag)} type="character"/>
                <textarea className="edit-note-textarea character-tag-color" spellCheck={false} value={editNoteData.characterTag} onChange={(event) => setEditNoteData({...editNoteData, characterTag: event.target.value?.trim()})}
                onFocus={() => setCharactersActive(true)} onBlur={() => setCharactersActive(false)}></textarea>
            </div>
            </>
        )

    }

    const noteJSX = () => {
        return (
            <>
            <div className="edit-note-dialog-row">
                <span className="edit-note-dialog-text">{i18n.labels.transcription}</span>
            </div>
            <div className="edit-note-dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="edit-note-textarea" spellCheck={false} value={editNoteData.transcript} onChange={(event) => setEditNoteData({...editNoteData, transcript: event.target.value})}></textarea>
            </div>
            <div className="edit-note-dialog-row">
                <span className="edit-note-dialog-text">{i18n.labels.translation}</span>
            </div>
            <div className="edit-note-dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="edit-note-textarea" spellCheck={false} value={editNoteData.translation} onChange={(event) => setEditNoteData({...editNoteData, translation: event.target.value})}></textarea>
            </div>
            <div className="edit-note-dialog-row-start">
                <span className="edit-note-dialog-text">{i18n.labels.fontFamily}:</span>
                <input className="edit-note-input" spellCheck={false} value={editNoteData.fontFamily} onChange={(event) => setEditNoteData({...editNoteData, fontFamily: event.target.value})}/>
            </div>
            <div className="edit-note-dialog-row-start">
                <span className="edit-note-dialog-text">{i18n.labels.fontStyle}:</span>
                <img className="edit-note-checkbox" src={editNoteData.bold ? boldActive : bold} onClick={() => setEditNoteData({...editNoteData, bold: !editNoteData.bold})} style={{filter: getFilter()}}/>
                <img className="edit-note-checkbox" src={editNoteData.italic ? italicActive : italic} onClick={() => setEditNoteData({...editNoteData, italic: !editNoteData.italic})} style={{marginLeft: "5px", filter: getFilter()}}/>
            </div>
            <div className="edit-note-dialog-row-start">
                <span className="edit-note-dialog-text">{i18n.labels.fontSize}:</span>
                <input className="edit-note-input" type="number" spellCheck={false} value={editNoteData.fontSize} onChange={(event) => setEditNoteData({...editNoteData, fontSize: Number(event.target.value)})}/>
            </div>
            <div className="edit-note-dialog-row-start">
                <span className="edit-note-dialog-text">{i18n.labels.overlay}?</span>
                <img className="edit-note-checkbox" src={editNoteData.overlay ? checkboxChecked : checkbox} onClick={() => setEditNoteData({...editNoteData, overlay: !editNoteData.overlay})} style={{filter: getFilter()}}/>
                {editNoteData.overlay ? <>
                <span style={{marginLeft: "10px"}} className="edit-note-dialog-text">Break Word?</span>
                <img className="edit-note-checkbox" src={editNoteData.breakWord ? checkboxChecked : checkbox} onClick={() => setEditNoteData({...editNoteData, breakWord: !editNoteData.breakWord})} style={{filter: getFilter()}}/>
                </> : null}
            </div>
            {editNoteData.overlay ? <>
                <div className="edit-note-dialog-row-start">
                    <span className="edit-note-dialog-text">{i18n.labels.textColor}:</span>
                    <input className="edit-note-color" type="color" spellCheck={false} value={editNoteData.textColor} onChange={(event) => setEditNoteData({...editNoteData, textColor: event.target.value})}/>
                </div>
                <div className="edit-note-dialog-row-start">
                    <span className="edit-note-dialog-text">{i18n.labels.backgroundColor}:</span>
                    <input className="edit-note-color" type="color" spellCheck={false} value={editNoteData.backgroundColor} onChange={(event) => setEditNoteData({...editNoteData, backgroundColor: event.target.value})}/>
                </div>
                <div className="edit-note-dialog-row-start">
                    <span className="edit-note-dialog-text">{i18n.labels.backgroundAlpha}:</span>
                    <input className="edit-note-input" type="number" spellCheck={false} value={editNoteData.backgroundAlpha} onChange={(event) => setEditNoteData({...editNoteData, backgroundAlpha: Number(event.target.value)})}/>
                </div>
                <div className="edit-note-dialog-row-start">
                    <span className="edit-note-dialog-text">{i18n.labels.strokeColor}:</span>
                    <input className="edit-note-color" type="color" spellCheck={false} value={editNoteData.strokeColor} onChange={(event) => setEditNoteData({...editNoteData, strokeColor: event.target.value})}/>
                </div>
                <div className="edit-note-dialog-row-start">
                    <span className="edit-note-dialog-text">{i18n.labels.strokeWidth}:</span>
                    <input className="edit-note-input" type="number" spellCheck={false} value={editNoteData.strokeWidth} onChange={(event) => setEditNoteData({...editNoteData, strokeWidth: Number(event.target.value)})}/>
                </div>
                <div className="edit-note-dialog-row-start">
                    <span className="edit-note-dialog-text">{i18n.labels.borderRadius}:</span>
                    <input className="edit-note-input" type="number" spellCheck={false} value={editNoteData.borderRadius} onChange={(event) => setEditNoteData({...editNoteData, borderRadius: Number(event.target.value)})}/>
                </div>
            </> : null}
            </>
        )
    }

    if (editNoteID !== null) {
        return (
            <div className="edit-note-dialog">
                <Draggable handle=".edit-note-dialog-title-container">
                <div className="edit-note-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="edit-note-container">
                        <div className="edit-note-dialog-title-container">
                            <span className="edit-note-dialog-title">{i18n.dialogs.editNote.title}</span>
                        </div>
                        {editNoteData.character ? characterNoteJSX() : noteJSX()}
                        {!editNoteData.overlay ?
                        <div className="edit-note-dialog-row-start">
                            <span className="edit-note-dialog-text">{i18n.tag.character}?</span>
                            <img className="edit-note-checkbox" src={editNoteData.character ? checkboxChecked : checkbox} onClick={() => setEditNoteData({...editNoteData, character: !editNoteData.character})} style={{filter: getFilter()}}/>
                        </div> : null}
                        <div className="edit-note-dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button style={{marginRight: "5px"}} onClick={reset} className="dialog-button">{i18n.filters.reset}</button>
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

export default EditNoteDialog