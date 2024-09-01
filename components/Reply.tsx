import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, DeleteReplyIDContext, DeleteReplyFlagContext,
EditReplyIDContext, EditReplyFlagContext, EditReplyContentContext, ReportReplyIDContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, EnableDragContext, MobileContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import favicon from "../assets/icons/favicon.png"
import quoteOptIcon from "../assets/icons/quote-opt.png"
import reportOptIcon from "../assets/icons/report-opt.png"
import editOptIcon from "../assets/icons/edit-opt.png"
import deleteOptIcon from "../assets/icons/delete-opt.png"
import permissions from "../structures/Permissions"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import "./styles/reply.less"
import axios from "axios"

interface Props {
    reply: any
    onDelete?: () => void
    onEdit?: () => void
    onReplyJump?: (replyID: number) => void
}

const Reply: React.FunctionComponent<Props> = (props) => {
    const {mobile, setMobile} = useContext(MobileContext)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {deleteReplyID, setDeleteReplyID} = useContext(DeleteReplyIDContext)
    const {deleteReplyFlag, setDeleteReplyFlag} = useContext(DeleteReplyFlagContext)
    const {editReplyFlag, setEditReplyFlag} = useContext(EditReplyFlagContext)
    const {editReplyID, setEditReplyID} = useContext(EditReplyIDContext)
    const {editReplyContent, setEditReplyContent} = useContext(EditReplyContentContext)
    const {reportReplyID, setReportReplyID} = useContext(ReportReplyIDContext)
    const history = useHistory()
    const reply = props.reply.reply

    const defaultIcon = props.reply.image ? false : true

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getReplyPFP = () => {
        if (props.reply.image) {
            return functions.getTagLink("pfp", props.reply.image)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.reply.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.reply.imagePost}`, "_blank")
        } else {
            history.push(`/post/${props.reply.imagePost}`)
        }
    }

    const triggerQuote = () => {
        const cleanReply = functions.parseComment(props.reply.content).filter((s: any) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[${props.reply.replyID}] ${functions.toProperCase(props.reply.creator)} said:
            > ${cleanReply}
        `))
    }

    const goToReply = (replyID: string) => {
        if (!replyID) return
        props.onReplyJump?.(Number(replyID))
    }

    const parseText = () => {
        const pieces = functions.parseComment(props.reply.content)
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
                    <div className="reply-quote-container">
                        {userPart ? <span className="reply-quote-user" onClick={() => goToReply(id)}>{`${username.trim()} ${said.trim()}`}</span> : null}
                        <span className="reply-quote-text">{text.trim()}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="reply-text">{piece.trim()}</span>)
            }
        }
        return jsx
    }

    const deleteReply = async () => {
        await axios.delete("/api/reply/delete", {params: {threadID: props.reply.threadID, replyID: props.reply.replyID}, headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteReplyFlag && deleteReplyID === props.reply.replyID) {
            deleteReply()
            setDeleteReplyFlag(false)
            setDeleteReplyID(null)
        }
    }, [deleteReplyFlag, deleteReplyID])

    const deleteReplyDialog = async () => {
        setDeleteReplyID(props.reply.replyID)
    }

    const editReply = async () => {
        if (!editReplyContent) return
        const badReply = functions.validateReply(editReplyContent)
        if (badReply) return
        await axios.put("/api/reply/edit", {replyID: props.reply.replyID, content: editReplyContent}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        props.onEdit?.()
    }

    useEffect(() => {
        if (editReplyFlag && editReplyID === props.reply.replyID) {
            editReply()
            setEditReplyFlag(false)
            setEditReplyID(null)
        }
    }, [editReplyFlag, editReplyID, editReplyContent])

    const editReplyDialog = async () => {
        setEditReplyContent(props.reply.content)
        setEditReplyID(props.reply.replyID)
    }

    const reportReplyDialog = async () => {
        setReportReplyID(props.reply.replyID)
    }

    const replyOptions = () => {
        if (session.username === props.reply.creator) {
            return (
                <div className="reply-options">
                    <div className="reply-options-container" onClick={editReplyDialog}>
                        <img className="reply-options-img" src={editOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">Edit</span>
                    </div>
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <img className="reply-options-img" src={deleteOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">Delete</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="reply-options">
                    <div className="reply-options-container" onClick={triggerQuote}>
                        <img className="reply-options-img" src={quoteOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">Quote</span>
                    </div>
                    {permissions.isElevated(session) ? 
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <img className="reply-options-img" src={deleteOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">Delete</span>
                    </div> : 
                    <div className="reply-options-container" onClick={reportReplyDialog}>
                        <img className="reply-options-img" src={reportOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">Report</span>
                    </div>}
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.reply.creator}`, "_blank")
        } else {
            history.push(`/user/${props.reply.creator}`)
        }
    }

    const generateUsernameJSX = () => {
        if (props.reply.role === "admin") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="reply-user-text admin-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={adminCrown}/>
                </div>
            )
        } else if (props.reply.role === "mod") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text mod-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={modCrown}/>
                </div>
            )
        } else if (props.reply.role === "system") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text system-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={systemCrown}/>
                </div>
            )
        }
        return <span className="reply-user-text" onClick={userClick} onAuxClick={userClick}>{functions.toProperCase(props.reply.creator)}</span>
    }

    return (
        <div className="reply" reply-id={props.reply.replyID}>
            <div className="reply-container">
                <div className="reply-user-container">
                    {generateUsernameJSX()}
                    <span className="reply-date-text">{functions.timeAgo(props.reply.createDate)}</span>
                    <img className="reply-user-img" src={getReplyPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                </div>
            </div>
            <div className="reply-text-container" onMouseEnter={() => setEnableDrag(false)}>
                {session.username && !mobile ? replyOptions() : null}
                {parseText()}
            </div>
            {session.username && mobile ? replyOptions() : null}
        </div>
    )
}

export default Reply