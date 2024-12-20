import React, {useEffect, useContext, useState, useReducer, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import uploadPfpIcon from "../assets/icons/uploadpfp.png"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import {useThemeSelector, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useFlagSelector, useMiscDialogActions, useMessageDialogActions,
useCacheActions, useInteractionActions, useMiscDialogSelector} from "../store"
import functions from "../structures/Functions"
import Carousel from "../components/Carousel"
import CommentCarousel from "../components/CommentCarousel"
import DeleteAccountDialog from "../dialogs/DeleteAccountDialog"
import DeleteFavgroupDialog from "../dialogs/DeleteFavgroupDialog"
import R18Dialog from "../dialogs/R18Dialog"
import adminLabel from "../assets/icons/admin-label.png"
import modLabel from "../assets/icons/mod-label.png"
import systemLabel from "../assets/icons/system-label.png"
import premiumLabel from "../assets/icons/premium-label.png"
import contributorLabel from "../assets/icons/contributor-label.png"
import premiumContributorLabel from "../assets/icons/premium-contributor-label.png"
import curatorLabel from "../assets/icons/curator-label.png"
import premiumCuratorLabel from "../assets/icons/premium-curator-label.png"
import permissions from "../structures/Permissions"
import premiumStar from "../assets/icons/premium-star.png"
import r18 from "../assets/icons/r18.png"
import danger from "../assets/icons/danger.png"
import lockIcon from "../assets/icons/private-lock.png"
import deleteIcon from "../assets/icons/delete.png"
import "./styles/userpage.less"

let intervalTimer = null as any
let limit = 25

const UserProfilePage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session, userImg, userImgPost} = useSessionSelector()
    const {setSessionFlag, setUserImg} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setActiveFavgroup} = useActiveActions()
    const {ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {updateUserFlag} = useFlagSelector()
    const {setRedirect, setCommentSearchFlag} = useFlagActions()
    const {showDeleteAccountDialog} = useMiscDialogSelector()
    const {setPremiumRequired, setR18Confirmation, setShowDeleteAccountDialog} = useMiscDialogActions()
    const {setDMTarget} = useMessageDialogActions()
    const {setPosts} = useCacheActions()
    const bioRef = useRef<any>(null)
    const errorRef = useRef<any>(null)
    const [error, setError] = useState(false)
    const [showBioInput, setShowBioInput] = useState(false)
    const [uploadIndex, setUploadIndex] = useState(0)
    const [favoriteIndex, setFavoriteIndex] = useState(0) as any
    const [uploads, setUploads] = useState([]) as any
    const [favorites, setFavorites] = useState([]) as any
    const [comments, setComments] = useState([]) as any
    const [favgroups, setFavgroups] = useState([]) as any
    const [uploadImages, setUploadImages] = useState([]) as any
    const [appendUploadImages, setAppendUploadImages] = useState([]) as any
    const [favoriteImages, setFavoriteImages] = useState([]) as any
    const [appendFavoriteImages, setAppendFavoriteImages] = useState([]) as any
    const [banReason, setBanReason] = useState("")
    const [counts, setCounts] = useState(null as any)
    const [bio, setBio] = useState("")
    const [interval, setInterval] = useState("")
    const [init, setInit] = useState(true)
    const [bannerHidden, setBannerHidden] = useState(false)
    const history = useHistory()

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const updateBanReason = async () => {
        const ban = await functions.get("/api/user/ban", {username: session.username}, session, setSessionFlag)
        if (ban?.reason) setBanReason(ban.reason)
    }

    const checkHiddenBanner = async () => {
        const banner = await functions.get("/api/misc/banner", null, session, setSessionFlag)
        const bannerHideDate = localStorage.getItem("bannerHideDate")
        if (bannerHideDate && new Date(bannerHideDate) > new Date(banner?.date)) {
            if (banner?.text) setBannerHidden(true)
        }
    }

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateUploads = async () => {
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const uploads = await functions.get("/api/user/uploads", {limit, rating}, session, setSessionFlag)
        const images = uploads.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "tiny"))
        setUploads(uploads)
        setUploadImages(images)
    }

    const updateUploadOffset = async () => {
        const newUploads = uploads
        let offset = newUploads.length
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.get("/api/user/uploads", {limit, rating, offset}, session, setSessionFlag)
        newUploads.push(...result)
        const images = result.map((p: any) => functions.getThumbnailLink(p.images[0].type, p.postID, p.images[0].order, p.images[0].filename, "large"))
        setUploads(newUploads)
        setAppendUploadImages(images)
    }

    const updateFavorites = async () => {
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const favorites = await functions.get("/api/user/favorites", {limit, rating}, session, setSessionFlag)
        const images = favorites.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
        setFavorites(favorites)
        setFavoriteImages(images)
    }

    const updateFavoriteOffset = async () => {
        const newFavorites = favorites
        let offset = newFavorites.length
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.get("/api/user/favorites", {limit, rating, offset}, session, setSessionFlag)
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
        const comments = await functions.get("/api/user/comments", {sort: "date"}, session, setSessionFlag)
        let filtered = comments.filter((c: any) => functions.isR18(ratingType) ? functions.isR18(c.post?.rating) : !functions.isR18(c.post?.rating))
        setComments(filtered)
    }

    const updateCounts = async () => {
        const counts = await functions.get("/api/user/edit/counts", null, session, setSessionFlag)
        setCounts(counts)
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
        updateFavgroups()
        updateComments()
        updateCounts()
        checkHiddenBanner()
        if (session.banned) updateBanReason()
    }, [session, ratingType])

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
            setSidebarText(i18n.sidebar.loginRequired)
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
                            const {width, height} = await functions.imageDimensions(firstURL, session)
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
        const badBio = functions.validateBio(bio, i18n)
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
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/user/changebio", {bio}, session, setSessionFlag)
            setSessionFlag(true)
            setError(false)
            setShowBioInput(false)
        } catch {
            errorRef.current!.innerText = i18n.errors.bio.bad
            await functions.timeout(2000)
            setError(false)
        }
    }

    const setUp = (img: string, index: number, newTab: boolean) => {
        setUploadIndex(index)
        const post = uploads[index]
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            history.push(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(uploads)
    }

    const setFav = (img: string, index: number, newTab: boolean) => {
        setFavoriteIndex(index)
        const post = favorites[index]
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            history.push(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(favorites)
    }

    const deleteAccountDialog = () => {
        setShowDeleteAccountDialog(!showDeleteAccountDialog)
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
        setCommentSearchFlag(`comments:${session.username}`)
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
                <div className="user-name-container">
                    <span className="user-name-plain admin-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={adminLabel}/>
                </div>
            )
        } else if (session.role === "mod") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain mod-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={modLabel}/>
                </div>
            )
        } else if (session.role === "system") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain system-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={systemLabel}/>
                </div>
            )
        } else if (session.role === "premium-curator") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain curator-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={premiumCuratorLabel}/>
                </div>
            )
        } else if (session.role === "curator") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain curator-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={curatorLabel}/>
                </div>
            )
        } else if (session.role === "premium-contributor") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain premium-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={premiumContributorLabel}/>
                </div>
            )
        } else if (session.role === "contributor") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain contributor-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={contributorLabel}/>
                </div>
            )
        } else if (session.role === "premium") {
            return (
                <div className="user-name-container">
                    <span className="user-name-plain premium-color">{functions.toProperCase(session.username)}</span>
                    <img className="user-name-label" src={premiumLabel}/>
                </div>
            )
        } 
        return <span className={`user-name ${session.banned ? "banned" : ""}`}>{functions.toProperCase(session.username)}</span>
    }

    const getBanText = () => {
        if (banReason) return `${i18n.user.bannedReason} ${banReason}`
        return i18n.user.banned
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

    const showBanner = async () => {
        localStorage.removeItem("bannerHideDate")
        setSessionFlag(true)
    }

    const premiumExpirationJSX = () => {
        if (!session.premiumExpiration) return null
        if (new Date(session.premiumExpiration) > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text" style={{color: "var(--premiumColor)"}}>{i18n.user.premiumUntil} {functions.prettyDate(new Date(session.premiumExpiration), i18n)}</span>
                </div>
            )
        } else if (new Date(session.premiumExpiration) < new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text">{i18n.user.premiumExpired} {functions.prettyDate(new Date(session.premiumExpiration), i18n)}</span>
                </div>
            )
        }
    }

    const banExpirationJSX = () => {
        if (!session.banned && !session.banExpiration) return null
        if (new Date(session.banExpiration) > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text" style={{color: "var(--banText)"}}>{i18n.user.banExpires} {functions.timeUntil(session.banExpiration, i18n)}</span>
                </div>
            )
        }
    }

    const generateFavgroupsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < favgroups.length; i++) {
            let favgroup = favgroups[i]
            if (functions.isR18(ratingType)) {
                if (!functions.isR18(favgroup.rating)) continue
            } else {
                if (functions.isR18(favgroup.rating)) continue
            }
            const images = favgroup.posts.map((f: any) => functions.getThumbnailLink(f.images[0].type, f.postID, f.images[0].order, f.images[0].filename, "tiny"))
            const viewFavgroup = () => {
                history.push(`/favgroup/${session.username}/${favgroup.slug}`)
            }
            const setFavgroup = (img: string, index: number, newTab: boolean) => {
                const post = favgroup.posts[index]
                if (newTab) {
                    window.open(`/post/${post.postID}/${post.slug}`, "_blank")
                } else {
                    history.push(`/post/${post.postID}/${post.slug}`)
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
                        {favgroup.private ? <img className="user-icon" src={lockIcon} style={{height: "20px", marginTop: "3px", filter: getFilter()}}/> : null}
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
        <DeleteFavgroupDialog/>
        <DeleteAccountDialog/>
        <R18Dialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="user">
                    <div className="user-top-container">
                        <img className="user-img" src={userImg} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateUsernameJSX()}
                        {permissions.isAdmin(session) && <>
                        <label htmlFor="upload-pfp" className="uploadpfp-label">
                            <img className="user-uploadimg" src={uploadPfpIcon} style={{filter: getFilter()}}/>
                        </label>
                        <input id="upload-pfp" type="file" onChange={(event) => uploadPfp(event)}/>
                        </>}
                    </div>
                    {session.banned ? <span className="user-ban-text">{getBanText()}</span> : null}
                    {premiumExpirationJSX()}
                    {banExpirationJSX()}
                    <div className="user-row">
                        <span className="user-text">{i18n.labels.email}: {session.email}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.joinDate}: {functions.prettyDate(new Date(session.joinDate), i18n)}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.bio}: {session.bio || i18n.user.noBio}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-link" onClick={() => setShowBioInput((prev) => !prev)}>{i18n.user.updateBio}</span>
                    </div>
                    {showBioInput ?
                    <div className="user-column">
                        <textarea ref={bioRef} className="user-textarea" spellCheck={false} value={bio} onChange={(event) => setBio(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                        {error ? <div className="user-validation-container"><span className="user-validation" ref={errorRef}></span></div> : null}
                        <button className="user-button" onClick={changeBio}>{i18n.buttons.ok}</button>
                    </div> : null}
                    <div className="user-row">
                        <span className="user-text">{i18n.user.favoritesPrivacy}: <span style={{color: !session.publicFavorites ? "var(--text-strong)" : "var(--text)"}} 
                        className="user-text-action" onClick={favoritesPrivacy}>{session.publicFavorites ? i18n.labels.public : i18n.sort.private}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.showRelated}: <span className="user-text-action" onClick={showRelated}>{session.showRelated ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.showTooltips}: <span className="user-text-action" onClick={showTooltips}>{session.showTooltips ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.showTagBanner}: <span className="user-text-action" onClick={showTagBanner}>{session.showTagBanner ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.downloadPixivID}: <span className="user-text-action" onClick={downloadPixivID}>{session.downloadPixivID ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <img className="user-icon" src={premiumStar}/>
                        <span style={{color: "var(--premiumColor)"}} className="user-text">{i18n.user.upscaledImages}: <span style={{color: "var(--premiumColor)"}} className="user-text-action" onClick={upscaledImages}>{session.upscaledImages ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <img className="user-icon" src={premiumStar}/>
                        <span style={{color: "var(--premiumColor)"}} className="user-text">{i18n.user.autosearchInterval}: </span>
                        <input style={{color: "var(--premiumColor)"}} className="user-input" spellCheck={false} value={interval} onChange={(event) => setInterval(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></input>
                    </div>
                    {permissions.isAdmin(session) ? <div className="user-row">
                        <img className="user-icon" src={r18}/>
                        <span style={{color: "var(--r18Color)"}} className="user-text">{i18n.user.showR18}: <span style={{color: "var(--r18Color)"}} className="user-text-action" onClick={showR18}>{session.showR18 ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div> : null}
                    {counts ? <>
                    {counts.postEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${session.username}/post/history`)}>{i18n.mod.postEdits} <span className="user-text-alt">{counts.postEdits}</span></span>
                    </div>  : null}
                    {counts.tagEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${session.username}/tag/history`)}>{i18n.mod.tagEdits} <span className="user-text-alt">{counts.tagEdits}</span></span>
                    </div> : null}
                    {counts.noteEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${session.username}/note/history`)}>{i18n.mod.noteEdits} <span className="user-text-alt">{counts.noteEdits}</span></span>
                    </div> : null}
                    {counts.groupEdits > 0 ? <div className="user-row">
                        <span className="user-title" onClick={() => history.push(`/user/${session.username}/group/history`)}>{i18n.mod.groupEdits} <span className="user-text-alt">{counts.groupEdits}</span></span>
                    </div> : null}
                    </> : null}
                    <div onClick={clearPfp} className="user-row">
                        <span className="user-link">{i18n.user.clearPfp}</span>
                    </div>
                    {bannerHidden ? 
                    <div onClick={showBanner} className="user-row">
                        <span className="user-link">{i18n.user.showBanner}</span>
                    </div> : null}
                    <div onClick={changeUsername} className="user-row">
                        <img className="user-icon" src={premiumStar} style={{height: "14px", marginRight: "5px"}}/>
                        <span style={{color: "var(--premiumColor)"}} className="user-link">{i18n.user.changeUsername}</span>
                    </div>
                    <Link to="/change-email" className="user-row">
                        <span className="user-link">{i18n.user.changeEmail}</span>
                    </Link>
                    <Link to="/change-password" className="user-row">
                        <span className="user-link">{i18n.user.changePassword}</span>
                    </Link>
                    <Link to="/enable-2fa" className="user-row">
                        <span className="user-link">{session.$2fa ? i18n.buttons.disable : i18n.buttons.enable} {i18n.user.$2fa}</span>
                    </Link>
                    <Link to="/login-history" className="user-row">
                        <span className="user-link">{i18n.user.loginHistory}</span>
                    </Link>
                    {permissions.isAdmin(session) ? <Link to="/ip-blacklist" className="user-row">
                        <span className="user-link">{i18n.user.ipBlacklist}</span>
                    </Link> : null}
                    {permissions.isAdmin(session) ? <Link to="/news-banner" className="user-row">
                        <span className="user-link">{i18n.user.newsBanner}</span>
                    </Link> : null}
                    {generateFavgroupsJSX()}
                    {favorites.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewFavorites}>{i18n.sort.favorites} <span className="user-text-alt">{favorites[0].postCount}</span></span>
                        <Carousel images={favoriteImages} noKey={true} set={setFav} index={favoriteIndex} update={updateFavoriteOffset} appendImages={appendFavoriteImages}/>
                    </div> : null}
                    {uploads.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewUploads}>{i18n.labels.uploads} <span className="user-text-alt">{uploads[0].postCount}</span></span>
                        <Carousel images={uploadImages} noKey={true} set={setUp} index={uploadIndex} update={updateUploadOffset} appendImages={appendUploadImages}/>
                    </div> : null}
                    {comments.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewComments}>{i18n.navbar.comments} <span className="user-text-alt">{comments.length}</span></span>
                        <CommentCarousel comments={comments}/>
                    </div> : null}
                    <div className="user-row">
                        <img className="user-icon" src={danger}/>
                        <span className="user-link" onClick={deleteAccountDialog}>{i18n.buttons.deleteAccount}</span>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UserProfilePage