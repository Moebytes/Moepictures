import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, DeleteCommentIDContext, DeleteCommentFlagContext, MobileContext,
EditCommentFlagContext, EditCommentIDContext, EditCommentTextContext, ReportCommentIDContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import commentQuote from "../assets/purple/commentquote.png"
import commentReport from "../assets/purple/commentreport.png"
import commentEdit from "../assets/purple/commentedit.png"
import commentDelete from "../assets/purple/commentdelete.png"
import adminCrown from "../assets/purple/admin-crown.png"
import modCrown from "../assets/purple/mod-crown.png"
import "./styles/commentrow.less"
import axios from "axios"

interface Props {
    comment: any
    onDelete?: () => void
    onEdit?: () => void
}

const CommentRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {deleteCommentID, setDeleteCommentID} = useContext(DeleteCommentIDContext)
    const {deleteCommentFlag, setDeleteCommentFlag} = useContext(DeleteCommentFlagContext)
    const {editCommentFlag, setEditCommentFlag} = useContext(EditCommentFlagContext)
    const {editCommentID, setEditCommentID} = useContext(EditCommentIDContext)
    const {editCommentText, setEditCommentText} = useContext(EditCommentTextContext)
    const {reportCommentID, setReportCommentID} = useContext(ReportCommentIDContext)
    const [hover, setHover] = useState(false)
    const history = useHistory()
    const img = functions.getImageLink(props.comment.post.images[0].type, props.comment.postID, props.comment.post.images[0].filename)
    const comment = props.comment.comment

    const getFavicon = () => {
        if (theme.includes("magenta")) return faviconMagenta 
        return favicon
    }

    const getCommentPFP = () => {
        if (props.comment.image) {
            return functions.getTagLink("pfp", props.comment.image)
        } else {
            return getFavicon()
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.comment.postID}`, "_blank")
        } else {
            history.push(`/post/${props.comment.postID}`)
        }
    }

    const parseText = () => {
        const pieces = functions.parseComment(comment)
        let jsx = [] as any
        for (let i = 0; i < pieces.length; i++) {
            const piece = pieces[i]
            if (piece.includes(">")) {
                const userPart = piece.match(/(>>>)(.*?)(?=$|>)/gm)?.[0].replace(">>>", "") ?? ""
                let username = ""
                let said = ""
                if (userPart) {
                    username = functions.toProperCase(userPart.split(/ +/g)[0])
                    said = userPart.split(/ +/g).slice(1).join(" ")
                }
                const text = piece.replace(userPart, "").replaceAll(">", "")
                jsx.push(
                    <div className="commentrow-quote-container">
                        {userPart ? <span className="commentrow-quote-user">{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className="commentrow-quote-text">{text.trim()}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="commentrow-text">{piece.trim()}</span>)
            }
        }
        return jsx
    }

    const triggerQuote = () => {
        history.push(`/post/${props.comment.postID}`)
        const cleanComment = functions.parseComment(props.comment.comment).filter((s: any) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>> ${functions.toProperCase(props.comment.username)} said:
            > ${cleanComment}
        `))
    }

    const deleteComment = async () => {
        await axios.delete("/api/comment/delete", {params: {commentID: props.comment.commentID}, withCredentials: true})
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
        await axios.put("/api/comment/edit", {commentID: props.comment.commentID, comment: editCommentText}, {withCredentials: true})
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
        if (mobile) return null
        if (session.username === props.comment.username) {
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={editCommentDialog}>
                        <img className="commentrow-options-img" src={commentEdit}/>
                        <span className="commentrow-options-text">Edit</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteCommentDialog}>
                        <img className="commentrow-options-img" src={commentDelete}/>
                        <span className="commentrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={triggerQuote}>
                        <img className="commentrow-options-img" src={commentQuote}/>
                        <span className="commentrow-options-text">Quote</span>
                    </div>
                    <div className="commentrow-options-container" onClick={reportCommentDialog}>
                        <img className="commentrow-options-img" src={commentReport}/>
                        <span className="commentrow-options-text">Report</span>
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
                <div className="commentrow-username-container">
                    <span className="commentrow-user-text admin-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (props.comment.role === "mod") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text mod-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="commentrow-user-text">{functions.toProperCase(props.comment.username)}</span>
    }

    return (
        <div className="commentrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="commentrow-container">
                {functions.isVideo(img) ? 
                <video className="commentrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}></video> :
                <img className="commentrow-img" src={img} onClick={imgClick}/>}
            </div>
            <div className="commentrow-container">
                <div className="commentrow-user-container" onClick={userClick} onAuxClick={userClick}>
                    <img className="commentrow-user-img" src={getCommentPFP()}/>
                    {generateUsernameJSX()}
                </div>
            </div>
            <div className="commentrow-container" style={{width: "100%"}}>
                <span className="commentrow-date-text">{functions.timeAgo(props.comment.postDate)}:</span>
                {parseText()}
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default CommentRow