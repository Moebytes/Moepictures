import React, {useEffect, useState} from "react"
import {Routes, Route, Navigate, useNavigate, useLocation} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useLayoutActions, useSessionSelector, useSessionActions, useInteractionSelector, useFlagSelector,
useInteractionActions, useActiveSelector, useActiveActions, useCacheSelector, useCacheActions, useSearchSelector, useSearchActions} from "./store"
import favicon from "./assets/icons/favicon.png"
import permissions from "./structures/Permissions"
import PostsPage from "./pages/search/PostsPage"
import CommentsPage from "./pages/search/CommentsPage"
import NotesPage from "./pages/search/NotesPage"
import ArtistsPage from "./pages/search/ArtistsPage"
import CharactersPage from "./pages/search/CharactersPage"
import SeriesPage from "./pages/search/SeriesPage"
import TagsPage from "./pages/search/TagsPage"
import PostPage from "./pages/item/PostPage"
import UploadPage from "./pages/upload/UploadPage"
import $404Page from "./pages/info/404Page"
import $403Page from "./pages/info/403Page"
import $401Page from "./pages/info/401Page"
import HelpPage from "./pages/info/HelpPage"
import TermsPage from "./pages/info/TermsPage"
import LoginPage from "./pages/settings/LoginPage"
import SignUpPage from "./pages/settings/SignUpPage"
import $2FAPage from "./pages/settings/2FAPage"
import $2FAEnablePage from "./pages/settings/2FAEnablePage"
import ContactPage from "./pages/info/ContactPage"
import CopyrightRemovalPage from "./pages/info/CopyrightRemovalPage"
import UserProfilePage from "./pages/item/UserProfilePage"
import ChangeUsernamePage from "./pages/settings/ChangeUsernamePage"
import ChangeEmailPage from "./pages/settings/ChangeEmailPage"
import ChangeEmailSuccessPage from "./pages/settings/ChangeEmailSuccessPage"
import VerifyEmailPage from "./pages/settings/VerifyEmailPage"
import VerifyEmailSuccessPage from "./pages/settings/VerifyEmailSuccessPage"
import VerifyLoginSuccessPage from "./pages/settings/VerifyLoginSuccessPage"
import ChangePasswordPage from "./pages/settings/ChangePasswordPage"
import ResetPasswordPage from "./pages/settings/ResetPasswordPage"
import ForgotPasswordPage from "./pages/settings/ForgotPasswordPage"
import EditPostPage from "./pages/upload/EditPostPage"
import UserPage from "./pages/item/UserPage"
import TagPage from "./pages/item/TagPage"
import GroupPage from "./pages/item/GroupPage"
import FavgroupPage from "./pages/item/FavgroupPage"
import TagHistoryPage from "./pages/history/TagHistoryPage"
import PostHistoryPage from "./pages/history/PostHistoryPage"
import GroupHistoryPage from "./pages/history/GroupHistoryPage"
import HistoryPage from "./pages/history/HistoryPage"
import UnverifiedPostPage from "./pages/item/UnverifiedPostPage"
import functions from "./structures/Functions"
import ModQueuePage from "./pages/search/ModQueuePage"
import EditUnverifiedPostPage from "./pages/upload/EditUnverifiedPostPage"
import SetAvatarPage from "./pages/item/SetAvatarPage"
import NoteHistoryPage from "./pages/history/NoteHistoryPage"
import ForumPage from "./pages/search/ForumPage"
import ForumPostsPage from "./pages/search/ForumPostsPage"
import ThreadPage from "./pages/item/ThreadPage"
import GroupsPage from "./pages/search/GroupsPage"
import BulkUploadPage from "./pages/upload/BulkUploadPage"
import MailPage from "./pages/search/MailPage"
import MessagePage from "./pages/item/MessagePage"
import LoginHistoryPage from "./pages/settings/LoginHistoryPage"
import IPBlacklistPage from "./pages/settings/IPBlacklistPage"
import NewsBannerPage from "./pages/settings/NewsBannerPage"
import APIKeyPage from "./pages/settings/APIKeyPage"
import PremiumPage from "./pages/info/PremiumPage"
import PremiumSuccessPage from "./pages/settings/PremiumSuccessPage"
import ReaderPage from "./pages/item/ReaderPage"
import Dialogs from "./dialogs/Dialogs"
import DragAndDrop from "./components/site/DragAndDrop"
import AudioPlayer from "./components/site/AudioPlayer"
import ActionBanner from "./components/site/ActionBanner"
import NewsBanner from "./components/site/NewsBanner"
import CookieBanner from "./components/site/CookieBanner"
import TagToolTip from "./components/tooltip/TagToolTip"
import ToolTip from "./components/tooltip/ToolTip"
import ParticleEffect from "./components/site/ParticleEffect"
import LocalStorage from "./LocalStorage"
import DragScroll from "./components/site/DragScroll"
import "./index.less"

require.context("./assets/icons", true)

let destroy2FATimeout = null as any

const App: React.FunctionComponent = (props) => {
    const [loaded, setLoaded] = useState(false)
    const {theme} = useThemeSelector()
    const {mobile, hideTitlebar} = useLayoutSelector()
    const {setMobile, setTablet, setHideSortbar} = useLayoutActions()
    const {enableDrag, sidebarHover} = useInteractionSelector()
    const {setMobileScrolling} = useInteractionActions()
    const {activeDropdown, filterDropActive, activeGroup, activeFavgroup} = useActiveSelector()
    const {setActiveDropdown, setActiveGroup, setActiveFavgroup} = useActiveActions()
    const {session, sessionFlag} = useSessionSelector()
    const {setSession, setSessionFlag, setUserImg, setUserImgPost, setHasNotification} = useSessionActions()
    const {postFlag, tagFlag, groupFlag, messageFlag, historyFlag, updateUserFlag} = useFlagSelector()
    const {posts} = useCacheSelector()
    const {setEmojis} = useCacheActions()
    const {selectionMode} = useSearchSelector()
    const {setRatingType} = useSearchActions()
    const navigate = useNavigate()
    const location = useLocation()

    const getSessionCookie = async () => {
        const cookie = await functions.get("/api/user/session", null, session, setSessionFlag)
        setSession(cookie)
        if (cookie.username && !permissions.isPremium(cookie)) {
            await functions.post("/api/user/upscaledimages", {reset: true}, session, setSessionFlag)
        }
    }

    const cacheEmojis = async () => {
        const emojis = await functions.emojisCache(session, setSessionFlag)
        setEmojis(emojis)
    }

    useEffect(() => {
        const savedActiveGroup = localStorage.getItem("activeGroup")
        const savedActiveFavgroup = localStorage.getItem("activeFavgroup")
        functions.clearCache()
        cacheEmojis()
        const onDOMLoaded = () => {
            setLoaded(true)
            getSessionCookie()
            if (savedActiveGroup) setActiveGroup(JSON.parse(savedActiveGroup))
            if (savedActiveFavgroup) setActiveFavgroup(JSON.parse(savedActiveFavgroup))
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (activeGroup) {
            localStorage.setItem("activeGroup", JSON.stringify(activeGroup))
        } else {
            localStorage.removeItem("activeGroup")
        }
        if (activeFavgroup) {
            localStorage.setItem("activeFavgroup", JSON.stringify(activeFavgroup))
        } else {
            localStorage.removeItem("activeFavgroup")
        }
    }, [activeGroup, activeFavgroup])

    const getImg = () => {
        if (session.username) {
            return session.image ? functions.getTagLink("pfp", session.image, session.imageHash) : favicon
        } else {
            return ""
        }
    }

    const updatePfp = async () => {
        const img = getImg()
        setUserImg(img)
        if (session.imagePost) setUserImgPost(session.imagePost)
    }

    useEffect(() => {
        if (!session.username) return
        const events = new EventSource("/api/notifications", {withCredentials: true})
        events.onmessage = (event: any) => {
            if (event.data === "new message!") setHasNotification(true)
        }
        return () => {
            events.close()
        }
    }, [session])

    useEffect(() => {
        if (!session.cookie) return
        updatePfp()
    }, [session, theme])

    const destroy2FA = async () => {
        try {
            await functions.delete("/api/2fa/delete", null, session, setSessionFlag)
            setSessionFlag(true)
        } catch {
            // ignore
        }
    }

    useEffect(() => {
        if (!location.pathname.includes("/post")) {
            setActiveGroup(null)
            setActiveFavgroup(null)
        }
        if (session.username && !session.emailVerified) {
            if (location.pathname !== "/verify-email") {
                navigate("/verify-email")
            }
        }
        clearTimeout(destroy2FATimeout)
        destroy2FATimeout = setTimeout(() => {
            if (!session.username && session.email) {
                if (location.pathname !== "/2fa") {
                    destroy2FA()
                }
            }
        }, 1000)
    }, [location, session])

    useEffect(() => {
        if (sessionFlag) {
            setSessionFlag(false)
            getSessionCookie()
            updatePfp()
        }
    }, [sessionFlag])

    useEffect(() => {
        functions.preventDragging()
    })

    useEffect(() => {
        setActiveGroup(null)
        setActiveFavgroup(null)
    }, [posts])

    useEffect(() => {
        const handleScroll = () => {
            if (filterDropActive || selectionMode) {
                setMobileScrolling(false)
                return setHideSortbar(false)
            }
            if (functions.scrolledToTop()) return setHideSortbar(false)
            if (sidebarHover) return setHideSortbar(true)
            setActiveDropdown("none")
            return setHideSortbar(true)
        }
        const handleMouseMove = (event: any) => {
            if (filterDropActive || selectionMode) {
                setMobileScrolling(false)
                return setHideSortbar(false)
            }
            if (activeDropdown !== "none") return setHideSortbar(false)
            if (functions.scrolledToTop()) return setHideSortbar(false)
            if (sidebarHover) return setHideSortbar(true)
            const sortbar = document.querySelector(".sortbar")
            const amt = hideTitlebar ? (sortbar ? (functions.navbarHeight() + functions.sortbarHeight()) : functions.navbarHeight()) : (functions.titlebarHeight() + functions.navbarHeight() + functions.sortbarHeight())
            if (event.clientY < amt) return setHideSortbar(false)
            return setHideSortbar(true)
        }
        window.addEventListener("scroll", handleScroll)
        window.addEventListener("mousemove", handleMouseMove)
        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [selectionMode, filterDropActive, hideTitlebar, activeDropdown, sidebarHover])

    useEffect(() => {
        functions.changeFavicon(theme)
    }, [theme])

    useEffect(() => {
        const resize = () => {
            const isMobile = window.matchMedia("(max-width: 500px)").matches
            const isTablet = window.matchMedia("(min-width: 501px) and (max-width: 1200px)").matches
    
            if (isMobile) {
                setMobile(true)
                setTablet(false)
            } else if (isTablet) {
                setTablet(true)
                setMobile(false)
            } else {
                setMobile(false)
                setTablet(false)
            }
        }
        resize()
        window.addEventListener("resize", resize)
        document.documentElement.style.visibility = "visible"
        return () => {
            window.removeEventListener("resize", resize)
        }
    }, [])

    return (
        <div className={`app ${!loaded ? "stop-transitions" : ""}`}>
            <DragScroll>
                <ParticleEffect/>
                <DragAndDrop/>
                <NewsBanner/>
                <ActionBanner/>
                <CookieBanner/>
                <Dialogs/>
                <LocalStorage/>
                <TagToolTip/>
                <ToolTip/>
                <Routes>
                    <Route path="/" element={<PostsPage/>}/>
                    <Route path="/posts" element={<PostsPage/>}/>
                    <Route path="/home" element={<PostsPage/>}/>
                    <Route path="/profile" element={<UserProfilePage/>}/>
                    <Route path="/upload" element={<UploadPage/>}/>
                    <Route path="/bulk-upload" element={<BulkUploadPage/>}/>
                    <Route path="/tags" element={<TagsPage/>}/>
                    <Route path="/series" element={<SeriesPage/>}/>
                    <Route path="/characters" element={<CharactersPage/>}/>
                    <Route path="/artists" element={<ArtistsPage/>}/>
                    <Route path="/comments" element={<CommentsPage/>}/>
                    <Route path="/notes" element={<NotesPage/>}/>
                    <Route path="/groups" element={<GroupsPage/>}/>
                    <Route path="/history" element={<HistoryPage/>}/>
                    <Route path="/premium" element={<PremiumPage/>}/>
                    <Route path="/user/:username" element={<UserPage/>}/>
                    <Route path="/tag/history/:tag" element={<TagHistoryPage/>}/>
                    <Route path="/user/:username/tag/history" element={<TagHistoryPage/>}/>
                    <Route path="/tag/:tag" element={<TagPage/>}/>
                    <Route path="/group/:group" element={<GroupPage/>}/>
                    <Route path="/group/history/:group" element={<GroupHistoryPage/>}/>
                    <Route path="/user/:username/group/history" element={<GroupHistoryPage/>}/>
                    <Route path="/favgroup/:username/:favgroup" element={<FavgroupPage/>}/>
                    <Route path="/note/history/:id/:slug/:order" element={<NoteHistoryPage/>}/>
                    <Route path="/user/:username/note/history" element={<NoteHistoryPage/>}/>
                    <Route path="/post/history/:id/:slug" element={<PostHistoryPage/>}/>
                    <Route path="/user/:username/post/history" element={<PostHistoryPage/>}/>
                    <Route path="/post/:id" element={<PostPage/>}/>
                    <Route path="/post/:id/:slug" element={<PostPage/>}/>
                    <Route path="/post/:id/:slug/reader" element={<ReaderPage/>}/>
                    <Route path="/unverified/post/:id" element={<UnverifiedPostPage/>}/>
                    <Route path="/edit-post/:id/:slug" element={<EditPostPage/>}/>
                    <Route path="/unverified/edit-post/:id" element={<EditUnverifiedPostPage/>}/>
                    <Route path="/set-avatar/:id/:slug" element={<SetAvatarPage/>}/>
                    <Route path="/help" element={<HelpPage/>}/>
                    <Route path="/forum" element={<ForumPage/>}/>
                    <Route path="/posts/:username" element={<ForumPostsPage/>}/>
                    <Route path="/thread/:id" element={<ThreadPage/>}/>
                    <Route path="/mail" element={<MailPage/>}/>
                    <Route path="/message/:id" element={<MessagePage/>}/>
                    <Route path="/change-username" element={<ChangeUsernamePage/>}/>
                    <Route path="/change-email" element={<ChangeEmailPage/>}/>
                    <Route path="/change-email-success" element={<ChangeEmailSuccessPage/>}/>
                    <Route path="/verify-email" element={<VerifyEmailPage/>}/>
                    <Route path="/verify-email-success" element={<VerifyEmailSuccessPage/>}/>
                    <Route path="/verify-login-success" element={<VerifyLoginSuccessPage/>}/>
                    <Route path="/premium-success" element={<PremiumSuccessPage/>}/>
                    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
                    <Route path="/change-password" element={<ChangePasswordPage/>}/>
                    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
                    <Route path="/signup" element={<SignUpPage/>}/>
                    <Route path="/login" element={<LoginPage/>}/>
                    <Route path="/2fa" element={<$2FAPage/>}/>
                    <Route path="/enable-2fa" element={<$2FAEnablePage/>}/>
                    <Route path="/login-history" element={<LoginHistoryPage/>}/>
                    <Route path="/contact" element={<ContactPage/>}/>
                    <Route path="/copyright-removal" element={<CopyrightRemovalPage/>}/>
                    <Route path="/mod-queue" element={<ModQueuePage/>}/>
                    <Route path="/privacy" element={<Navigate to="/terms#privacy" replace/>}/>
                    <Route path="/terms" element={<TermsPage/>}/>
                    <Route path="/news-banner" element={<NewsBannerPage/>}/>
                    <Route path="/ip-blacklist" element={<IPBlacklistPage/>}/>
                    <Route path="/api-key" element={<APIKeyPage/>}/>
                    <Route path="/401" element={<$401Page/>}/>
                    <Route path="/403" element={<$403Page/>}/>
                    <Route path="*" element={<$404Page/>}/>
                </Routes>
                <AudioPlayer/>
            </DragScroll>
        </div>
    )
}

export default App