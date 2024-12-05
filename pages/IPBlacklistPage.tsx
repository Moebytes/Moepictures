import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../store"
import "./styles/sitepage.less"

const IPBlacklistPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const {setActionBanner} = useActiveActions()
    const [ip, setIP] = useState("")
    const [reason, setReason] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

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
        document.title = i18n.user.ipBlacklist
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
        if (!permissions.isAdmin(session)) {
            functions.replaceLocation("/403")
        }
    }, [session])

    const blacklist = async () => {
        await functions.post("/api/misc/blacklistip", {ip, reason}, session, setSessionFlag)
        setActionBanner("blacklist")
        setIP("")
    }

    const unblacklist = async () => {
        await functions.delete("/api/misc/unblacklistip", {ip}, session, setSessionFlag)
        setActionBanner("unblacklist")
        setIP("")
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                {permissions.isAdmin(session) ?
                <div className="sitepage">
                    <span className="sitepage-title">{i18n.pages.ipBlacklist.title}</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.pages.ipBlacklist.ipAddress}: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={ip} onChange={(event) => setIP(event.target.value)}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">{i18n.labels.reason}: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←{i18n.buttons.back}</button>
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => unblacklist()}>{i18n.pages.ipBlacklist.unblacklist}</button>
                        <button className="sitepage-button" onClick={() => blacklist()}>{i18n.pages.ipBlacklist.blacklist}</button>
                    </div> 
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default IPBlacklistPage