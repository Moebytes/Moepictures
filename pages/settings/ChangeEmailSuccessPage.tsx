import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import Footer from "../../components/site/Footer"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import functions from "../../functions/Functions"
import {useThemeSelector, useInteractionActions, useSessionSelector, useLayoutActions, 
useActiveActions, useFlagActions, useLayoutSelector} from "../../store"
import "./styles/sitepage.less"
import session from "express-session"

const ChangeEmailSuccessPage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
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
    }, [])

    useEffect(() => {
        document.title = i18n.pages.changeEmailSuccess.pageTitle
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
            setRedirect("/change-email-success")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
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
                    <span className="sitepage-title">{i18n.pages.changeEmailSuccess.title}</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.changeEmailSuccess.label}</span>
                        <span className="sitepage-text-small2">{session.email}</span>
                    </div>
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => navigate("/profile")}>{i18n.buttons.ok}</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ChangeEmailSuccessPage