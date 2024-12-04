import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useActiveActions, useSessionActions, 
useCommentDialogSelector, useCommentDialogActions, useCacheSelector} from "../store"
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
import systemCrown from "../assets/icons/system-crown.png"
import premiumCuratorStar from "../assets/icons/premium-curator-star.png"
import curatorStar from "../assets/icons/curator-star.png"
import premiumContributorPencil from "../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../assets/icons/contributor-pencil.png"
import premiumStar from "../assets/icons/premium-star.png"
import jsxFunctions from "../structures/JSXFunctions"
import "./styles/comment.less"

interface Props {
    comment: any
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
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const defaultIcon = props.comment?.image ? false : true

    const getCommentPFP = () => {
        if (props.comment?.image) {
            return functions.getTagLink("pfp", props.comment.image, props.comment.imageHash)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.comment?.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.comment.imagePost}`, "_blank")
        } else {
            history.push(`/post/${props.comment.imagePost}`)
        }
    }

    const triggerQuote = () => {
        const cleanComment = functions.parseComment(props.comment?.comment).filter((s: any) => !s.includes(">>>")).join(" ")
        setQuoteText(functions.multiTrim(`
            >>>[${props.comment?.commentID}] ${functions.toProperCase(props.comment?.username)} said:
            > ${cleanComment}
        `))
    }

    const goToComment = (commentID: string) => {
        if (!commentID) return
        props.onCommentJump?.(Number(commentID))
    }

    const parseText = () => {
        const pieces = functions.parseComment(props.comment?.comment)
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
                        <span className="comment-quote-text">{jsxFunctions.renderCommentText(text.trim(), emojis)}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="comment-text">{jsxFunctions.renderCommentText(piece.trim(), emojis)}</span>)
            }
        }
        return jsx
    }

    const deleteComment = async () => {
        await functions.delete("/api/comment/delete", {commentID: props.comment?.commentID}, session, setSessionFlag)
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
        const badComment = functions.validateComment(editCommentText, i18n)
        if (badComment) return
        await functions.put("/api/comment/edit", {commentID: props.comment?.commentID, comment: editCommentText}, session, setSessionFlag)
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
        setEditCommentText(props.comment?.comment)
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
                        <img className="comment-options-img" src={commentEdit}/>
                        <span className="comment-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="comment-options-container" onClick={deleteCommentDialog}>
                        <img className="comment-options-img" src={commentDelete}/>
                        <span className="comment-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="comment-options">
                    <div className="comment-options-container" onClick={triggerQuote}>
                        <img className="comment-options-img" src={commentQuote}/>
                        <span className="comment-options-text">{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? 
                    <div className="comment-options-container" onClick={deleteCommentDialog}>
                        <img className="comment-options-img" src={commentDelete}/>
                        <span className="comment-options-text">{i18n.buttons.delete}</span>
                    </div> : 
                    <div className="comment-options-container" onClick={reportCommentDialog}>
                        <img className="comment-options-img" src={commentReport}/>
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
            history.push(`/user/${props.comment.username}`)
        }
    }

    const generateUsernameJSX = () => {
        if (props.comment?.role === "admin") {
            return (
                <div className="comment-username-container">
                    <span className="comment-user-text admin-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={adminCrown}/>
                </div>
            )
        } else if (props.comment?.role === "mod") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text mod-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={modCrown}/>
                </div>
            )
        } else if (props.comment?.role === "system") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text system-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={systemCrown}/>
                </div>
            )
        } else if (props.comment?.role === "premium-curator") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text curator-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (props.comment?.role === "curator") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text curator-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={curatorStar}/>
                </div>
            )
        } else if (props.comment?.role === "premium-contributor") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text premium-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (props.comment?.role === "contributor") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text contributor-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (props.comment?.role === "premium") {
            return (
                <div className="comment-username-container">
                <span className="comment-user-text premium-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="comment-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className={`comment-user-text ${props.comment?.banned ? "banned" : ""}`}>{functions.toProperCase(props.comment?.username) || i18n.user.deleted}</span>
    }

    const commentJump = () => {
        props.onCommentJump?.(Number(props.comment?.commentID))
    }

    return (
        <div className="comment" comment-id={props.comment?.commentID}>
            <div className="comment-container">
                <div className="comment-user-container" onClick={userClick} onAuxClick={userClick}>
                    <img className="comment-user-img" src={getCommentPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                    {generateUsernameJSX()}
                </div>
            </div>
            <div className="comment-container" style={{width: "100%"}}>
                <span className="comment-date-text" onClick={commentJump}>{functions.timeAgo(props.comment?.postDate, i18n)}:</span>
                {parseText()}
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default Comment