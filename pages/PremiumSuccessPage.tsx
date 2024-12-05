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
import premiumStar from "../assets/icons/premium-star.png"
import "./styles/sitepage.less"

const PremiumSuccessPage: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSession, setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
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
    }, [])

    useEffect(() => {
        document.title = i18n.pages.premiumSuccess.pageTitle
    }, [i18n])

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
                    {permissions.isPremium(session) ? <><div className="premium-row">
                        <span className="premium-heading">{i18n.pages.premiumSuccess.title}</span>
                        <img className="premium-star" src={premiumStar}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text" style={{color: "var(--premiumColor)"}}>
                            {i18n.pages.premiumSuccess.thankYou}<br/><br/>

                            {i18n.pages.premiumSuccess.lastUntil} {functions.prettyDate(new Date(session.premiumExpiration), i18n)}.
                        </span>
                    </div>
                    <div className="sitepage-button-container">
                        <button className="sitepage-button" onClick={() => history.push("/posts")}>{i18n.buttons.ok}</button>
                    </div></> : null}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PremiumSuccessPage