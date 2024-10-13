import React, {useEffect, useContext, useState, useReducer, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import uploadPfpIcon from "../assets/icons/uploadpfp.png"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RelativeContext, HideTitlebarContext, MobileContext, RestrictTypeContext,
HeaderTextContext, SidebarTextContext, SessionContext, RedirectContext, SessionFlagContext, UserImgContext, ShowDeleteAccountDialogContext, PostsContext,
CommentSearchFlagContext, SiteHueContext, SiteLightnessContext, UserImgPostContext, SiteSaturationContext, R18ConfirmationContext, SearchContext, SearchFlagContext,
PremiumRequiredContext} from "../Context"
import functions from "../structures/Functions"
import Carousel from "../components/Carousel"
import CommentCarousel from "../components/CommentCarousel"
import DeleteAccountDialog from "../dialogs/DeleteAccountDialog"
import R18Dialog from "../dialogs/R18Dialog"
import adminLabel from "../assets/icons/admin-label.png"
import modLabel from "../assets/icons/mod-label.png"
import systemLabel from "../assets/icons/system-label.png"
import premiumLabel from "../assets/icons/premium-label.png"
import permissions from "../structures/Permissions"
import premiumStar from "../assets/icons/premiumStar.png"
import r18 from "../assets/icons/r18.png"
import danger from "../assets/icons/danger.png"
import "./styles/userprofilepage.less"

let intervalTimer = null as any
let limit = 25

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
    const {premiumRequired, setPremiumRequired} = useContext(PremiumRequiredContext)
    const {r18Confirmation, setR18Confirmation} = useContext(R18ConfirmationContext)
    const {showDeleteAccountDialog, setShowDeleteAccountDialog} = useContext(ShowDeleteAccountDialogContext)
    const {commentSearchFlag, setCommentSearchFlag} = useContext(CommentSearchFlagContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {posts, setPosts} = useContext(PostsContext)
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
    const [appendUploadImages, setAppendUploadImages] = useState([]) as any
    const [favoriteImages, setFavoriteImages] = useState([]) as any
    const [appendFavoriteImages, setAppendFavoriteImages] = useState([]) as any
    const [banReason, setBanReason] = useState("")
    const [bio, setBio] = useState("")
    const [interval, setInterval] = useState("")
    const [init, setInit] = useState(true)
    const history = useHistory()

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const updateBanReason = async () => {
        const ban = await functions.get("/api/user/ban", {username: session.username}, session, setSessionFlag)
        if (ban?.reason) setBanReason(ban.reason)
    }

    useEffect(() => {
        if (session.banned) updateBanReason()
    }, [session])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateUploads = async () => {
        const uploads = await functions.get("/api/user/uploads", {limit}, session, setSessionFlag)
        let filtered = uploads.filter((u: any) => restrictType === "explicit" ? u.restrict === "explicit" : u.restrict !== "explicit")
        if (!permissions.isElevated(session)) filtered = filtered.filter((u: any) => !u.hidden)
        const images = filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny"))
        setUploads(filtered)
        setUploadImages(images)
    }

    const updateUploadOffset = async () => {
        const newUploads = uploads
        let offset = newUploads.length
        const result = await functions.get("/api/user/uploads", {limit, offset}, session, setSessionFlag)
        newUploads.push(...result)
        let filtered = newUploads.filter((u: any) => restrictType === "explicit" ? u.post?.restrict === "explicit" : u.post?.restrict !== "explicit")
        if (!permissions.isElevated(session)) filtered = filtered.filter((u: any) => !u.hidden)
        const images = filtered.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "large"))
        setUploads(filtered)
        setAppendUploadImages(images)
    }

    const updateFavorites = async () => {
        const favorites = await functions.get("/api/user/favorites", {limit}, session, setSessionFlag)
        let filtered = favorites.filter((f: any) => restrictType === "explicit" ? f.restrict === "explicit" : f.restrict !== "explicit")
        if (!permissions.isElevated(session)) filtered = filtered.filter((f: any) => !f.hidden)
        const images = filtered.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
        setFavorites(filtered)
        setFavoriteImages(images)
    }

    const updateFavoriteOffset = async () => {
        const newFavorites = favorites
        let offset = newFavorites.length
        const result = await functions.get("/api/user/favorites", {limit, offset}, session, setSessionFlag)
        newFavorites.push(...result)
        let filtered = favorites.filter((f: any) => restrictType === "explicit" ? f.restrict === "explicit" : f.restrict !== "explicit")
        if (!permissions.isElevated(session)) filtered = filtered.filter((f: any) => !f.hidden)
        const images = filtered.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
        setFavorites(filtered)
        setAppendFavoriteImages(images)
    }

    const updateComments = async () => {
        const comments = await functions.get("/api/user/comments", {sort: "date"}, session, setSessionFlag)
        let filtered = comments.filter((c: any) => restrictType === "explicit" ? c.post?.restrict === "explicit" : c.post?.restrict !== "explicit")
        if (!permissions.isElevated(session)) filtered = filtered.filter((c: any) => !c.post?.hidden)
        setComments(filtered)
    }

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        document.title = "User Profile"
    }, [])

    useEffect(() => {
        updateUploads()
        updateFavorites()
        updateComments()
    }, [session])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (session) {
        }
    }, [])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/profile")
            history.push("/login")
            setSidebarText("Login required.")
        } else {
            setBio(session.bio)
            if (init) {
                setInterval(Math.floor(Number(session.autosearchInterval || 3000) / 1000).toString())
                setInit(false)
            }
        }
    }, [session, init])

    const uploadPfp = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                const bytes = new Uint8Array(f.target.result)
                const result = functions.bufferFileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                const avif = result?.mime === "image/avif"
                if (jpg || png || gif || webp || avif) {
                    const MB = file.size / (1024*1024)
                    const maxSize = jpg ? 10 :
                                    png ? 10 :
                                    avif ? 10 :
                                    gif ? 25 : 25
                                    webp ? 25 : 25
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
                        await functions.post("/api/user/pfp", {bytes}, session, setSessionFlag)
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
        await functions.post("/api/user/favoritesprivacy", null, session, setSessionFlag)
        setSessionFlag(true)
    }

    const showRelated = async () => {
        await functions.post("/api/user/showrelated", null, session, setSessionFlag)
        setSessionFlag(true)
    }

    const showTooltips = async () => {
        await functions.post("/api/user/showtooltips", null, session, setSessionFlag)
        setSessionFlag(true)
    }

    const showTagBanner = async () => {
        await functions.post("/api/user/showtagbanner", null, session, setSessionFlag)
        setSessionFlag(true)
    }

    const downloadPixivID = async () => {
        await functions.post("/api/user/downloadpixivid", null, session, setSessionFlag)
        setSessionFlag(true)
    }

    const showR18 = async () => {
        if (session.showR18) {
            await functions.post("/api/user/r18", {r18: false}, session, setSessionFlag)
            setSessionFlag(true)
        } else {
            setR18Confirmation(true)
        }
    }

    const upscaledImages = async () => {
        if (permissions.isPremium(session)) {
            await functions.post("/api/user/upscaledimages", null, session, setSessionFlag)
            setSessionFlag(true)
        } else {
            setPremiumRequired(true)
        }
    }

    useEffect(() => {
        const autosearchInterval = async () => {
            clearTimeout(intervalTimer) 
            intervalTimer = setTimeout(() => {
                functions.post("/api/user/autosearchinterval", {interval}, session, setSessionFlag)
                .then(() => setSessionFlag(true))
            }, 1000)
        }
        autosearchInterval()
    }, [interval])

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
            await functions.post("/api/user/changebio", {bio}, session, setSessionFlag)
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

    const deleteAccountDialog = () => {
        setShowDeleteAccountDialog((prev: boolean) => !prev)
    }

    const viewFavorites = () => {
        history.push("/posts")
        setSearch(`favorites:${session.username}`)
        setSearchFlag(true)
    }

    const viewUploads = () => {
        history.push("/posts")
        setSearch(`uploads:${session.username}`)
        setSearchFlag(true)
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
        } else if (session.role === "system") {
            return (
                <div className="userprofile-name-container">
                    <span className="userprofile-name-plain system-color">{functions.toProperCase(session.username)}</span>
                    <img className="userprofile-name-label" src={systemLabel}/>
                </div>
            )
        } else if (session.role === "premium") {
            return (
                <div className="userprofile-name-container">
                    <span className="userprofile-name-plain premium-color">{functions.toProperCase(session.username)}</span>
                    <img className="userprofile-name-label" src={premiumLabel}/>
                </div>
            )
        }
        return <span className={`userprofile-name ${session.banned ? "banned" : ""}`}>{functions.toProperCase(session.username)}</span>
    }

    const getBanText = () => {
        if (banReason) return `You are banned for reason: ${banReason}`
        return "You are banned"
    }

    const changeUsername = () => {
        if (permissions.isPremium(session)) {
            history.push("/change-username")
        } else {
            setPremiumRequired(true)
        }
    }

    const clearPfp = async () => {
        await functions.delete("/api/user/pfp", null, session, setSessionFlag)
        setUserImg("")
        setSessionFlag(true)
    }

    const premiumExpirationJSX = () => {
        if (!session.premiumExpiration) return null
        if (new Date(session.premiumExpiration) > new Date()) {
            return (
                <div className="userprofile-row">
                    <span className="userprofile-text" style={{color: "var(--premiumColor)"}}>Premium until {functions.prettyDate(new Date(session.premiumExpiration))}</span>
                </div>
            )
        } else {
            return (
                <div className="userprofile-row">
                    <span className="userprofile-text">Premium expired on {functions.prettyDate(new Date(session.premiumExpiration))}</span>
                </div>
            )
        }
    }

    return (
        <>
        <DeleteAccountDialog/>
        <R18Dialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="userprofile">
                    <div className="userprofile-top-container">
                        <img className="userprofile-img" src={userImg} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateUsernameJSX()}
                        {permissions.isPremium(session) && <>
                        <label htmlFor="upload-pfp" className="uploadpfp-label">
                            <img className="userprofile-uploadimg" src={uploadPfpIcon} style={{filter: getFilter()}}/>
                        </label>
                        <input id="upload-pfp" type="file" onChange={(event) => uploadPfp(event)}/>
                        </>}
                    </div>
                    {session.banned ? <span className="user-ban-text">{getBanText()}</span> : null}
                    {premiumExpirationJSX()}
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
                    <div className="userprofile-row">
                        <span className="userprofile-text">Show Related: <span className="userprofile-text-action" onClick={showRelated}>{session.showRelated ? "Yes" : "No"}</span></span>
                    </div>
                    <div className="userprofile-row">
                        <span className="userprofile-text">Show Tooltips: <span className="userprofile-text-action" onClick={showTooltips}>{session.showTooltips ? "Yes" : "No"}</span></span>
                    </div>
                    <div className="userprofile-row">
                        <span className="userprofile-text">Show Tag Banner: <span className="userprofile-text-action" onClick={showTagBanner}>{session.showTagBanner ? "Yes" : "No"}</span></span>
                    </div>
                    <div className="userprofile-row">
                        <span className="userprofile-text">Download Pixiv ID: <span className="userprofile-text-action" onClick={downloadPixivID}>{session.downloadPixivID ? "Yes" : "No"}</span></span>
                    </div>
                    <div className="userprofile-row">
                        <img className="userprofile-icon" src={premiumStar}/>
                        <span style={{color: "var(--premiumColor)"}} className="userprofile-text">Upscaled Images: <span style={{color: "var(--premiumColor)"}} className="userprofile-text-action" onClick={upscaledImages}>{session.upscaledImages ? "Yes" : "No"}</span></span>
                    </div>
                    <div className="userprofile-row">
                        <img className="userprofile-icon" src={premiumStar}/>
                        <span style={{color: "var(--premiumColor)"}} className="userprofile-text">Autosearch Interval: </span>
                        <input style={{color: "var(--premiumColor)"}} className="userprofile-input" spellCheck={false} value={interval} onChange={(event) => setInterval(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></input>
                    </div>
                    {permissions.isAdmin(session) ? <div className="userprofile-row">
                        <img className="userprofile-icon" src={r18}/>
                        <span style={{color: "var(--r18Color)"}} className="userprofile-text">Show R18: <span style={{color: "var(--r18Color)"}} className="userprofile-text-action" onClick={showR18}>{session.showR18 ? "Yes" : "No"}</span></span>
                    </div> : null}
                    <div onClick={clearPfp} className="userprofile-row">
                        <span className="userprofile-link">Clear Pfp</span>
                    </div>
                    <div onClick={changeUsername} className="userprofile-row">
                        <img className="userprofile-icon" src={premiumStar} style={{height: "14px", marginRight: "5px"}}/>
                        <span style={{color: "var(--premiumColor)"}} className="userprofile-link">Change Username</span>
                    </div>
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
                        <span className="userprofile-title" onClick={viewFavorites}>Favorites <span className="userprofile-text-alt">{favorites[0].postCount}</span></span>
                        <Carousel images={favoriteImages} noKey={true} set={setFav} index={favoriteIndex} update={updateFavoriteOffset} appendImages={appendFavoriteImages}/>
                    </div> : null}
                    {uploads.length ?
                    <div className="userprofile-column">
                        <span className="userprofile-title" onClick={viewUploads}>Uploads <span className="userprofile-text-alt">{uploads[0].postCount}</span></span>
                        <Carousel images={uploadImages} noKey={true} set={setUp} index={uploadIndex} update={updateUploadOffset} appendImages={appendUploadImages}/>
                    </div> : null}
                    {comments.length ?
                    <div className="userprofile-column">
                        <span className="userprofile-title" onClick={viewComments}>Comments <span className="userprofile-title-alt">{comments.length}</span></span>
                        <CommentCarousel comments={comments}/>
                    </div> : null}
                    <div className="userprofile-row">
                        <img className="userprofile-icon" src={danger}/>
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