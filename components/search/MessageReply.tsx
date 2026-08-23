/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useMessageDialogActions, 
useCacheSelector, useActiveActions, useMessageDialogSelector, useInteractionActions} from "../../store"
import functions from "../../functions/Functions"
import moeText from "../../moetext/MoeText"
import favicon from "../../assets/icons/favicon.png"
import QuoteIcon from "../../assets/svg/quote.svg"
import EditIcon from "../../assets/svg/edit.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import permissions from "../../structures/Permissions"
import {MessageUserReply} from "../../types/Types"
import "./styles/reply.less"

interface Props {
    reply: MessageUserReply
    onDelete?: () => void
    onEdit?: () => void
    onReplyJump?: (replyID: number) => void
}

const MessageReply: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setQuoteText} = useActiveActions()
    const {deleteMsgReplyID, deleteMsgReplyFlag, editMsgReplyFlag, editMsgReplyID, editMsgReplyContent, editMsgReplyR18} = useMessageDialogSelector()
    const {setDeleteMsgReplyID, setDeleteMsgReplyFlag, setEditMsgReplyFlag, setEditMsgReplyID, setEditMsgReplyContent, setEditMsgReplyR18} = useMessageDialogActions()
    const {emojis} = useCacheSelector()
    const navigate = useNavigate()

    const defaultIcon = props.reply?.image ? false : true

    const getReplyPFP = () => {
        if (props.reply?.image) {
            return functions.link.getFolderLink("pfp", props.reply.image, props.reply.imageHash)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.reply?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(props.reply.imagePost, event, navigate, session, setSessionFlag)
    }

    const triggerQuote = () => {
        const cleanReply = functions.render.parsePieces(props.reply?.content).filter((s: string) => !s.includes(">>>")).join(" ")
        setQuoteText(functions.multiTrim(`
            >>>[${props.reply?.replyID}] ${functions.util.toProperCase(props.reply?.creator)} said:
            > ${cleanReply}
        `))
    }

    const goToReply = (replyID: string) => {
        if (!replyID) return
        props.onReplyJump?.(Number(replyID))
    }

    const deleteReply = async () => {
        await functions.http.delete("/api/message/reply/delete", {messageID: props.reply?.messageID, replyID: props.reply?.replyID}, session, setSessionFlag)
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
        const badReply = functions.validation.validateReply(editMsgReplyContent, i18n)
        if (badReply) return
        await functions.http.put("/api/message/reply/edit", {replyID: props.reply?.replyID, content: editMsgReplyContent, r18: editMsgReplyR18}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (editMsgReplyFlag && editMsgReplyID === props.reply?.replyID) {
            editReply()
            setEditMsgReplyFlag(false)
            setEditMsgReplyID(null)
        }
    }, [editMsgReplyFlag, editMsgReplyID, editMsgReplyContent, editMsgReplyR18, session])

    const editReplyDialog = async () => {
        setEditMsgReplyContent(moeText.undoLinkReplacements(props.reply?.content))
        setEditMsgReplyID(props.reply?.replyID)
        setEditMsgReplyR18(props.reply?.r18)
    }

    const replyOptions = () => {
        if (session.username === props.reply?.creator) {
            return (
                <div className="reply-options">
                    <div className="reply-options-container" onClick={editReplyDialog}>
                        <EditIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <DeleteIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="reply-options">
                    <div className="reply-options-container" onClick={triggerQuote}>
                        <QuoteIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? <>
                    <div className="reply-options-container" onClick={editReplyDialog}>
                        <EditIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <DeleteIcon className="reply-options-img"/>
                        <span className="reply-options-text">{i18n.buttons.delete}</span>
                    </div></> : null}
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.reply.creator}`, "_blank")
        } else {
            navigate(`/user/${props.reply.creator}`)
        }
    }

    const generateUsernameJSX = () => {
        return functions.jsx.usernameJSX({username: props.reply.creator, ...props.reply}, {
            containerClass: "reply-username-container",
            textClass: "reply-user-text",
            imageClass: "reply-user-label"
        }, i18n, navigate)
    }

    return (
        <div className="reply" reply-id={props.reply?.replyID} style={{backgroundColor: props.reply.r18 ? "var(--r18BGColor)" : ""}}>
            <div className="reply-container">
                <div className="reply-user-container">
                    {generateUsernameJSX()}
                    <span className="reply-date-text">{functions.date.timeAgo(props.reply?.createDate, i18n)}</span>
                    <img className="reply-user-img" src={getReplyPFP()} onClick={userImgClick} onAuxClick={userImgClick}/>
                </div>
            </div>
            <div className="reply-text-container" onMouseEnter={() => setEnableDrag(false)}>
                {session.username && !mobile ? replyOptions() : null}
                {moeText.renderText(props.reply?.content, emojis, "message", goToReply, props.reply?.r18)}
            </div>
            {session.username && mobile ? replyOptions() : null}
        </div>
    )
}

export default MessageReply