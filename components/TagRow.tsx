import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useLayoutActions, useActiveActions, useFlagActions, 
useLayoutSelector, useFlagSelector, useCacheActions, useInteractionActions, useSearchActions, useTagDialogActions,
useTagDialogSelector, useSearchSelector} from "../store"
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
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {tagFlag} = useFlagSelector()
    const {setTagFlag} = useFlagActions()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {editTagObj, editTagFlag, deleteTagID, deleteTagFlag, aliasTagID, aliasTagFlag, aliasTagName} = useTagDialogSelector()
    const {setEditTagObj, setEditTagFlag, setDeleteTagID, setDeleteTagFlag, setCategorizeTag, setAliasTagID, setAliasTagFlag, setAliasTagName} = useTagDialogActions()
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
        if (tagFlag === props.tag.tag) {
            props.onEdit?.()
            setTagFlag(false)
        }
    }, [tagFlag, session])

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
        if (editTagObj.image) {
            if (editTagObj.image === "delete") {
                image = ["delete"]
            } else {
                const arrayBuffer = await fetch(editTagObj.image).then((r) => r.arrayBuffer())
                const bytes = new Uint8Array(arrayBuffer)
                image = Object.values(bytes)
            }
        }
        try {
            await functions.put("/api/tag/edit", {tag: props.tag.tag, key: editTagObj.key, description: editTagObj.description,
            image, aliases: editTagObj.aliases, implications: editTagObj.implications, pixivTags: editTagObj.pixivTags, social: editTagObj.social, twitter: editTagObj.twitter,
            website: editTagObj.website, fandom: editTagObj.fandom, r18: editTagObj.r18, reason: editTagObj.reason}, session, setSessionFlag)
            props.onEdit?.()
        } catch (err: any) {
            if (err.response?.data.includes("No permission to edit implications")) {
                await functions.post("/api/tag/edit/request", {tag: editTagObj.tag, key: editTagObj.key, description: editTagObj.description, image, aliases: editTagObj.aliases, 
                implications: editTagObj.implications, pixivTags: editTagObj.pixivTags, social: editTagObj.social, twitter: editTagObj.twitter, website: editTagObj.website, fandom: editTagObj.fandom, 
                r18: editTagObj.r18, reason: editTagObj.reason}, session, setSessionFlag)
                setEditTagObj({tag: props.tag.tag, failed: "implication"})
            } else {
                setEditTagObj({tag: props.tag.tag, failed: true})
            }
        }
    }

    useEffect(() => {
        if (editTagFlag && editTagObj?.tag === props.tag.tag) {
            editTag()
            setEditTagFlag(false)
            setEditTagObj(null)
        }
    }, [editTagFlag, session])

    const editTagDialog = async () => {
        setEditTagObj({
            failed: false,
            tag: props.tag.tag,
            key: props.tag.tag,
            description: props.tag.description,
            image: props.tag.image ? functions.getTagLink(props.tag.type, props.tag.image, props.tag.imageHash) : null,
            aliases: props.tag.aliases?.[0] ? props.tag.aliases.map((a: any) => a.alias) : [],
            implications: props.tag.implications?.[0] ? props.tag.implications.map((i: any) => i.implication) : [],
            pixivTags: props.tag.pixivTags?.[0] ? props.tag.pixivTags : [],
            type: props.tag.type,
            social: props.tag.social,
            twitter: props.tag.twitter,
            website: props.tag.website,
            fandom: props.tag.fandom,
            r18: props.tag.r18,
            reason: ""
        })
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

    return (
        <tr className="tagrow">
            {props.tag.image ?
            <td className="tagrow-img-container">
                <img className="tagrow-img" src={functions.getTagLink(props.tag.type, props.tag.image, props.tag.imageHash)}/>
            </td> : null}
            <div className="tagrow-content-container">
                <td className="tagrow-container" style={{width: props.tag.image ? "16%" : "25%"}}>
                    <div className="tagrow-row">
                        <span className={`tagrow-tag ${functions.getTagColor(props.tag)}`} onClick={tagPage} onAuxClick={tagPage} onContextMenu={tagPage}>{props.tag.tag.replaceAll("-", " ")}</span>
                        {socialJSX()}
                        <span className="tagrow-tag-count">{props.tag.postCount}</span>
                    </div>
                    {props.tag.aliases?.[0] ?
                    <div className="tagrow-column">
                        <span className="tagrow-alias-header">{i18n.sort.aliases}: </span>
                        {generateAliasesJSX()}
                    </div> : null}
                    {props.tag.implications?.[0] ?
                    <div className="tagrow-column">
                        <span className="tagrow-alias-header">{i18n.labels.implies}: </span>
                        {generateImplicationsJSX()}
                    </div> : null}
                </td>
                <td className="tagrow-description">
                    <span className="tagrow-desc-text" ref={scrollRef}>{props.tag.description || i18n.labels.none}</span>
                </td>
            </div>
            {session.username ?
            <div className="tag-buttons">
                <img className="tag-button" src={categoryIcon} onClick={categorizeTagDialog}/>
                <img className="tag-button" src={historyIcon} onClick={tagHistory}/>
                <img className="tag-button" src={alias} onClick={aliasTagDialog}/>
                <img className="tag-button" src={edit} onClick={editTagDialog}/>
                <img className="tag-button" src={deleteIcon} onClick={deleteTagDialog}/>
            </div> : null}
        </tr>
    )
}

export default TagRow