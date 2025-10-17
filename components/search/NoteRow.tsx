import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useSessionActions, useFilterSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import noteHistory from "../../assets/icons/history.png"
import TinyImage from "../image/TinyImage"
import "./styles/commentrow.less"
import {NoteSearch} from "../../types/Types"

interface Props {
    note: NoteSearch
    onDelete?: () => void
    onEdit?: () => void
}

const NoteRow: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const defaultIcon = props.note?.image ? false : true

    const getNotePFP = () => {
        if (props.note?.image) {
            return functions.link.getTagLink("pfp", props.note.image, props.note.imageHash)
        } else {
            return favicon
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.note.postID}/${props.note.post.slug}?order=${props.note.order}`, "_blank")
        } else {
            navigate(`/post/${props.note.postID}/${props.note.post.slug}?order=${props.note.order}`)
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.note?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(props.note.imagePost, event, navigate, session, setSessionFlag)
    }

    const parseText = () => {
        let jsx = [] as React.ReactElement[]
        if (!props.note.notes?.length) {
            return <span key={0} className="commentrow-text">No data</span>
        }
        for (let i = 0; i < props.note.notes.length; i++) {
            const item = props.note.notes[i]
            if (item.character) {
                jsx.push(<span key={i} className="commentrow-text">{`${i18n.tag.character} -> ${item.characterTag}`}</span>)
            } else {
                jsx.push(<span key={i} className="commentrow-text">{`${item.transcript || "N/A"} -> ${item.translation || "N/A"}`}</span>)
            }
        }
        return jsx
    }

    const showHistory = () => {
        navigate(`/note/history/${props.note.postID}/${props.note.post.slug}/${props.note.order || 1}`)
    }

    const commentOptions = () => {
        if (mobile) return null
        if (session.banned) return null
        return (
            <div className="commentrow-options">
                <div className="commentrow-options-container" onClick={showHistory}>
                    <img className="commentrow-options-img" src={noteHistory}/>
                    <span className="commentrow-options-text">{i18n.sidebar.history}</span>
                </div>
            </div>
        )
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.note.updater}`, "_blank")
        } else {
            navigate(`/user/${props.note.updater}`)
        }
    }

    const generateUsernameJSX = () => {
        return functions.jsx.usernameJSX({username: props.note.updater, ...props.note}, {
            containerClass: "commentrow-username-container",
            textClass: "commentrow-user-text",
            imageClass: "commentrow-user-label"
        }, i18n, navigate)
    }

    return (
        <div className="commentrow" note-id={props.note?.noteID}>
            <div className="commentrow-container" style={{justifyContent: "center"}}>
                <TinyImage className="commentrow-img" post={props.note.post} order={props.note.order}
                onClick={imgClick} height={110} lineMultiplier={2} maxLineWidth={2}/>
            </div>
            <div className="commentrow-container-row">
                <div className="commentrow-container">
                    <div className="commentrow-user-container" onClick={userClick} onAuxClick={userClick}>
                        <img className="commentrow-user-img" src={getNotePFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        {generateUsernameJSX()}
                    </div>
                </div>
                <div className="commentrow-container" style={{width: "100%"}}>
                    <span className="commentrow-date-text" onClick={imgClick}>{functions.date.timeAgo(props.note?.updatedDate, i18n)}:</span>
                    {parseText()}
                </div>
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default NoteRow