import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SessionFlagContext, MobileContext, SessionContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import systemCrown from "../assets/icons/system-crown.png"
import premiumCuratorStar from "../assets/icons/premium-curator-star.png"
import curatorStar from "../assets/icons/curator-star.png"
import premiumContributorPencil from "../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../assets/icons/contributor-pencil.png"
import premiumStar from "../assets/icons/premium-star.png"
import favicon from "../assets/icons/favicon.png"
import "./styles/thread.less"
import sticky from "../assets/icons/sticky.png"
import lock from "../assets/icons/lock.png"

interface Props {
    thread?: any
    onDelete?: () => void
    onEdit?: () => void
    titlePage?: boolean
}

const Thread: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [creatorData, setCreatorData] = useState({}) as any
    const [updaterData, setUpdaterData] = useState({}) as any
    const [creatorDefaultIcon, setCreatorDefaultIcon] = useState(false)
    const [updaterDefaultIcon, setUpdaterDefaultIcon] = useState(false)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateUpdater = async () => {
        const updater = await functions.get("/api/user", {username: props.thread.updater}, session, setSessionFlag)
        setUpdaterData(updater)
        setUpdaterDefaultIcon(updater?.image ? false : true)
    }

    const updateCreator = async () => {
        const creator = await functions.get("/api/user", {username: props.thread.creator}, session, setSessionFlag)
        setCreatorData(creator)
        if (props.thread.creator === props.thread.updater) {
            setUpdaterData(creator)
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
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/thread/${props.thread.threadID}`, "_blank")
        } else {
            history.push(`/thread/${props.thread.threadID}`)
        }
    }

    const getCreatorPFP = () => {
        if (creatorData?.image) {
            return functions.getTagLink("pfp", creatorData.image)
        } else {
            return favicon
        }
    }

    const creatorPage = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.thread.creator}`, "_blank")
        } else {
            history.push(`/user/${props.thread.creator}`)
        }
    }

    const creatorImgClick = (event: React.MouseEvent) => {
        if (!creatorData?.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${creatorData.imagePost}`, "_blank")
        } else {
            history.push(`/post/${creatorData.imagePost}`)
        }
    }

    const getUpdaterPFP = () => {
        if (updaterData?.image) {
            return functions.getTagLink("pfp", updaterData.image)
        } else {
            return favicon
        }
    }

    const updaterPage = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.thread.updater}`, "_blank")
        } else {
            history.push(`/user/${props.thread.updater}`)
        }
    }

    const updaterImgClick = (event: React.MouseEvent) => {
        if (!updaterData?.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${updaterData.imagePost}`, "_blank")
        } else {
            history.push(`/post/${updaterData.imagePost}`)
        }
    }

    const generateCreatorJSX = () => {
        if (creatorData?.role === "admin") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text admin-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={adminCrown}/>
                </div>
            )
        } else if (creatorData?.role === "mod") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text mod-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={modCrown}/>
                </div>
            )
        } else if (creatorData?.role === "system") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text system-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={systemCrown}/>
                </div>
            )
        } else if (creatorData?.role === "premium-curator") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (creatorData?.role === "curator") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={curatorStar}/>
                </div>
            )
        } else if (creatorData?.role === "premium-contributor") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (creatorData?.role === "contributor") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text contributor-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (creatorData?.role === "premium") {
            return (
                <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="thread-user-label" src={premiumStar}/>
                </div>
            )
        }
        return (
            <div className="thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                <img draggable={false} src={getCreatorPFP()} className="thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick} style={{filter: creatorDefaultIcon ? getFilter() : ""}}/>
                <span className={`thread-user-text ${creatorData?.banned ? "banned" : ""}`} onClick={creatorPage} onAuxClick={creatorPage}>{functions.toProperCase(props.thread?.creator) || "deleted"}</span>
            </div>
        )
    }

    const generateUpdaterJSX = () => {
        if (updaterData?.role === "admin") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                    <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text admin-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={adminCrown}/>
                </div>
            )
        } else if (updaterData?.role === "mod") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text mod-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={modCrown}/>
                </div>
            )
        } else if (updaterData?.role === "system") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text system-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={systemCrown}/>
                </div>
            )
        } else if (updaterData?.role === "premium-curator") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (updaterData?.role === "curator") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text curator-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={curatorStar}/>
                </div>
            )
        } else if (updaterData?.role === "premium-contributor") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (updaterData?.role === "contributor") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text contributor-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (updaterData?.role === "premium") {
            return (
                <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                    <span className="thread-user-text premium-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="thread-user-label" src={premiumStar}/>
                </div>
            )
        }
        return (
            <div className="thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                <img draggable={false} src={getUpdaterPFP()} className="thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick} style={{filter: updaterDefaultIcon ? getFilter() : ""}}/>
                <span className={`thread-user-text ${updaterData?.banned ? "banned" : ""}`} onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>{functions.toProperCase(props.thread?.updater) || "deleted"}</span>
            </div>
        )
    }

    const dateTextJSX = () => {
        const targetDate = props.thread.updatedDate
        return <span className="thread-date-text">{functions.timeAgo(targetDate)}</span>
    }

    if (props.titlePage) {
        return (
            <tr className="thread-no-hover">
                <div className="thread-content-container">
                    <td className="thread-container">
                        <div className="thread-row" style={{width: "100%"}}>
                            <span className="thread-heading">Title</span>
                        </div>
                        {!mobile ? <div className="thread-row">
                            <span className="thread-heading">Created by</span>
                        </div> : null}
                        {!mobile ? <div className="thread-row">
                            <span className="thread-heading">Updated by</span>
                        </div> : null}
                        <div className="thread-row">
                            <span className="thread-heading">Updated</span>
                        </div>
                    </td>
                </div>
            </tr>
        )
    }

    return (
        <tr className="thread">
            <div className="thread-content-container">
                <td className="thread-container">
                    <div className="thread-row" style={{width: "100%"}}>
                        {props.thread.sticky ? <img draggable={false} className="thread-icon" src={sticky} style={{marginTop: "4px"}}/> : null}
                        {props.thread.locked ? <img draggable={false} className="thread-icon" src={lock}/> : null}
                        <span className="thread-title" onClick={threadPage} onAuxClick={threadPage}>{props.thread.title}</span>
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
                </td>
            </div>
        </tr>
    )
}

export default Thread