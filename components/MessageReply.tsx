import React, {useEffect} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useMessageDialogActions, 
useCacheSelector, useActiveActions, useMessageDialogSelector, useInteractionActions} from "../store"
import functions from "../structures/Functions"
import favicon from "../assets/icons/favicon.png"
import quoteOptIcon from "../assets/icons/quote-opt.png"
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

const MessageReply: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setQuoteText} = useActiveActions()
    const {deleteMsgReplyID, deleteMsgReplyFlag, editMsgReplyFlag, editMsgReplyID, editMsgReplyContent, editMsgReplyR18} = useMessageDialogSelector()
    const {setDeleteMsgReplyID, setDeleteMsgReplyFlag, setEditMsgReplyFlag, setEditMsgReplyID, setEditMsgReplyContent, setEditMsgReplyR18} = useMessageDialogActions()
    const {emojis} = useCacheSelector()
    const history = useHistory()
    const reply = props.reply.reply

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
        const pieces = functions.parseComment(props.reply?.content)
        let jsx = [] as any
        if (props.reply.r18) jsx.push(<span className="reply-text" style={{color: "var(--r18Color)", marginTop: "-38px"}}>[R18]</span>)
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
                        <span className="reply-quote-text">{jsxFunctions.renderMessageText(text.trim(), emojis)}</span>
                    </div>
                )
            } else {
                jsx.push(<span className="reply-text">{jsxFunctions.renderMessageText(piece.trim(), emojis)}</span>)
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
        await functions.put("/api/message/reply/edit", {replyID: props.reply?.replyID, content: editMsgReplyContent, r18: editMsgReplyR18}, session, setSessionFlag)
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
        setEditMsgReplyContent(props.reply?.content)
        setEditMsgReplyID(props.reply?.replyID)
        setEditMsgReplyR18(props.reply?.r18)
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
        }  else if (props.reply?.role === "premium") {
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
        <div className="reply" reply-id={props.reply?.replyID} style={{backgroundColor: props.reply.r18 ? "var(--r18BGColor)" : ""}}>
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