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

const NewsBannerPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setNewsBanner, setActionBanner} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [submitted, setSubmitted] = useState(false)
    const [text, setText] = useState("")
    const [link, setLink] = useState("")
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
        document.title = "News Banner"
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

    const setBanner = async () => {
        await functions.post("/api/misc/setbanner", {text, link}, session, setSessionFlag)
        setText("")
        setLink("")
        setSessionFlag(true)
        if (!text) {
            setNewsBanner(null)
            setActionBanner("remove-banner")
        }
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
                    <span className="sitepage-title">News Banner</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">Text: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={text} onChange={(event) => setText(event.target.value)}/>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text-wide">Link: </span>
                        <input className="sitepage-input" type="text" spellCheck={false} value={link} onChange={(event) => setLink(event.target.value)}/>
                    </div>
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←Back</button>
                        <button className="sitepage-button" onClick={() => setBanner()}>Set Banner</button>
                    </div> 
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default NewsBannerPage