import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import Footer from "../../components/site/Footer"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import functions from "../../structures/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../../store"
import {LoginHistory} from "../../types/Types"
import "./styles/sitepage.less"

const LoginHistoryPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile, tablet} = useLayoutSelector()
    const {setActionBanner} = useActiveActions()
    const [loginHistory, setLoginHistory] = useState([] as LoginHistory[])
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateLoginHistory = async () => {
        const result = await functions.get("/api/user/login/history", null, session, setSessionFlag)
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
    }, [])

    useEffect(() => {
        document.title = i18n.user.loginHistory
    }, [i18n])

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

    const failedLogin = (log: LoginHistory) => {
        if (log.type === "login failed") return true
        if (log.type === "login 2fa failed") return true
        if (log.type === "2fa disabled") return true
        if (log.type === "password reset") return true
        if (log.type === "password changed") return true
        if (log.type === "email changed") return true
        if (log.type === "username changed") return true
        return false
    }

    const loginHistoryJSX = () => {
        let jsx = [] as React.ReactElement[]
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
                        <span className="sitepage-table-name-strong">{functions.prettyDate(log.timestamp, i18n)}</span>
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
                        <span className="sitepage-title">{i18n.user.loginHistory}</span>
                    </div>
                    <span className="sitepage-link">{i18n.pages.loginHistory.heading}</span>
                    <div className="sitepage-button-container" style={{justifyContent: "flex-start"}}>
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←{i18n.buttons.back}</button>
                        <button className="sitepage-button" onClick={logoutOtherSessions}>{i18n.pages.loginHistory.logoutSessions}</button>
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