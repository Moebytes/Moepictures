import React, {useEffect, useContext, useState, useReducer, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import uploadPfpIcon from "../../assets/icons/uploadpfp.png"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useFlagSelector, useMiscDialogActions, useMessageDialogActions,
useCacheSelector, useCacheActions, useInteractionActions, useMiscDialogSelector} from "../../store"
import functions from "../../structures/Functions"
import Carousel from "../../components/site/Carousel"
import VerticalCarousel from "../../components/site/VerticalCarousel"
import adminLabel from "../../assets/icons/admin-label.png"
import modLabel from "../../assets/icons/mod-label.png"
import systemLabel from "../../assets/icons/system-label.png"
import premiumLabel from "../../assets/icons/premium-label.png"
import contributorLabel from "../../assets/icons/contributor-label.png"
import premiumContributorLabel from "../../assets/icons/premium-contributor-label.png"
import curatorLabel from "../../assets/icons/curator-label.png"
import premiumCuratorLabel from "../../assets/icons/premium-curator-label.png"
import permissions from "../../structures/Permissions"
import premiumStar from "../../assets/icons/premium-star.png"
import r18 from "../../assets/icons/r18.png"
import danger from "../../assets/icons/danger.png"
import lockIcon from "../../assets/icons/private-lock.png"
import emojiSelect from "../../assets/icons/emoji-select.png"
import highlight from "../../assets/icons/highlight.png"
import bold from "../../assets/icons/bold.png"
import italic from "../../assets/icons/italic.png"
import underline from "../../assets/icons/underline.png"
import strikethrough from "../../assets/icons/strikethrough.png"
import spoiler from "../../assets/icons/spoiler.png"
import link from "../../assets/icons/link-purple.png"
import details from "../../assets/icons/details.png"
import hexcolor from "../../assets/icons/hexcolor.png"
import codeblock from "../../assets/icons/codeblock.png"
import jsxFunctions from "../../structures/JSXFunctions"
import {EditCounts, CommentSearch, Favgroup, PostSearch, UnverifiedPost, TagCount, ForumPostSearch} from "../../types/Types"
import "./styles/userpage.less"

let intervalTimer = null as any
let blacklistTimer = null as any
let limit = 25

const UserProfilePage: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session, userImg, userImgPost} = useSessionSelector()
    const {setSession, setSessionFlag, setUserImg} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setActiveFavgroup} = useActiveActions()
    const {ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {updateUserFlag} = useFlagSelector()
    const {setRedirect, setCommentSearchFlag} = useFlagActions()
    const {showDeleteAccountDialog} = useMiscDialogSelector()
    const {setPremiumRequired, setR18Confirmation, setShowDeleteAccountDialog} = useMiscDialogActions()
    const {setDMTarget} = useMessageDialogActions()
    const {emojis} = useCacheSelector()
    const {setPosts} = useCacheActions()
    const errorRef = useRef<HTMLSpanElement>(null)
    const [error, setError] = useState(false)
    const [showBioInput, setShowBioInput] = useState(false)
    const [uploadIndex, setUploadIndex] = useState(0)
    const [favoriteIndex, setFavoriteIndex] = useState(0)
    const [uploads, setUploads] = useState([] as PostSearch[])
    const [appendUploadImages, setAppendUploadImages] = useState([] as string[])
    const [favorites, setFavorites] = useState([] as PostSearch[])
    const [appendFavoriteImages, setAppendFavoriteImages] = useState([] as string[])
    const [comments, setComments] = useState([] as CommentSearch[])
    const [forumPosts, setForumPosts] = useState([] as ForumPostSearch[])
    const [favgroups, setFavgroups] = useState([] as Favgroup[])
    const [uploadImages, setUploadImages] = useState([] as string[])
    const [favoriteImages, setFavoriteImages] = useState([] as string[])
    const [favoriteTags, setFavoriteTags] = useState([] as TagCount[])
    const [counts, setCounts] = useState(null as EditCounts | null)
    const [pending, setPending] = useState([] as UnverifiedPost[])
    const [pendingImages, setPendingImages] = useState([] as string[])
    const [pendingIndex, setPendingIndex] = useState(0)
    const [deleted, setDeleted] = useState([] as UnverifiedPost[])
    const [deletedImages, setDeletedImages] = useState([] as string[])
    const [deletedIndex, setDeletedIndex] = useState(0)
    const [banReason, setBanReason] = useState("")
    const [bio, setBio] = useState("")
    const [interval, setInterval] = useState("")
    const [blacklist, setBlacklist] = useState("")
    const [init, setInit] = useState(true)
    const [bannerHidden, setBannerHidden] = useState(false)
    const [showEmojiDropdown, setShowEmojiDropdown] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const emojiRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const navigate = useNavigate()

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
        if (bannerHideDate && new Date(bannerHideDate) > new Date(banner?.date || "")) {
            if (banner?.text) setBannerHidden(true)
        }
    }

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateUploads = async () => {
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const uploads = await functions.get("/api/user/uploads", {limit, rating}, session, setSessionFlag)
        const images = uploads.map((p) => functions.getThumbnailLink(p.images[0], "tiny", session, mobile))
        setUploads(uploads)
        setUploadImages(images)
    }

    const updateUploadOffset = async () => {
        const newUploads = uploads
        let offset = newUploads.length
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.get("/api/user/uploads", {limit, rating, offset}, session, setSessionFlag)
        newUploads.push(...result)
        const images = result.map((p) => functions.getThumbnailLink(p.images[0], "tiny", session, mobile))
        setUploads(newUploads)
        setAppendUploadImages(images)
    }

    const updateFavorites = async () => {
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const favorites = await functions.get("/api/user/favorites", {limit, rating}, session, setSessionFlag)
        const images = favorites.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
        setFavorites(favorites)
        setFavoriteImages(images)
    }

    const updateFavoriteOffset = async () => {
        const newFavorites = favorites
        let offset = newFavorites.length
        let rating = functions.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.get("/api/user/favorites", {limit, rating, offset}, session, setSessionFlag)
        newFavorites.push(...result)
        const images = result.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
        setFavorites(newFavorites)
        setAppendFavoriteImages(images)
    }

    const updateFavgroups = async () => {
        const favgroups = await functions.get("/api/user/favgroups", null, session, setSessionFlag)
        setFavgroups(favgroups)
    }

    const updateComments = async () => {
        const comments = await functions.get("/api/user/comments", {sort: "date"}, session, setSessionFlag)
        let filtered = comments.filter((c) => functions.isR18(ratingType) ? functions.isR18(c.post?.rating) : !functions.isR18(c.post?.rating))
        setComments(filtered)
    }

    const updateForumPosts = async () => {
        const forumPosts = await functions.get("/api/user/forumposts", {sort: "date"}, session, setSessionFlag)
        setForumPosts(forumPosts)
    }

    const updateCounts = async () => {
        const counts = await functions.get("/api/user/edit/counts", null, session, setSessionFlag)
        setCounts(counts)
    }

    const updateFavoriteTags = async () => {
        const favoriteTags = await functions.get("/api/tagfavorites", null, session, setSessionFlag)
        setFavoriteTags(favoriteTags)
    }

    const updatePending = async () => {
         const pending = await functions.get("/api/post/pending", null, session, setSessionFlag)
         const images = pending.map((p) => functions.getUnverifiedThumbnailLink(p.images[0], "tiny", session, mobile))
         setPending(pending)
         setPendingImages(images)
    }

    const updateDeleted = async () => {
        const deleted = await functions.get("/api/post/rejected", null, session, setSessionFlag)
        const images = deleted.map((p) => functions.getUnverifiedThumbnailLink(p.images[0], "tiny", session, mobile))
        setDeleted(pending)
        setDeletedImages(images)
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
        updateForumPosts()
        updateCounts()
        updateFavoriteTags()
        checkHiddenBanner()
        updatePending()
        updateDeleted()
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
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        } else {
            setBio(session.bio)
            if (init) {
                setBlacklist(session.blacklist)
                setInterval(Math.floor(Number(session.autosearchInterval || 3000) / 1000).toString())
                setInit(false)
            }
        }
    }, [session, init])

    const uploadPfp = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: ProgressEvent<FileReader>) => {
                const bytes = new Uint8Array(f.target?.result as ArrayBuffer)
                const result = functions.bufferFileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                const avif = result?.mime === "image/avif"
                if (jpg || png || gif || webp || avif) {
                    const MB = file.size / (1024*1024)
                    const maxSize = functions.maxTagFileSize({jpg, png, gif, webp, avif})
                    if (MB <= maxSize) {
                        const url = URL.createObjectURL(file)
                        let croppedURL = ""
                        if (gif) {
                            const gifData = await functions.extractGIFFrames(bytes.buffer)
                            let frameArray = [] as ArrayBuffer[] 
                            let delayArray = [] as number[]
                            for (let i = 0; i < gifData.length; i++) {
                                const canvas = gifData[i].frame as HTMLCanvasElement
                                const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                                frameArray.push(cropped)
                                delayArray.push(gifData[i].delay)
                            }
                            const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1, false)
                            const {width, height} = await functions.imageDimensions(firstURL)
                            const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                            const blob = new Blob([new Uint8Array(buffer)])
                            croppedURL = URL.createObjectURL(blob)
                        } else {
                            croppedURL = await functions.crop(url, 1, false)
                        }
                        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                        await functions.post("/api/user/pfp", {bytes: Object.values(new Uint8Array(arrayBuffer))}, session, setSessionFlag)
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
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const tagFavoritesPrivacy = async () => {
        await functions.post("/api/user/tagfavoritesprivacy", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showRelated = async () => {
        await functions.post("/api/user/showrelated", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showTooltips = async () => {
        await functions.post("/api/user/showtooltips", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showTagTooltips = async () => {
        await functions.post("/api/user/showtagtooltips", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showTagBanner = async () => {
        await functions.post("/api/user/showtagbanner", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const downloadPixivID = async () => {
        await functions.post("/api/user/downloadpixivid", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const forceNoteBubbles = async () => {
        await functions.post("/api/user/forcenotebubbles", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const liveAnimationPreview = async () => {
        await functions.post("/api/user/liveanimationpreview", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }
    
    const liveModelPreview = async () => {
        await functions.post("/api/user/livemodelpreview", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showR18 = async () => {
        if (session.showR18) {
            await functions.post("/api/user/r18", {r18: false}, session, setSessionFlag)
            functions.clearResponseCacheKey("/api/user/session")
            setSessionFlag(true)
        } else {
            setR18Confirmation(true)
        }
    }

    const upscaledImages = async () => {
        if (permissions.isPremium(session)) {
            await functions.post("/api/user/upscaledimages", null, session, setSessionFlag)
            functions.clearResponseCacheKey("/api/user/session")
            setSessionFlag(true)
        } else {
            setPremiumRequired(true)
        }
    }

    useEffect(() => {
        const autosearchInterval = async () => {
            clearTimeout(intervalTimer) 
            intervalTimer = setTimeout(() => {
                functions.clearResponseCacheKey("/api/user/session")
                functions.post("/api/user/autosearchinterval", {interval: functions.safeNumber(interval)}, session, setSessionFlag)
                .then(() => setSessionFlag(true))
            }, 1000)
        }
        autosearchInterval()
    }, [interval])

    useEffect(() => {
        const updateBlacklist = async () => {
            clearTimeout(blacklistTimer) 
            blacklistTimer = setTimeout(() => {
                functions.clearResponseCacheKey("/api/user/session")
                functions.post("/api/user/blacklist", {blacklist}, session, setSessionFlag)
                .then(() => setSessionFlag(true))
            }, 1000)
        }
        updateBlacklist()
    }, [blacklist])

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
            functions.clearResponseCacheKey("/api/user/session")
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
            navigate(`/post/${post.postID}/${post.slug}`)
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
            navigate(`/post/${post.postID}/${post.slug}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
        setPosts(favorites)
    }

    const setPend = (img: string, index: number, newTab: boolean) => {
        setPendingIndex(index)
        const post = pending[index]
        if (newTab) {
            window.open(`/unverified/post/${post.postID}`, "_blank")
        } else {
            navigate(`/unverified/post/${post.postID}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
    }

    const setDel = (img: string, index: number, newTab: boolean) => {
        setDeletedIndex(index)
        const post = deleted[index]
        if (newTab) {
            window.open(`/unverified/post/${post.postID}`, "_blank")
        } else {
            navigate(`/unverified/post/${post.postID}`)
        }
        window.scrollTo(0, functions.navbarHeight() + functions.titlebarHeight())
    }

    const deleteAccountDialog = () => {
        setShowDeleteAccountDialog(!showDeleteAccountDialog)
    }

    const viewFavorites = () => {
        navigate("/posts")
        setSearch(`favorites:${session.username}`)
        setSearchFlag(true)
    }

    const viewUploads = () => {
        navigate("/posts")
        setSearch(`uploads:${session.username}`)
        setSearchFlag(true)
    }

    const viewComments = () => {
        navigate("/comments")
        setCommentSearchFlag(`comments:${session.username}`)
    }

    const viewForumPosts = () => {
        navigate(`/posts/${session.username}`)
    }

    const userImgClick = (event: React.MouseEvent) => {
        if (!userImgPost) return
        event.stopPropagation()
        functions.openPost(userImgPost, event, navigate, session, setSessionFlag)
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
            navigate("/change-username")
        } else {
            setPremiumRequired(true)
        }
    }

    const clearPfp = async () => {
        await functions.delete("/api/user/pfp", null, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setUserImg("")
        setSessionFlag(true)
    }

    const clearCookieConsent = async () => {
        await functions.post("/api/user/cookieconsent", {consent: null}, session, setSessionFlag)
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showBanner = async () => {
        localStorage.removeItem("bannerHideDate")
        functions.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const premiumExpirationJSX = () => {
        if (!session.premiumExpiration) return null
        if (new Date(session.premiumExpiration) > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text" style={{color: "var(--premiumColor)"}}>{i18n.user.premiumUntil} {functions.prettyDate(session.premiumExpiration, i18n)}</span>
                </div>
            )
        } else if (new Date(session.premiumExpiration) < new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text">{i18n.user.premiumExpired} {functions.prettyDate(session.premiumExpiration, i18n)}</span>
                </div>
            )
        }
    }

    const banExpirationJSX = () => {
        if (!session.banned && !session.banExpiration) return null
        if (new Date(session.banExpiration || "") > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text" style={{color: "var(--banText)"}}>{i18n.user.banExpires} {functions.timeUntil(session.banExpiration, i18n)}</span>
                </div>
            )
        }
    }

    const searchTag = (event: React.MouseEvent, tag?: string) => {
        if (!tag) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/posts?query=${tag}`, "_blank")
        } else {
            navigate("/posts")
            setSearch(tag)
            setSearchFlag(true)
        }
    }

    const generateFavoriteTagsJSX = () => {
        if (favoriteTags.length) {
            return (
                <div className="user-column">
                    <span className="user-title">{i18n.user.favoriteTags} <span className="user-text-alt">{favoriteTags.length}</span></span>
                    <div className="tag-alias-button-container">
                        {favoriteTags.map((tag) =>
                            <button className="tag-alias-button" onClick={(event) => searchTag(event, tag.tag)}>{tag.tag.replaceAll("-", " ")}</button>
                        )}
                    </div>
                </div> 
            )
        }
    }

    const generateFavgroupsJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < favgroups.length; i++) {
            let favgroup = favgroups[i]
            if (functions.isR18(ratingType)) {
                if (!functions.isR18(favgroup.rating)) continue
            } else {
                if (functions.isR18(favgroup.rating)) continue
            }
            const images = favgroup.posts.map((f) => functions.getThumbnailLink(f.images[0], "tiny", session, mobile))
            const viewFavgroup = () => {
                navigate(`/favgroup/${session.username}/${favgroup.slug}`)
            }
            const setFavgroup = (img: string, index: number, newTab: boolean) => {
                const post = favgroup.posts[index]
                if (newTab) {
                    window.open(`/post/${post.postID}/${post.slug}`, "_blank")
                } else {
                    navigate(`/post/${post.postID}/${post.slug}`)
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

    const getEmojiMarginRight = () => {
        if (typeof document === "undefined") return "0px"
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = -120
        if (mobile) offset += 0
        return `${raw + offset}px`
    }

    const getEmojiMarginBottom = () => {
        if (typeof document === "undefined") return "0px"
        let elementName = ".user-textarea"
        const bodyRect = document.querySelector(elementName)?.getBoundingClientRect()
        const rect = emojiRef.current?.getBoundingClientRect()
        if (!rect || !bodyRect) return "0px"
        const raw = bodyRect.bottom - rect.bottom
        let offset = 390
        if (mobile) offset += 0
        return `${raw + offset}px`
    }

    const emojiGrid = () => {
        let rows = [] as React.ReactElement[]
        let rowAmount = 7
        for (let i = 0; i < Object.keys(emojis).length; i++) {
            let items = [] as React.ReactElement[]
            for (let j = 0; j < rowAmount; j++) {
                const k = (i*rowAmount)+j
                const key = Object.keys(emojis)[k]
                if (!key) break
                const appendText = () => {
                    setBio((prev: string) => prev + ` :${key}:`)
                    setShowEmojiDropdown(false)
                }
                items.push(
                    <img draggable={false} src={emojis[key]} className="dialog-emoji-big" onClick={appendText}/>
                )
            }
            if (items.length) rows.push(<div className="dialog-emoji-row">{items}</div>)
        }
        return (
            <div className={`dialog-emoji-grid ${showEmojiDropdown ? "" : "hide-dialog-emoji-grid"}`}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}
            style={{marginRight: getEmojiMarginRight(), marginBottom: getEmojiMarginBottom()}}>
                {rows}
            </div>
        )
    }

    const getBioTextArea = () => {
        return (
            <>
            <div className="user-column">
                <div className="dialog-textarea-buttons" style={{width: "50%"}}>
                    <button className="dialog-textarea-button"><img src={highlight} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "highlight")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={bold} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "bold")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={italic} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "italic")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={underline} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "underline")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={strikethrough} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "strikethrough")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={spoiler} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "spoiler")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={link} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "link")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={details} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "details")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={hexcolor} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "color")} style={{filter: getFilter()}}/></button>
                    <button className="dialog-textarea-button"><img src={codeblock} onClick={() => functions.triggerTextboxButton(textRef.current, setBio, "code")} style={{filter: getFilter()}}/></button>
                </div>
                {previewMode ? <div className="comments-preview" style={{width: "50%", minHeight: "100px"}}>{jsxFunctions.renderText(bio, emojis, "reply")}</div> : 
                <div style={{marginTop: "0px"}} className="user-column">
                    <textarea ref={textRef} className="user-textarea" spellCheck={false} value={bio} onChange={(event) => setBio(event.target.value)}
                    onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                </div>}
                {error ? <div className="user-validation-container"><span className="user-validation" ref={errorRef}></span></div> : null}
            </div>
            <div className="user-row">
                <button className="user-button" onClick={changeBio}>{i18n.buttons.ok}</button>
                <button className="user-emoji-button" ref={emojiRef} onClick={() => setShowEmojiDropdown((prev: boolean) => !prev)}>
                    <img src={emojiSelect}/>
                </button>
                <button className={previewMode ? "user-edit-button" : "user-preview-button"} onClick={() => setPreviewMode((prev: boolean) => !prev)}>{previewMode ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
            </div>
            </>
        )
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="user">
                    <div className="user-top-container">
                        <img className="user-img" src={userImg} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateUsernameJSX()}
                        {!mobile && permissions.isAdmin(session) && <>
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
                        <span className="user-text">{i18n.user.joinDate}: {functions.prettyDate(session.joinDate, i18n)}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.bio}: {jsxFunctions.renderText(session.bio || i18n.user.noBio, emojis, "reply")}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-link" onClick={() => setShowBioInput((prev) => !prev)}>{i18n.user.updateBio}</span>
                    </div>
                    {showBioInput ? getBioTextArea() : null}
                    <div className="user-row">
                        <span className="user-text">{i18n.user.favoritesPrivacy}: <span style={{color: !session.publicFavorites ? "var(--text-strong)" : "var(--text)"}} 
                        className="user-text-action" onClick={favoritesPrivacy}>{session.publicFavorites ? i18n.labels.public : i18n.sort.private}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.tagFavoritesPrivacy}: <span style={{color: !session.publicTagFavorites ? "var(--text-strong)" : "var(--text)"}} 
                        className="user-text-action" onClick={tagFavoritesPrivacy}>{session.publicTagFavorites ? i18n.labels.public : i18n.sort.private}</span></span>
                    </div>
                    {Number.isFinite(permissions.getUploadLimit(session)) ? <div className="user-row">
                        <span className="user-text">{i18n.labels.uploadLimit}: <span className="user-text-action">{functions.currentUploads(pending)} / {permissions.getUploadLimit(session)}</span></span>
                    </div> : null}
                    <div className="user-row">
                        <span className="user-text">{i18n.user.showRelated}: <span className="user-text-action" onClick={showRelated}>{session.showRelated ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.showTooltips}: <span className="user-text-action" onClick={showTooltips}>{session.showTooltips ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.showTagTooltips}: <span className="user-text-action" onClick={showTagTooltips}>{session.showTagTooltips ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.showTagBanner}: <span className="user-text-action" onClick={showTagBanner}>{session.showTagBanner ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.downloadPixivID}: <span className="user-text-action" onClick={downloadPixivID}>{session.downloadPixivID ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.forceNoteBubbles}: <span className="user-text-action" onClick={forceNoteBubbles}>{session.forceNoteBubbles ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.liveAnimationPreview}: <span className="user-text-action" onClick={liveAnimationPreview}>{session.liveAnimationPreview ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.liveModelPreview}: <span className="user-text-action" onClick={liveModelPreview}>{session.liveModelPreview ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        {permissions.isPremiumEnabled() ? <img className="user-icon" src={premiumStar}/> : null}
                        <span style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-text">{i18n.user.upscaledImages}: <span style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-text-action" onClick={upscaledImages}>{session.upscaledImages ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        {permissions.isPremiumEnabled() ? <img className="user-icon" src={premiumStar}/> : null}
                        <span style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-text">{i18n.user.autosearchInterval}: </span>
                        <input style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-input" spellCheck={false} value={interval} onChange={(event) => setInterval(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></input>
                    </div>
                    {permissions.isAdmin(session) ? <div className="user-row">
                        <img className="user-icon" src={r18}/>
                        <span style={{color: "var(--r18Color)"}} className="user-text">{i18n.user.showR18}: <span style={{color: "var(--r18Color)"}} className="user-text-action" onClick={showR18}>{session.showR18 ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div> : null}
                    <div onClick={clearPfp} className="user-row">
                        <span className="user-link">{i18n.user.clearPfp}</span>
                    </div>
                    <div onClick={clearCookieConsent} className="user-row">
                        <span className="user-link">{i18n.user.clearCookieConsent}</span>
                    </div>
                    {bannerHidden ? 
                    <div onClick={showBanner} className="user-row">
                        <span className="user-link">{i18n.user.showBanner}</span>
                    </div> : null}
                    <div onClick={changeUsername} className="user-row">
                        {permissions.isPremiumEnabled() ? <img className="user-icon" src={premiumStar} style={{height: "14px", marginRight: "5px"}}/> : null}
                        <span style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-link">{i18n.user.changeUsername}</span>
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
                    {permissions.isAdmin(session) ? <Link to="/api-key" className="user-row">
                        <span className="user-link">{i18n.user.apiKey}</span>
                    </Link> : null}
                    {counts?.postEdits || counts?.tagEdits || counts?.noteEdits || counts?.groupEdits ? 
                    <div className="user-row">
                        <span className="user-title" style={{marginRight: "10px"}}>{i18n.labels.edits}:</span>
                    {counts.postEdits > 0 ? 
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${session.username}/post/history`)}>
                        {i18n.buttons.post} {!mobile ? <span className="user-text-alt">{counts.postEdits}</span> : null}</span>
                    : null}
                    {counts.tagEdits > 0 ? 
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${session.username}/tag/history`)}>
                        {i18n.tag.tag} {!mobile ? <span className="user-text-alt">{counts.tagEdits}</span> : null}</span>
                    : null}
                    {counts.noteEdits > 0 ?
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${session.username}/note/history`)}>
                        {i18n.labels.note} {!mobile ? <span className="user-text-alt">{counts.noteEdits}</span> : null}</span>
                    : null}
                    {counts.groupEdits > 0 ?
                        <span style={{marginRight: "10px"}} className="user-title" onClick={() => navigate(`/user/${session.username}/group/history`)}>
                        {i18n.labels.group} {!mobile ? <span className="user-text-alt">{counts.groupEdits}</span> : null}</span>
                    : null}
                    </div> : null}
                    {pending.length ?
                    <div className="user-column">
                        <span className="user-title">{i18n.labels.pending} <span className="user-text-alt">{pending[0].postCount}</span></span>
                        <Carousel images={pendingImages} noKey={true} set={setPend} index={pendingIndex} unverified={true}/>
                    </div> : null}
                    {deleted.length ?
                    <div className="user-column">
                        <span className="user-title">{functions.toProperCase(i18n.user.deleted)} <span className="user-text-alt">{deleted[0].postCount}</span></span>
                        <Carousel images={deletedImages} noKey={true} set={setDel} index={deletedIndex} unverified={true}/>
                    </div> : null}
                    {permissions.isMod(session) && session.deletedPosts?.length ? <div className="user-row">
                        <span className="user-text">{i18n.user.deletedPosts}: <span className="user-text-action">{session.deletedPosts.length}</span></span>
                    </div> : null}
                    {generateFavoriteTagsJSX()}
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
                        <VerticalCarousel items={comments} type="comment"/>
                    </div> : null}
                    {forumPosts.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewForumPosts}>{i18n.user.forumPosts} <span className="user-text-alt">{forumPosts.length}</span></span>
                        <VerticalCarousel items={forumPosts} type="forumpost"/>
                    </div> : null}
                    <div className="user-column">
                        <span className="user-text" style={{fontSize: "22px", color: "var(--text-strong)"}}>Blacklist Tags</span>
                        <textarea style={{height: "150px", width: "60%", fontSize: "20px", color: "var(--text-strong)"}} className="user-textarea" 
                        spellCheck={false} value={blacklist} onChange={(event) => setBlacklist(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                    </div>
                    <div className="user-row">
                        <img className="user-icon" src={danger}/>
                        <span className="user-link" onClick={deleteAccountDialog}>{i18n.buttons.deleteAccount}</span>
                    </div>
                    {emojiGrid()}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default UserProfilePage