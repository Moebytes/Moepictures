import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import TitleBar from "../components/TitleBar"
import Footer from "../components/Footer"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import DragAndDrop from "../components/DragAndDrop"
import functions from "../structures/Functions"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, RedirectContext, MobileContext,
RelativeContext, HideTitlebarContext, HeaderTextContext, SidebarTextContext, SessionContext} from "../Context"
import premiumStar from "../assets/icons/premiumStar.png"
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
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [submitted, setSubmitted] = useState(false)
    const [newEmail, setNewEmail] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            history.push("/401")
        }
    }, [session])

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
        <DragAndDrop/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="verify-email-success">
                    <div className="premium-row">
                        <span className="premium-heading">Account Upgraded!</span>
                        <img className="premium-star" src={premiumStar}/>
                    </div>
                    <div className="verify-email-success-row">
                        <span className="verify-email-success-text" style={{color: "var(--premiumColor)"}}>
                            Thank you for purchasing premium! Your account has been upgraded. You can now 
                            access all the premium features.
                        </span>
                    </div>
                    <div className="verify-email-success-button-container">
                        <button className="verify-email-success-button" onClick={() => history.push("/posts")}>Ok</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PremiumSuccessPage