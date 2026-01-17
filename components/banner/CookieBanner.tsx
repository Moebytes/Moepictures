import React, {useEffect, useState} from "react"
import {useInteractionActions, useThemeSelector, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import cookie from "../../assets/svg/cookie.svg"
import "./styles/cookiebanner.less"

let cookieTimer = null as any

const CookieBanner: React.FunctionComponent = (props) => {
    const {i18n, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const [showCookieBanner, setShowCookieBanner] = useState(false)

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--cookieColor")
    }

    useEffect(() => {
        if (!session.cookie) return
        clearTimeout(cookieTimer)
        cookieTimer = setTimeout(() => {
            let cookieConsent = session.username ? session.cookieConsent : localStorage.getItem("cookieConsent")
            if (cookieConsent === undefined || cookieConsent === null) {
                setShowCookieBanner(true)
            }
        }, 3000)
    }, [session])

    const click = async (button: "accept" | "reject") => {
        await functions.http.post("/api/user/cookieconsent", 
            {consent: button === "accept"}, session, setSessionFlag).catch(() => null)
        setShowCookieBanner(false)
        localStorage.setItem("cookieConsent", String(button === "accept"))
    }

    return (
        <div className={`cookie-banner ${showCookieBanner ? "show-cookie-banner" : ""}`}>
            <div className="cookie-icon-container">
                <img className="cookie-icon" src={getIcon(cookie)} style={{filter}}/>
                <div className="cookie-text-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <span className="cookie-text">{i18n.dialogs.cookieBanner.text}</span>
                </div>
            </div>
            <button className="cookie-button" onClick={() => click("accept")}>{i18n.labels.agree}</button>
        </div>
    )
}

export default CookieBanner