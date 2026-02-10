import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useActiveActions, useSessionActions, 
useFilterSelector, useCommentDialogSelector, useCommentDialogActions, useFlagActions, useCacheSelector} from "../../store"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import commentQuote from "../../assets/svg/quote.svg"
import commentReport from "../../assets/svg/report.svg"
import commentEdit from "../../assets/svg/edit.svg"
import commentDelete from "../../assets/svg/delete.svg"
import TinyImage from "../image/TinyImage"
import {CommentSearch} from "../../types/Types"
import "./styles/commentrow.less"

interface Props {
    comment: CommentSearch
    onDelete?: () => void
    onEdit?: () => void
    onCommentJump?: (commentID: number) => void
}

const CommentRow: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {emojis} = useCacheSelector()
    const {setQuoteText} = useActiveActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {deleteCommentID, deleteCommentFlag, editCommentFlag, editCommentID, editCommentText} = useCommentDialogSelector()
    const {setDeleteCommentID, setDeleteCommentFlag, setEditCommentFlag, setEditCommentID, setEditCommentText, setReportCommentID} = useCommentDialogActions()
    const {setCommentID, setCommentJumpFlag} = useFlagActions()
    const navigate = useNavigate()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})
    
    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    const defaultIcon = props.comment?.image ? false : true

    const getCommentPFP = () => {
        if (props.comment?.image) {
            return functions.link.getTagLink("pfp", props.comment.image, props.comment.imageHash)
        } else {
            return favicon
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.comment.postID}/${props.comment.post.slug}`, "_blank")
        } else {
            navigate(`/post/${props.comment.postID}/${props.comment.post.slug}`)
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.comment?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(props.comment.imagePost, event, navigate, session, setSessionFlag)
    }

    const goToComment = (commentID: string) => {
        if (!commentID) return
        props.onCommentJump?.(Number(commentID))
    }

    const triggerQuote = () => {
        navigate(`/post/${props.comment?.postID}/${props.comment.post.slug}`)
        const cleanComment = functions.render.parsePieces(props.comment?.comment).filter((s: string) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[${props.comment?.commentID}] ${functions.util.toProperCase(props.comment?.username)} said:
            > ${cleanComment}
        `))
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
        setEditCommentText(functions.jsx.undoLinkReplacements(props.comment?.comment))
        setEditCommentID(props.comment?.commentID)
    }

    const reportCommentDialog = async () => {
        setReportCommentID(props.comment?.commentID)
    }

    const commentOptions = () => {
        if (mobile) return null
        if (session.username === props.comment?.username) {
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={editCommentDialog}>
                        <img className="commentrow-options-img" src={getIcon(commentEdit)} style={{filter}}/>
                        <span className="commentrow-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteCommentDialog}>
                        <img className="commentrow-options-img" src={getIcon(commentDelete)} style={{filter}}/>
                        <span className="commentrow-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={triggerQuote}>
                        <img className="commentrow-options-img" src={getIcon(commentQuote)} style={{filter}}/>
                        <span className="commentrow-options-text">{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? <>
                    <div className="commentrow-options-container" onClick={editCommentDialog}>
                        <img className="commentrow-options-img" src={getIcon(commentEdit)} style={{filter}}/>
                        <span className="commentrow-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteCommentDialog}>
                        <img className="commentrow-options-img" src={getIcon(commentDelete)} style={{filter}}/>
                        <span className="commentrow-options-text">{i18n.buttons.delete}</span>
                    </div></> : 
                    <div className="commentrow-options-container" onClick={reportCommentDialog}>
                        <img className="commentrow-options-img" src={getIcon(commentReport)} style={{filter}}/>
                        <span className="commentrow-options-text">{i18n.buttons.report}</span>
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
            containerClass: "commentrow-username-container",
            textClass: "commentrow-user-text",
            imageClass: "commentrow-user-label"
        }, i18n, navigate)
    }

    const commentJump = () => {
        setCommentID(Number(props.comment?.commentID))
        setCommentJumpFlag(true)
        navigate(`/post/${props.comment?.postID}/${props.comment.post.slug}?comment=${props.comment?.commentID}`)
    }

    return (
        <div className="commentrow" comment-id={props.comment?.commentID}>
            <div className="commentrow-container">
                <TinyImage className="commentrow-img" post={props.comment.post} 
                onClick={imgClick} height={110} lineMultiplier={2} maxLineWidth={2}/>
            </div>
            <div className="commentrow-container-row">
                <div className="commentrow-container" style={{borderLeft: "none", borderRight: "none"}}>
                    <div className="commentrow-user-container" onClick={userClick} onAuxClick={userClick}>
                        <img className="commentrow-user-img" src={getCommentPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? filter : ""}}/>
                        {generateUsernameJSX()}
                    </div>
                </div>
                <div className="commentrow-container" style={{width: "100%"}}>
                    <span className="commentrow-date-link" onClick={commentJump}>{functions.date.timeAgo(props.comment?.postDate, i18n)}:</span>
                    {functions.jsx.renderText(props.comment?.comment, emojis, "comment", goToComment)}
                </div>
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default CommentRow