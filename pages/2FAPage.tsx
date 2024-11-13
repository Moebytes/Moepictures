import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import Footer from "../components/Footer"
import SideBar from "../components/SideBar"
import {useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../store"
import functions from "../structures/Functions"
import "./styles/sitepage.less"

const $2FAPage: React.FunctionComponent = (props) => {
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [error, setError] = useState(false)
    const [token, setToken] = useState("")
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "2-Factor Authentication"
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
        if (session.username) {
            history.push("/profile")
        }
    }, [session])

    const validate = async () => {
        if (!token.trim()) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Bad token."
            await functions.timeout(2000)
            setError(false)
            return
        }
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = "Submitting..."
        try {
            await functions.post("/api/2fa", {token}, session, setSessionFlag)
            setSessionFlag(true)
            history.push("/posts")
            setError(false)
        } catch {
            errorRef.current!.innerText = "Bad token."
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
                    <span className="sitepage-title">2-Factor Authentication</span>
                    <span className="sitepage-link">Please enter your 2FA token.</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">2FA Token:</span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={token} onChange={(event) => setToken(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? validate() : null}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={validate}>Validate</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default $2FAPage