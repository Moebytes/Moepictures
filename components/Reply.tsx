import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, DeleteReplyIDContext, DeleteReplyFlagContext,
EditReplyIDContext, EditReplyFlagContext, EditReplyContentContext, ReportReplyIDContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, EnableDragContext, MobileContext, SessionFlagContext,
EmojisContext} from "../Context"
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
import premiumCuratorStar from "../assets/icons/premium-curator-star.png"
import curatorStar from "../assets/icons/curator-star.png"
import premiumContributorPencil from "../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../assets/icons/contributor-pencil.png"
import premiumStar from "../assets/icons/premium-star.png"
import jsxFunctions from "../structures/JSXFunctions"
import "./styles/reply.less"

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
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteReplyID, setDeleteReplyID} = useContext(DeleteReplyIDContext)
    const {deleteReplyFlag, setDeleteReplyFlag} = useContext(DeleteReplyFlagContext)
    const {editReplyFlag, setEditReplyFlag} = useContext(EditReplyFlagContext)
    const {editReplyID, setEditReplyID} = useContext(EditReplyIDContext)
    const {editReplyContent, setEditReplyContent} = useContext(EditReplyContentContext)
    const {reportReplyID, setReportReplyID} = useContext(ReportReplyIDContext)
    const {emojis, setEmojis} = useContext(EmojisContext)
    const history = useHistory()

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
        const cleanReply = functions.parseComment(props.reply?.content).filter((s: any) => !s.includes(">>>")).join(" ")
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
                        <span className="reply-quote-text">{jsxFunctions.parseTextLinks(text.trim(), emojis)}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="reply-text">{jsxFunctions.parseTextLinks(piece.trim(), emojis)}</span>)
            }
        }
        return jsx
    }

    const deleteReply = async () => {
        await functions.delete("/api/reply/delete", {threadID: props.reply?.threadID, replyID: props.reply?.replyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteReplyFlag && deleteReplyID === props.reply?.replyID) {
            deleteReply()
            setDeleteReplyFlag(false)
            setDeleteReplyID(null)
        }
    }, [deleteReplyFlag, deleteReplyID, session])

    const deleteReplyDialog = async () => {
        setDeleteReplyID(props.reply?.replyID)
    }

    const editReply = async () => {
        if (!editReplyContent) return
        const badReply = functions.validateReply(editReplyContent)
        if (badReply) return
        await functions.put("/api/reply/edit", {replyID: props.reply?.replyID, content: editReplyContent}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (editReplyFlag && editReplyID === props.reply?.replyID) {
            editReply()
            setEditReplyFlag(false)
            setEditReplyID(null)
        }
    }, [editReplyFlag, editReplyID, editReplyContent, session])

    const editReplyDialog = async () => {
        setEditReplyContent(props.reply?.content)
        setEditReplyID(props.reply?.replyID)
    }

    const reportReplyDialog = async () => {
        setReportReplyID(props.reply?.replyID)
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
                    {permissions.isMod(session) ? 
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
            window.open(`/user/${props.reply?.creator}`, "_blank")
        } else {
            history.push(`/user/${props.reply?.creator}`)
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
                <span className="reply-user-text system-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={systemCrown}/>
                </div>
            )
        } else if (props.reply?.role === "premium-curator") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text curator-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (props.reply?.role === "curator") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text curator-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={curatorStar}/>
                </div>
            )
        } else if (props.reply?.role === "premium-contributor") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text premium-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (props.reply?.role === "contributor") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text contributor-color">{functions.toProperCase(props.reply.creator)}</span>
                    <img className="reply-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (props.reply?.role === "premium") {
            return (
                <div className="reply-username-container" onClick={userClick} onAuxClick={userClick}>
                <span className="reply-user-text premium-color">{functions.toProperCase(props.reply.creator)}</span>
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

export default Reply