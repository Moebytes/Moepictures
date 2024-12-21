import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useActiveActions, useSessionActions, 
useFilterSelector, useCommentDialogSelector, useCommentDialogActions, useFlagActions, useCacheSelector} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import favicon from "../assets/icons/favicon.png"
import commentQuote from "../assets/icons/commentquote.png"
import commentReport from "../assets/icons/commentreport.png"
import commentEdit from "../assets/icons/commentedit.png"
import commentDelete from "../assets/icons/commentdelete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import premiumCuratorStar from "../assets/icons/premium-curator-star.png"
import curatorStar from "../assets/icons/curator-star.png"
import premiumContributorPencil from "../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../assets/icons/contributor-pencil.png"
import premiumStar from "../assets/icons/premium-star.png"
import jsxFunctions from "../structures/JSXFunctions"
import "./styles/commentrow.less"

interface Props {
    comment: any
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
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {deleteCommentID, deleteCommentFlag, editCommentFlag, editCommentID, editCommentText} = useCommentDialogSelector()
    const {setDeleteCommentID, setDeleteCommentFlag, setEditCommentFlag, setEditCommentID, setEditCommentText, setReportCommentID} = useCommentDialogActions()
    const {setCommentID, setCommentJumpFlag} = useFlagActions()
    const history = useHistory()
    const initialImg = functions.getThumbnailLink(props.comment?.post.images[0].type, props.comment?.postID, props.comment?.post.images[0].order, props.comment?.post.images[0].filename, "tiny")
    const [img, setImg] = useState(initialImg)
    const ref = useRef<HTMLCanvasElement>(null)

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

    const imgClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.comment.postID}`, "_blank")
        } else {
            history.push(`/post/${props.comment.postID}`)
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

    const goToComment = (commentID: string) => {
        if (!commentID) return
        props.onCommentJump?.(Number(commentID))
    }

    const triggerQuote = () => {
        history.push(`/post/${props.comment?.postID}`)
        const cleanComment = functions.parsePieces(props.comment?.comment).filter((s: any) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[${props.comment?.commentID}] ${functions.toProperCase(props.comment?.username)} said:
            > ${cleanComment}
        `))
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
        if (mobile) return null
        if (session.username === props.comment?.username) {
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={editCommentDialog}>
                        <img className="commentrow-options-img" src={commentEdit}/>
                        <span className="commentrow-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteCommentDialog}>
                        <img className="commentrow-options-img" src={commentDelete}/>
                        <span className="commentrow-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={triggerQuote}>
                        <img className="commentrow-options-img" src={commentQuote}/>
                        <span className="commentrow-options-text">{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? 
                    <div className="commentrow-options-container" onClick={deleteCommentDialog}>
                        <img className="commentrow-options-img" src={commentDelete}/>
                        <span className="commentrow-options-text">{i18n.buttons.delete}</span>
                    </div> : 
                    <div className="commentrow-options-container" onClick={reportCommentDialog}>
                        <img className="commentrow-options-img" src={commentReport}/>
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
            history.push(`/user/${props.comment.username}`)
        }
    }

    const generateUsernameJSX = () => {
        if (props.comment?.role === "admin") {
            return (
                <div className="commentrow-username-container">
                    <span className="commentrow-user-text admin-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (props.comment?.role === "mod") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text mod-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (props.comment?.role === "system") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text system-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={systemCrown}/>
                </div>
            )
        } else if (props.comment?.role === "premium-curator") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text curator-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (props.comment?.role === "curator") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text curator-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (props.comment?.role === "premium-contributor") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text premium-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (props.comment?.role === "contributor") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text contributor-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (props.comment?.role === "premium") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text premium-color">{functions.toProperCase(props.comment.username)}</span>
                    <img className="commentrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className={`commentrow-user-text ${props.comment?.banned ? "banned" : ""}`}>{functions.toProperCase(props.comment?.username) || i18n.user.deleted}</span>
    }

    useEffect(() => {
        if (functions.isVideo(img) && mobile) {
            functions.videoThumbnail(img).then((thumbnail) => {
                setImg(thumbnail)
            })
        }
        const base64Img = async () => {
            const base64 = await functions.linkToBase64(img)
            setImg(base64)
        }
        // base64Img()
    }, [])

    const loadImage = async () => {
        if (functions.isGIF(img)) return
        if (!ref.current) return
        let src = await functions.decryptThumb(img, session)
        const imgElement = document.createElement("img")
        imgElement.src = src 
        imgElement.onload = () => {
            if (!ref.current) return
            const rendered = functions.render(imgElement, brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate)
            const refCtx = ref.current.getContext("2d")
            ref.current.width = rendered.width
            ref.current.height = rendered.height
            refCtx?.drawImage(rendered, 0, 0, rendered.width, rendered.height)
        }
    }

    const commentJump = () => {
        setCommentID(Number(props.comment?.commentID))
        setCommentJumpFlag(true)
        history.push(`/post/${props.comment?.postID}?comment=${props.comment?.commentID}`)
    }

    useEffect(() => {
        loadImage()
    }, [img, brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, session])

    return (
        <div className="commentrow" comment-id={props.comment?.commentID}>
            <div className="commentrow-container">
                {functions.isVideo(img) && !mobile ? 
                <video className="commentrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}></video> :
                functions.isGIF(img) ? <img className="commentrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}/> :
                <canvas className="commentrow-img" ref={ref} onClick={imgClick} onAuxClick={imgClick}></canvas>}
            </div>
            <div className="commentrow-container-row">
                <div className="commentrow-container">
                    <div className="commentrow-user-container" onClick={userClick} onAuxClick={userClick}>
                        <img className="commentrow-user-img" src={getCommentPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        {generateUsernameJSX()}
                    </div>
                </div>
                <div className="commentrow-container" style={{width: "100%"}}>
                    <span className="commentrow-date-text" onClick={commentJump}>{functions.timeAgo(props.comment?.postDate, i18n)}:</span>
                    {jsxFunctions.renderText(props.comment?.comment, emojis, "commentrow", goToComment)}
                </div>
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default CommentRow