import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RedirectContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext, SessionFlagContext} from "../Context"
import premiumStar from "../assets/icons/premium-star.png"
import "./styles/verifyemailsuccesspage.less"

const PremiumSuccessPage: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
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
    const [newEmail, setNewEmail] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getSessionCookie = async () => {
        const cookie = await functions.get("/api/user/session", null, session, setSessionFlag)
        setSession(cookie)
        if (!permissions.isPremium(cookie)) {
            functions.replaceLocation("/401")
        }
    }

    useEffect(() => {
        getSessionCookie()
    }, [])

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
        document.title = "Premium Success"
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
                <div className="verify-email-success">
                    {permissions.isPremium(session) ? <><div className="premium-row">
                        <span className="premium-heading">Account Upgraded!</span>
                        <img className="premium-star" src={premiumStar}/>
                    </div>
                    <div className="verify-email-success-row">
                        <span className="verify-email-success-text" style={{color: "var(--premiumColor)"}}>
                            Thank you for purchasing premium! Your account has been upgraded and you can now 
                            access all of the premium features. <br/><br/>

                            Your premium membership will last until {functions.prettyDate(new Date(session.premiumExpiration))}.
                        </span>
                    </div>
                    <div className="verify-email-success-button-container">
                        <button className="verify-email-success-button" onClick={() => history.push("/posts")}>Ok</button>
                    </div></> : null}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PremiumSuccessPage