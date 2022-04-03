import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import alias from "../assets/purple/alias.png"
import edit from "../assets/purple/edit.png"
import editMagenta from "../assets/magenta/edit.png"
import history from "../assets/purple/history.png"
import historyMagenta from "../assets/magenta/history.png"
import deleteIcon from "../assets/purple/delete.png"
import deleteIconMagenta from "../assets/magenta/delete.png"
import "./styles/tagrow.less"

const TagRow: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)

    return (
        <tr className="tagrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <td className="tagrow-container">
                <div className="tagrow-row">
                    <span className="tagrow-tag">Gabriel (Gabriel Dropout)</span>
                    <span className="tagrow-tag-count">654k</span>
                </div>
                <div className="tagrow-column">
                    <span className="tagrow-alias-header">Aliases: </span>
                    <span className="tagrow-alias">Tenma Gabriel White: </span>
                    <span className="tagrow-alias">愛想</span>
                </div>
            </td>
            <td className="tagrow-description">
                <span className="tagrow-desc-text">A blonde haired girl that dropped out of heaven.</span>
            </td>
            <div className="tag-buttons">
                <img className="tag-button" src={history}/>
                <img className="tag-button" src={alias}/>
                <img className="tag-button" src={edit}/>
                <img className="tag-button" src={deleteIcon}/>
            </div>
        </tr>
    )
}

export default TagRow