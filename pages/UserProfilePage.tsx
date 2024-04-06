import React, {useEffect, useContext, useState, useReducer, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import uploadPfpIcon from "../assets/icons/uploadpfp.png"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext,
HeaderTextContext, SidebarTextContext, SessionContext, RedirectContext, SessionFlagContext, UserImgContext, ShowDeleteAccountDialogContext,
CommentSearchFlagContext, SiteHueContext, SiteLightnessContext, UserImgPostContext, SiteSaturationContext} from "../Context"
import fileType from "magic-bytes.js"
import functions from "../structures/Functions"
import Carousel from "../components/Carousel"
import CommentCarousel from "../components/CommentCarousel"
import DeleteAccountDialog from "../dialogs/DeleteAccountDialog"
import adminLabel from "../assets/icons/admin-label.png"
import modLabel from "../assets/icons/mod-label.png"
import permissions from "../structures/Permissions"
import "./styles/userprofilepage.less"
import axios from "axios"

const UserProfilePage: React.FunctionComponent = (props) => {
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
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {userImg, setUserImg} = useContext(UserImgContext)
    const {userImgPost, setUserImgPost} = useContext(UserImgPostContext)
    const {showDeleteAccountDialog, setShowDeleteAccountDialog} = useContext(ShowDeleteAccountDialogContext)
    const {commentSearchFlag, setCommentSearchFlag} = useContext(CommentSearchFlagContext)
    const bioRef = useRef<any>(null)
    const errorRef = useRef<any>(null)
    const [error, setError] = useState(false)
    const [showBioInput, setShowBioInput] = useState(false)
    const [uploadIndex, setUploadIndex] = useState(0)
    const [favoriteIndex, setFavoriteIndex] = useState(0) as any
    const [uploads, setUploads] = useState([]) as any
    const [favorites, setFavorites] = useState([]) as any
    const [comments, setComments] = useState([]) as any
    const [uploadImages, setUploadImages] = useState([]) as any
    const [favoriteImages, setFavoriteImages] = useState([]) as any
    const [bio, setBio] = useState("")
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateUploads = async () => {
        const uploads = await axios.get("/api/user/uploads", {withCredentials: true}).then((r) => r.data)
        const filtered = uploads.filter((u: any) => u.post?.restrict !== "explicit")
        const images = filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny"))
        setUploads(filtered)
        setUploadImages(images)
    }

    const updateFavorites = async () => {
        const favorites = await axios.get("/api/user/favorites", {withCredentials: true}).then((r) => r.data)
        const filtered = favorites.filter((f: any) => f.post?.restrict !== "explicit")
        const images = filtered.map((f: any) => functions.getThumbnailLink(f.post.images[0].type, f.postID, f.post.images[0].order, f.post.images[0].filename, "tiny"))
        setFavorites(filtered)
        setFavoriteImages(images)
    }

    const updateComments = async () => {
        const comments = await axios.get("/api/user/comments", {params: {sort: "date"}, withCredentials: true}).then((r) => r.data)
        setComments(comments)
    }

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: User Profile"
        updateUploads()
        updateFavorites()
        updateComments()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/profile")
            history.push("/login")
            setSidebarText("Login required.")
        } else {
            setBio(session.bio)
        }
    }, [session])

    const uploadPfp = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                const bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                if (jpg || png || gif || webp) {
                    const MB = file.size / (1024*1024)
                    const maxSize = jpg ? 10 :
                                    png ? 10 :
                                    webp ? 10 :
                                    gif ? 25 : 25
                    if (MB <= maxSize) {
                        const url = URL.createObjectURL(file)
                        let croppedURL = ""
                        if (gif) {
                            const gifData = await functions.extractGIFFrames(url)
                            let frameArray = [] as any 
                            let delayArray = [] as any
                            for (let i = 0; i < gifData.length; i++) {
                                const canvas = gifData[i].frame as HTMLCanvasElement
                                const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                                frameArray.push(cropped)
                                delayArray.push(gifData[i].delay)
                            }
                            const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1)
                            const {width, height} = await functions.imageDimensions(firstURL)
                            const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                            const blob = new Blob([buffer])
                            croppedURL = URL.createObjectURL(blob)
                        } else {
                            croppedURL = await functions.crop(url, 1)
                        }
                        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                        const bytes = Object.values(new Uint8Array(arrayBuffer))
                        await axios.post("/api/user/updatepfp", {bytes}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
                        setUserImg("")
                        setSessionFlag(true)
                    }
                }
            }
            fileReader.readAsArrayBuffer(file)
        })
        event.target.value = ""
    }

    const favoritesPrivacy = async () => {
        await axios.post("/api/user/favoritesprivacy", null, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        setSessionFlag(true)
    }

    const changeBio = async () => {
        const badBio = functions.validateBio(bio)
        if (badBio) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badBio
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/user/changebio", {bio}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSessionFlag(true)
            setError(false)
            setShowBioInput(false)
        } catch {
            errorRef.current!.innerText = "Bad bio."
            await functions.timeout(2000)
            setError(false)
        }
    }

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

    const deleteAccountDialog = () => {
        setShowDeleteAccountDialog((prev: boolean) => !prev)
    }

    const viewComments = () => {
        history.push("/comments")
        setCommentSearchFlag(`user:${session.username}`)
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!userImgPost) return
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${userImgPost}`, "_blank")
        } else {
            history.push(`/post/${userImgPost}`)
        }
    }

    const generateUsernameJSX = () => {
        if (session.role === "admin") {
            return (
                <div className="userprofile-name-container">
                    <span className="userprofile-name-plain admin-color">{functions.toProperCase(session.username)}</span>
                    <img className="userprofile-name-label" src={adminLabel}/>
                </div>
            )
        } else if (session.role === "mod") {
            return (
                <div className="userprofile-name-container">
                    <span className="userprofile-name-plain mod-color">{functions.toProperCase(session.username)}</span>
                    <img className="userprofile-name-label" src={modLabel}/>
                </div>
            )
        }
        return <span className="userprofile-name">{functions.toProperCase(session.username)}</span>
    }

    return (
        <>
        <DragAndDrop/>
        <DeleteAccountDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="userprofile">
                    <div className="userprofile-top-container">
                        <img className="userprofile-img" src={userImg} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateUsernameJSX()}
                        {permissions.isElevated(session) && <>
                        <label htmlFor="upload-pfp" className="uploadpfp-label">
                            <img className="userprofile-uploadimg" src={uploadPfpIcon} style={{filter: getFilter()}}/>
                        </label>
                        <input id="upload-pfp" type="file" onChange={(event) => uploadPfp(event)}/>
                        </>}
                    </div>
                    <div className="userprofile-row">
                        <span className="userprofile-text">Email: {session.email}</span>
                    </div>
                    <div className="userprofile-row">
                        <span className="userprofile-text">Join Date: {functions.prettyDate(new Date(session.joinDate))}</span>
                    </div>
                    <div className="userprofile-row">
                        <span className="userprofile-text">Bio: {session.bio || "This user has not written anything."}</span>
                    </div>
                    <div className="userprofile-row">
                        <span className="userprofile-link" onClick={() => setShowBioInput((prev) => !prev)}>Update Bio</span>
                    </div>
                    {showBioInput ?
                    <div className="userprofile-column">
                        <textarea ref={bioRef} className="userprofile-textarea" spellCheck={false} value={bio} onChange={(event) => setBio(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                        {error ? <div className="userprofile-validation-container"><span className="userprofile-validation" ref={errorRef}></span></div> : null}
                        <button className="userprofile-button" onClick={changeBio}>Ok</button>
                    </div> : null}
                    {/*<div className="userprofile-row">
                        <span className="userprofile-link" onClick={viewComments}>View Comments</span>
                    </div>*/}
                    <div className="userprofile-row">
                        <span className="userprofile-text">Favorites Privacy: <span className="userprofile-text-action" onClick={favoritesPrivacy}>{session.publicFavorites ? "Public" : "Private"}</span></span>
                    </div>
                    <Link to="/change-username" className="userprofile-row">
                        <span className="userprofile-link">Change Username</span>
                    </Link>
                    <Link to="/change-email" className="userprofile-row">
                        <span className="userprofile-link">Change Email</span>
                    </Link>
                    <Link to="/change-password" className="userprofile-row">
                        <span className="userprofile-link">Change Password</span>
                    </Link>
                    <Link to="/enable-2fa" className="userprofile-row">
                        <span className="userprofile-link">{session.$2fa ? "Disable" : "Enable"} 2-Factor Authentication</span>
                    </Link>
                    {favorites.length ?
                    <div className="userprofile-column">
                        <span className="userprofile-text">Favorites <span className="userprofile-text-alt">{favorites.length}</span></span>
                        <Carousel images={favoriteImages} noKey={true} set={setFav} index={favoriteIndex}/>
                    </div> : null}
                    {uploads.length ?
                    <div className="userprofile-column">
                        <span className="userprofile-text">Uploads <span className="userprofile-text-alt">{uploads.length}</span></span>
                        <Carousel images={uploadImages} noKey={true} set={setUp} index={uploadIndex}/>
                    </div> : null}
                    {comments.length ?
                    <div className="userprofile-column">
                        <span className="userprofile-text">Comments <span className="userprofile-text-alt">{comments.length}</span></span>
                        <CommentCarousel comments={comments}/>
                    </div> : null}
                    <div className="userprofile-row">
                        <span className="userprofile-link" onClick={deleteAccountDialog}>Delete Account</span>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UserProfilePage