/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchActions, 
useSearchSelector, useMiscDialogActions, useCacheSelector, useCacheActions, 
useInteractionActions, useMiscDialogSelector} from "../../store"
import functions from "../../functions/Functions"
import moeText from "../../moetext/MoeText"
import Carousel from "../../components/site/Carousel"
import VerticalCarousel from "../../components/site/VerticalCarousel"
import permissions from "../../structures/Permissions"
import PremiumStarIcon from "../../assets/svg/premium-star.svg"
import R18Icon from "../../assets/svg/lewd.svg"
import DangerIcon from "../../assets/svg/danger.svg"
import LockIcon from "../../assets/svg/lock.svg"
import EmojiSelectIcon from "../../assets/svg/emoji-select.svg"
import MiniTextBox, {MiniTextBoxRef} from "../../ui/MiniTextBox"
import {EditCounts, CommentSearch, Favgroup, PostSearch, UnverifiedPost, TagCount, ForumPostSearch} from "../../types/Types"
import "./styles/userpage.less"

let intervalTimer = null as any
let blacklistTimer = null as any
let limit = 25

const UserProfilePage: React.FunctionComponent = () => {
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
    const {setRedirect, setCommentSearchFlag} = useFlagActions()
    const {showDeleteAccountDialog} = useMiscDialogSelector()
    const {setPremiumRequired, setR18Confirmation, setShowDeleteAccountDialog} = useMiscDialogActions()
    const {emojis} = useCacheSelector()
    const {setPosts, setNavigationPosts} = useCacheActions()
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
    const emojiRef = useRef<HTMLButtonElement>(null)
    const textRef = useRef<HTMLTextAreaElement>(null)
    const textBoxRef = useRef<MiniTextBoxRef>(null)
    const navigate = useNavigate()

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const updateBanReason = async () => {
        const ban = await functions.http.get("/api/user/ban", {username: session.username}, session, setSessionFlag)
        if (ban?.reason) setBanReason(ban.reason)
    }

    const checkHiddenBanner = async () => {
        const banner = await functions.http.get("/api/misc/banner", null, session, setSessionFlag)
        const bannerHideDate = localStorage.getItem("bannerHideDate")
        if (bannerHideDate && new Date(bannerHideDate) > new Date(banner?.date || "")) {
            if (banner?.text) setBannerHidden(true)
        }
    }

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const updateUploads = async () => {
        let rating = functions.post.isR18(ratingType) ? functions.r18() : "all"
        const uploads = await functions.http.get("/api/user/uploads", {limit, rating}, session, setSessionFlag)
        const images = uploads.map((p) => functions.link.getThumbnailLink(p.images[0], "tiny", session, mobile))
        setUploads(uploads)
        setUploadImages(images)
    }

    const updateUploadOffset = async () => {
        let offset = uploads.length
        let rating = functions.post.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.http.get("/api/user/uploads", {limit, rating, offset}, session, setSessionFlag)
        const images = result.map((p) => functions.link.getThumbnailLink(p.images[0], "tiny", session, mobile))
        setUploads(prev => [...prev, ...result])
        setAppendUploadImages(images)
    }

    const updateFavorites = async () => {
        let rating = functions.post.isR18(ratingType) ? functions.r18() : "all"
        const favorites = await functions.http.get("/api/user/favorites", {limit, rating}, session, setSessionFlag)
        const images = favorites.map((f) => functions.link.getThumbnailLink(f.images[0], "tiny", session, mobile))
        setFavorites(favorites)
        setFavoriteImages(images)
    }

    const updateFavoriteOffset = async () => {
        let offset = favorites.length
        let rating = functions.post.isR18(ratingType) ? functions.r18() : "all"
        const result = await functions.http.get("/api/user/favorites", {limit, rating, offset}, session, setSessionFlag)
        const images = result.map((f) => functions.link.getThumbnailLink(f.images[0], "tiny", session, mobile))
        setFavorites(prev => [...prev, ...result])
        setAppendFavoriteImages(images)
    }

    const updateFavgroups = async () => {
        const favgroups = await functions.http.get("/api/user/favgroups", null, session, setSessionFlag)
        setFavgroups(favgroups)
    }

    const updateComments = async () => {
        const comments = await functions.http.get("/api/user/comments", {sort: "date"}, session, setSessionFlag)
        let filtered = comments.filter((c) => functions.post.isR18(ratingType) ? functions.post.isR18(c.post?.rating) : !functions.post.isR18(c.post?.rating))
        setComments(filtered)
    }

    const updateForumPosts = async () => {
        const forumPosts = await functions.http.get("/api/user/forumposts", {sort: "date"}, session, setSessionFlag)
        setForumPosts(forumPosts)
    }

    const updateCounts = async () => {
        const counts = await functions.http.get("/api/user/edit/counts", null, session, setSessionFlag)
        setCounts(counts)
    }

    const updateFavoriteTags = async () => {
        const favoriteTags = await functions.http.get("/api/tagfavorites", null, session, setSessionFlag)
        setFavoriteTags(favoriteTags)
    }

    const updatePending = async () => {
         const pending = await functions.http.get("/api/post/pending", null, session, setSessionFlag)
         const images = pending.map((p) => functions.link.getUnverifiedThumbnailLink(p.images[0], "tiny", session, mobile))
         setPending(pending)
         setPendingImages(images)
    }

    const updateDeleted = async () => {
        const deleted = await functions.http.get("/api/post/rejected", null, session, setSessionFlag)
        const images = deleted.map((p) => functions.link.getUnverifiedThumbnailLink(p.images[0], "tiny", session, mobile))
        setDeleted(deleted)
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
        //updateForumPosts()
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
            setBio(moeText.undoLinkReplacements(session.bio))
            if (init) {
                setBlacklist(session.blacklist)
                setInterval(Math.floor(Number(session.autosearchInterval || 3000) / 1000).toString())
                setInit(false)
            }
        }
    }, [session, init])

    const favoritesPrivacy = async () => {
        await functions.http.post("/api/user/favoritesprivacy", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const tagFavoritesPrivacy = async () => {
        await functions.http.post("/api/user/tagfavoritesprivacy", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showRelated = async () => {
        await functions.http.post("/api/user/showrelated", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showTooltips = async () => {
        await functions.http.post("/api/user/showtooltips", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showTagTooltips = async () => {
        await functions.http.post("/api/user/showtagtooltips", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showTagBanner = async () => {
        await functions.http.post("/api/user/showtagbanner", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const downloadPixivID = async () => {
        await functions.http.post("/api/user/downloadpixivid", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const forceNoteBubbles = async () => {
        await functions.http.post("/api/user/forcenotebubbles", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const liveAnimationPreview = async () => {
        await functions.http.post("/api/user/liveanimationpreview", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }
    
    const liveModelPreview = async () => {
        await functions.http.post("/api/user/livemodelpreview", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const showR18 = async () => {
        if (session.showR18) {
            await functions.http.post("/api/user/r18", {r18: false}, session, setSessionFlag)
            functions.cache.clearResponseCacheKey("/api/user/session")
            setSessionFlag(true)
        } else {
            setR18Confirmation(true)
        }
    }

    const upscaledImages = async () => {
        if (permissions.isPremium(session)) {
            await functions.http.post("/api/user/upscaledimages", null, session, setSessionFlag)
            functions.cache.clearResponseCacheKey("/api/user/session")
            setSessionFlag(true)
        } else {
            setPremiumRequired(true)
        }
    }

    useEffect(() => {
        const autosearchInterval = async () => {
            clearTimeout(intervalTimer) 
            intervalTimer = setTimeout(() => {
                functions.cache.clearResponseCacheKey("/api/user/session")
                functions.http.post("/api/user/autosearchinterval", {interval: functions.util.safeNumber(interval)}, session, setSessionFlag)
                .then(() => setSessionFlag(true))
            }, 1000)
        }
        autosearchInterval()
    }, [interval])

    useEffect(() => {
        const updateBlacklist = async () => {
            clearTimeout(blacklistTimer) 
            blacklistTimer = setTimeout(() => {
                functions.cache.clearResponseCacheKey("/api/user/session")
                functions.http.post("/api/user/blacklist", {blacklist}, session, setSessionFlag)
                .then(() => setSessionFlag(true))
            }, 1000)
        }
        updateBlacklist()
    }, [blacklist])

    const changeBio = async () => {
        const bio = await textBoxRef.current!.resolveReplacements()
        const badBio = functions.validation.validateBio(bio, i18n)
        if (badBio) {
            textBoxRef.current?.showError(badBio)
            await functions.timeout(2000)
            return textBoxRef.current?.clearError()
        }
        textBoxRef.current?.showError(i18n.buttons.submitting)
        try {
            await functions.http.post("/api/user/changebio", {bio}, session, setSessionFlag)
            functions.cache.clearResponseCacheKey("/api/user/session")
            setSessionFlag(true)
            textBoxRef.current?.clearError()
            setShowBioInput(false)
        } catch {
            textBoxRef.current?.showError(i18n.errors.bio.bad)
            await functions.timeout(2000)
            textBoxRef.current?.clearError()
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
        setPosts(uploads)
        setNavigationPosts(uploads)
    }

    const setFav = (img: string, index: number, newTab: boolean) => {
        setFavoriteIndex(index)
        const post = favorites[index]
        if (newTab) {
            window.open(`/post/${post.postID}/${post.slug}`, "_blank")
        } else {
            navigate(`/post/${post.postID}/${post.slug}`)
        }
        setPosts(favorites)
        setNavigationPosts(favorites)
    }

    const setPend = (img: string, index: number, newTab: boolean) => {
        setPendingIndex(index)
        const post = pending[index]
        if (newTab) {
            window.open(`/unverified/post/${post.postID}`, "_blank")
        } else {
            navigate(`/unverified/post/${post.postID}`)
        }
    }

    const setDel = (img: string, index: number, newTab: boolean) => {
        setDeletedIndex(index)
        const post = deleted[index]
        if (newTab) {
            window.open(`/unverified/post/${post.postID}`, "_blank")
        } else {
            navigate(`/unverified/post/${post.postID}`)
        }
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
        setSearch(`user:${session.username}`)
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
        functions.post.openPost(userImgPost, event, navigate, session, setSessionFlag)
    }

    const generateUsernameJSX = () => {
        return functions.jsx.usernameJSX(session, {
            containerClass: "user-name-container",
            textClass: "user-name-plain",
            imageClass: "user-name-label"
        }, i18n, navigate)
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
        await functions.http.delete("/api/user/pfp", null, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        setUserImg("")
        setSessionFlag(true)
    }

    const clearCookieConsent = async () => {
        await functions.http.post("/api/user/cookieconsent", {consent: null}, session, setSessionFlag)
        functions.cache.clearResponseCacheKey("/api/user/session")
        localStorage.removeItem("cookieConsent")
        setSessionFlag(true)
    }

    const showBanner = async () => {
        localStorage.removeItem("bannerHideDate")
        functions.cache.clearResponseCacheKey("/api/user/session")
        setSessionFlag(true)
    }

    const premiumExpirationJSX = () => {
        if (!session.premiumExpiration) return null
        if (new Date(session.premiumExpiration) > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text" style={{color: "var(--premiumColor)"}}>{i18n.user.premiumUntil} {functions.date.prettyDate(session.premiumExpiration, i18n)}</span>
                </div>
            )
        } else if (new Date(session.premiumExpiration) < new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text">{i18n.user.premiumExpired} {functions.date.prettyDate(session.premiumExpiration, i18n)}</span>
                </div>
            )
        }
    }

    const banExpirationJSX = () => {
        if (!session.banned && !session.banExpiration) return null
        if (new Date(session.banExpiration || "") > new Date()) {
            return (
                <div className="user-row">
                    <span className="user-text" style={{color: "var(--banText)"}}>{i18n.user.banExpires} {functions.date.timeUntil(session.banExpiration, i18n)}</span>
                </div>
            )
        }
    }

    const openTag = (event: React.MouseEvent, tag?: string) => {
        if (!tag) return
        event.preventDefault()
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/tag/${encodeURIComponent(tag)}`, "_blank")
        } else {
            navigate(`/tag/${encodeURIComponent(tag)}`)
        }
    }

    const generateFavoriteTagsJSX = () => {
        if (favoriteTags.length) {
            return (
                <div className="user-column">
                    <span className="user-title">{i18n.user.favoriteTags} <span className="user-text-alt">{favoriteTags.length}</span></span>
                    <div className="tag-alias-button-container">
                        {favoriteTags.map((tag) =>
                            <button className="tag-alias-button" onClick={(event) => openTag(event, tag.tag)}>{tag.tag.replaceAll("-", " ")}</button>
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
            if (functions.post.isR18(ratingType)) {
                if (!functions.post.isR18(favgroup.rating)) continue
            } else {
                if (functions.post.isR18(favgroup.rating)) continue
            }
            const images = favgroup.posts.map((f) => functions.link.getThumbnailLink(f.images[0], "tiny", session, mobile))
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
                setNavigationPosts(favgroup.posts)
                setTimeout(() => {
                    setActiveFavgroup(favgroup)
                }, 200)
            }
            jsx.push(
                <div className="user-column">
                    <div className="user-title-container">
                        {favgroup.private ? <LockIcon className="user-icon" style={{height: "20px", marginTop: "3px"}}/> : null}
                        <span className="user-title" onClick={viewFavgroup}>{favgroup.name} <span className="user-text-alt">{favgroup.postCount}</span></span>
                    </div>
                    <Carousel images={images} noKey={true} set={setFavgroup} index={0} unlimited={true}/>
                </div>
            )
        }
        return jsx
    }

    const getBioTextArea = () => {
        return (
            <>
            <div className="user-column" style={{marginTop: "0px"}}>
                <MiniTextBox ref={textBoxRef} type="comment" bio={true} height={100} text={bio} setText={setBio} textRef={textRef} emojiRef={emojiRef}/>
            </div>
            <div className="user-row">
                <button className="user-button" onClick={changeBio}>{i18n.buttons.ok}</button>
                <button className="user-emoji-button" ref={emojiRef} onClick={() => textBoxRef.current?.toggleEmojiDropdown()}>
                    <EmojiSelectIcon className="user-emoji-button-icon"/>
                </button>
                <button className={textBoxRef.current?.getPreviewMode() ? "user-edit-button" : "user-preview-button"} 
                onClick={() => textBoxRef.current?.togglePreviewMode()}>
                {textBoxRef.current?.getPreviewMode() ? i18n.buttons.unpreview : i18n.buttons.preview}</button>
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
                        <img className="user-img" src={userImg} onClick={userImgClick} onAuxClick={userImgClick} style={{filter: session.image ? "" : filter}}/>
                        {generateUsernameJSX()}
                    </div>
                    {session.banned ? <span className="user-ban-text">{getBanText()}</span> : null}
                    {session.deleted ? <button className="user-deleted-button">{i18n.user.deletedAccount}</button> : null}
                    {premiumExpirationJSX()}
                    {banExpirationJSX()}
                    <div className="user-row">
                        <span className="user-text">{i18n.labels.email}: {session.email}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.joinDate}: {functions.date.prettyDate(session.joinDate, i18n)}</span>
                    </div>
                    <div className="user-row">
                        <span className="user-text">{i18n.user.bio}: {moeText.renderText(session.bio || i18n.user.noBio, emojis, "reply")}</span>
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
                        <span className="user-text">{i18n.labels.uploadLimit}: <span className="user-text-action">{functions.post.currentUploads(pending)} / {permissions.getUploadLimit(session)}</span></span>
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
                        
                        {permissions.isPremiumEnabled() ? <PremiumStarIcon className="user-icon-pink"/> : null}
                        <span style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-text">{i18n.user.upscaledImages}: <span style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-text-action" onClick={upscaledImages}>{session.upscaledImages ? i18n.buttons.yes : i18n.buttons.no}</span></span>
                    </div>
                    <div className="user-row">
                        {permissions.isPremiumEnabled() ? <PremiumStarIcon className="user-icon-pink"/> : null}
                        <span style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-text">{i18n.user.autosearchInterval}: </span>
                        <input style={permissions.isPremiumEnabled() ? {color: "var(--premiumColor)"} : {}} className="user-input" spellCheck={false} value={interval} onChange={(event) => setInterval(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></input>
                    </div>
                    {permissions.isAdmin(session) ? <div className="user-row">
                        <R18Icon className="user-icon-red"/>
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
                        {permissions.isPremiumEnabled() ? <PremiumStarIcon className="user-icon-pink" style={{height: "14px", marginRight: "5px"}}/> : null}
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
                        <span className="user-title">{functions.util.toProperCase(i18n.user.deleted)} <span className="user-text-alt">{deleted[0].postCount}</span></span>
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
                    {/*forumPosts.length ?
                    <div className="user-column">
                        <span className="user-title" onClick={viewForumPosts}>{i18n.user.forumPosts} <span className="user-text-alt">{forumPosts.length}</span></span>
                        <VerticalCarousel items={forumPosts} type="forumpost"/>
                    </div> : null*/}
                    <div className="user-column">
                        <span className="user-text" style={{fontSize: "22px", color: "var(--text-strong)"}}>Blacklist Tags</span>
                        <textarea style={{height: "150px", width: mobile ? "100%" : "60%", fontSize: "20px", color: "var(--text-strong)"}} className="user-textarea" 
                        spellCheck={false} value={blacklist} onChange={(event) => setBlacklist(event.target.value)}
                        onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}></textarea>
                    </div>
                    <div className="user-row">
                        <DangerIcon className="user-icon"/>
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