import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, DeleteTagFlagContext, DeleteTagIDContext, MobileContext,
EditTagAliasesContext, EditTagDescriptionContext, EditTagIDContext, EditTagFlagContext, SessionContext,
EditTagImageContext, EditTagKeyContext, AliasTagFlagContext, AliasTagIDContext, AliasTagNameContext} from "../Context"
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
    onEdit?: () => void
}

const TagRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {deleteTagID, setDeleteTagID} = useContext(DeleteTagIDContext)
    const {deleteTagFlag, setDeleteTagFlag} = useContext(DeleteTagFlagContext)
    const {editTagFlag, setEditTagFlag} = useContext(EditTagFlagContext)
    const {editTagID, setEditTagID} = useContext(EditTagIDContext)
    const {editTagAliases, setEditTagAliases} = useContext(EditTagAliasesContext)
    const {editTagDescription, setEditTagDescription} = useContext(EditTagDescriptionContext)
    const {editTagImage, setEditTagImage} = useContext(EditTagImageContext)
    const {editTagKey, setEditTagKey} = useContext(EditTagKeyContext)
    const {aliasTagID, setAliasTagID} = useContext(AliasTagIDContext)
    const {aliasTagFlag, setAliasTagFlag} = useContext(AliasTagFlagContext)
    const {aliasTagName, setAliasTagName} = useContext(AliasTagNameContext)
    const {session, setSession} = useContext(SessionContext)
    const history = useHistory()

    const searchTag = () => {
        setSearch(props.tag.tag)
        setSearchFlag(true)
        history.push("/posts")
    }

    const generateAliasesJSX = () => {
        let jsx = [] as any 
        for (let i = 0; i < props.tag.aliases.length; i++) {
            jsx.push(<span className="tagrow-alias">{props.tag.aliases[i].alias.replaceAll("-", " ")}</span>)
        }
        return jsx
    }

    const deleteTag = async () => {
        await axios.delete("/api/tag/delete", {params: {tag: props.tag.tag}, withCredentials: true})
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteTagFlag && deleteTagID === props.tag.tag) {
            deleteTag()
            setDeleteTagFlag(false)
            setDeleteTagID(null)
        }
    }, [deleteTagFlag])

    const deleteTagDialog = async () => {
        setDeleteTagID(props.tag.tag)
    }

    const editTag = async () => {
        let image = null as any
        if (editTagImage) {
            const arrayBuffer = await fetch(editTagImage).then((r) => r.arrayBuffer())
            const bytes = new Uint8Array(arrayBuffer)
            image = Object.values(bytes)
        }
        await axios.put("/api/tag/edit", {tag: props.tag.tag, key: editTagKey, description: editTagDescription,
        image, aliases: editTagAliases}, {withCredentials: true})
        props.onEdit?.()
    }

    useEffect(() => {
        if (editTagFlag && editTagID === props.tag.tag) {
            editTag()
            setEditTagFlag(false)
            setEditTagID(null)
        }
    }, [editTagFlag])

    const editTagDialog = async () => {
        setEditTagKey(props.tag.tag)
        setEditTagDescription(props.tag.description)
        setEditTagImage(props.tag.image ? functions.getTagLink(props.tag.type, props.tag.image) : null)
        setEditTagAliases(props.tag.aliases?.[0] ? props.tag.aliases.map((a: any) => a.alias) : [])
        setEditTagID(props.tag.tag)
    }

    const aliasTag = async () => {
        await axios.post("/api/tag/aliasto", {tag: props.tag.tag, aliasTo: aliasTagName}, {withCredentials: true})
        props.onEdit?.()
    }

    useEffect(() => {
        if (aliasTagFlag && aliasTagID === props.tag.tag) {
            aliasTag()
            setAliasTagFlag(false)
            setAliasTagID(null)
        }
    }, [aliasTagFlag])

    const aliasTagDialog = async () => {
        setAliasTagName("")
        setAliasTagID(props.tag.tag)
    }

    return (
        <tr className="tagrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            {props.tag.image ?
            <td className="tagrow-img-container">
                <img className="tagrow-img" src={functions.getTagLink(props.tag.type, props.tag.image)}/>
            </td> : null}
            <div className="tagrow-content-container">
                <td className="tagrow-container" style={{width: props.tag.image ? "16%" : "25%"}}>
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
            </div>
            {session.username ?
            <div className="tag-buttons">
                {/* <img className="tag-button" src={historyIcon}/> */}
                <img className="tag-button" src={alias} onClick={aliasTagDialog}/>
                <img className="tag-button" src={edit} onClick={editTagDialog}/>
                <img className="tag-button" src={deleteIcon} onClick={deleteTagDialog}/>
            </div> : null}
        </tr>
    )
}

export default TagRow