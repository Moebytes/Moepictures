import React, {useEffect, useContext, useState, useReducer, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import favicon from "../assets/purple/favicon.png"
import faviconMagenta from "../assets/magenta/favicon.png"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext, CommentSearchFlagContext,
HeaderTextContext, SidebarTextContext, SessionContext, RedirectContext, SessionFlagContext, UserImgContext, ShowDeleteAccountDialogContext} from "../Context"
import functions from "../structures/Functions"
import Carousel from "../components/Carousel"
import "./styles/userpage.less"
import axios from "axios"

interface Props {
    match?: any
}

const UserPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {showDeleteAccountDialog, setShowDeleteAccountDialog} = useContext(ShowDeleteAccountDialogContext)
    const {commentSearchFlag, setCommentSearchFlag} = useContext(CommentSearchFlagContext)
    const [uploadIndex, setUploadIndex] = useState(0)
    const [favoriteIndex, setFavoriteIndex] = useState(0) as any
    const [uploads, setUploads] = useState([]) as any
    const [favorites, setFavorites] = useState([]) as any
    const [uploadImages, setUploadImages] = useState([]) as any
    const [favoriteImages, setFavoriteImages] = useState([]) as any
    const [user, setUser] = useState(null) as any
    const history = useHistory()
    const username = props?.match.params.username

    const fetchUser = async () => {
        const user = await axios.get("/api/user", {params: {username}}).then((r) => r.data)
        if (!user) return history.push("/404")
        setUser(user)
    }

    useEffect(() => {
        fetchUser()
    }, [])

    const updateUploads = async () => {
        const uploads = await axios.get("/api/user/uploads", {params: {username}, withCredentials: true}).then((r) => r.data)
        const images = uploads.map((p: any) => functions.getImageLink(p.images[0].type, p.postID, p.images[0].filename))
        setUploads(uploads)
        setUploadImages(images)
    }

    const updateFavorites = async () => {
        const favorites = await axios.get("/api/user/favorites", {params: {username}, withCredentials: true}).then((r) => r.data)
        const images = favorites.map((f: any) => functions.getImageLink(f.post.images[0].type, f.postID, f.post.images[0].filename))
        setFavorites(favorites)
        setFavoriteImages(images)
    }

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = `Moebooru: ${functions.toProperCase(username)}`
        updateUploads()
        updateFavorites()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const setUp = (img: string, index: number) => {
        setUploadIndex(index)
        const postID = uploads[index].postID
        history.push(`/post/${postID}`)
    }

    const setFav = (img: string, index: number) => {
        setFavoriteIndex(index)
        const postID = favorites[index].postID
        history.push(`/post/${postID}`)
    }

    const getFavicon = () => {
        if (theme.includes("magenta")) return faviconMagenta 
        return favicon
    }

    const getUserImg = () => {
        if (!user) return ""
        return user.image ? functions.getTagLink("pfp", user.image) : getFavicon()
    }

    const generateFavoritesJSX = () => {
        if (!user) return null
        if (user.publicFavorites) {
            if (!favorites.length) return null
            return (
                <div className="user-column">
                    <span className="user-text">Favorites <span className="user-text-alt">{favorites.length}</span></span>
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

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                {user ?
                <div className="user">
                    <div className="user-top-container">
                        <img className="user-img" src={getUserImg()}/>
                        <span className="user-name">{functions.toProperCase(username)}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">Bio: {user.bio || "This user has not written anything."}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">Join Date: {functions.formatDate(new Date(user.joinDate || ""))}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-link" onClick={viewComments}>View Comments</span>
                    </div>
                    {generateFavoritesJSX()}
                    {uploads.length ?
                    <div className="user-column">
                        <span className="user-text">Uploads <span className="user-text-alt">{uploads.length}</span></span>
                        <Carousel images={uploadImages} noKey={true} set={setUp} index={uploadIndex}/>
                    </div> : null}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UserPage