import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import alias from "../assets/purple/alias.png"
import edit from "../assets/purple/edit.png"
import editMagenta from "../assets/magenta/edit.png"
import historyIcon from "../assets/purple/history.png"
import historyMagenta from "../assets/magenta/history.png"
import deleteIcon from "../assets/purple/delete.png"
import deleteIconMagenta from "../assets/magenta/delete.png"
import "./styles/tagrow.less"
import axios from "axios"

interface Props {
    tag: any
    onDelete?: () => void
}

const TagRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const history = useHistory()

    const searchTag = () => {
        setSearch(props.tag.tag)
        setSearchFlag(true)
        history.push("/posts")
    }

    const generateAliasesJSX = () => {
        let jsx = [] as any 
        for (let i = 0; i < props.tag.aliases.length; i++) {
            jsx.push(<span className="tagrow-alias">{props.tag.aliases[i].replaceAll("-", " ")}</span>)
        }
        return jsx
    }

    const deleteTag = async () => {
        await axios.delete("/api/tag", {params: {tag: props.tag.tag}, withCredentials: true})
        props.onDelete?.()
    }

    return (
        <tr className="tagrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            {props.tag.image ?
            <td className="tagrow-img-container">
                <img className="tagrow-img" src={functions.getTagLink(props.tag.type, props.tag.image)}/>
            </td> : null}
            <td className="tagrow-container">
                <div className="tagrow-row" onClick={searchTag}>
                    <span className="tagrow-tag">{props.tag.tag.replaceAll("-", " ")}</span>
                    <span className="tagrow-tag-count">{props.tag.postCount}</span>
                </div>
                {props.tag.aliases?.[0] ?
                <div className="tagrow-column">
                    <span className="tagrow-alias-header">Aliases: </span>
                    {generateAliasesJSX()}
                </div> : null}
            </td>
            <td className="tagrow-description">
                <span className="tagrow-desc-text">{props.tag.description || "No description."}</span>
            </td>
            <div className="tag-buttons">
                <img className="tag-button" src={historyIcon}/>
                <img className="tag-button" src={alias}/>
                <img className="tag-button" src={edit}/>
                <img className="tag-button" src={deleteIcon} onClick={deleteTag}/>
            </div>
        </tr>
    )
}

export default TagRow