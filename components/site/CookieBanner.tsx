import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import cookieIcon from "../../assets/icons/cookie.png"
import "./styles/cookiebanner.less"

const CookieBanner: React.FunctionComponent = (props) => {
    const {i18n, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const [showCookieBanner, setShowCookieBanner] = useState(false)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        if (!session.cookie) return
        if (session.cookieConsent === undefined || session.cookieConsent === null) {
            setShowCookieBanner(true)
        }
    }, [session])

    const click = async (button: "accept" | "reject") => {
        await functions.post("/api/user/cookieconsent", {consent: button === "accept"}, session, setSessionFlag)
        setShowCookieBanner(false)
    }

    return (
        <div className={`cookie-banner ${showCookieBanner ? "show-cookie-banner" : ""}`}>
            <div className="cookie-icon-container">
                <img className="cookie-icon" src={cookieIcon} style={{filter: getFilter()}}/>
                <div className="cookie-text-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="cookie-text">We use cookies to store your preferences and enhance your experience. By continuing to use our site, you consent to our use of cookies.</span>
                </div>
            </div>
            <button className="cookie-button" onClick={() => click("accept")}>Agree</button>
            <button className="cookie-button-deny" onClick={() => click("reject")}>Deny</button>
        </div>
    )
}

export default CookieBanner