import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useActiveSelector, 
useActiveActions, useFlagSelector, useFlagActions} from "../../store"
import functions from "../../functions/Functions"
import TextBox, {TextBoxRef} from "../../ui/TextBox"
import Comment from "./Comment"
import {PostSearch, PostHistory, UserComment} from "../../types/Types"
import "./styles/comments.less"

interface Props {
    post: PostSearch | PostHistory
}

const Comments: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {quoteText} = useActiveSelector()
    const {setQuoteText} = useActiveActions()
    const {commentID, commentJumpFlag} = useFlagSelector()
    const {setCommentID, setCommentJumpFlag} = useFlagActions()
    const [comments, setComments] = useState([] as UserComment[])
    const [commentFlag, setCommentFlag] = useState(false)
    const textBoxRef = useRef<TextBoxRef>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const commentParam = new URLSearchParams(window.location.search).get("comment")
        const onDOMLoaded = async () => {
            if (commentParam) {
                await functions.timeout(500)
                setCommentID(Number(commentParam))
                setCommentJumpFlag(true)
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (comments && commentID && commentJumpFlag) {
            onCommentJump(commentID)
            setCommentJumpFlag(false)
        }
    }, [comments, commentJumpFlag, commentID])

    const onCommentJump = async (commentID: number) => {
        let element = document.querySelector(`[comment-id="${commentID}"]`)
        if (!element) {
            await functions.timeout(1000)
            element = document.querySelector(`[comment-id="${commentID}"]`)
        }
        if (!element) return
        const position = element.getBoundingClientRect()
        const elementTop = position.top + window.scrollY
        window.scrollTo(0, elementTop - (window.innerHeight / 3))
        setCommentID(commentID)
    }

    useEffect(() => {
        if (commentID) navigate(`${location.pathname}?comment=${commentID}`, {replace: true})
    }, [commentID])

    const updateComments = async () => {
        const comments = await functions.http.get("/api/post/comments", {postID: props.post.postID}, session, setSessionFlag)
        setComments(comments || [])
    }

    useEffect(() => {
        updateComments()
    }, [session, props.post])

    useEffect(() => {
        if (commentFlag) {
            setCommentFlag(false)
            updateComments()
        }
    }, [commentFlag, session])

    useEffect(() => {
        if (quoteText) {
            const text = textBoxRef.current?.getText() ?? ""
            const prevText = text.trim() ? `${text.trim()}\n` : ""
            textBoxRef.current?.updateText(`${prevText}${quoteText.trim()}`)
            setQuoteText("") 
            let element = document.querySelector(".textbox-textarea")
            if (!element) return
            const position = element.getBoundingClientRect()
            const elementTop = position.top + window.scrollY
            window.scrollTo(0, elementTop - (window.innerHeight / 3))
        }
    }, [quoteText])

    const post = async () => {
        const text = textBoxRef.current?.getText() ?? ""
        const badComment = functions.validation.validateComment(text, i18n)
        if (badComment) {
            textBoxRef.current?.showError(badComment)
            await functions.timeout(2000)
            textBoxRef.current?.clearError()
            return
        }
        textBoxRef.current?.showError(i18n.buttons.submitting)
        try {
            await functions.http.post("/api/comment/create", {postID: props.post.postID, comment: text}, session, setSessionFlag)
            textBoxRef.current?.showError(i18n.errors.comment.added)
            setCommentFlag(true)
            textBoxRef.current?.updateText("")
            await functions.timeout(2000)
            textBoxRef.current?.clearError()
        } catch {
            textBoxRef.current?.showError(i18n.errors.comment.bad)
            await functions.timeout(2000)
            textBoxRef.current?.clearError()
        }
    }

    const generateCommentsJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < comments.length; i++) {
            jsx.push(<Comment key={comments[i].commentID} comment={comments[i]} onDelete={updateComments} onEdit={updateComments} onCommentJump={onCommentJump}/>)
        }
        return jsx
    }

    return (
        <div className="comments">
            <div className="comments-title">{i18n.navbar.comments}</div>
            {comments.length ? generateCommentsJSX() :
            <div className="comments-text">{i18n.post.noComments}</div>}
            <TextBox ref={textBoxRef} type="comment" onPost={post}/>
        </div>
    )
}

export default Comments