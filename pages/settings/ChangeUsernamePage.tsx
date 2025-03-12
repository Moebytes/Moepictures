import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../../store"
import "./styles/sitepage.less"

const ChangeUsernamePage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [newUsername, setNewUsername] = useState("")
    const [captchaResponse, setCaptchaResponse] = useState("")
    const [captcha, setCaptcha] = useState("")
    const [error, setError] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState("")
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getCaptchaColor = () => {
        if (theme.includes("light")) return "#ffffff"
        return "#09071c"
    }

    const updateCaptcha = async () => {
        const captcha = await functions.get("/api/misc/captcha/create", {color: getCaptchaColor()}, session, setSessionFlag)
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
    }, [])

    useEffect(() => {
        document.title = i18n.user.changeUsername
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
            setRedirect("/change-username")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
        if (!permissions.isPremium(session)) {
            functions.replaceLocation("/401")
        }
    }, [session])

    const submit = async () => {
        const badUsername = functions.validateUsername(newUsername, i18n)
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
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/user/changeusername", {newUsername, captchaResponse}, session, setSessionFlag)
            setSubmitted(true)
            setSessionFlag(true)
            setError(false)
        } catch (err: any) {
            let errMsg = i18n.pages.changeUsername.error
            if (err.response?.data.includes("Changing username too frequently")) errMsg = i18n.pages.changeUsername.rateLimit
            errorRef.current!.innerText = errMsg
            await functions.timeout(2000)
            setError(false)
            updateCaptcha()
        }
    }

    useEffect(() => {
        if (!permissions.isAdmin(session) && session.lastNameChange) {
            let timeDiff = new Date().getTime() - new Date(session.lastNameChange).getTime()
            if (timeDiff < 7 * 24 * 60 * 60 * 1000) {
                const timeRemaining = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000 - timeDiff)).toISOString()
                return setTimeRemaining(timeRemaining)
            }
        }
        setTimeRemaining("")
    }, [session])

    const changeText = () => {
        if (timeRemaining) {
            return <span className="sitepage-link" style={{fontWeight: "bold"}}>{i18n.pages.changeUsername.changeIn} {functions.timeUntil(timeRemaining, i18n)}</span>
        } else {
            return <span className="sitepage-link">{i18n.pages.changeUsername.heading}</span>
        }
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">{i18n.user.changeUsername}</span>
                    {submitted ?
                    <>
                    <span className="sitepage-link">{i18n.pages.changeUsername.submitHeading}</span>
                    <div className="sitepage-button-container-left">
                        <button className="sitepage-button" onClick={() => navigate("/profile")}>←{i18n.buttons.back}</button>
                    </div>
                    </> : <>
                    {changeText()}
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.labels.username}: </span>
                        <span className="sitepage-text-small">{session.username}</span>
                    </div>
                    {!timeRemaining ? <>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.labels.newUsername}: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={newUsername} onChange={(event) => setNewUsername(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div>
                    <div className="sitepage-row" style={{justifyContent: "center"}}>
                        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(captcha)}`} style={{filter: getFilter()}}/>
                        <input className="sitepage-input" type="text" spellCheck={false} value={captchaResponse} onChange={(event) => setCaptchaResponse(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? submit() : null}/>
                    </div></> : null}
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container" style={{justifyContent: timeRemaining ? "flex-start" : "center"}}>
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => navigate("/profile")}>←{i18n.buttons.back}</button>
                        {!timeRemaining ? <button className="sitepage-button" onClick={() => submit()}>{i18n.user.changeUsername}</button> : null}
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