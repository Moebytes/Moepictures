import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import systemCrown from "../../assets/icons/system-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import unread from "../../assets/icons/unread.png"
import read from "../../assets/icons/read.png"
import readLight from "../../assets/icons/read-light.png"
import favicon from "../../assets/icons/favicon.png"
import "./styles/thread.less"
import sticky from "../../assets/icons/sticky.png"
import lock from "../../assets/icons/lock.png"
import {ThreadSearch, PrunedUser} from "../../types/Types"

interface Props {
    thread?: ThreadSearch
    onDelete?: () => void
    onEdit?: () => void
    titlePage?: boolean
}

const ThreadRow: React.FunctionComponent<Props> = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [creatorData, setCreatorData] = useState({} as PrunedUser)
    const [updaterData, setUpdaterData] = useState({} as PrunedUser)
    const [creatorDefaultIcon, setCreatorDefaultIcon] = useState(false)
    const [updaterDefaultIcon, setUpdaterDefaultIcon] = useState(false)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateUpdater = async () => {
        if (!props.thread) return
        const updater = await functions.http.get("/api/user", {username: props.thread.updater}, session, setSessionFlag)
        if (updater) setUpdaterData(updater)
        setUpdaterDefaultIcon(updater?.image ? false : true)
    }

    const updateCreator = async () => {
        if (!props.thread) return
        const creator = await functions.http.get("/api/user", {username: props.thread.creator}, session, setSessionFlag)
        if (creator) setCreatorData(creator)
        if (props.thread.creator === props.thread.updater) {
            if (creator) setUpdaterData(creator)
            setCreatorDefaultIcon(creator?.image ? false : true)
            setUpdaterDefaultIcon(creator?.image ? false : true)
        } else {
            setCreatorDefaultIcon(creator?.image ? false : true)
            updateUpdater()
        }
    }

    useEffect(() => {
        if (props.thread) {
            updateCreator()
        }
    }, [session])

    const threadPage = (event: React.MouseEvent) => {
        if (!props.thread) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/thread/${props.thread.threadID}`, "_blank")
        } else {
            navigate(`/thread/${props.thread.threadID}`)
        }
    }

    const getCreatorPFP = () => {
        if (creatorData?.image) {
            return functions.link.getTagLink("pfp", creatorData.image, creatorData.imageHash)
        } else {
            return favicon
        }
    }

    const creatorPage = (event: React.MouseEvent) => {
        if (!props.thread) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.thread.creator}`, "_blank")
        } else {
            navigate(`/user/${props.thread.creator}`)
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!creatorData?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(creatorData.imagePost, event, navigate, session, setSessionFlag)
    }

    const getUpdaterPFP = () => {
        if (updaterData?.image) {
            return functions.link.getTagLink("pfp", updaterData.image, updaterData.imageHash)
        } else {
            return favicon
        }
    }

    const updaterPage = (event: React.MouseEvent) => {
        if (!props.thread) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.thread.updater}`, "_blank")
        } else {
            navigate(`/user/${props.thread.updater}`)
        }
    }

    const updaterImgClick = (event: React.MouseEvent) => {
        if (!updaterData?.imagePost) return
        event.stopPropagation()
        functions.post.openPost(updaterData.imagePost, event, navigate, session, setSessionFlag)
    }

    const generateCreatorJSX = () => {
        if (!props.thread) return
        if (creatorData?.role === "admin") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text admin-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={adminCrown}/>
                </div>
            )
        } else if (creatorData?.role === "mod") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text mod-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={modCrown}/>
                </div>
            )
        } else if (creatorData?.role === "system") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text system-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={systemCrown}/>
                </div>
            )
        } else if (creatorData?.role === "premium-curator") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (creatorData?.role === "curator") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={curatorStar}/>
                </div>
            )
        } else if (creatorData?.role === "premium-contributor") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (creatorData?.role === "contributor") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text contributor-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (creatorData?.role === "premium") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.util.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={premiumStar}/>
                </div>
            )
        }
        return (
            <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                <span className={`thread-user-text ${creatorData?.banned ? "banned" : ""}`} onClick={creatorPage} onAuxClick={creatorPage}>{functions.util.toProperCase(props.thread?.creator) || i18n.user.deleted}</span>
            </div>
        )
    }

    const generateUpdaterJSX = () => {
        if (!props.thread) return
        if (updaterData?.role === "admin") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                    <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text admin-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={adminCrown}/>
                </div>
            )
        } else if (updaterData?.role === "mod") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text mod-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={modCrown}/>
                </div>
            )
        } else if (updaterData?.role === "system") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text system-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={systemCrown}/>
                </div>
            )
        } else if (updaterData?.role === "premium-curator") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (updaterData?.role === "curator") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={curatorStar}/>
                </div>
            )
        } else if (updaterData?.role === "premium-contributor") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (updaterData?.role === "contributor") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text contributor-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (updaterData?.role === "premium") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.util.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={premiumStar}/>
                </div>
            )
        }
        return (
            <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                <span className={`thread-user-text ${updaterData?.banned ? "banned" : ""}`} onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>{functions.util.toProperCase(props.thread?.updater) || i18n.user.deleted}</span>
            </div>
        )
    }

    const readStatus = () => {
        return props.thread?.read ?? false
    }

    const toggleRead = async () => {
        if (!props.thread) return
        functions.cache.clearResponseCacheKey("/api/search/threads")
        await functions.http.post("/api/thread/read", {threadID: props.thread.threadID}, session, setSessionFlag)
        props.onEdit?.()
    }

    const getReadIcon = () => {
        if (!readStatus()) return unread
        if (theme.includes("light")) return readLight
        return read
    }

    const dateTextJSX = () => {
        if (!props.thread) return
        const targetDate = props.thread.updatedDate
        return <span className="thread-date-text">{functions.date.timeAgo(targetDate, i18n)}</span>
    }

    if (props.titlePage) {
        return (
            <div className="thread-no-hover">
                <div className="thread-content-container">
                    <div className="thread-container">
                        <div className="thread-row" style={{width: "100%"}}>
                            <span className="thread-heading">{i18n.labels.title}</span>
                        </div>
                        {!mobile ? <div className="thread-row">
                            <span className="thread-heading">{i18n.labels.createdBy}</span>
                        </div> : null}
                        {!mobile ? <div className="thread-row">
                            <span className="thread-heading">{i18n.labels.updatedBy}</span>
                        </div> : null}
                        <div className="thread-row">
                            <span className="thread-heading">{i18n.sidebar.updated}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="thread">
            <div className="thread-content-container">
                <div className="thread-container">
                    <div className="thread-row" style={{width: "100%"}}>
                        {session.username ? <img draggable={false} className="thread-opt-icon" src={getReadIcon()} onClick={toggleRead} style={{filter: getFilter()}}/> : null}
                        {props.thread?.sticky ? <img draggable={false} className="thread-icon" src={sticky} style={{marginTop: "4px"}}/> : null}
                        {props.thread?.locked ? <img draggable={false} className="thread-icon" src={lock}/> : null}
                        <span className={`thread-title ${readStatus() ? "thread-read" : ""}`} onClick={threadPage} onAuxClick={threadPage}>
                            {props.thread?.r18 ? <span style={{color: "var(--r18Color)", marginRight: "10px"}}>[R18]</span> : null}
                            {props.thread?.title || ""}
                        </span>
                    </div>
                    {!mobile ? <div className="thread-row">
                        {generateCreatorJSX()}
                    </div> : null}
                    {!mobile ? <div className="thread-row">
                        {generateUpdaterJSX()}
                    </div> : null}
                    <div className="thread-row">
                        {dateTextJSX()}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ThreadRow