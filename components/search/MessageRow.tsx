/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useMessageDialogActions} from "../../store"
import functions from "../../functions/Functions"
import favicon from "../../assets/icons/favicon.png"
import SoftDeleteIcon from "../../assets/svg/soft-delete.svg"
import UnreadIcon from "../../assets/svg/unread.svg"
import ReadIcon from "../../assets/svg/read.svg"
import {MessageSearch, PrunedUser} from "../../types/Types"
import "./styles/message.less"

interface Props {
    message?: MessageSearch
    onDelete?: () => void
    onEdit?: () => void
    titlePage?: boolean
}

const MessageRow: React.FunctionComponent<Props> = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag, setHasNotification} = useSessionActions()
    const {setSoftDeleteMessageID} = useMessageDialogActions()
    const [creatorData, setCreatorData] = useState({} as PrunedUser)
    const [recipientData, setRecipientData] = useState({} as PrunedUser)
    const [creatorDefaultIcon, setCreatorDefaultIcon] = useState(false)
    const [recipientDefaultIcon, setRecipientDefaultIcon] = useState(false)
    const navigate = useNavigate()
    
    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const updateRecipient = async () => {
        if (!props.message?.recipients[0]) return
        const recipient = await functions.http.get("/api/user", {username: props.message.recipients[0]}, session, setSessionFlag, true)
        if (recipient) setRecipientData(recipient)
        setRecipientDefaultIcon(recipient?.image ? false : true)
    }

    const updateCreator = async () => {
        if (!props.message) return
        const creator = await functions.http.get("/api/user", {username: props.message.creator}, session, setSessionFlag, true)
        if (creator) setCreatorData(creator)
        setCreatorDefaultIcon(creator?.image ? false : true)
    }

    useEffect(() => {
        if (props.message) {
            updateCreator()
            updateRecipient()
        }
    }, [session])

    const messagePage = (event: React.MouseEvent) => {
        if (!props.message) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/message/${props.message.messageID}`, "_blank")
        } else {
            navigate(`/message/${props.message.messageID}`)
        }
    }

    const getCreatorPFP = () => {
        if (creatorData?.image) {
            return functions.link.getTagLink("pfp", creatorData.image, creatorData.imageHash)
        } else {
            return favicon
        }
    }

    const getRecipientPFP = () => {
        if (recipientData?.image) {
            return functions.cache.noCacheURL(functions.link.getTagLink("pfp", recipientData.image, recipientData.imageHash))
        } else {
            return favicon
        }
    }

    const generateCreatorJSX = () => {
        if (!creatorData) return
        return functions.jsx.usernameJSX(creatorData, {
            containerClass: "message-username-container",
            textClass: "message-user-text",
            imageClass: "message-user-label",
            profilePictureClass: "message-user-img",
            profilePicture: getCreatorPFP(),
            filter: creatorDefaultIcon ? filter : "",
            session, setSessionFlag
        }, i18n, navigate)
    }

    const generateRecipientJSX = () => {
        if (!props.message || !recipientData) return
        return functions.jsx.usernameJSX(recipientData, {
            containerClass: "message-username-container",
            textClass: "message-user-text",
            imageClass: "message-user-label",
            profilePictureClass: "message-user-img",
            recipientClass: "message-recipients-text",
            profilePicture: getRecipientPFP(),
            recipientAmount: props.message.recipients.length,
            filter: recipientDefaultIcon ? filter : ""
        }, i18n, navigate)
    }

    const checkMail = async () => {
        const result = await functions.http.get("/api/user/checkmail", null, session, setSessionFlag)
        setHasNotification(result)
    }

    const readStatus = () => {
        if (!props.message) return
        if (props.message.creator === session.username) {
            return props.message.read
        } else {
            for (const data of props.message.recipientData) {
                if (data.recipient === session.username) {
                    return data.read
                }
            }
        }
    }

    const toggleRead = async () => {
        if (!props.message) return
        functions.cache.clearResponseCacheKey("/api/search/messages")
        await functions.http.post("/api/message/read", {messageID: props.message.messageID}, session, setSessionFlag)
        props.onEdit?.()
        checkMail()
    }

    const toggleSoftDelete = () => {
        if (!props.message) return
        setSoftDeleteMessageID(props.message.messageID)
    }

    const dateTextJSX = () => {
        if (!props.message) return
        const targetDate = props.message.updatedDate
        return <span className="message-date-text">{functions.date.timeAgo(targetDate, i18n)}</span>
    }

    if (props.titlePage) {
        return (
            <div className="message-no-hover">
                <div className="message-content-container">
                    <div className="message-container">
                        <div className="message-row" style={{width: "100%"}}>
                            <span className="message-heading">{i18n.labels.title}</span>
                        </div>
                        {!mobile ? <div className="message-row">
                            <span className="message-heading">{i18n.labels.sender}</span>
                        </div> : null}
                        {!mobile ? <div className="message-row">
                            <span className="message-heading">{i18n.labels.recipients}</span>
                        </div> : null}
                        <div className="message-row">
                            <span className="message-heading">{i18n.sidebar.updated}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="message">
            <div className="message-content-container">
                <div className="message-container">
                    <div className="message-row" style={{width: "100%"}}>
                        {!readStatus() ? 
                        <UnreadIcon className="message-opt-icon" onClick={toggleRead}/> :
                        <ReadIcon className="message-opt-icon" onClick={toggleRead}/>}
                        <SoftDeleteIcon className="message-opt-icon" onClick={toggleSoftDelete}/>
                        <span className={`message-title ${readStatus() ? "message-read" : ""}`} onClick={messagePage} onAuxClick={messagePage}>
                            {props.message?.r18 ? <span style={{color: "var(--r18Color)", marginRight: "10px"}}>[R18]</span> : null}
                            {props.message?.title || ""}
                        </span> 
                    </div>
                    {!mobile ? <div className="message-row">
                        {generateCreatorJSX()}
                    </div> : null}
                    {!mobile ? <div className="message-row">
                        {generateRecipientJSX()}
                    </div> : null}
                    <div className="message-row">
                        {dateTextJSX()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MessageRow