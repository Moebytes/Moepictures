import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import cookieIcon from "../../assets/icons/cookie.png"
import "./styles/cookiebanner.less"

let cookieTimer = null as any

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
        clearTimeout(cookieTimer)
        cookieTimer = setTimeout(() => {
            if (session.cookieConsent === undefined || session.cookieConsent === null) {
                setShowCookieBanner(true)
            }
        }, 3000)
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
                    <span className="cookie-text">{i18n.dialogs.cookieBanner.text}</span>
                </div>
            </div>
            <button className="cookie-button" onClick={() => click("accept")}>{i18n.labels.agree}</button>
            {/* <button className="cookie-button-deny" onClick={() => click("reject")}>{i18n.labels.deny}</button> */}
        </div>
    )
}

export default CookieBanner