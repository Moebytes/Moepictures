import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, DeleteTagFlagContext, DeleteTagIDContext, MobileContext, EditTagTypeContext, EditTagReasonContext,
EditTagSocialContext, EditTagTwitterContext, EditTagWebsiteContext, EditTagFandomContext, EditTagAliasesContext, EditTagImplicationsContext, 
EditTagDescriptionContext, EditTagIDContext, EditTagFlagContext, EditTagPixivTagsContext, EditTagR18Context, SessionContext, EditTagImageContext, EditTagKeyContext, AliasTagFlagContext, 
AliasTagIDContext, AliasTagNameContext, SessionFlagContext, CategorizeTagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import alias from "../assets/icons/alias.png"
import edit from "../assets/icons/edit.png"
import historyIcon from "../assets/icons/history.png"
import deleteIcon from "../assets/icons/delete.png"
import categoryIcon from "../assets/icons/category.png"
import website from "../assets/icons/support.png"
import fandom from "../assets/icons/fandom.png"
import pixiv from "../assets/icons/pixiv.png"
import soundcloud from "../assets/icons/soundcloud.png"
import sketchfab from "../assets/icons/sketchfab.png"
import twitter from "../assets/icons/twitter.png"
import "./styles/tagrow.less"

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
    const {editTagSocial, setEditTagSocial} = useContext(EditTagSocialContext)
    const {editTagTwitter, setEditTagTwitter} = useContext(EditTagTwitterContext)
    const {editTagWebsite, setEditTagWebsite} = useContext(EditTagWebsiteContext)
    const {editTagFandom, setEditTagFandom} = useContext(EditTagFandomContext)
    const {editTagPixivTags, setEditTagPixivTags} = useContext(EditTagPixivTagsContext)
    const {editTagR18, setEditTagR18} = useContext(EditTagR18Context)
    const {editTagImage, setEditTagImage} = useContext(EditTagImageContext)
    const {editTagKey, setEditTagKey} = useContext(EditTagKeyContext)
    const {aliasTagID, setAliasTagID} = useContext(AliasTagIDContext)
    const {aliasTagFlag, setAliasTagFlag} = useContext(AliasTagFlagContext)
    const {aliasTagName, setAliasTagName} = useContext(AliasTagNameContext)
    const {categorizeTag, setCategorizeTag} = useContext(CategorizeTagContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const history = useHistory()
    const scrollRef = useRef(null) as any

    useEffect(() => {
        if (!scrollRef.current) return
        let startY = 0
        let scrollTopStart = 0
    
        const touchStart = (event: React.TouchEvent) => {
            if (!scrollRef.current) return
            startY = event.touches[0].pageY
            scrollTopStart = scrollRef.current.scrollTop
        }
    
        const touchMove = (event: React.TouchEvent) => {
            if (!scrollRef.current) return
            const touchY = event.touches[0].pageY
            const deltaY = startY - touchY
            scrollRef.current.scrollTop = scrollTopStart + deltaY
            event.preventDefault()
        }
    
        scrollRef.current.addEventListener("touchstart", touchStart)
        scrollRef.current.addEventListener("touchmove", touchMove)
        return () => {
            if (!scrollRef.current) return
            scrollRef.current.removeEventListener("touchstart", touchStart)
            scrollRef.current.removeEventListener("touchmove", touchMove)
        }
      }, [])

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
        event.preventDefault()
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
        await functions.delete("/api/tag/delete", {tag: props.tag.tag}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteTagFlag && deleteTagID === props.tag.tag) {
            deleteTag()
            setDeleteTagFlag(false)
            setDeleteTagID(null)
        }
    }, [deleteTagFlag, session])

    const deleteTagDialog = async () => {
        setDeleteTagID(props.tag.tag)
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
        try {
            await functions.put("/api/tag/edit", {tag: props.tag.tag, key: editTagKey, description: editTagDescription,
            image, aliases: editTagAliases, implications: editTagImplications, pixivTags: editTagPixivTags, social: editTagSocial, twitter: editTagTwitter,
            website: editTagWebsite, fandom: editTagFandom, r18: editTagR18, reason: editTagReason}, session, setSessionFlag)
            if (editTagImage) functions.refreshCache(editTagImage)
            props.onEdit?.()
        } catch (err: any) {
            if (err.response?.data.includes("No permission to edit implications")) {
                await functions.post("/api/tag/edit/request", {tag: editTagID.tag, key: editTagKey, description: editTagDescription, image, aliases: editTagAliases, 
                implications: editTagImplications, pixivTags: editTagPixivTags, social: editTagSocial, twitter: editTagTwitter, website: editTagWebsite, fandom: editTagFandom, 
                r18: editTagR18, reason: editTagReason}, session, setSessionFlag)
                setEditTagID({tag: props.tag.tag, failed: "implication"})
            } else {
                setEditTagID({tag: props.tag.tag, failed: true})
            }
        }
    }

    useEffect(() => {
        if (editTagFlag && editTagID?.tag === props.tag.tag) {
            editTag()
            setEditTagFlag(false)
            setEditTagID(null)
        }
    }, [editTagFlag, session])

    const editTagDialog = async () => {
        setEditTagKey(props.tag.tag)
        setEditTagDescription(props.tag.description)
        setEditTagImage(props.tag.image ? functions.getTagLink(props.tag.type, props.tag.image) : null)
        setEditTagAliases(props.tag.aliases?.[0] ? props.tag.aliases.map((a: any) => a.alias) : [])
        setEditTagImplications(props.tag.implications?.[0] ? props.tag.implications.map((i: any) => i.implication) : [])
        setEditTagPixivTags(props.tag.pixivTags?.[0] ? props.tag.pixivTags : [])
        setEditTagType(props.tag.type)
        setEditTagSocial(props.tag.social)
        setEditTagTwitter(props.tag.twitter)
        setEditTagWebsite(props.tag.website)
        setEditTagFandom(props.tag.fandom)
        setEditTagR18(props.tag.r18)
        setEditTagReason("")
        setEditTagID({tag: props.tag.tag, failed: false})
    }

    const aliasTag = async () => {
        await functions.post("/api/tag/aliasto", {tag: props.tag.tag, aliasTo: aliasTagName}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (aliasTagFlag && aliasTagID === props.tag.tag) {
            aliasTag()
            setAliasTagFlag(false)
            setAliasTagID(null)
        }
    }, [aliasTagFlag, session])

    const aliasTagDialog = async () => {
        setAliasTagName("")
        setAliasTagID(props.tag.tag)
    }

    const categorizeTagDialog = async () => {
        setCategorizeTag(props.tag)
    }

    const tagHistory = async () => {
        window.scrollTo(0, 0)
        history.push(`/tag/history/${props.tag.tag}`)
    }

    const socialJSX = () => {
        let jsx = [] as any
        if (props.tag.type === "artist") {
            if (props.tag.website) {
                jsx.push(<img className="tagrow-social" src={website} onClick={() => window.open(props.tag.website, "_blank", "noreferrer")}/>)
            }
            if (props.tag.social?.includes("pixiv.net")) {
                jsx.push(<img className="tagrow-social" src={pixiv} onClick={() => window.open(props.tag.social, "_blank", "noreferrer")}/>)
            } else if (props.tag.social?.includes("soundcloud.com")) {
                jsx.push(<img className="tagrow-social" src={soundcloud} onClick={() => window.open(props.tag.social, "_blank", "noreferrer")}/>)
            } else if (props.tag.social?.includes("sketchfab.com")) {
                jsx.push(<img className="tagrow-social" src={sketchfab} onClick={() => window.open(props.tag.social, "_blank", "noreferrer")}/>)
            }
            if (props.tag.twitter) {
                jsx.push(<img className="tagrow-social" src={twitter} onClick={() => window.open(props.tag.twitter, "_blank", "noreferrer")}/>)
            }
        }
        if (props.tag.type === "character") {
            if (props.tag.fandom) {
                jsx.push(<img className="tagrow-social" src={fandom} onClick={() => window.open(props.tag.fandom, "_blank", "noreferrer")}/>)
            }
        }
        if (props.tag.type === "series") {
            if (props.tag.website) {
                jsx.push(<img className="tagrow-social" src={website} onClick={() => window.open(props.tag.website, "_blank", "noreferrer")}/>)
            }
            if (props.tag.twitter) {
                jsx.push(<img className="tagrow-social" src={twitter} onClick={() => window.open(props.tag.twitter, "_blank", "noreferrer")}/>)
            }
        }
        return jsx
    }

    const getTagColor = () => {
        if (props.tag.banned) return "strikethrough"
        if (props.tag.r18) return "r18-tag-color"
        if (props.tag.type === "artist") return "artist-tag-color"
        if (props.tag.type === "character") return "character-tag-color"
        if (props.tag.type === "series") return "series-tag-color"
        if (props.tag.type === "meta") return "meta-tag-color"
        return "tag-color"
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
                        <span className={`tagrow-tag ${getTagColor()}`} onClick={tagPage} onAuxClick={tagPage} onContextMenu={tagPage}>{props.tag.tag.replaceAll("-", " ")}</span>
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
                    <span className="tagrow-desc-text" ref={scrollRef}>{props.tag.description || "No description."}</span>
                </td>
            </div>
            {session.username ?
            <div className="tag-buttons">
                {permissions.isMod(session) ? <img className="tag-button" src={categoryIcon} onClick={categorizeTagDialog}/> : null}
                <img className="tag-button" src={historyIcon} onClick={tagHistory}/>
                <img className="tag-button" src={alias} onClick={aliasTagDialog}/>
                <img className="tag-button" src={edit} onClick={editTagDialog}/>
                <img className="tag-button" src={deleteIcon} onClick={deleteTagDialog}/>
            </div> : null}
        </tr>
    )
}

export default TagRow