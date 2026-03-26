/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useActiveActions, useSessionActions, 
useThreadDialogSelector, useThreadDialogActions, useCacheSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import QuoteIcon from "../../assets/svg/quote.svg"
import ReportIcon from "../../assets/svg/report.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import {ForumPostSearch} from "../../types/Types"
import "./styles/commentrow.less"

interface Props {
    forumPost: ForumPostSearch
    onDelete?: () => void
    onEdit?: () => void
    onPostJump?: (id: number) => void
}

const ForumPostRow: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {emojis} = useCacheSelector()
    const {setQuoteText} = useActiveActions()
    const {deleteReplyID, deleteReplyFlag, editReplyID, editReplyFlag, editReplyContent, editReplyR18, 
    deleteThreadID, deleteThreadFlag, editThreadID, editThreadFlag, editThreadTitle, editThreadContent,
    editThreadR18} = useThreadDialogSelector()
    const {setDeleteReplyID, setDeleteReplyFlag, setEditReplyID, setEditReplyFlag, setEditReplyContent, setEditReplyR18,
    setDeleteThreadID, setDeleteThreadFlag, setEditThreadID, setEditThreadFlag, setEditThreadTitle, setEditThreadContent, 
    setEditThreadR18, setReportReplyID, setReportThreadID} = useThreadDialogActions()
    const navigate = useNavigate()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const defaultIcon = props.forumPost?.image ? false : true

    const getUserPFP = () => {
        if (props.forumPost?.image) {
            return functions.link.getTagLink("pfp", props.forumPost.image, props.forumPost.imageHash)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.forumPost?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(props.forumPost.imagePost, event, navigate, session, setSessionFlag)
    }

    const goToPost = (id: string) => {
        if (!id) return
        props.onPostJump?.(Number(id))
    }

    const triggerQuote = () => {
        if (!props.forumPost.thread) return
        navigate(`/thread/${props.forumPost.thread.threadID}`)
        const cleanComment = functions.render.parsePieces(props.forumPost?.content).filter((s: string) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[${props.forumPost?.id}] ${functions.util.toProperCase(props.forumPost?.creator)} said:
            > ${cleanComment}
        `))
    }

    const deleteThread = async () => {
        if (props.forumPost.type === "thread") {
            await functions.http.delete("/api/thread/delete", {threadID: props.forumPost.id}, session, setSessionFlag)
            navigate("/forum")
        }
    }

    const deleteReply = async () => {
        if (!props.forumPost.thread) return
        if (props.forumPost.type === "reply") {
            await functions.http.delete("/api/reply/delete", {threadID: props.forumPost.thread.threadID, replyID: props.forumPost.id}, session, setSessionFlag)
            props.onDelete?.()
        }
    }

    useEffect(() => {
        if (props.forumPost.type === "reply") {
            if (deleteReplyFlag && deleteReplyID === props.forumPost.id) {
                deleteReply()
                setDeleteReplyFlag(false)
                setDeleteReplyID(null)
            }
        } else if (props.forumPost.type === "thread") {
            if (deleteThreadFlag && deleteThreadID === props.forumPost.id) {
                deleteThread()
                setDeleteThreadFlag(false)
                setDeleteThreadID(null)
            }
        }
    }, [deleteReplyFlag, deleteReplyID, deleteThreadFlag, deleteThreadID, session])

    const deleteForumPostDialog = async () => {
        if (props.forumPost.type === "reply") {
            setDeleteReplyID(props.forumPost.id)
        } else if (props.forumPost.type === "thread") {
            setDeleteThreadID(props.forumPost.id)
        }
    }

    const editThread = async () => {
        if (props.forumPost.type === "thread") {
            const badTitle = functions.validation.validateTitle(editThreadTitle, i18n)
            if (badTitle) return
            const badContent = functions.validation.validateThread(editThreadContent, i18n)
            if (badContent) return
            await functions.http.put("/api/thread/edit", {threadID: props.forumPost.id, title: editThreadTitle, content: editThreadContent, r18: editThreadR18}, session, setSessionFlag)
            props.onEdit?.()
        }
    }

    const editReply = async () => {
        if (props.forumPost.type === "reply") {
            if (!editReplyContent) return
            const badReply = functions.validation.validateReply(editReplyContent, i18n)
            if (badReply) return
            await functions.http.put("/api/reply/edit", {replyID: props.forumPost.id, content: editReplyContent, r18: editReplyR18}, session, setSessionFlag)
            props.onEdit?.()
        }
    }

    useEffect(() => {
        if (props.forumPost.type === "reply") {
            if (editReplyFlag && editReplyID === props.forumPost.id) {
                editReply()
                setEditReplyFlag(false)
                setEditReplyID(null)
            }
        } else if (props.forumPost.type === "thread") {
            if (editThreadFlag && editThreadID === props.forumPost.id) {
                editThread()
                setEditThreadFlag(false)
                setEditReplyID(null)
            }
        }
    }, [editReplyFlag, editReplyID, editReplyContent, editReplyR18, 
        editThreadFlag, editThreadID, editThreadContent, editThreadTitle, 
        editThreadR18, session])

    const editForumPostDialog = async () => {
        if (props.forumPost.type === "reply") {
            setEditReplyContent(functions.jsx.undoLinkReplacements(props.forumPost.content))
            setEditReplyID(props.forumPost.id)
            setEditReplyR18(props.forumPost.r18 ?? false)
        } else if (props.forumPost.type === "thread") {
            setEditThreadTitle(props.forumPost.title)
            setEditThreadContent(functions.jsx.undoLinkReplacements(props.forumPost.content))
            setEditThreadID(props.forumPost.id)
            setEditThreadR18(props.forumPost.r18 ?? false)
        }
    }

    const reportForumPostDialog = async () => {
        if (props.forumPost.type === "reply") {
            setReportReplyID(props.forumPost.id)
        } else if (props.forumPost.type === "thread") {
            setReportThreadID(props.forumPost.id)
        }
    }

    const forumPostOptions = () => {
        if (mobile) return null
        if (session.username === props.forumPost?.creator) {
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={editForumPostDialog}>
                        <EditIcon className="commentrow-options-img"/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.edit}</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteForumPostDialog}>
                        <DeleteIcon className="commentrow-options-img"/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={triggerQuote}>
                        <QuoteIcon className="commentrow-options-img"/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? <>
                    <div className="commentrow-options-container" onClick={editForumPostDialog}>
                        <EditIcon className="commentrow-options-img"/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.edit}</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteForumPostDialog}>
                        <DeleteIcon className="commentrow-options-img"/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.delete}</span>
                    </div></> : 
                    <div className="commentrow-options-container" onClick={reportForumPostDialog}>
                        <ReportIcon className="commentrow-options-img"/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.report}</span>
                    </div>}
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.forumPost.creator}`, "_blank")
        } else {
            navigate(`/user/${props.forumPost.creator}`)
        }
    }

    const generateUsernameJSX = () => {
        return functions.jsx.usernameJSX({username: props.forumPost.creator, ...props.forumPost}, {
            containerClass: "commentrow-username-container",
            textClass: "commentrow-user-text",
            imageClass: "commentrow-user-label"
        }, i18n, navigate)
    }

    const titleClick = (event: React.MouseEvent) => {
        if (!props.forumPost.thread) return
        let replyID = props.forumPost.type === "reply" ? `?reply=${props.forumPost.id}` : ""
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/thread/${props.forumPost.thread.threadID}${replyID}`, "_blank")
        } else {
            navigate(`/thread/${props.forumPost.thread.threadID}${replyID}`)
        }
    }

    return (
        <div className="commentrow" post-id={props.forumPost.id}>
            <div className="commentrow-container-row">
                <div className="commentrow-container">
                    <div className="commentrow-user-container" onClick={userClick} onAuxClick={userClick} style={{justifyContent: "flex-start", paddingTop: "10px"}}>
                        <img className="commentrow-user-img" src={getUserPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? filter : ""}}/>
                        {generateUsernameJSX()}
                    </div>
                </div>
                <div className="commentrow-container" style={{width: "100%"}}>
                    <span className="commentrow-title" onClick={titleClick}>{props.forumPost.thread?.title}</span>
                    <span className="commentrow-date-text">{functions.date.timeAgo(props.forumPost?.createDate, i18n)}:</span>
                    {functions.jsx.renderText(props.forumPost?.content, emojis, "comment", goToPost)}
                </div>
            </div>
            {session.username ? forumPostOptions() : null}
        </div>
    )
}

export default ForumPostRow