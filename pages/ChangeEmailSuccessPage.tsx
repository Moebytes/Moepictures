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
import "./styles/sitepage.less"
import session from "express-session"

const ChangeEmailSuccessPage: React.FunctionComponent = (props) => {
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
        document.title = "Change Email Success"
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
            setRedirect("/change-email-success")
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">Email Changed Successfully</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">Your email has been changed to: </span>
                        <span className="sitepage-text-small2">{session.email}</span>
                    </div>
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => history.push("/profile")}>Ok</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ChangeEmailSuccessPage