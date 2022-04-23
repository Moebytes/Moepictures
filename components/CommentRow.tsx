import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import commentQuote from "../assets/purple/commentquote.png"
import commentReport from "../assets/purple/commentreport.png"
import commentEdit from "../assets/purple/commentedit.png"
import commentDelete from "../assets/purple/commentdelete.png"
import "./styles/commentrow.less"
import axios from "axios"

interface Props {
    comment: any
    onDelete?: () => void
}

const CommentRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {session, setSession} = useContext(SessionContext)
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

    const imgClick = () => {
        history.push(`/post/${props.comment.postID}`)
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
        await axios.delete("/api/comment", {params: {commentID: props.comment.commentID}, withCredentials: true})
        props.onDelete?.()
    }

    const commentOptions = () => {
        if (session.username === props.comment.username) {
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container">
                        <img className="commentrow-options-img" src={commentEdit}/>
                        <span className="commentrow-options-text">Edit</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteComment}>
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
                    <div className="commentrow-options-container">
                        <img className="commentrow-options-img" src={commentReport}/>
                        <span className="commentrow-options-text">Report</span>
                    </div>
                </div>
            )
        }
    }

    return (
        <div className="commentrow" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
            <div className="commentrow-container">
                {functions.isVideo(img) ? 
                <video className="commentrow-img" src={img} onClick={imgClick}></video> :
                <img className="commentrow-img" src={img} onClick={imgClick}/>}
            </div>
            <div className="commentrow-container">
                <div className="commentrow-user-container">
                    <img className="commentrow-user-img" src={getCommentPFP()}/>
                    <span className="commentrow-user-text">{functions.toProperCase(props.comment.username)}</span>
                </div>
            </div>
            <div className="commentrow-container" style={{width: "100%"}}>
                <span className="commentrow-date-text">{functions.timeAgo(props.comment.posted)}:</span>
                {parseText()}
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default CommentRow