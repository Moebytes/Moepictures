import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, SessionFlagContext, DeleteMsgReplyIDContext, DeleteMsgReplyFlagContext,
EditMsgReplyIDContext, EditMsgReplyFlagContext, EditMsgReplyContentContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, EnableDragContext, MobileContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import favicon from "../assets/icons/favicon.png"
import quoteOptIcon from "../assets/icons/quote-opt.png"
import editOptIcon from "../assets/icons/edit-opt.png"
import deleteOptIcon from "../assets/icons/delete-opt.png"
import permissions from "../structures/Permissions"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import premiumStar from "../assets/icons/premiumStar.png"
import jsxFunctions from "../structures/JSXFunctions"
import "./styles/reply.less"

interface Props {
    reply: any
    onDelete?: () => void
    onEdit?: () => void
    onReplyJump?: (replyID: number) => void
}

const MessageReply: React.FunctionComponent<Props> = (props) => {
    const {mobile, setMobile} = useContext(MobileContext)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {quoteText, setQuoteText} = useContext(QuoteTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteMsgReplyID, setDeleteMsgReplyID} = useContext(DeleteMsgReplyIDContext)
    const {deleteMsgReplyFlag, setDeleteMsgReplyFlag} = useContext(DeleteMsgReplyFlagContext)
    const {editMsgReplyFlag, setEditMsgReplyFlag} = useContext(EditMsgReplyFlagContext)
    const {editMsgReplyID, setEditMsgReplyID} = useContext(EditMsgReplyIDContext)
    const {editMsgReplyContent, setEditMsgReplyContent} = useContext(EditMsgReplyContentContext)
    const history = useHistory()
    const reply = props.reply.reply

    const defaultIcon = props.reply?.image ? false : true

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getReplyPFP = () => {
        if (props.reply?.image) {
            return functions.getTagLink("pfp", props.reply.image)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.reply?.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.reply.imagePost}`, "_blank")
        } else {
            history.push(`/post/${props.reply.imagePost}`)
        }
    }

    const triggerQuote = () => {
        const cleanReply = functions.parseComment(props.reply?.content).filter((s: any) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[${props.reply?.replyID}] ${functions.toProperCase(props.reply?.creator)} said:
            > ${cleanReply}
        `))
    }

    const goToReply = (replyID: string) => {
        if (!replyID) return
        props.onReplyJump?.(Number(replyID))
    }

    const parseText = () => {
        const pieces = functions.parseComment(props.reply?.content)
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
                        <span className="reply-quote-text">{jsxFunctions.parseTextLinks(text.trim())}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="reply-text">{jsxFunctions.parseTextLinks(piece.trim())}</span>)
            }
        }
        return jsx
    }

    const deleteReply = async () => {
        await functions.delete("/api/message/reply/delete", {messageID: props.reply?.messageID, replyID: props.reply?.replyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteMsgReplyFlag && deleteMsgReplyID === props.reply?.replyID) {
            deleteReply()
            setDeleteMsgReplyFlag(false)
            setDeleteMsgReplyID(null)
        }
    }, [deleteMsgReplyFlag, deleteMsgReplyID, session])

    const deleteReplyDialog = async () => {
        setDeleteMsgReplyID(props.reply?.replyID)
    }

    const editReply = async () => {
        if (!editMsgReplyContent) return
        const badReply = functions.validateReply(editMsgReplyContent)
        if (badReply) return
        await functions.put("/api/message/reply/edit", {replyID: props.reply?.replyID, content: editMsgReplyContent}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (editMsgReplyFlag && editMsgReplyID === props.reply?.replyID) {
            editReply()
            setEditMsgReplyFlag(false)
            setEditMsgReplyID(null)
        }
    }, [editMsgReplyFlag, editMsgReplyID, editMsgReplyContent, session])

    const editReplyDialog = async () => {
        setEditMsgReplyContent(props.reply?.content)
        setEditMsgReplyID(props.reply?.replyID)
    }

    const replyOptions = () => {
        if (session.username === props.reply?.creator) {
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
                    </div> : null}
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
        if (props.reply?.role === "admin") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="reply-user-text admin-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={adminCrown}/>
                </div>
            )
        } else if (props.reply?.role === "mod") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text mod-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={modCrown}/>
                </div>
            )
        } else if (props.reply?.role === "system") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text system-color">{functions.toProperCase(props.reply?.creator)}</span>
                    <img className="reply-user-label" src={systemCrown}/>
                </div>
            )
        } else if (props.reply?.role === "premium") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text premium-color">{functions.toProperCase(props.reply?.creator)}</span>
                    <img className="reply-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className={`reply-user-text ${props.reply?.banned ? "banned" : ""}`} onClick={userClick} onAuxClick={userClick}>{functions.toProperCase(props.reply?.creator) || "deleted"}</span>
    }

    return (
        <div className="reply" reply-id={props.reply?.replyID}>
            <div className="reply-container">
                <div className="reply-user-container">
                    {generateUsernameJSX()}
                    <span className="reply-date-text">{functions.timeAgo(props.reply?.createDate)}</span>
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

export default MessageReply