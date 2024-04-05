import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, DeleteCommentIDContext, DeleteCommentFlagContext,
EditCommentIDContext, EditCommentFlagContext, EditCommentTextContext, ReportCommentIDContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import favicon from "../assets/icons/favicon.png"
import commentQuote from "../assets/icons/commentquote.png"
import commentReport from "../assets/icons/commentreport.png"
import commentEdit from "../assets/icons/commentedit.png"
import commentDelete from "../assets/icons/commentdelete.png"
import DeleteCommentDialog from "../dialogs/DeleteCommentDialog"
import permissions from "../structures/Permissions"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import "./styles/comment.less"
import axios from "axios"

interface Props {
    comment: any
    onDelete?: () => void
    onEdit?: () => void
    onCommentJump?: (commentID: number) => void
}

const Comment: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {deleteCommentID, setDeleteCommentID} = useContext(DeleteCommentIDContext)
    const {deleteCommentFlag, setDeleteCommentFlag} = useContext(DeleteCommentFlagContext)
    const {editCommentFlag, setEditCommentFlag} = useContext(EditCommentFlagContext)
    const {editCommentID, setEditCommentID} = useContext(EditCommentIDContext)
    const {editCommentText, setEditCommentText} = useContext(EditCommentTextContext)
    const {reportCommentID, setReportCommentID} = useContext(ReportCommentIDContext)
    const history = useHistory()
    const comment = props.comment.comment

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const defaultIcon = props.comment.image ? false : true

    const getCommentPFP = () => {
        if (props.comment.image) {
            return functions.getTagLink("pfp", props.comment.image)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.comment.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.comment.imagePost}`, "_blank")
        } else {
            history.push(`/post/${props.comment.imagePost}`)
        }
    }

    const triggerQuote = () => {
        const cleanComment = functions.parseComment(props.comment.comment).filter((s: any) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[${props.comment.commentID}] ${functions.toProperCase(props.comment.username)} said:
            > ${cleanComment}
        `))
    }

    const goToComment = (commentID: string) => {
        if (!commentID) return
        props.onCommentJump?.(Number(commentID))
    }

    const parseText = () => {
        const pieces = functions.parseComment(comment)
        let jsx = [] as any
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.includes(">")) {
                const matchPart = piece.match(/(>>>(\[\d+\])?)(.*?)(?=$|>)/gm)?.[0] ?? ""
                const userPart = matchPart.replace(/(>>>(\[\d+\])?\s*)/, "")
                const id = matchPart.match(/(?<=\[)\d+(?=\])/)?.[0] ?? ""
                let username = ""
                let said = ""
                if (userPart) {
                    username = functions.toProperCase(userPart.split(/ +/g)[0])
                    said = userPart.split(/ +/g).slice(1).join(" ")
                }
                const text = piece.replace(matchPart.replace(">>>", ""), "").replaceAll(">", "")
                jsx.push(
                    <div className="comment-quote-container">
                        {userPart ? <span className="comment-quote-user" onClick={() => goToComment(id)}>{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className="comment-quote-text">{text.trim()}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="comment-text">{piece.trim()}</span>)
            }
        }
        return jsx
    }

    const deleteComment = async () => {
        await axios.delete("/api/comment/delete", {params: {commentID: props.comment.commentID}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteCommentFlag && deleteCommentID === props.comment.commentID) {
            deleteComment()
            setDeleteCommentFlag(false)
            setDeleteCommentID(null)
        }
    }, [deleteCommentFlag])

    const deleteCommentDialog = async () => {
        setDeleteCommentID(props.comment.commentID)
    }

    const editComment = async () => {
        if (!editCommentText) return
        const badComment = functions.validateComment(editCommentText)
        if (badComment) return
        await axios.put("/api/comment/edit", {commentID: props.comment.commentID, comment: editCommentText}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        props.onEdit?.()
    }

    useEffect(() => {
        if (editCommentFlag && editCommentID === props.comment.commentID) {
            editComment()
            setEditCommentFlag(false)
            setEditCommentID(null)
        }
    }, [editCommentFlag])

    const editCommentDialog = async () => {
        setEditCommentText(comment)
        setEditCommentID(props.comment.commentID)
    }

    const reportCommentDialog = async () => {
        setReportCommentID(props.comment.commentID)
    }

    const commentOptions = () => {
        if (session.username === props.comment.username) {
            return (
                <div className="comment-options">
                    <div className="comment-options-container" onClick={editCommentDialog}>
                        <img className="comment-options-img" src={commentEdit}/>
                        <span className="comment-options-text">Edit</span>
                    </div>
                    <div className="comment-options-container" onClick={deleteCommentDialog}>
                        <img className="comment-options-img" src={commentDelete}/>
                        <span className="comment-options-text">Delete</span>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="comment-options">
                    <div className="comment-options-container" onClick={triggerQuote}>
                        <img className="comment-options-img" src={commentQuote}/>
                        <span className="comment-options-text">Quote</span>
                    </div>
                    <div className="comment-options-container" onClick={reportCommentDialog}>
                        <img className="comment-options-img" src={commentReport}/>
                        <span className="comment-options-text">Report</span>
                    </div>
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.comment.username}`, "_blank")
        } else {
            history.push(`/user/${props.comment.username}`)
        }
    }

    const generateUsernameJSX = () => {
        if (props.comment.role === "admin") {
            return (
                <div className="comment-username-container">
                    <span className="comment-user-text admin-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={adminCrown}/>
                </div>
            )
        } else if (props.comment.role === "mod") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text mod-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="comment-user-text">{functions.toProperCase(props.comment.username)}</span>
    }

    return (
        <div className="comment" comment-id={props.comment.commentID}>
            <div className="comment-container">
                <div className="comment-user-container" onClick={userClick} onAuxClick={userClick}>
                    <img className="comment-user-img" src={getCommentPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                    {generateUsernameJSX()}
                </div>
            </div>
            <div className="comment-container" style={{width: "100%"}}>
                <span className="comment-date-text">{functions.timeAgo(props.comment.postDate)}:</span>
                {parseText()}
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default Comment