import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import axios from "axios"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, SessionFlagContext, RedirectContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext} from "../Context"
import "./styles/changeusernamepage.less"

const ChangeUsernamePage: React.FunctionComponent = (props) => {
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
    const [submitted, setSubmitted] = useState(false)
    const [newUsername, setNewUsername] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getCaptchaColor = () => {
        if (theme.includes("light")) return "#ffffff"
        return "#09071c"
    }

    const updateCaptcha = async () => {
        const captcha = await axios.get("/api/misc/captcha/create", {params: {color: getCaptchaColor()}, withCredentials: true}).then((r) => r.data)
        setCaptcha(captcha)
        setCaptchaResponse("")
    }

    useEffect(() => {
        updateCaptcha()
    }, [session, theme])

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Change Username"
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
            setRedirect("/change-username")
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    const submit = async () => {
        const badUsername = functions.validateUsername(newUsername)
        if (badUsername) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = badUsername
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await axios.post("/api/user/changeusername", {newUsername, captchaResponse}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            setSubmitted(true)
            setSessionFlag(true)
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad username or captcha."
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
        }
    }

    return (
        <>
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="change-username">
                    <span className="change-username-title">Change Username</span>
                    {submitted ?
                    <>
                    <span className="change-username-link">Your username has been changed.</span>
                    <div className="change-username-button-container-left">
                        <button className="change-username-button" onClick={() => history.push("/profile")}>←Back</button>
                    </div>
                    </> : <>
                    <span className="change-username-link">Your old username will become available after the change.</span>
                    <div className="change-username-row">
                        <span className="change-username-text">Username: </span>
                        <span className="change-username-text-small">{session.username}</span>
                    </div>
                    <div className="change-username-row">
                        <span className="change-username-text">New Username: </span>
                        <input className="change-username-input" type="text" spellCheck={false} value={newUsername} onChange={(event) => setNewUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="change-username-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="change-username-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    {error ? <div className="change-username-validation-container"><span className="change-username-validation" ref={errorRef}></span></div> : null}
                    <div className="change-username-button-container">
                        <button style={{marginRight: "20px"}} className="change-username-button" onClick={() => history.push("/profile")}>←Back</button>
                        <button className="change-username-button" onClick={() => submit()}>Change Username</button>
                    </div>
                    </>
                    }
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ChangeUsernamePage