import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import favicon from "../../assets/icons/favicon.png"
import unread from "../../assets/svg/unread.svg"
import read from "../../assets/svg/read.svg"
import sticky from "../../assets/svg/sticky.svg"
import lock from "../../assets/svg/lock.svg"
import {ThreadSearch, PrunedUser} from "../../types/Types"
import "./styles/thread.less"

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

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    const updateUpdater = async () => {
        if (!props.thread) return
        const updater = await functions.http.get("/api/user", {username: props.thread.updater}, session, setSessionFlag, true)
        if (updater) setUpdaterData(updater)
        setUpdaterDefaultIcon(updater?.image ? false : true)
    }

    const updateCreator = async () => {
        if (!props.thread) return
        const creator = await functions.http.get("/api/user", {username: props.thread.creator}, session, setSessionFlag, true)
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

    const getUpdaterPFP = () => {
        if (updaterData?.image) {
            return functions.link.getTagLink("pfp", updaterData.image, updaterData.imageHash)
        } else {
            return favicon
        }
    }

    const generateCreatorJSX = () => {
        if (!props.thread) return
        return functions.jsx.usernameJSX(creatorData, {
            containerClass: "thread-username-container",
            textClass: "thread-user-text",
            imageClass: "thread-user-label",
            profilePictureClass: "thread-user-img",
            profilePicture: getCreatorPFP(),
            filter: creatorDefaultIcon ? filter : "",
            session, setSessionFlag
        }, i18n, navigate)
    }

    const generateUpdaterJSX = () => {
        if (!props.thread) return
        return functions.jsx.usernameJSX(updaterData, {
            containerClass: "thread-username-container",
            textClass: "thread-user-text",
            imageClass: "thread-user-label",
            profilePictureClass: "thread-user-img",
            profilePicture: getUpdaterPFP(),
            filter: updaterDefaultIcon ? filter : ""
        }, i18n, navigate)
    }

    const readStatus = () => {
        return props.thread?.read ?? false
    }

    const toggleRead = async () => {
        if (!props.thread || !session.username) return
        functions.cache.clearResponseCacheKey("/api/search/threads")
        await functions.http.post("/api/thread/read", {threadID: props.thread.threadID}, session, setSessionFlag)
        props.onEdit?.()
    }

    const getReadIcon = () => {
        if (!readStatus()) return getIcon(unread)
        return getIcon(read)
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
                        {session.username ? <img draggable={false} className="thread-opt-icon" src={getReadIcon()} onClick={toggleRead} style={{filter}}/> : null}
                        {props.thread?.sticky ? <img draggable={false} className="thread-icon" src={getIcon(sticky)} style={{marginTop: "4px"}}/> : null}
                        {props.thread?.locked ? <img draggable={false} className="thread-icon" src={getIcon(lock)}/> : null}
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