import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, RedirectContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext, SessionFlagContext, ActionBannerContext} from "../Context"
import {useThemeSelector} from "../store"
import "./styles/sitepage.less"

const IPBlacklistPage: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const [submitted, setSubmitted] = useState(false)
    const {actionBanner, setActionBanner} = useContext(ActionBannerContext)
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
        document.title = "IP Blacklist"
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
                    <span className="sitepage-title">Blacklist IP</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">IP Address: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={ip} onChange={(event) => setIP(event.target.value)}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">Reason: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←Back</button>
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => unblacklist()}>Unblacklist</button>
                        <button className="sitepage-button" onClick={() => blacklist()}>Blacklist</button>
                    </div> 
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default IPBlacklistPage