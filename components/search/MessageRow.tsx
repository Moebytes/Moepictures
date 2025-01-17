import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions, useMessageDialogActions} from "../../store"
import functions from "../../structures/Functions"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import systemCrown from "../../assets/icons/system-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import softDelete from "../../assets/icons/soft-delete.png"
import unread from "../../assets/icons/unread.png"
import read from "../../assets/icons/read.png"
import readLight from "../../assets/icons/read-light.png"
import favicon from "../../assets/icons/favicon.png"
import "./styles/message.less"
import {MessageSearch, PrunedUser} from "../../types/Types"

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
    const history = useHistory()
    
    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateRecipient = async () => {
        if (!props.message?.recipients[0]) return
        const recipient = await functions.get("/api/user", {username: props.message.recipients[0]}, session, setSessionFlag)
        if (recipient) setRecipientData(recipient)
        setRecipientDefaultIcon(recipient?.image ? false : true)
    }

    const updateCreator = async () => {
        if (!props.message) return
        const creator = await functions.get("/api/user", {username: props.message.creator}, session, setSessionFlag)
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
            history.push(`/message/${props.message.messageID}`)
        }
    }

    const getCreatorPFP = () => {
        if (creatorData?.image) {
            return functions.getTagLink("pfp", creatorData.image, creatorData.imageHash)
        } else {
            return favicon
        }
    }

    const creatorPage = (event: React.MouseEvent) => {
        if (!props.message) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.message.creator}`, "_blank")
        } else {
            history.push(`/user/${props.message.creator}`)
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!creatorData?.imagePost) return
        event.stopPropagation()
        functions.openPost(creatorData.imagePost, event, history, session, setSessionFlag)
    }

    const getRecipientPFP = () => {
        if (recipientData?.image) {
            return functions.noCacheURL(functions.getTagLink("pfp", recipientData.image, recipientData.imageHash))
        } else {
            return favicon
        }
    }

    const recipientPage = (event: React.MouseEvent) => {
        if (!recipientData?.username) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${recipientData.username}`, "_blank")
        } else {
            history.push(`/user/${recipientData.username}`)
        }
    }

    const recipientImgClick = (event: React.MouseEvent) => {
        if (!recipientData?.imagePost) return
        event.stopPropagation()
        functions.openPost(recipientData.imagePost, event, history, session, setSessionFlag)
    }

    const generateCreatorJSX = () => {
        if (!props.message) return
        if (creatorData?.role === "admin") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text admin-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={adminCrown}/>
                </div>
            )
        } else if (creatorData?.role === "mod") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text mod-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={modCrown}/>
                </div>
            )
        } else if (creatorData?.role === "system") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text system-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={systemCrown}/>
                </div>
            )
        } else if (creatorData?.role === "premium-curator") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text curator-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (creatorData?.role === "curator") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text curator-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={curatorStar}/>
                </div>
            )
        } else if (creatorData?.role === "premium-contributor") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text premium-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (creatorData?.role === "contributor") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text contributor-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (creatorData?.role === "premium") {
            return (
                <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text premium-color">{functions.toProperCase(props.message.creator)}</span>
                    <img className="message-user-label" src={premiumStar}/>
                </div>
            )
        }
        return (
            <div className="message-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                <img draggable={false} src={getCreatorPFP()} className="message-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                <span className={`message-user-text ${creatorData?.banned ? "banned" : ""}`} onClick={creatorPage} onAuxClick={creatorPage}>{functions.toProperCase(props.message?.creator) || i18n.user.deleted}</span>
            </div>
        )
    }

    const generateRecipientJSX = () => {
        if (!props.message?.recipients[0]) return
        if (recipientData?.role === "admin") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text admin-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={adminCrown}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        } else if (recipientData?.role === "mod") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text mod-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={modCrown}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        } else if (recipientData?.role === "system") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text system-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={systemCrown}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        } else if (recipientData?.role === "premium-curator") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text curator-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={premiumCuratorStar}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        } else if (recipientData?.role === "curator") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text curator-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={curatorStar}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        } else if (recipientData?.role === "premium-contributor") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text premium-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={premiumContributorPencil}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        } else if (recipientData?.role === "contributor") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text contributor-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={contributorPencil}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        } else if (recipientData?.role === "premium") {
            return (
                <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                    <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                    <span className="message-user-text premium-color">{functions.toProperCase(props.message.recipients[0])}</span>
                    <img className="message-user-label" src={premiumStar}/>
                    {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
                </div>
            )
        }
        return (
            <div className="message-username-container" onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>
                <img draggable={false} src={getRecipientPFP()} className="message-user-img" onClick={recipientImgClick} onAuxClick={recipientImgClick} style={{filter: recipientDefaultIcon ? getFilter() : ""}}/>
                <span className={`message-user-text ${recipientData?.banned ? "banned" : ""}`} onClick={(event) => recipientPage(event)} onAuxClick={(event) => recipientPage(event)}>{functions.toProperCase(props.message?.recipients[0] || i18n.user.deleted)}</span>
                {props.message.recipients.length > 1 ? <span className="message-recipients-text">(+{props.message.recipients.length - 1})</span> : null}
            </div>
        )
    }

    const checkMail = async () => {
        const result = await functions.get("/api/user/checkmail", null, session, setSessionFlag)
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
        functions.clearResponseCacheKey("/api/search/messages")
        await functions.post("/api/message/read", {messageID: props.message.messageID}, session, setSessionFlag)
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
        return <span className="message-date-text">{functions.timeAgo(targetDate, i18n)}</span>
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

    const getReadIcon = () => {
        if (!readStatus()) return unread
        if (theme.includes("light")) return readLight
        return read
    }

    return (
        <div className="message">
            <div className="message-content-container">
                <div className="message-container">
                    <div className="message-row" style={{width: "100%"}}>
                        <img draggable={false} className="message-opt-icon" src={getReadIcon()} onClick={toggleRead} style={{filter: getFilter()}}/>
                        <img draggable={false} className="message-opt-icon" src={softDelete} onClick={toggleSoftDelete} style={{filter: getFilter()}}/>
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