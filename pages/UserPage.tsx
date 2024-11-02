import React, {useEffect, useContext, useState, useReducer, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/icons/favicon.png"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext, CommentSearchFlagContext, PostsContext,
HeaderTextContext, SidebarTextContext, SessionContext, RedirectContext, SessionFlagContext, ShowDeleteAccountDialogContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext, BanNameContext, UnbanNameContext, PromoteNameContext, UpdateUserFlagContext, DMTargetContext, RestrictTypeContext, SearchContext, SearchFlagContext,
ActiveFavgroupContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import Carousel from "../components/Carousel"
import CommentCarousel from "../components/CommentCarousel"
import adminLabel from "../assets/icons/admin-label.png"
import modLabel from "../assets/icons/mod-label.png"
import systemLabel from "../assets/icons/system-label.png"
import premiumLabel from "../assets/icons/premium-label.png"
import contributorLabel from "../assets/icons/contributor-label.png"
import premiumContributorLabel from "../assets/icons/premium-contributor-label.png"
import curatorLabel from "../assets/icons/curator-label.png"
import premiumCuratorLabel from "../assets/icons/premium-curator-label.png"
import banIcon from "../assets/icons/ban.png"
import unbanIcon from "../assets/icons/unban.png"
import promoteIcon from "../assets/icons/promote.png"
import dmIcon from "../assets/icons/dm.png"
import BanDialog from "../dialogs/BanDialog"
import SendMessageDialog from "../dialogs/SendMessageDialog"
import UnbanDialog from "../dialogs/UnbanDialog"
import PromoteDialog from "../dialogs/PromoteDialog"
import "./styles/userpage.less"

interface Props {
    match?: any
}

let limit = 25

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
    const {promoteName, setPromoteName} = useContext(PromoteNameContext)
    const {dmTarget, setDMTarget} = useContext(DMTargetContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [uploadIndex, setUploadIndex] = useState(0)
    const [favoriteIndex, setFavoriteIndex] = useState(0) as any
    const [uploads, setUploads] = useState([]) as any
    const [appendUploadImages, setAppendUploadImages] = useState([]) as any
    const [favorites, setFavorites] = useState([]) as any
    const [appendFavoriteImages, setAppendFavoriteImages] = useState([]) as any
    const {activeFavgroup, setActiveFavgroup} = useContext(ActiveFavgroupContext)
    const [comments, setComments] = useState([]) as any
    const [favgroups, setFavgroups] = useState([]) as any
    const [uploadImages, setUploadImages] = useState([]) as any
    const [favoriteImages, setFavoriteImages] = useState([]) as any
    const [user, setUser] = useState(null) as any
    const [defaultIcon, setDefaultIcon] = useState(false)
    const {posts, setPosts} = useContext(PostsContext)
    const [counts, setCounts] = useState(null as any)
    const history = useHistory()
    const username = props?.match.params.username

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const fetchUser = async () => {
        const user = await functions.get("/api/user", {username}, session, setSessionFlag)
        if (!user) return functions.replaceLocation("/404")
        setUser(user)
        setDefaultIcon(user.image ? false : true)
        forceUpdate()
    }

    const updateUploads = async () => {
        let restrict = restrictType === "explicit" ? "explicit" : "all"
        const uploads = await functions.get("/api/user/uploads", {username, restrict}, session, setSessionFlag)
        const images = uploads.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny"))
        setUploads(uploads)
        setUploadImages(images)
    }

    const updateUploadOffset = async () => {
        const newUploads = uploads
        let offset = newUploads.length
        let restrict = restrictType === "explicit" ? "explicit" : "all"
        const result = await functions.get("/api/user/uploads", {limit, restrict, offset}, session, setSessionFlag)
        newUploads.push(...result)
        const images = result.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "large"))
        setUploads(newUploads)
        setAppendUploadImages(images)
    }

    const updateFavorites = async () => {
        let restrict = restrictType === "explicit" ? "explicit" : "all"
        const favorites = await functions.get("/api/user/favorites", {username, restrict}, session, setSessionFlag)
        const images = favorites.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
        setFavorites(favorites)
        setFavoriteImages(images)
    }

    const updateFavoriteOffset = async () => {
        const newFavorites = favorites
        let offset = newFavorites.length
        let restrict = restrictType === "explicit" ? "explicit" : "all"
        const result = await functions.get("/api/user/favorites", {limit, restrict, offset}, session, setSessionFlag)
        newFavorites.push(...result)
        const images = result.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
        setFavorites(newFavorites)
        setAppendFavoriteImages(images)
    }

    const updateFavgroups = async () => {
        const favgroups = await functions.get("/api/user/favgroups", null, session, setSessionFlag)
        setFavgroups(favgroups)
    }

    const updateComments = async () => {
        const comments = await functions.get("/api/user/comments", {username, sort: "date"}, session, setSessionFlag)
        let filtered = comments.filter((c: any) => restrictType === "explicit" ? c.post?.restrict === "explicit" : c.post?.restrict !== "explicit")
        setComments(filtered)
    }

    const updateCounts = async () => {
        const counts = await functions.get("/api/user/edit/counts", {username}, session, setSessionFlag)
        setCounts(counts)
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
        fetchUser()
        updateUploads()
        updateFavorites()
        updateFavgroups()
        updateComments()
        updateCounts()
    }, [username, restrictType, session])

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
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(uploads)
    }

    const setFav = (img: string, index: number, newTab: boolean) => {
        setFavoriteIndex(index)
        const postID = favorites[index].postID
        if (newTab) {
            window.open(`/post/${postID}`, "_blank")
        } else {
            history.push(`/post/${postID}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(favorites)
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

    const viewFavorites = () => {
        history.push("/posts")
        setSearch(`favorites:${user.username}`)
        setSearchFlag(true)
    }

    const viewUploads = () => {
        history.push("/posts")
        setSearch(`uploads:${user.username}`)
        setSearchFlag(true)
    }

    const viewComments = () => {
        history.push("/comments")
        setCommentSearchFlag(`user:${user.username}`)
    }

    const generateFavoritesJSX = () => {
        if (!user) return null
        if (user.publicFavorites) {
            if (!favorites.length) return null
            return (
                <div className="user-column">
                    <span className="user-title" onClick={viewFavorites}>Favorites <span className="user-text-alt">{favorites[0].postCount}</span></span>
                    <Carousel images={favoriteImages} noKey={true} set={setFav} index={favoriteIndex} update={updateFavoriteOffset} appendImages={appendFavoriteImages}/>
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
        } else if (user?.role === "premium-curator") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain curator-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={premiumCuratorLabel}/>
                </div>
            )
        } else if (user?.role === "curator") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain curator-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={curatorLabel}/>
                </div>
            )
        } else if (user?.role === "premium-contributor") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain premium-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={premiumContributorLabel}/>
                </div>
            )
        } else if (user?.role === "contributor") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain contributor-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={contributorLabel}/>
                </div>
            )
        } else if (user?.role === "premium") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain premium-color">{functions.toProperCase(username)}</span>
                    <img className="user-name-label" src={premiumLabel}/>
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

    const promoteDialog = () => {
        setPromoteName(username)
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

    const banJSX = () => {
        if (!user.banned) return null
        if (user.banExpiration && new Date(user.banExpiration) > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-ban-text">Banned for {functions.timeUntil(user.banExpiration)}</span>
                </div>
            )
        } else {
            return <span className="user-ban-text">Banned</span>
        }
    }

    const generateFavgroupsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < favgroups.length; i++) {
            let favgroup = favgroups[i]
            if (favgroup.private) continue
            if (restrictType === "explicit") {
                if (favgroup.restrict !== "explicit") continue
            } else {
                if (favgroup.restrict === "explicit") continue
            }
            const images = favgroup.posts.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
            const viewFavgroup = () => {
                history.push(`/favgroup/${username}/${favgroup.slug}`)
            }
            const setFavgroup = (img: string, index: number, newTab: boolean) => {
                const postID = favgroup.posts[index].postID
                if (newTab) {
                    window.open(`/post/${postID}`, "_blank")
                } else {
                    history.push(`/post/${postID}`)
                }
                window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
                setPosts(favgroup.posts)
                setTimeout(() => {
                    setActiveFavgroup(favgroup)
                }, 200)
            }
            jsx.push(
                <div className="user-column">
                    <div className="user-title-container">
                        <span className="user-title" onClick={viewFavgroup}>{favgroup.name} <span className="user-text-alt">{favgroup.postCount}</span></span>
                    </div>
                    <Carousel images={images} noKey={true} set={setFavgroup} index={0}/>
                </div>
            )
        }
        return jsx
    }

    return (
        <>
        <SendMessageDialog/>
        <BanDialog/>
        <UnbanDialog/>
        <PromoteDialog/>
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
                        {session.username && (session.username !== username) && user.role !== "system" && !session.banned ? <img className="user-icon" src={dmIcon} onClick={dmDialog}/> : null}
                        {permissions.isMod(session) && !permissions.isMod(user) ? <img className="user-icon" src={user.banned ? unbanIcon : banIcon} onClick={banDialog}/> : null}
                        {permissions.isAdmin(session) && (session.username !== username) ? <img className="user-icon" src={promoteIcon} onClick={promoteDialog}/> : null}
                    </div>
                    {banJSX()}
                    <div className="user-row">
                        <span className="user-text">Bio: {user.bio || "This user has not written anything."}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">Join Date: {functions.prettyDate(new Date(user.joinDate || ""))}</span>
                    </div>
                    {counts ? <>
                    {counts.postEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${username}/post/history`)}>Post Edits <span className="user-text-alt">{counts.postEdits}</span></span>
                    </div>  : null}
                    {counts.tagEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${username}/tag/history`)}>Tag Edits <span className="user-text-alt">{counts.tagEdits}</span></span>
                    </div> : null}
                    {counts.translationEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${username}/translation/history`)}>Translation Edits <span className="user-text-alt">{counts.translationEdits}</span></span>
                    </div> : null}
                    {counts.groupEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${username}/group/history`)}>Group Edits <span className="user-text-alt">{counts.groupEdits}</span></span>
                    </div> : null}
                    </> : null}
                    {generateFavgroupsJSX()}
                    {generateFavoritesJSX()}
                    {uploads.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewUploads}>Uploads <span className="user-text-alt">{uploads[0].postCount}</span></span>
                        <Carousel images={uploadImages} noKey={true} set={setUp} index={uploadIndex} update={updateUploadOffset} appendImages={appendUploadImages}/>
                    </div> : null}
                    {comments.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewComments}>Comments <span className="user-text-alt">{comments.length}</span></span>
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