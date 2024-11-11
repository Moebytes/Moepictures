import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, EnableDragContext, RedirectContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext} from "../Context"
import {useThemeSelector} from "../store"
import "./styles/sitepage.less"
import session from "express-session"

const VerifyEmailSuccessPage: React.FunctionComponent = (props) => {
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {session, setSession} = useContext(SessionContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [error, setError] = useState(false)
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
        document.title = "Verify Email Success"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">Email Verified</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Thank you, your email address has been verified! You should be 
                        able to use your account now.</span>
                    </div>
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => history.push("/posts")}>Ok</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default VerifyEmailSuccessPage