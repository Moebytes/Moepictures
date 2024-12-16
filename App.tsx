import React, {useEffect, useState} from "react"
import {Switch, Route, Redirect, useHistory, useLocation} from "react-router-dom"
import {useThemeSelector, useLayoutSelector, useLayoutActions, useSessionSelector, useSessionActions, useInteractionSelector, 
useInteractionActions, useActiveSelector, useActiveActions, useCacheSelector, useCacheActions, useSearchSelector, useSearchActions} from "./store"
import favicon from "./assets/icons/favicon.png"
import permissions from "./structures/Permissions"
import PostsPage from "./pages/PostsPage"
import CommentsPage from "./pages/CommentsPage"
import ArtistsPage from "./pages/ArtistsPage"
import CharactersPage from "./pages/CharactersPage"
import SeriesPage from "./pages/SeriesPage"
import TagsPage from "./pages/TagsPage"
import PostPage from "./pages/PostPage"
import UploadPage from "./pages/UploadPage"
import $404Page from "./pages/404Page"
import $403Page from "./pages/403Page"
import $401Page from "./pages/401Page"
import HelpPage from "./pages/HelpPage"
import TermsPage from "./pages/TermsPage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import $2FAPage from "./pages/2FAPage"
import $2FAEnablePage from "./pages/2FAEnablePage"
import ContactPage from "./pages/ContactPage"
import CopyrightRemovalPage from "./pages/CopyrightRemovalPage"
import UserProfilePage from "./pages/UserProfilePage"
import ChangeUsernamePage from "./pages/ChangeUsernamePage"
import ChangeEmailPage from "./pages/ChangeEmailPage"
import ChangeEmailSuccessPage from "./pages/ChangeEmailSuccessPage"
import VerifyEmailPage from "./pages/VerifyEmailPage"
import VerifyEmailSuccessPage from "./pages/VerifyEmailSuccessPage"
import ChangePasswordPage from "./pages/ChangePasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import EditPostPage from "./pages/EditPostPage"
import UserPage from "./pages/UserPage"
import TagPage from "./pages/TagPage"
import GroupPage from "./pages/GroupPage"
import FavgroupPage from "./pages/FavgroupPage"
import TagHistoryPage from "./pages/TagHistoryPage"
import PostHistoryPage from "./pages/PostHistoryPage"
import GroupHistoryPage from "./pages/GroupHistoryPage"
import HistoryPage from "./pages/HistoryPage"
import UnverifiedPostPage from "./pages/UnverifiedPostPage"
import functions from "./structures/Functions"
import ModQueuePage from "./pages/ModQueuePage"
import EditUnverifiedPostPage from "./pages/EditUnverifiedPostPage"
import SetAvatarPage from "./pages/SetAvatarPage"
import TranslationHistoryPage from "./pages/TranslationHistoryPage"
import ForumPage from "./pages/ForumPage"
import ThreadPage from "./pages/ThreadPage"
import GroupsPage from "./pages/GroupsPage"
import BulkUploadPage from "./pages/BulkUploadPage"
import MailPage from "./pages/MailPage"
import MessagePage from "./pages/MessagePage"
import LoginHistoryPage from "./pages/LoginHistoryPage"
import IPBlacklistPage from "./pages/IPBlacklistPage"
import NewsBannerPage from "./pages/NewsBannerPage"
import PremiumPage from "./pages/PremiumPage"
import PremiumRequiredDialog from "./dialogs/PremiumRequiredDialog"
import PremiumSuccessPage from "./pages/PremiumSuccessPage"
import DragAndDrop from "./components/DragAndDrop"
import AudioPlayer from "./components/AudioPlayer"
import ActionBanner from "./components/ActionBanner"
import NewsBanner from "./components/NewsBanner"
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
    const {posts} = useCacheSelector()
    const {setEmojis} = useCacheActions()
    const {selectionMode} = useSearchSelector()
    const {setRatingType} = useSearchActions()
    const history = useHistory()
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
        const savedRating = localStorage.getItem("rating")
        if (savedRating) setRatingType(savedRating)
        const onDOMLoaded = () => {
            setLoaded(true)
            getSessionCookie()
            functions.clearCache()
            cacheEmojis()
            if (savedActiveGroup) setActiveGroup(savedActiveGroup)
            if (savedActiveFavgroup) setActiveFavgroup(JSON.parse(savedActiveFavgroup))
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (activeGroup) {
            localStorage.setItem("activeGroup", activeGroup)
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
            await functions.post("/api/2fa/delete", null, session, setSessionFlag)
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
                history.push("/verify-email")
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
        if (mobile) return functions.dragScroll(false)
        functions.dragScroll(enableDrag)
    }, [enableDrag, history])

    useEffect(() => {
        if (!theme || theme === "purple") {
            document.documentElement.style.setProperty("--background", "#09071c")
            document.documentElement.style.setProperty("--titlebarBG", "#090420")
            document.documentElement.style.setProperty("--navbarBG", "#0b0322")
        } else if (theme === "purple-light") {
            document.documentElement.style.setProperty("--background", "#ffffff")
            document.documentElement.style.setProperty("--titlebarBG", "#dfdfff")
            document.documentElement.style.setProperty("--navbarBG", "#dbddff")
        } else if (theme === "magenta") {
            document.documentElement.style.setProperty("--background", "#17040e")
            document.documentElement.style.setProperty("--titlebarBG", "#1c0511")
            document.documentElement.style.setProperty("--navbarBG", "#1e0514")
        } else if (theme === "magenta-light") {
            document.documentElement.style.setProperty("--background", "#ffffff")
            document.documentElement.style.setProperty("--titlebarBG", "#ffe2f2")
            document.documentElement.style.setProperty("--navbarBG", "#ffe0f1")
        }
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
            <DragAndDrop/>
            <NewsBanner/>
            <ActionBanner/>
            <PremiumRequiredDialog/>
            <Switch>
                <Route exact path={["/", "/posts", "/home"]}><PostsPage/></Route>
                <Route exact path="/profile"><UserProfilePage/></Route>
                <Route exact path="/upload"><UploadPage/></Route>
                <Route exact path="/bulk-upload"><BulkUploadPage/></Route>
                <Route exact path="/tags"><TagsPage/></Route>
                <Route exact path="/series"><SeriesPage/></Route>
                <Route exact path="/characters"><CharactersPage/></Route>
                <Route exact path="/artists"><ArtistsPage/></Route>
                <Route exact path="/comments"><CommentsPage/></Route>
                <Route exact path="/groups"><GroupsPage/></Route>
                <Route exact path="/history"><HistoryPage/></Route>
                <Route exact path="/premium"><PremiumPage/></Route>
                <Route exact path="/user/:username" render={(props) => <UserPage {...props}/>}></Route>
                <Route exact path="/tag/history/:tag" render={(props) => <TagHistoryPage {...props}/>}></Route>
                <Route exact path="/user/:username/tag/history" render={(props) => <TagHistoryPage {...props}/>}></Route>
                <Route exact path="/tag/:tag" render={(props) => <TagPage {...props}/>}></Route>
                <Route exact path="/group/:group" render={(props) => <GroupPage {...props}/>}></Route>
                <Route exact path="/group/history/:group" render={(props) => <GroupHistoryPage {...props}/>}></Route>
                <Route exact path="/user/:username/group/history" render={(props) => <GroupHistoryPage {...props}/>}></Route>
                <Route exact path="/favgroup/:username/:favgroup" render={(props) => <FavgroupPage {...props}/>}></Route>
                <Route exact path="/translation/history/:id/:order" render={(props) => <TranslationHistoryPage {...props}/>}></Route>
                <Route exact path="/user/:username/translation/history" render={(props) => <TranslationHistoryPage {...props}/>}></Route>
                <Route exact path="/post/history/:id" render={(props) => <PostHistoryPage {...props}/>}></Route>
                <Route exact path="/user/:username/post/history" render={(props) => <PostHistoryPage {...props}/>}></Route>
                <Route exact path="/post/:id" render={(props) => <PostPage {...props}/>}></Route>
                <Route exact path="/post/:id/:slug" render={(props) => <PostPage {...props}/>}></Route>
                <Route exact path="/unverified/post/:id" render={(props) => <UnverifiedPostPage {...props}/>}></Route>
                <Route exact path="/edit-post/:id" render={(props) => <EditPostPage {...props}/>}></Route>
                <Route exact path="/unverified/edit-post/:id" render={(props) => <EditUnverifiedPostPage {...props}/>}></Route>
                <Route exact path="/set-avatar/:id" render={(props) => <SetAvatarPage {...props}/>}></Route>
                <Route exact path="/help"><HelpPage/></Route>
                <Route exact path="/forum"><ForumPage/></Route>
                <Route exact path="/thread/:id" render={(props) => <ThreadPage {...props}/>}></Route>
                <Route exact path="/mail"><MailPage/></Route>
                <Route exact path="/message/:id" render={(props) => <MessagePage {...props}/>}></Route>
                <Route exact path="/change-username"><ChangeUsernamePage/></Route>
                <Route exact path="/change-email"><ChangeEmailPage/></Route>
                <Route exact path="/change-email-success"><ChangeEmailSuccessPage/></Route>
                <Route exact path="/verify-email"><VerifyEmailPage/></Route>
                <Route exact path="/verify-email-success"><VerifyEmailSuccessPage/></Route>
                <Route exact path="/premium-success"><PremiumSuccessPage/></Route>
                <Route exact path="/reset-password"><ResetPasswordPage/></Route>
                <Route exact path="/change-password"><ChangePasswordPage/></Route>
                <Route exact path="/forgot-password"><ForgotPasswordPage/></Route>
                <Route exact path={["/signup", "/register"]}><SignUpPage/></Route>
                <Route exact path="/login"><LoginPage/></Route>
                <Route exact path="/2fa"><$2FAPage/></Route>
                <Route exact path="/enable-2fa"><$2FAEnablePage/></Route>
                <Route exact path="/login-history"><LoginHistoryPage/></Route>
                <Route exact path="/contact"><ContactPage/></Route>
                <Route exact path="/copyright-removal"><CopyrightRemovalPage/></Route>
                <Route exact path="/mod-queue"><ModQueuePage/></Route>
                <Route exact path={["/privacy", "/privacypolicy"]}><Redirect to="/terms#privacy"/></Route>
                <Route exact path={["/terms", "termsofservice"]}><TermsPage/></Route>
                <Route exact path="/news-banner"><NewsBannerPage/></Route>
                <Route exact path="/ip-blacklist"><IPBlacklistPage/></Route>
                <Route exact path="/401"><$401Page/></Route>
                <Route exact path="/403"><$403Page/></Route>
                <Route path="*"><$404Page/></Route>
            </Switch>
            <AudioPlayer/>
        </div>
    )
}

export default App