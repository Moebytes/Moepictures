import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useThreadDialogActions, 
useCacheSelector, useActiveActions, useThreadDialogSelector, useInteractionActions,
useFlagActions} from "../store"
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
import {ThreadUser, ThreadReply} from "../types/Types"

interface Props {
    thread: ThreadUser
    reply: ThreadReply
    onDelete?: () => void
    onEdit?: () => void
    onReplyJump?: (replyID: number) => void
}

const Reply: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setQuoteText} = useActiveActions()
    const {setThreadSearchFlag} = useFlagActions()
    const {deleteReplyID, deleteReplyFlag, editReplyFlag, editReplyID, editReplyContent, editReplyR18} = useThreadDialogSelector()
    const {setDeleteReplyID, setDeleteReplyFlag, setEditReplyFlag, setEditReplyID, setEditReplyContent, setEditReplyR18, setReportReplyID} = useThreadDialogActions()
    const {emojis} = useCacheSelector()
    const history = useHistory()

    const defaultIcon = props.reply?.image ? false : true

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getReplyPFP = () => {
        if (props.reply?.image) {
            return functions.getTagLink("pfp", props.reply.image, props.reply.imageHash)
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
        const cleanReply = functions.parsePieces(props.reply?.content).filter((s: string) => !s.includes(">>>")).join(" ")
        setQuoteText(functions.multiTrim(`
            >>>[${props.reply?.replyID}] ${functions.toProperCase(props.reply?.creator)} said:
            > ${cleanReply}
        `))
    }

    const goToReply = (replyID: string) => {
        if (!replyID) return
        props.onReplyJump?.(Number(replyID))
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
        const badReply = functions.validateReply(editReplyContent, i18n)
        if (badReply) return
        await functions.put("/api/reply/edit", {replyID: props.reply?.replyID, content: editReplyContent, r18: editReplyR18}, session, setSessionFlag)
        props.onEdit?.()
    }

    useEffect(() => {
        if (editReplyFlag && editReplyID === props.reply?.replyID) {
            editReply()
            setEditReplyFlag(false)
            setEditReplyID(null)
        }
    }, [editReplyFlag, editReplyID, editReplyContent, editReplyR18, session])

    const editReplyDialog = async () => {
        setEditReplyContent(props.reply?.content)
        setEditReplyID(props.reply?.replyID)
        setEditReplyR18(props.reply?.r18)
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
                        <span className="reply-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <img className="reply-options-img" src={deleteOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="reply-options">
                    <div className="reply-options-container" onClick={triggerQuote}>
                        <img className="reply-options-img" src={quoteOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? <>
                    <div className="reply-options-container" onClick={editReplyDialog}>
                        <img className="reply-options-img" src={editOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">{i18n.buttons.edit}</span>
                    </div>
                    <div className="reply-options-container" onClick={deleteReplyDialog}>
                        <img className="reply-options-img" src={deleteOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">{i18n.buttons.delete}</span>
                    </div></> : 
                    <div className="reply-options-container" onClick={reportReplyDialog}>
                        <img className="reply-options-img" src={reportOptIcon} style={{filter: getFilter()}}/>
                        <span className="reply-options-text">{i18n.buttons.report}</span>
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
        return <span className={`reply-user-text ${props.reply?.banned ? "banned" : ""}`} onClick={userClick} onAuxClick={userClick}>{functions.toProperCase(props.reply?.creator) || i18n.user.deleted}</span>
    }

    const getBGColor = () => {
        if (!props.thread) return ""
        if (props.reply.r18) {
            return props.thread.r18 ? "" : "var(--r18BGColor)"
        } else {
            return props.thread.r18 ? "var(--background)" : ""
        }
    }

    const viewThreads = () => {
        history.push("/forum")
        setThreadSearchFlag(`posts:${props.reply?.creator}`)
    }

    return (
        <div className="reply" reply-id={props.reply?.replyID} style={{backgroundColor: props.reply.r18 ? "var(--r18BGColor)" : ""}}>
            <div className="reply-container">
                <div className="reply-user-container">
                    {generateUsernameJSX()}
                    <span className="reply-date-text">{functions.timeAgo(props.reply?.createDate, i18n)}</span>
                    <img className="reply-user-img" src={getReplyPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                    <span className="reply-mini-link" onClick={viewThreads}>{i18n.sort.posts}: {props.reply?.postCount}</span>
                </div>
            </div>
            <div className="reply-text-container" onMouseEnter={() => setEnableDrag(false)}>
                {session.username && !mobile ? replyOptions() : null}
                {jsxFunctions.renderText(props.reply?.content, emojis, "reply", goToReply, props.reply?.r18)}
            </div>
            {session.username && mobile ? replyOptions() : null}
        </div>
    )
}

export default Reply