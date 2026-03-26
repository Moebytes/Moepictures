/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useThreadDialogActions, 
useCacheSelector, useActiveActions, useThreadDialogSelector, useInteractionActions,
useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import favicon from "../../assets/icons/favicon.png"
import QuoteIcon from "../../assets/svg/quote.svg"
import ReportIcon from "../../assets/svg/report.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import permissions from "../../structures/Permissions"
import {ThreadUser, ThreadReply} from "../../types/Types"
import "./styles/reply.less"

interface Props {
    thread: ThreadUser
    reply: ThreadReply
    onDelete?: () => void
    onEdit?: () => void
    onReplyJump?: (replyID: number) => void
}

const Reply: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setQuoteText} = useActiveActions()
    const {setThreadSearchFlag} = useFlagActions()
    const {deleteReplyID, deleteReplyFlag, editReplyFlag, editReplyID, editReplyContent, editReplyR18} = useThreadDialogSelector()
    const {setDeleteReplyID, setDeleteReplyFlag, setEditReplyFlag, setEditReplyID, setEditReplyContent, setEditReplyR18, setReportReplyID} = useThreadDialogActions()
    const {emojis} = useCacheSelector()
    const navigate = useNavigate()

    const defaultIcon = props.reply.image ? false : true

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getReplyPFP = () => {
        if (props.reply.image) {
            return functions.link.getFolderLink("pfp", props.reply.image, props.reply.imageHash)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.reply.imagePost) return
        event.stopPropagation()
        functions.post.openPost(props.reply.imagePost, event, navigate, session, setSessionFlag)
    }

    const triggerQuote = () => {
        const cleanReply = functions.render.parsePieces(props.reply.content).filter((s: string) => !s.includes(">>>")).join(" ")
        setQuoteText(functions.multiTrim(`
            >>>[${props.reply.replyID}] ${functions.util.toProperCase(props.reply.creator)} said:
            > ${cleanReply}
        `))
    }

    const goToReply = (replyID: string) => {
        if (!replyID) return
        props.onReplyJump?.(Number(replyID))
    }

    const deleteReply = async () => {
        await functions.http.delete("/api/reply/delete", {threadID: props.reply.threadID, replyID: props.reply.replyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteReplyFlag && deleteReplyID === props.reply.replyID) {
            deleteReply()
            setDeleteReplyFlag(false)
            setDeleteReplyID(null)
        }
    }, [deleteReplyFlag, deleteReplyID, session])

    const deleteReplyDialog = async () => {
        setDeleteReplyID(props.reply.replyID)
    }

    const editReply = async () => {
        if (!editReplyContent) return
        const badReply = functions.validation.validateReply(editReplyContent, i18n)
        if (badReply) return
        await functions.http.put("/api/reply/edit", {replyID: props.reply.replyID, content: editReplyContent, r18: editReplyR18}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (editReplyFlag && editReplyID === props.reply.replyID) {
            editReply()
            setEditReplyFlag(false)
            setEditReplyID(null)
        }
    }, [editReplyFlag, editReplyID, editReplyContent, editReplyR18, session])

    const editReplyDialog = async () => {
        setEditReplyContent(functions.jsx.undoLinkReplacements(props.reply.content))
        setEditReplyID(props.reply.replyID)
        setEditReplyR18(props.reply.r18)
    }

    const reportReplyDialog = async () => {
        setReportReplyID(props.reply.replyID)
    }

    const replyOptions = () => {
        if (session.username === props.reply.creator) {
            return (
                <div className="reply-options">
                    <div className="reply-options-container" onClick={editReplyDialog}>
                        <EditIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <DeleteIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="reply-options">
                    <div className="reply-options-container" onClick={triggerQuote}>
                        <QuoteIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? <>
                    <div className="reply-options-container" onClick={editReplyDialog}>
                        <EditIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <DeleteIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.delete}</span>
                    </div></> : 
                    <div className="reply-options-container" onClick={reportReplyDialog}>
                        <ReportIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.report}</span>
                    </div>}
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.reply.creator}`, "_blank")
        } else {
            navigate(`/user/${props.reply.creator}`)
        }
    }

    const generateUsernameJSX = () => {
        return functions.jsx.usernameJSX({username: props.reply.creator, ...props.reply}, {
            containerClass: "reply-username-container",
            textClass: "reply-user-text",
            imageClass: "reply-user-label"
        }, i18n, navigate)
    }

    const getBGColor = () => {
        if (!props.thread) return ""
        if (props.reply.r18) {
            return props.thread.r18 ? "" : "var(--r18BGColor)"
        } else {
            return props.thread.r18 ? "var(--background)" : ""
        }
    }

    const viewThreads = () => {
        navigate(`/posts/${props.reply.creator}`)
        //navigate("/forum")
        //setThreadSearchFlag(`threads:${props.reply.creator}`)
    }

    return (
        <div className="reply" reply-id={props.reply.replyID} style={{backgroundColor: props.reply.r18 ? "var(--r18BGColor)" : ""}}>
            <div className="reply-container">
                <div className="reply-user-container">
                    {generateUsernameJSX()}
                    <span className="reply-date-text">{functions.date.timeAgo(props.reply.createDate, i18n)}</span>
                    <img className="reply-user-img" src={getReplyPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? filter : ""}}/>
                    <span className="reply-mini-link" onClick={viewThreads}>{props.reply.postCount} {Number(props.reply.postCount) === 1 ? i18n.buttons.post : i18n.sort.posts}</span>
                    <span className="reply-mini-text">{i18n.labels.joined} {functions.date.prettyDate(props.reply.joinDate, i18n, true)}</span>
                </div>
            </div>
            <div className="reply-text-container" onMouseEnter={() => setEnableDrag(false)}>
                {session.username && !mobile ? replyOptions() : null}
                {functions.jsx.renderText(props.reply.content, emojis, "reply", goToReply, props.reply.r18)}
            </div>
            {session.username && mobile ? replyOptions() : null}
        </div>
    )
}

export default Reply