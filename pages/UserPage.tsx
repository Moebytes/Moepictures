import React, {useEffect, useContext, useState, useReducer, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext, CommentSearchFlagContext,
HeaderTextContext, SidebarTextContext, SessionContext, RedirectContext, SessionFlagContext, ShowDeleteAccountDialogContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext, BanNameContext, UnbanNameContext, UpdateUserFlagContext, DMTargetContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import Carousel from "../components/Carousel"
import CommentCarousel from "../components/CommentCarousel"
import adminLabel from "../assets/icons/admin-label.png"
import modLabel from "../assets/icons/mod-label.png"
import systemLabel from "../assets/icons/system-label.png"
import banIcon from "../assets/icons/ban.png"
import unbanIcon from "../assets/icons/unban.png"
import dmIcon from "../assets/icons/dm.png"
import BanDialog from "../dialogs/BanDialog"
import DMDialog from "../dialogs/DMDialog"
import UnbanDialog from "../dialogs/UnbanDialog"
import "./styles/userpage.less"
import axios from "axios"

interface Props {
    match?: any
}

const UserPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {updateUserFlag, setUpdateUserFlag} = useContext(UpdateUserFlagContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {showDeleteAccountDialog, setShowDeleteAccountDialog} = useContext(ShowDeleteAccountDialogContext)
    const {commentSearchFlag, setCommentSearchFlag} = useContext(CommentSearchFlagContext)
    const {banName, setBanName} = useContext(BanNameContext)
    const {unbanName, setUnbanName} = useContext(UnbanNameContext)
    const {dmTarget, setDMTarget} = useContext(DMTargetContext)
    const [uploadIndex, setUploadIndex] = useState(0)
    const [favoriteIndex, setFavoriteIndex] = useState(0) as any
    const [uploads, setUploads] = useState([]) as any
    const [favorites, setFavorites] = useState([]) as any
    const [comments, setComments] = useState([]) as any
    const [uploadImages, setUploadImages] = useState([]) as any
    const [favoriteImages, setFavoriteImages] = useState([]) as any
    const [user, setUser] = useState(null) as any
    const [defaultIcon, setDefaultIcon] = useState(false)
    const history = useHistory()
    const username = props?.match.params.username

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const fetchUser = async () => {
        const user = await axios.get("/api/user", {params: {username}}).then((r) => r.data)
        if (!user) return history.push("/404")
        setUser(user)
        setDefaultIcon(user.image ? false : true)
        forceUpdate()
    }

    useEffect(() => {
        fetchUser()
        updateUploads()
        updateFavorites()
        updateComments()
    }, [username])

    const updateUploads = async () => {
        const uploads = await axios.get("/api/user/uploads", {params: {username}, withCredentials: true}).then((r) => r.data)
        const filtered = uploads.filter((u: any) => u.post?.restrict !== "explicit")
        const images = filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny"))
        setUploads(filtered)
        setUploadImages(images)
    }

    const updateFavorites = async () => {
        const favorites = await axios.get("/api/user/favorites", {params: {username}, withCredentials: true}).then((r) => r.data)
        const filtered = favorites.filter((f: any) => f.post?.restrict !== "explicit")
        const images = filtered.map((f: any) => functions.getThumbnailLink(f.post.images[0].type, f.postID, f.post.images[0].order, f.post.images[0].filename, "tiny"))
        setFavorites(filtered)
        setFavoriteImages(images)
    }

    const updateComments = async () => {
        const comments = await axios.get("/api/user/comments", {params: {username, sort: "date"}, withCredentials: true}).then((r) => r.data)
        setComments(comments)
    }

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = `${functions.toProperCase(username)}`
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const setUp = (img: string, index: number, newTab: boolean) => {
        setUploadIndex(index)
        const postID = uploads[index].postID
        if (newTab) {
            window.open(`/post/${postID}`, "_blank")
        } else {
            history.push(`/post/${postID}`)
        }
    }

    const setFav = (img: string, index: number, newTab: boolean) => {
        setFavoriteIndex(index)
        const postID = favorites[index].postID
        if (newTab) {
            window.open(`/post/${postID}`, "_blank")
        } else {
            history.push(`/post/${postID}`)
        }
    }

    const getUserImg = () => {
        if (!user) return ""
        return user.image ? functions.getTagLink("pfp", user.image) : favicon
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!user?.imagePost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${user.imagePost}`, "_blank")
        } else {
            history.push(`/post/${user.imagePost}`)
        }
    }

    const generateFavoritesJSX = () => {
        if (!user) return null
        if (user.publicFavorites) {
            if (!favorites.length) return null
            return (
                <div className="user-column">
                    <span className="user-title">Favorites <span className="user-text-alt">{favorites.length}</span></span>
                    <Carousel images={favoriteImages} noKey={true} set={setFav} index={favoriteIndex}/>
                </div> 
            )
        } else {
            return (
                <div className="user-column">
                    <span className="user-text">Favorites: <span className="user-text-alt">Private</span></span>
                </div>
            )
        }
    }

    const viewComments = () => {
        history.push("/comments")
        setCommentSearchFlag(`user:${username}`)
    }

    const generateUsernameJSX = () => {
        if (user?.role === "admin") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain admin-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={adminLabel}/>
                </div>
            )
        } else if (user?.role === "mod") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain mod-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={modLabel}/>
                </div>
            )
        } else if (user?.role === "system") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain system-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={systemLabel}/>
                </div>
            )
        }
        return <span className={`user-name ${user.banned ? "banned" : ""}`}>{functions.toProperCase(username)}</span>
    }

    const banDialog = () => {
        if (user.banned) {
            setUnbanName(username)
        } else {
            setBanName(username)
        }
    }

    const dmDialog = () => {
        setDMTarget(username)
    }

    useEffect(() => {
        if (updateUserFlag) {
            fetchUser()
            setUpdateUserFlag(false)
        }
    }, [updateUserFlag])

    return (
        <>
        <DragAndDrop/>
        <DMDialog/>
        <BanDialog/>
        <UnbanDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                {user ?
                <div className="user">
                    <div className="user-top-container">
                        <img className="user-img" src={getUserImg()} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: defaultIcon ? getFilter() : ""}}/>
                        {generateUsernameJSX()}
                        {session.username && (session.username !== username) ? <img className="user-icon" src={dmIcon} onClick={dmDialog}/> : null}
                        {permissions.isElevated(session) && !permissions.isElevated(user)? <img className="user-icon" src={user.banned ? unbanIcon : banIcon} onClick={banDialog}/> : null}
                    </div>
                    {user.banned ? <span className="user-ban-text">Banned</span> : null}
                    <div className="user-row">
                        <span className="user-text">Bio: {user.bio || "This user has not written anything."}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">Join Date: {functions.prettyDate(new Date(user.joinDate || ""))}</span>
                    </div>
                    {generateFavoritesJSX()}
                    {uploads.length ?
                    <div className="user-column">
                        <span className="user-title">Uploads <span className="user-text-alt">{uploads.length}</span></span>
                        <Carousel images={uploadImages} noKey={true} set={setUp} index={uploadIndex}/>
                    </div> : null}
                    {comments.length ?
                    <div className="userprofile-column">
                        <span className="userprofile-title">Comments <span className="userprofile-text-alt">{comments.length}</span></span>
                        <CommentCarousel comments={comments}/>
                    </div> : null}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UserPage