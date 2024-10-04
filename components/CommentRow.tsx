import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, DeleteCommentIDContext, DeleteCommentFlagContext, MobileContext,
EditCommentFlagContext, EditCommentIDContext, EditCommentTextContext, ReportCommentIDContext, BrightnessContext, ContrastContext, 
HueContext, SaturationContext, LightnessContext, BlurContext, SharpenContext, PixelateContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext, CommentIDContext, CommentJumpFlagContext, SessionFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import cryptoFunctions from "../structures/CryptoFunctions"
import favicon from "../assets/icons/favicon.png"
import commentQuote from "../assets/icons/commentquote.png"
import commentReport from "../assets/icons/commentreport.png"
import commentEdit from "../assets/icons/commentedit.png"
import commentDelete from "../assets/icons/commentdelete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import jsxFunctions from "../structures/JSXFunctions"
import "./styles/commentrow.less"

interface Props {
    comment: any
    onDelete?: () => void
    onEdit?: () => void
    onCommentJump?: (commentID: number) => void
}

const CommentRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {deleteCommentID, setDeleteCommentID} = useContext(DeleteCommentIDContext)
    const {deleteCommentFlag, setDeleteCommentFlag} = useContext(DeleteCommentFlagContext)
    const {editCommentFlag, setEditCommentFlag} = useContext(EditCommentFlagContext)
    const {editCommentID, setEditCommentID} = useContext(EditCommentIDContext)
    const {editCommentText, setEditCommentText} = useContext(EditCommentTextContext)
    const {reportCommentID, setReportCommentID} = useContext(ReportCommentIDContext)
    const {commentID, setCommentID} = useContext(CommentIDContext)
    const {commentJumpFlag, setCommentJumpFlag} = useContext(CommentJumpFlagContext)
    const [hover, setHover] = useState(false)
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
            return functions.getTagLink("pfp", props.comment.image)
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
                    <div className="commentrow-quote-container">
                        {userPart ? <span className="commentrow-quote-user" onClick={() => goToComment(id)}>{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className="commentrow-quote-text">{jsxFunctions.parseTextLinks(text.trim())}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="commentrow-text">{jsxFunctions.parseTextLinks(piece.trim())}</span>)
            }
        }
        return jsx
    }

    const triggerQuote = () => {
        history.push(`/post/${props.comment?.postID}`)
        const cleanComment = functions.parseComment(props.comment?.comment).filter((s: any) => !s.includes(">>>")).join("")
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
        const badComment = functions.validateComment(editCommentText)
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
                        <span className="commentrow-options-text">Edit</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteCommentDialog}>
                        <img className="commentrow-options-img" src={commentDelete}/>
                        <span className="commentrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={triggerQuote}>
                        <img className="commentrow-options-img" src={commentQuote}/>
                        <span className="commentrow-options-text">Quote</span>
                    </div>
                    {permissions.isElevated(session) ? 
                    <div className="commentrow-options-container" onClick={deleteCommentDialog}>
                        <img className="commentrow-options-img" src={commentDelete}/>
                        <span className="commentrow-options-text">Delete</span>
                    </div> : 
                    <div className="commentrow-options-container" onClick={reportCommentDialog}>
                        <img className="commentrow-options-img" src={commentReport}/>
                        <span className="commentrow-options-text">Report</span>
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
        }
        return <span className={`commentrow-user-text ${props.comment?.banned ? "banned" : ""}`}>{functions.toProperCase(props.comment.username) || "deleted"}</span>
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
        let src = img
        if (functions.isImage(img)) {
            src = await cryptoFunctions.decryptedLink(src)
        } else if (functions.isModel(src)) {
            src = await functions.modelImage(src)
        } else if (functions.isAudio(src)) {
            src = await functions.songCover(src)
        }
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
    }, [img, brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate])

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
                    <span className="commentrow-date-text" onClick={commentJump}>{functions.timeAgo(props.comment?.postDate)}:</span>
                    {parseText()}
                </div>
            </div>
            {session.username ? commentOptions() : null}
        </div>
    )
}

export default CommentRow