import React, {useEffect, useState, useContext} from "react"
import {Switch, Route, Redirect, useHistory} from "react-router-dom"
import Context, {ThemeContext, HideNavbarContext, HideSidebarContext, HideSortbarContext,
HideTitlebarContext, EnableDragContext, ActiveDropdownContext, FilterDropActiveContext,
SidebarHoverContext} from "./Context"
import PostsPage from "./pages/PostsPage"
import CommentsPage from "./pages/CommentsPage"
import ArtistsPage from "./pages/ArtistsPage"
import CharactersPage from "./pages/CharactersPage"
import SeriesPage from "./pages/SeriesPage"
import TagsPage from "./pages/TagsPage"
import PostPage from "./pages/PostPage"
import ComicPage from "./pages/ComicPage"
import GIFPage from "./pages/GIFPage"
import VideoPage from "./pages/VideoPage"
import UploadPage from "./pages/UploadPage"
import $404Page from "./pages/404Page"
import HelpPage from "./pages/HelpPage"
import TermsPage from "./pages/TermsPage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import $2FAPage from "./pages/2FAPage"
import ContactPage from "./pages/ContactPage"
import ChangeUsernamePage from "./pages/ChangeUsernamePage"
import ChangeEmailPage from "./pages/ChangeEmailPage"
import ChangePasswordPage from "./pages/ChangePasswordPage"
import ResetPasswordPage from "./pages/ResetPasswordPage"
import ForgotPasswordPage from "./pages/ForgotPasswordPage"
import functions from "./structures/Functions"
import ScrollToTop from "./components/ScrollToTop"
import "./index.less"

require.context("./assets/images", true)
require.context("./assets/purple", true)
require.context("./assets/purple-light", true)
require.context("./assets/magenta", true)
require.context("./assets/magenta-light", true)


const App: React.FunctionComponent = (props) => {
    const [loaded, setLoaded] = useState(false)
    const [theme, setTheme] = useState("purple")
    const [hideSortbar, setHideSortbar] = useState(false)
    const [hideSidebar, setHideSidebar] = useState(false)
    const [hideNavbar, setHideNavbar] = useState(false)
    const [hideTitlebar, setHideTitlebar] = useState(false)
    const [enableDrag, setEnableDrag] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState("none")
    const [filterDropActive, setFilterDropActive] = useState(false)
    const [sidebarHover, setSidebarHover] = useState(false)
    const history = useHistory()

    useEffect(() => {
        setTimeout(() => {
            setLoaded(true)
        }, 100)
    }, [])

    useEffect(() => {
        functions.preventDragging()
    })

    useEffect(() => {
        const handleScroll = () => {
            if (filterDropActive) return setHideSortbar(false)
            if (window.scrollY === 0) return setHideSortbar(false)
            if (sidebarHover) return setHideSortbar(true)
            setActiveDropdown("none")
            return setHideSortbar(true)
        }
        const handleMouseMove = (event: any) => {
            if (filterDropActive) return setHideSortbar(false)
            if (activeDropdown !== "none") return setHideSortbar(false)
            if (window.scrollY === 0) return setHideSortbar(false)
            if (sidebarHover) return setHideSortbar(true)
            const sortbar = document.querySelector(".sortbar")
            const amt = hideTitlebar ? (sortbar ? (35 + 40) : 35) : (77 + 35 + 40)
            if (event.clientY < amt) return setHideSortbar(false)
            return setHideSortbar(true)
        }
        window.addEventListener("scroll", handleScroll)
        window.addEventListener("mousemove", handleMouseMove)
        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [hideTitlebar, activeDropdown, sidebarHover])

    useEffect(() => {
        functions.dragScroll(enableDrag)
    }, [enableDrag, history])

    useEffect(() => {
        if (!theme || theme === "purple") {
            document.documentElement.style.setProperty("--background", "#0f0b35")
            document.documentElement.style.setProperty("--titlebarBG", "#1d0a71")
            document.documentElement.style.setProperty("--navbarBG", "#230089")
        } else if (theme === "purple-light") {
            document.documentElement.style.setProperty("--background", "#c7c6fb")
            document.documentElement.style.setProperty("--titlebarBG", "#8789ff")
            document.documentElement.style.setProperty("--navbarBG", "#888bff")
        } else if (theme === "magenta") {
            document.documentElement.style.setProperty("--background", "#350b2c")
            document.documentElement.style.setProperty("--titlebarBG", "#710a65")
            document.documentElement.style.setProperty("--navbarBG", "#890085")
        } else if (theme === "magenta-light") {
            document.documentElement.style.setProperty("--background", "#f4dbfd")
            document.documentElement.style.setProperty("--titlebarBG", "#ee9bff")
            document.documentElement.style.setProperty("--navbarBG", "#e49dff")
        }
        functions.changeFavicon(theme)
    }, [theme])

    return (
        <div className={`app ${theme} ${!loaded ? "stop-transitions" : ""}`}>
            <SidebarHoverContext.Provider value={{sidebarHover, setSidebarHover}}>
            <FilterDropActiveContext.Provider value={{filterDropActive, setFilterDropActive}}>
            <ActiveDropdownContext.Provider value={{activeDropdown, setActiveDropdown}}>
            <EnableDragContext.Provider value={{enableDrag, setEnableDrag}}>
            <HideSortbarContext.Provider value={{hideSortbar, setHideSortbar}}>
            <HideNavbarContext.Provider value={{hideNavbar, setHideNavbar}}>
            <HideTitlebarContext.Provider value={{hideTitlebar, setHideTitlebar}}>
            <HideSidebarContext.Provider value={{hideSidebar, setHideSidebar}}>
            <ThemeContext.Provider value={{theme, setTheme}}>
                <Context>
                    <Switch>
                        <Route exact path={["/", "/posts", "/home"]}><PostsPage/></Route>
                        <Route exact path="/upload"><UploadPage/></Route>
                        <Route exact path="/comic"><ComicPage/></Route>
                        <Route exact path="/video"><VideoPage/></Route>
                        <Route exact path="/gif"><GIFPage/></Route>
                        <Route exact path="/tags"><TagsPage/></Route>
                        <Route exact path="/series"><SeriesPage/></Route>
                        <Route exact path="/characters"><CharactersPage/></Route>
                        <Route exact path="/artists"><ArtistsPage/></Route>
                        <Route exact path="/comments"><CommentsPage/></Route>
                        <Route exact path="/post/:id" render={(props) => <PostPage {...props}/>}></Route>
                        <Route exact path="/help"><HelpPage/></Route>
                        <Route exact path="/change-username"><ChangeUsernamePage/></Route>
                        <Route exact path="/change-email"><ChangeEmailPage/></Route>
                        <Route exact path="/reset-password"><ResetPasswordPage/></Route>
                        <Route exact path="/change-password"><ChangePasswordPage/></Route>
                        <Route exact path="/forgot-password"><ForgotPasswordPage/></Route>
                        <Route exact path={["/signup", "/register"]}><SignUpPage/></Route>
                        <Route exact path="/login"><LoginPage/></Route>
                        <Route exact path="/2fa"><$2FAPage/></Route>
                        <Route exact path="/contact"><ContactPage/></Route>
                        <Route exact path={["/privacy", "/privacypolicy"]}><Redirect to="/terms#privacy"/></Route>
                        <Route exact path={["/terms", "termsofservice"]}><TermsPage/></Route>
                        <Route path="*"><$404Page/></Route>
                    </Switch>
                </Context>
            </ThemeContext.Provider>
            </HideSidebarContext.Provider>
            </HideTitlebarContext.Provider>
            </HideNavbarContext.Provider>
            </HideSortbarContext.Provider>
            </EnableDragContext.Provider>
            </ActiveDropdownContext.Provider>
            </FilterDropActiveContext.Provider>
            </SidebarHoverContext.Provider>
        </div>
    )
}

export default App