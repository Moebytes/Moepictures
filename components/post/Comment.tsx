/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useActiveActions, useSessionActions, 
useCommentDialogSelector, useCommentDialogActions, useCacheSelector} from "../../store"
import functions from "../../functions/Functions"
import moeText from "../../moetext/MoeText"
import favicon from "../../assets/icons/favicon.png"
import QuoteIcon from "../../assets/svg/quote.svg"
import ReportIcon from "../../assets/svg/report.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import permissions from "../../structures/Permissions"
import {UserComment} from "../../types/Types"
import "./styles/comment.less"

interface Props {
    comment: UserComment
    onDelete?: () => void
    onEdit?: () => void
    onCommentJump?: (commentID: number) => void
}

const Comment: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {emojis} = useCacheSelector()
    const {setQuoteText} = useActiveActions()
    const {deleteCommentID, deleteCommentFlag, editCommentFlag, editCommentID, editCommentText} = useCommentDialogSelector()
    const {setDeleteCommentID, setDeleteCommentFlag, setEditCommentFlag, setEditCommentID, setEditCommentText, setReportCommentID} = useCommentDialogActions()
    const navigate = useNavigate()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const defaultIcon = props.comment?.image ? false : true

    const getCommentPFP = () => {
        if (props.comment?.image) {
            return functions.link.getFolderLink("pfp", props.comment.image, props.comment.imageHash)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.comment?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(props.comment.imagePost, event, navigate, session, setSessionFlag)
    }

    const triggerQuote = () => {
        const cleanComment = functions.render.parsePieces(props.comment?.comment).filter((s: string) => !s.includes(">>>")).join(" ")
        setQuoteText(functions.multiTrim(`
            >>>[${props.comment?.commentID}] ${functions.util.toProperCase(props.comment?.username)} said:
            > ${cleanComment}
        `))
    }

    const goToComment = (commentID: string) => {
        if (!commentID) return
        props.onCommentJump?.(Number(commentID))
    }

    const deleteComment = async () => {
        await functions.http.delete("/api/comment/delete", {commentID: props.comment?.commentID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteCommentFlag && deleteCommentID === props.comment?.commentID) {
            deleteComment()
            setDeleteCommentFlag(false)
            setDeleteCommentID(null)
        }
    }, [deleteCommentFlag, session])

    const deleteCommentDialog = async () => {
        setDeleteCommentID(props.comment?.commentID)
    }

    const editComment = async () => {
        if (!editCommentText) return
        const badComment = functions.validation.validateComment(editCommentText, i18n)
        if (badComment) return
        await functions.http.put("/api/comment/edit", {commentID: props.comment?.commentID, comment: editCommentText}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (editCommentFlag && editCommentID === props.comment?.commentID) {
            editComment()
            setEditCommentFlag(false)
            setEditCommentID(null)
        }
    }, [editCommentFlag, session])

    const editCommentDialog = async () => {
        setEditCommentText(moeText.undoLinkReplacements(props.comment?.comment))
        setEditCommentID(props.comment?.commentID)
    }

    const reportCommentDialog = async () => {
        setReportCommentID(props.comment?.commentID)
    }

    const commentOptions = () => {
        if (session.username === props.comment?.username) {
            return (
                <div className="comment-options">
                    <div className="comment-options-container" onClick={editCommentDialog}>
                        <EditIcon className="comment-options-img"/>
                        <span className="comment-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="comment-options-container" onClick={deleteCommentDialog}>
                        <DeleteIcon className="comment-options-img"/>
                        <span className="comment-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="comment-options">
                    <div className="comment-options-container" onClick={triggerQuote}>
                        <QuoteIcon className="comment-options-img"/>
                        <span className="comment-options-text">{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? <>
                    <div className="comment-options-container" onClick={editCommentDialog}>
                        <EditIcon className="comment-options-img"/>
                        <span className="comment-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="comment-options-container" onClick={deleteCommentDialog}>
                        <DeleteIcon className="comment-options-img"/>
                        <span className="comment-options-text">{i18n.buttons.delete}</span>
                    </div></> : 
                    <div className="comment-options-container" onClick={reportCommentDialog}>
                        <ReportIcon className="comment-options-img"/>
                        <span className="comment-options-text">{i18n.buttons.report}</span>
                    </div>}
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.comment.username}`, "_blank")
        } else {
            navigate(`/user/${props.comment.username}`)
        }
    }

    const generateUsernameJSX = () => {
        return functions.jsx.usernameJSX(props.comment, {
            containerClass: "comment-username-container",
            textClass: "comment-user-text",
            imageClass: "comment-user-label"
        }, i18n, navigate)
    }

    const commentJump = () => {
        props.onCommentJump?.(Number(props.comment?.commentID))
    }

    return (
        <div className="comment" comment-id={props.comment?.commentID}>
            <div className="comment-container">
                <div className="comment-user-container" onClick={userClick} onAuxClick={userClick}>
                    <img className="comment-user-img" src={getCommentPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? filter : ""}}/>
                    {generateUsernameJSX()}
                </div>
            </div>
            <div className="comment-container" style={{width: "100%", marginTop: mobile && session.username ? "25px" : ""}}>
                <span className="comment-date-text" onClick={commentJump}>{functions.date.timeAgo(props.comment?.postDate, i18n)}:</span>
                {moeText.renderText(props.comment?.comment, emojis, "comment", goToComment)}
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default Comment