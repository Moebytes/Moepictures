import React, {useEffect, useState} from "react"
import {Switch, Route, Redirect, useHistory} from "react-router-dom"
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

export const ThemeContext = React.createContext<any>(null)
export const HideSortbarContext = React.createContext<any>(null)
export const HideSidebarContext = React.createContext<any>(null)
export const HideNavbarContext = React.createContext<any>(null)
export const EnableDragContext = React.createContext<any>(null)
export const ActiveDropdownContext = React.createContext<any>(null)
export const SizeTypeContext = React.createContext<any>(null)
export const FilterDropActiveContext = React.createContext<any>(null)
export const SquareContext = React.createContext<any>(null)

export const BrightnessContext = React.createContext<any>(null)
export const ContrastContext = React.createContext<any>(null)
export const HueContext = React.createContext<any>(null)
export const SaturationContext = React.createContext<any>(null)
export const LightnessContext = React.createContext<any>(null)
export const BlurContext = React.createContext<any>(null)
export const SharpenContext = React.createContext<any>(null)
export const PixelateContext = React.createContext<any>(null)
export const ImageAmountContext = React.createContext<any>(null)
export const ImagesContext = React.createContext<any>(null)
export const DownloadURLsContext = React.createContext<any>(null)
export const DownloadFlagContext = React.createContext<any>(null)
export const RelativeContext = React.createContext<any>(null)

export const ShowDownloadDialogContext = React.createContext<any>(null)
export const DisableZoomContext = React.createContext<any>(null)

const App: React.FunctionComponent = (props) => {
    const [theme, setTheme] = useState("purple")
    const [hideSortbar, setHideSortbar] = useState(false)
    const [hideSidebar, setHideSidebar] = useState(false)
    const [hideNavbar, setHideNavbar] = useState(false)
    const [enableDrag, setEnableDrag] = useState(false)
    const [sizeType, setSizeType] = useState("medium")
    const [loaded, setLoaded] = useState(false)
    const [activeDropdown, setActiveDropdown] = useState("none")
    const [filterDropActive, setFilterDropActive] = useState(false)
    const [brightness, setBrightness] = useState(100)
    const [contrast, setContrast] = useState(100)
    const [hue, setHue] = useState(180)
    const [saturation, setSaturation] = useState(100)
    const [lightness, setLightness] = useState(100)
    const [blur, setBlur] = useState(0)
    const [sharpen, setSharpen] = useState(0)
    const [pixelate, setPixelate] = useState(1)
    const [square, setSquare] = useState(false)
    const [showDownloadDialog, setShowDownloadDialog] = useState(false)
    const [imageAmount, setImageAmount] = useState(0)
    const [downloadURLs, setDownloadURLs] = useState([])
    const [downloadFlag, setDownloadFlag] = useState(false)
    const [relative, setRelative] = useState(false)
    const [images, setImages] = useState([]) as any
    const [disableZoom, setDisableZoom] = useState(true)
    const history = useHistory()

    useEffect(() => {
        functions.preventDragging()
        setTimeout(() => {
            setLoaded(true)
        }, 100)
    }, [])

    useEffect(() => {
        const handleScroll = () => {
            if (filterDropActive) return setHideSortbar(false)
            if (window.scrollY === 0) return setHideSortbar(false)
            setActiveDropdown("none")
            return setHideSortbar(true)
        }
        const handleMouseMove = (event: any) => {
            if (filterDropActive) return setHideSortbar(false)
            if (activeDropdown !== "none") return setHideSortbar(false)
            if (window.scrollY === 0) return setHideSortbar(false)
            const amt = hideNavbar ? (35 + 40) : (77 + 35 + 40)
            if (event.clientY < amt) return setHideSortbar(false)
            return setHideSortbar(true)
        }
        window.addEventListener("scroll", handleScroll)
        window.addEventListener("mousemove", handleMouseMove)
        return () => {
            window.removeEventListener("scroll", handleScroll)
            window.removeEventListener("mousemove", handleMouseMove)
        }
    }, [hideNavbar, activeDropdown])

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
            <DisableZoomContext.Provider value={{disableZoom, setDisableZoom}}>
            <RelativeContext.Provider value={{relative, setRelative}}>
            <DownloadURLsContext.Provider value={{downloadURLs, setDownloadURLs}}>
            <DownloadFlagContext.Provider value={{downloadFlag, setDownloadFlag}}>
            <ImagesContext.Provider value={{images, setImages}}>
            <ImageAmountContext.Provider value={{imageAmount, setImageAmount}}>
            <ShowDownloadDialogContext.Provider value={{showDownloadDialog, setShowDownloadDialog}}>
            <PixelateContext.Provider value={{pixelate, setPixelate}}>
            <SquareContext.Provider value={{square, setSquare}}>
            <FilterDropActiveContext.Provider value={{filterDropActive, setFilterDropActive}}>
            <BrightnessContext.Provider value={{brightness, setBrightness}}>
            <ContrastContext.Provider value={{contrast, setContrast}}>
            <HueContext.Provider value={{hue, setHue}}>
            <SaturationContext.Provider value={{saturation, setSaturation}}>
            <LightnessContext.Provider value={{lightness, setLightness}}>
            <BlurContext.Provider value={{blur, setBlur}}>
            <SharpenContext.Provider value={{sharpen, setSharpen}}>
            <SizeTypeContext.Provider value={{sizeType, setSizeType}}>
            <ActiveDropdownContext.Provider value={{activeDropdown, setActiveDropdown}}>
            <EnableDragContext.Provider value={{enableDrag, setEnableDrag}}>
            <HideSortbarContext.Provider value={{hideSortbar, setHideSortbar}}>
            <HideNavbarContext.Provider value={{hideNavbar, setHideNavbar}}>
            <HideSidebarContext.Provider value={{hideSidebar, setHideSidebar}}>
            <ThemeContext.Provider value={{theme, setTheme}}>
                <ScrollToTop>
                    <Switch>
                        <Route exact path="/upload"><UploadPage/></Route>
                        <Route exact path="/comic"><ComicPage/></Route>
                        <Route exact path="/video"><VideoPage/></Route>
                        <Route exact path="/gif"><GIFPage/></Route>
                        <Route exact path="/tags"><TagsPage/></Route>
                        <Route exact path="/series"><SeriesPage/></Route>
                        <Route exact path="/characters"><CharactersPage/></Route>
                        <Route exact path="/artists"><ArtistsPage/></Route>
                        <Route exact path="/comments"><CommentsPage/></Route>
                        <Route exact path={["/", "/posts", "/home"]}><PostsPage/></Route>
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
                </ScrollToTop>
            </ThemeContext.Provider>
            </HideSidebarContext.Provider>
            </HideNavbarContext.Provider>
            </HideSortbarContext.Provider>
            </EnableDragContext.Provider>
            </ActiveDropdownContext.Provider>
            </SizeTypeContext.Provider>
            </SharpenContext.Provider>
            </BlurContext.Provider>
            </LightnessContext.Provider>
            </SaturationContext.Provider>
            </HueContext.Provider>
            </ContrastContext.Provider>
            </BrightnessContext.Provider>
            </FilterDropActiveContext.Provider>
            </SquareContext.Provider>
            </PixelateContext.Provider>
            </ShowDownloadDialogContext.Provider>
            </ImageAmountContext.Provider>
            </ImagesContext.Provider>
            </DownloadFlagContext.Provider>
            </DownloadURLsContext.Provider>
            </RelativeContext.Provider>
            </DisableZoomContext.Provider>
        </div>
    )
}

export default App