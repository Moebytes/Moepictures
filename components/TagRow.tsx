import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, DeleteTagFlagContext, DeleteTagIDContext, MobileContext, EditTagTypeContext, EditTagReasonContext,
EditTagPixivContext, EditTagTwitterContext, EditTagWebsiteContext, EditTagFandomContext, EditTagAliasesContext, EditTagImplicationsContext, 
EditTagDescriptionContext, EditTagIDContext, EditTagFlagContext, SessionContext, EditTagImageContext, EditTagKeyContext, AliasTagFlagContext, 
AliasTagIDContext, AliasTagNameContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import alias from "../assets/purple/alias.png"
import edit from "../assets/purple/edit.png"
import editMagenta from "../assets/magenta/edit.png"
import historyIcon from "../assets/purple/history.png"
import historyMagenta from "../assets/magenta/history.png"
import deleteIcon from "../assets/purple/delete.png"
import deleteIconMagenta from "../assets/magenta/delete.png"
import website from "../assets/purple/support.png"
import fandom from "../assets/purple/fandom.png"
import pixiv from "../assets/purple/pixiv.png"
import twitter from "../assets/purple/twitter.png"
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
    const {editTagReason, setEditTagReason} = useContext(EditTagReasonContext)
    const {editTagFlag, setEditTagFlag} = useContext(EditTagFlagContext)
    const {editTagID, setEditTagID} = useContext(EditTagIDContext)
    const {editTagAliases, setEditTagAliases} = useContext(EditTagAliasesContext)
    const {editTagImplications, setEditTagImplications} = useContext(EditTagImplicationsContext)
    const {editTagDescription, setEditTagDescription} = useContext(EditTagDescriptionContext)
    const {editTagType, setEditTagType} = useContext(EditTagTypeContext)
    const {editTagPixiv, setEditTagPixiv} = useContext(EditTagPixivContext)
    const {editTagTwitter, setEditTagTwitter} = useContext(EditTagTwitterContext)
    const {editTagWebsite, setEditTagWebsite} = useContext(EditTagWebsiteContext)
    const {editTagFandom, setEditTagFandom} = useContext(EditTagFandomContext)
    const {editTagImage, setEditTagImage} = useContext(EditTagImageContext)
    const {editTagKey, setEditTagKey} = useContext(EditTagKeyContext)
    const {aliasTagID, setAliasTagID} = useContext(AliasTagIDContext)
    const {aliasTagFlag, setAliasTagFlag} = useContext(AliasTagFlagContext)
    const {aliasTagName, setAliasTagName} = useContext(AliasTagNameContext)
    const {session, setSession} = useContext(SessionContext)
    const history = useHistory()

    const searchTag = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open("/posts", "_blank")
        } else {
            history.push("/posts")
        }
        setSearch(props.tag.tag)
        setSearchFlag(true)
    }

    const tagPage = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${props.tag.tag}`, "_blank")
        } else {
            history.push(`/tag/${props.tag.tag}`)
        }
    }

    const generateAliasesJSX = () => {
        let jsx = [] as any 
        for (let i = 0; i < props.tag.aliases.length; i++) {
            jsx.push(<span className="tagrow-alias">{props.tag.aliases[i].alias.replaceAll("-", " ")}</span>)
        }
        return jsx
    }

    const generateImplicationsJSX = () => {
        let jsx = [] as any 
        for (let i = 0; i < props.tag.implications.length; i++) {
            jsx.push(<span className="tagrow-alias">{props.tag.implications[i].implication.replaceAll("-", " ")}</span>)
        }
        return jsx
    }

    const deleteTag = async () => {
        await axios.delete("/api/tag/delete", {params: {tag: props.tag.tag}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
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

    const refreshCache = async (image: any) => {
        try {
           await axios.post(image, null, {withCredentials: true})
        } catch {
            // ignore
        }
    }

    const editTag = async () => {
        let image = null as any
        if (editTagImage) {
            if (editTagImage === "delete") {
                image = ["delete"]
            } else {
                const arrayBuffer = await fetch(editTagImage).then((r) => r.arrayBuffer())
                const bytes = new Uint8Array(arrayBuffer)
                image = Object.values(bytes)
            }
        }
        await axios.put("/api/tag/edit", {tag: props.tag.tag, key: editTagKey, description: editTagDescription,
        image, aliases: editTagAliases, implications: editTagImplications, pixiv: editTagPixiv, twitter: editTagTwitter,
        website: editTagWebsite, fandom: editTagFandom, reason: editTagReason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        if (editTagImage) refreshCache(editTagImage)
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
        setEditTagImplications(props.tag.implications?.[0] ? props.tag.implications.map((i: any) => i.implication) : [])
        setEditTagID(props.tag.tag)
        setEditTagType(props.tag.type)
        setEditTagPixiv(props.tag.pixiv)
        setEditTagTwitter(props.tag.twitter)
        setEditTagWebsite(props.tag.website)
        setEditTagFandom(props.tag.fandom)
        setEditTagReason("")
    }

    const aliasTag = async () => {
        await axios.post("/api/tag/aliasto", {tag: props.tag.tag, aliasTo: aliasTagName}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
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

    const tagHistory = async () => {
        window.scrollTo(0, 0)
        history.push(`/tag/history/${props.tag.tag}`)
    }

    const socialJSX = () => {
        let jsx = [] as any
        if (props.tag.type === "artist") {
            if (props.tag.website) {
                jsx.push(<img className="tagrow-social" src={website} onClick={() => window.open(props.tag.website, "_blank")}/>)
            }
            if (props.tag.pixiv) {
                jsx.push(<img className="tagrow-social" src={pixiv} onClick={() => window.open(props.tag.pixiv, "_blank")}/>)
            }
            if (props.tag.twitter) {
                jsx.push(<img className="tagrow-social" src={twitter} onClick={() => window.open(props.tag.twitter, "_blank")}/>)
            }
        }
        if (props.tag.type === "character") {
            if (props.tag.fandom) {
                jsx.push(<img className="tagrow-social" src={fandom} onClick={() => window.open(props.tag.fandom, "_blank")}/>)
            }
        }
        if (props.tag.type === "series") {
            if (props.tag.website) {
                jsx.push(<img className="tagrow-social" src={website} onClick={() => window.open(props.tag.website, "_blank")}/>)
            }
            if (props.tag.twitter) {
                jsx.push(<img className="tagrow-social" src={twitter} onClick={() => window.open(props.tag.twitter, "_blank")}/>)
            }
        }
        return jsx
    }

    const getClass = () => {
        if (props.tag.type === "artist") return "tagrow-artist-tag"
        if (props.tag.type === "character") return "tagrow-character-tag"
        if (props.tag.type === "series") return "tagrow-series-tag"
        if (props.tag.type === "meta") return "tagrow-meta-tag"
        return "tagrow-tag"
    }

    return (
        <tr className="tagrow">
            {props.tag.image ?
            <td className="tagrow-img-container">
                <img className="tagrow-img" src={functions.getTagLink(props.tag.type, props.tag.image)}/>
            </td> : null}
            <div className="tagrow-content-container">
                <td className="tagrow-container" style={{width: props.tag.image ? "16%" : "25%"}}>
                    <div className="tagrow-row">
                        <span className={getClass()} onClick={tagPage} onAuxClick={tagPage}>{props.tag.tag.replaceAll("-", " ")}</span>
                        {socialJSX()}
                        <span className="tagrow-tag-count">{props.tag.postCount}</span>
                    </div>
                    {props.tag.aliases?.[0] ?
                    <div className="tagrow-column">
                        <span className="tagrow-alias-header">Aliases: </span>
                        {generateAliasesJSX()}
                    </div> : null}
                    {props.tag.implications?.[0] ?
                    <div className="tagrow-column">
                        <span className="tagrow-alias-header">Implies: </span>
                        {generateImplicationsJSX()}
                    </div> : null}
                </td>
                <td className="tagrow-description">
                    <span className="tagrow-desc-text">{props.tag.description || "No description."}</span>
                </td>
            </div>
            {session.username ?
            <div className="tag-buttons">
                <img className="tag-button" src={historyIcon} onClick={tagHistory}/>
                <img className="tag-button" src={alias} onClick={aliasTagDialog}/>
                <img className="tag-button" src={edit} onClick={editTagDialog}/>
                <img className="tag-button" src={deleteIcon} onClick={deleteTagDialog}/>
            </div> : null}
        </tr>
    )
}

export default TagRow