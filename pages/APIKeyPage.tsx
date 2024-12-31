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

const APIKeyPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const [status, setStatus] = useState(false)
    const [apiKey, setAPIKey] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateStatus = async () => {
        const status = await functions.get("/api/misc/api-key/status", null, session, setSessionFlag)
        setStatus(status)
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
        document.title = i18n.user.apiKey
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
            return functions.replaceLocation("/403")
        }
        updateStatus()
    }, [session])

    const generateKey = async () => {
        const apiKey = await functions.post("/api/misc/api-key", null, session, setSessionFlag)
        setAPIKey(apiKey)
        updateStatus()
    }

    const deleteKey = async () => {
        await functions.delete("/api/misc/api-key/delete", null, session, setSessionFlag)
        setAPIKey("")
        updateStatus()
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="sitepage">
                    <span className="sitepage-title">{i18n.user.apiKey}</span>
                    <span className="sitepage-link">{i18n.pages.apiKey.header}</span>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.labels.status}: </span>
                        <span className="sitepage-text" style={{cursor: "pointer", marginLeft: "10px"}}>{status ? i18n.pages.apiKey.keyActive : i18n.pages.apiKey.noKey}</span>
                    </div>
                    {apiKey ? <>
                    <div className="sitepage-row">
                        <span className="sitepage-text">{i18n.pages.apiKey.displayKey}</span>
                    </div>
                    <div className="sitepage-row">
                        <span className="sitepage-text" style={{color: "var(--text-strong)"}}>{apiKey}</span>
                    </div>
                    </> : null}
                    {error ? <div className="sitepage-validation-container"><span className="sitepage-validation" ref={errorRef}></span></div> : null}
                    <div className="sitepage-button-container">
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => history.push("/profile")}>←{i18n.buttons.back}</button>
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => deleteKey()}>{i18n.pages.apiKey.deleteKey}</button>
                        <button className="sitepage-button" onClick={() => generateKey()}>{i18n.pages.apiKey.generateKey}</button>
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default APIKeyPage