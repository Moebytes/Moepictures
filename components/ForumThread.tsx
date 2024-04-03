import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, MobileContext, SessionContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import "./styles/forumthread.less"
import sticky from "../assets/icons/sticky.png"
import lock from "../assets/icons/lock.png"
import axios from "axios"

interface Props {
    thread?: any
    onDelete?: () => void
    onEdit?: () => void
    titlePage?: boolean
}

const ForumThread: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const [creatorRole, setCreatorRole] = useState("")
    const [updaterRole, setUpdaterRole] = useState("")
    const [updaterImg, setUpdaterImg] = useState("")
    const [creatorImg, setCreatorImg] = useState("")
    const [updaterImgPost, setUpdaterImgPost] = useState("")
    const [creatorImgPost, setCreatorImgPost] = useState("")
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateUpdaterRole = async () => {
        const user = await axios.get("/api/user", {params: {username: props.thread.updater}, withCredentials: true}).then((r) => r.data)
        if (user?.role) setUpdaterRole(user.role)
        if (user?.image) setUpdaterImg(functions.getTagLink("pfp", user.image))
        if (user?.imagePost) setUpdaterImgPost(user.imagePost)
    }

    const updateCreatorRole = async () => {
        const user = await axios.get("/api/user", {params: {username: props.thread.creator}, withCredentials: true}).then((r) => r.data)
        if (props.thread.creator === props.thread.updater) {
            if (user?.role) {
                setCreatorRole(user.role)
                setUpdaterRole(user.role)
            }
            if (user?.image) {
                setCreatorImg(functions.getTagLink("pfp", user.image))
                setUpdaterImg(functions.getTagLink("pfp", user.image))
            }
            if (user?.imagePost) {
                setCreatorImgPost(user.imagePost)
                setUpdaterImgPost(user.imagePost)
            }
        } else {
            if (user?.role) setCreatorRole(user.role)
            if (user?.image) setCreatorImg(functions.getTagLink("pfp", user.image))
            if (user?.imagePost) setCreatorImgPost(user.imagePost)
            updateUpdaterRole()
        }
    }

    useEffect(() => {
        if (props.thread) {
            updateCreatorRole()
        }
    }, [])

    const threadPage = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/thread/${props.thread.threadID}`, "_blank")
        } else {
            history.push(`/thread/${props.thread.threadID}`)
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
        if (!creatorImgPost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${creatorImgPost}`, "_blank")
        } else {
            history.push(`/post/${creatorImgPost}`)
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
        if (!updaterImgPost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${updaterImgPost}`, "_blank")
        } else {
            history.push(`/post/${updaterImgPost}`)
        }
    }

    const generateCreatorJSX = () => {
        if (creatorRole === "admin") {
            return (
                <div className="forum-thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    {creatorImg ? <img draggable={false} src={creatorImg} className="forum-thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick}/> : null}
                    <span className="forum-thread-user-text admin-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="forum-thread-user-label" src={adminCrown}/>
                </div>
            )
        } else if (creatorRole === "mod") {
            return (
                <div className="forum-thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                    {creatorImg ? <img draggable={false} src={creatorImg} className="forum-thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick}/> : null}
                    <span className="forum-thread-user-text mod-color">{functions.toProperCase(props.thread.creator)}</span>
                    <img className="forum-thread-user-label" src={modCrown}/>
                </div>
            )
        }
        return (
            <div className="forum-thread-username-container" onClick={creatorPage} onAuxClick={creatorPage}>
                {creatorImg ? <img draggable={false} src={creatorImg} className="forum-thread-user-img" onClick={creatorImgClick} onAuxClick={creatorImgClick}/> : null}
                <span className="forum-thread-user-text" onClick={creatorPage} onAuxClick={creatorPage}>{functions.toProperCase(props.thread.creator)}</span>
            </div>
        )
    }

    const generateUpdaterJSX = () => {
        if (updaterRole === "admin") {
            return (
                <div className="forum-thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                    {updaterImg ? <img draggable={false} src={updaterImg} className="forum-thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick}/> : null}
                    <span className="forum-thread-user-text admin-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="forum-thread-user-label" src={adminCrown}/>
                </div>
            )
        } else if (updaterRole === "mod") {
            return (
                <div className="forum-thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                    {updaterImg ? <img draggable={false} src={updaterImg} className="forum-thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick}/> : null}
                    <span className="forum-thread-user-text mod-color">{functions.toProperCase(props.thread.updater)}</span>
                    <img className="forum-thread-user-label" src={modCrown}/>
                </div>
            )
        }
        return (
            <div className="forum-thread-username-container" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>
                {updaterImg ? <img draggable={false} src={updaterImg} className="forum-thread-user-img" onClick={updaterImgClick} onAuxClick={updaterImgClick}/> : null}
                <span className="forum-thread-user-text" onClick={(event) => updaterPage(event)} onAuxClick={(event) => updaterPage(event)}>{functions.toProperCase(props.thread.updater)}</span>
            </div>
        )
    }

    const dateTextJSX = () => {
        const targetDate = props.thread.updatedDate
        return <span className="forum-thread-date-text">{functions.timeAgo(targetDate)}</span>
    }

    if (props.titlePage) {
        return (
            <tr className="forum-thread-no-hover">
                <div className="forum-thread-content-container">
                    <td className="forum-thread-container">
                        <div className="forum-thread-row" style={{width: "100%"}}>
                            <span className="forum-thread-heading">Title</span>
                        </div>
                        <div className="forum-thread-row">
                            <span className="forum-thread-heading">Created by</span>
                        </div>
                        <div className="forum-thread-row">
                            <span className="forum-thread-heading">Updated by</span>
                        </div>
                        <div className="forum-thread-row">
                            <span className="forum-thread-heading">Updated</span>
                        </div>
                    </td>
                </div>
            </tr>
        )
    }

    return (
        <tr className="forum-thread">
            <div className="forum-thread-content-container">
                <td className="forum-thread-container">
                    <div className="forum-thread-row" style={{width: "100%"}}>
                        {props.thread.sticky ? <img draggable={false} className="forum-thread-icon" src={sticky} style={{marginTop: "4px"}}/> : null}
                        {props.thread.locked ? <img draggable={false} className="forum-thread-icon" src={lock}/> : null}
                        <span className="forum-thread-title" onClick={threadPage} onAuxClick={threadPage}>{props.thread.title}</span>
                    </div>
                    <div className="forum-thread-row">
                        {generateCreatorJSX()}
                    </div>
                    <div className="forum-thread-row">
                        {generateUpdaterJSX()}
                    </div>
                    <div className="forum-thread-row">
                        {dateTextJSX()}
                    </div>
                </td>
            </div>
        </tr>
    )
}

export default ForumThread