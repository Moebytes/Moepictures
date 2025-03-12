import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useActiveActions, useSessionActions, 
useFilterSelector, useThreadDialogSelector, useThreadDialogActions, useFlagActions, useCacheSelector} from "../../store"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import favicon from "../../assets/icons/favicon.png"
import quoteOptIcon from "../../assets/icons/quote-opt.png"
import reportOptIcon from "../../assets/icons/report-opt.png"
import editOptIcon from "../../assets/icons/edit-opt.png"
import deleteOptIcon from "../../assets/icons/delete-opt.png"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import systemCrown from "../../assets/icons/system-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import jsxFunctions from "../../structures/JSXFunctions"
import "./styles/commentrow.less"
import {ForumPostSearch} from "../../types/Types"

interface Props {
    forumPost: ForumPostSearch
    onDelete?: () => void
    onEdit?: () => void
    onPostJump?: (id: number) => void
}

const ForumPostRow: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {emojis} = useCacheSelector()
    const {setQuoteText} = useActiveActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {deleteReplyID, deleteReplyFlag, editReplyID, editReplyFlag, editReplyContent, editReplyR18, 
    deleteThreadID, deleteThreadFlag, editThreadID, editThreadFlag, editThreadTitle, editThreadContent,
    editThreadR18, reportReplyID, reportThreadID} = useThreadDialogSelector()
    const {setDeleteReplyID, setDeleteReplyFlag, setEditReplyID, setEditReplyFlag, setEditReplyContent, setEditReplyR18,
    setDeleteThreadID, setDeleteThreadFlag, setEditThreadID, setEditThreadFlag, setEditThreadTitle, setEditThreadContent, 
    setEditThreadR18, setReportReplyID, setReportThreadID} = useThreadDialogActions()
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const defaultIcon = props.forumPost?.image ? false : true

    const getUserPFP = () => {
        if (props.forumPost?.image) {
            return functions.getTagLink("pfp", props.forumPost.image, props.forumPost.imageHash)
        } else {
            return favicon
        }
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!props.forumPost?.imagePost) return
        event.stopPropagation()
        functions.openPost(props.forumPost.imagePost, event, navigate, session, setSessionFlag)
    }

    const goToPost = (id: string) => {
        if (!id) return
        props.onPostJump?.(Number(id))
    }

    const triggerQuote = () => {
        if (!props.forumPost.thread) return
        navigate(`/thread/${props.forumPost.thread.threadID}`)
        const cleanComment = functions.parsePieces(props.forumPost?.content).filter((s: string) => !s.includes(">>>")).join("")
        setQuoteText(functions.multiTrim(`
            >>>[${props.forumPost?.id}] ${functions.toProperCase(props.forumPost?.creator)} said:
            > ${cleanComment}
        `))
    }

    const deleteThread = async () => {
        if (props.forumPost.type === "thread") {
            await functions.delete("/api/thread/delete", {threadID: props.forumPost.id}, session, setSessionFlag)
            navigate("/forum")
        }
    }

    const deleteReply = async () => {
        if (!props.forumPost.thread) return
        if (props.forumPost.type === "reply") {
            await functions.delete("/api/reply/delete", {threadID: props.forumPost.thread.threadID, replyID: props.forumPost.id}, session, setSessionFlag)
            props.onDelete?.()
        }
    }

    useEffect(() => {
        if (props.forumPost.type === "reply") {
            if (deleteReplyFlag && deleteReplyID === props.forumPost.id) {
                deleteReply()
                setDeleteReplyFlag(false)
                setDeleteReplyID(null)
            }
        } else if (props.forumPost.type === "thread") {
            if (deleteThreadFlag && deleteThreadID === props.forumPost.id) {
                deleteThread()
                setDeleteThreadFlag(false)
                setDeleteThreadID(null)
            }
        }
    }, [deleteReplyFlag, deleteReplyID, deleteThreadFlag, deleteThreadID, session])

    const deleteForumPostDialog = async () => {
        if (props.forumPost.type === "reply") {
            setDeleteReplyID(props.forumPost.id)
        } else if (props.forumPost.type === "thread") {
            setDeleteThreadID(props.forumPost.id)
        }
    }

    const editThread = async () => {
        if (props.forumPost.type === "thread") {
            const badTitle = functions.validateTitle(editThreadTitle, i18n)
            if (badTitle) return
            const badContent = functions.validateThread(editThreadContent, i18n)
            if (badContent) return
            await functions.put("/api/thread/edit", {threadID: props.forumPost.id, title: editThreadTitle, content: editThreadContent, r18: editThreadR18}, session, setSessionFlag)
            props.onEdit?.()
        }
    }

    const editReply = async () => {
        if (props.forumPost.type === "reply") {
            if (!editReplyContent) return
            const badReply = functions.validateReply(editReplyContent, i18n)
            if (badReply) return
            await functions.put("/api/reply/edit", {replyID: props.forumPost.id, content: editReplyContent, r18: editReplyR18}, session, setSessionFlag)
            props.onEdit?.()
        }
    }

    useEffect(() => {
        if (props.forumPost.type === "reply") {
            if (editReplyFlag && editReplyID === props.forumPost.id) {
                editReply()
                setEditReplyFlag(false)
                setEditReplyID(null)
            }
        } else if (props.forumPost.type === "thread") {
            if (editThreadFlag && editThreadID === props.forumPost.id) {
                editThread()
                setEditThreadFlag(false)
                setEditReplyID(null)
            }
        }
    }, [editReplyFlag, editReplyID, editReplyContent, editReplyR18, 
        editThreadFlag, editThreadID, editThreadContent, editThreadTitle, 
        editThreadR18, session])

    const editForumPostDialog = async () => {
        if (props.forumPost.type === "reply") {
            setEditReplyContent(props.forumPost.content)
            setEditReplyID(props.forumPost.id)
            setEditReplyR18(props.forumPost.r18 ?? false)
        } else if (props.forumPost.type === "thread") {
            setEditThreadTitle(props.forumPost.title)
            setEditThreadContent(props.forumPost.content)
            setEditThreadID(props.forumPost.id)
            setEditThreadR18(props.forumPost.r18 ?? false)
        }
    }

    const reportForumPostDialog = async () => {
        if (props.forumPost.type === "reply") {
            setReportReplyID(props.forumPost.id)
        } else if (props.forumPost.type === "thread") {
            setReportThreadID(props.forumPost.id)
        }
    }

    const forumPostOptions = () => {
        if (mobile) return null
        if (session.username === props.forumPost?.creator) {
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={editForumPostDialog}>
                        <img className="commentrow-options-img" src={editOptIcon}/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.edit}</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteForumPostDialog}>
                        <img className="commentrow-options-img" src={deleteOptIcon}/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else {
            if (session.banned) return null
            return (
                <div className="commentrow-options">
                    <div className="commentrow-options-container" onClick={triggerQuote}>
                        <img className="commentrow-options-img" src={quoteOptIcon}/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.quote}</span>
                    </div>
                    {permissions.isMod(session) ? <>
                    <div className="commentrow-options-container" onClick={editForumPostDialog}>
                        <img className="commentrow-options-img" src={editOptIcon}/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.edit}</span>
                    </div>
                    <div className="commentrow-options-container" onClick={deleteForumPostDialog}>
                        <img className="commentrow-options-img" src={deleteOptIcon}/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.delete}</span>
                    </div></> : 
                    <div className="commentrow-options-container" onClick={reportForumPostDialog}>
                        <img className="commentrow-options-img" src={reportOptIcon}/>
                        <span className="commentrow-options-text" style={{color: "var(--text)"}}>{i18n.buttons.report}</span>
                    </div>}
                </div>
            )
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.forumPost.creator}`, "_blank")
        } else {
            navigate(`/user/${props.forumPost.creator}`)
        }
    }

    const generateUsernameJSX = () => {
        if (props.forumPost?.role === "admin") {
            return (
                <div className="commentrow-username-container">
                    <span className="commentrow-user-text admin-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (props.forumPost?.role === "mod") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text mod-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (props.forumPost?.role === "system") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text system-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={systemCrown}/>
                </div>
            )
        } else if (props.forumPost?.role === "premium-curator") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text curator-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (props.forumPost?.role === "curator") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text curator-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (props.forumPost?.role === "premium-contributor") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text premium-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (props.forumPost?.role === "contributor") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text contributor-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (props.forumPost?.role === "premium") {
            return (
                <div className="commentrow-username-container">
                <span className="commentrow-user-text premium-color">{functions.toProperCase(props.forumPost.creator)}</span>
                    <img className="commentrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className={`commentrow-user-text ${props.forumPost?.banned ? "banned" : ""}`}>{functions.toProperCase(props.forumPost?.creator) || i18n.user.deleted}</span>
    }

    const titleClick = (event: React.MouseEvent) => {
        if (!props.forumPost.thread) return
        let replyID = props.forumPost.type === "reply" ? `?reply=${props.forumPost.id}` : ""
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/thread/${props.forumPost.thread.threadID}${replyID}`, "_blank")
        } else {
            navigate(`/thread/${props.forumPost.thread.threadID}${replyID}`)
        }
    }

    return (
        <div className="commentrow" post-id={props.forumPost.id}>
            <div className="commentrow-container-row">
                <div className="commentrow-container">
                    <div className="commentrow-user-container" onClick={userClick} onAuxClick={userClick}>
                        <img className="commentrow-user-img" src={getUserPFP()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        {generateUsernameJSX()}
                    </div>
                </div>
                <div className="commentrow-container" style={{width: "100%"}}>
                    <span className="commentrow-title" onClick={titleClick}>{props.forumPost.thread?.title}</span>
                    <span className="commentrow-date-text">{functions.timeAgo(props.forumPost?.createDate, i18n)}:</span>
                    {jsxFunctions.renderText(props.forumPost?.content, emojis, "comment", goToPost)}
                </div>
            </div>
            {session.username ? forumPostOptions() : null}
        </div>
    )
}

export default ForumPostRow