import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RedirectContext, MobileContext, TabletContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext, SessionFlagContext, ActionBannerContext} from "../Context"
import "./styles/sitepage.less"

const LoginHistoryPage: React.FunctionComponent = (props) => {
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
    const {mobile, setMobile} = useContext(MobileContext)
    const {tablet, setTablet} = useContext(TabletContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {ActionBanner, setActionBanner} = useContext(ActionBannerContext)
    const [loginHistory, setLoginHistory] = useState([] as any)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateLoginHistory = async () => {
        const result = await functions.get("/api/user/login/history", null, session, setSession)
        setLoginHistory(result)
    }

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Login History"
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
            setRedirect("/login-history")
            history.push("/login")
            setSidebarText("Login required.")
        }
        updateLoginHistory()
    }, [session])

    const logoutOtherSessions = async () => {
        await functions.post("/api/user/logout-sessions", null, session, setSessionFlag)
        setActionBanner("logout-sessions")
    }

    const failedLogin = (log: any) => {
        if (log.type === "login failed") return true
        if (log.type === "login 2fa failed") return true
        if (log.type === "2fa disabled") return true
        return false
    }

    const loginHistoryJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < loginHistory.length; i++) {
            const log = loginHistory[i]
            jsx.push(
                <div className="sitepage-table-row">
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name">{log.username}</span>
                    </div>
                    <div className="sitepage-table-column" style={{width: "130px"}}>
                        <span className={`sitepage-table-name ${failedLogin(log) ? "artist-tag-color" : ""}`}>{log.type}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name-strong">{log.ip}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name">{log.device}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name">{log.region}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name-strong">{functions.prettyDate(new Date(log.timestamp))}</span>
                    </div>
                </div>
            )
        }
        return (
            <div className="sitepage-table">
                {jsx}
            </div>
        )
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage" style={{width: mobile || tablet ? "100%" : "70%", height: "max-content"}}>
                    <div className="sitepage-title-container">
                        <span className="sitepage-title">Login History</span>
                    </div>
                    <span className="sitepage-link">If you don't recognize the activity, logout of all other sessions and change your password!</span>
                    <div className="sitepage-button-container" style={{justifyContent: "flex-start"}}>
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←Back</button>
                        <button className="sitepage-button" onClick={logoutOtherSessions}>Logout Other Sessions</button>
                    </div>
                    {loginHistoryJSX()}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default LoginHistoryPage