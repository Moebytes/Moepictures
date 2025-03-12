import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import Footer from "../../components/site/Footer"
import SideBar from "../../components/site/SideBar"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, useMiscDialogSelector, useMiscDialogActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../../store"
import "./styles/sitepage.less"
import functions from "../../structures/Functions"

const $2FAEnablePage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {disable2FAFlag} = useMiscDialogSelector()
    const {setDisable2FAFlag, setDisable2FADialog} = useMiscDialogActions()
    const [qr, setQR] = useState("")
    const [showValidation, setShowValidation] = useState(false)
    const [token, setToken] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const navigate = useNavigate()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        if (session?.$2fa) get2FAQRCode()
    }, [])

    useEffect(() => {
        document.title = i18n.user.$2fa
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const get2FAQRCode = async () => {
        const qrcode = await functions.post("/api/2fa/qr", null, session, setSessionFlag)
        if (qrcode) setQR(qrcode)
    }

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/enable-2fa")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
        if (session.$2fa) {
            get2FAQRCode()
        }
    }, [session])

    const toggle = async () => {
        const qr = await functions.post("/api/2fa/create", null, session, setSessionFlag)
        if (qr) {
            setQR(qr)
            setShowValidation(true)
        } else {
            setQR("")
            setShowValidation(false)
        }
        setSessionFlag(true)
    }

    useEffect(() => {
        if (disable2FAFlag) {
            toggle()
            setDisable2FAFlag(false)
        }
    }, [disable2FAFlag, session])

    const changeStatus = async () => {
        if (session.$2fa) {
            setDisable2FADialog(true)
        } else {
            toggle()
        }
    }

    const enable2FA = async () => {
        if (!token.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = i18n.pages.$2fa.badToken
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.submitting
        try {
            await functions.post("/api/2fa/enable", {token}, session, setSessionFlag)
            setSessionFlag(true)
            setShowValidation(false)
            setError(false)
        } catch {
            errorRef.current!.innerText = i18n.pages.$2fa.badToken
            await functions.timeout(2000)
            setError(false)
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
                    <span className="sitepage-title">{i18n.user.$2fa}</span>
                    <span className="sitepage-link">{i18n.pages.enable2FA.heading}</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.labels.status}: </span>
                        <span className="sitepage-text" style={{cursor: "pointer", marginLeft: "10px"}} onClick={changeStatus}>{session.$2fa ? i18n.buttons.enabled : i18n.buttons.disabled}</span>
                    </div>
                    {qr ? <>
                    <div className="sitepage-row">
                        <span className="sitepage-link">{i18n.pages.enable2FA.scan}</span>
                    </div>
                    <div className="sitepage-row">
                        <img className="f2a-qr" src={qr}/>
                    </div>
                    </> : null}
                    {!showValidation ? 
                    <div className="sitepage-row">
                        <button className="sitepage-button" onClick={() => navigate("/profile")}>←{i18n.buttons.back}</button>
                    </div>
                    : null}
                    {showValidation ? <>
                    <div className="sitepage-row">
                        <span className="sitepage-link">{i18n.pages.enable2FA.finish}</span>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.$2fa.token}:</span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={token} onChange={(event) => setToken(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? enable2FA() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-row">
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => navigate("/profile")}>←{i18n.buttons.back}</button>
                        <button className="f2a-button" onClick={enable2FA}>{i18n.pages.enable2FA.enable}</button>
                    </div>
                    </> : null}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default $2FAEnablePage