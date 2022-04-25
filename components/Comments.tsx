import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext, SessionContext, QuoteTextContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import Comment from "./Comment"
import axios from "axios"
import "./styles/comments.less"

interface Props {
    post: any
}

const Comments: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const [text, setText] = useState("")
    const [error, setError] = useState(false)
    const [comments, setComments] = useState([]) as any
    const [commentFlag, setCommentFlag] = useState(false)
    const errorRef = useRef(null) as any

    const updateComments = async () => {
        const comments = await axios.get("/api/comments", {params: {postID: props.post.postID}, withCredentials: true}).then((r) => r.data)
        setComments(comments)
    }

    useEffect(() => {
        updateComments()
    }, [])

    useEffect(() => {
        updateComments()
    }, [props.post])

    useEffect(() => {
        if (commentFlag) {
            setCommentFlag(false)
            updateComments()
        }
    }, [commentFlag])

    useEffect(() => {
        if (quoteText) {
            const prevText = text.trim() ? `${text.trim()}\n` : ""
            setText(`${prevText}${quoteText.trim()}`)
            setQuoteText(null)
            window.scrollTo(0, document.body.scrollHeight)
        }
    }, [quoteText])

    const post = async () => {
        if (!text) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "No comment provided."
            await functions.timeout(2000)
            setError(false)
            return
        }
        const badComment = functions.validateComment(text)
        if (badComment) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badComment
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/comment", {postID: props.post.postID, comment: text}, {withCredentials: true})
            errorRef.current!.innerText = "Comment added."
            setCommentFlag(true)
            setText("")
            await functions.timeout(2000)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad comment."
            await functions.timeout(2000)
            setError(false)
        }
    }

    const generateCommentsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < comments.length; i++) {
            jsx.push(<Comment comment={comments[i]} onDelete={updateComments}/>)
        }
        return jsx
    }

    const keyDown = (event: any) => {
        event.stopPropagation()
    }

    return (
        <div className="comments">
            <div className="comments-title">Comments</div>
            {comments.length ? generateCommentsJSX() :
            <div className="comments-text">There are no comments.</div>}
            {session.username ?
            <div className="comments-input-container">
                <div className="comments-row-start" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <textarea className="comments-textarea" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={keyDown}></textarea>
                </div>
                {error ? <div className="comments-validation-container"><span className="comments-validation" ref={errorRef}></span></div> : null}
                <div className="comments-button-container-left">
                    <button className="comments-button" onClick={post}>Post</button>
                </div>
            </div> : null}
        </div>
    )
}

export default Comments