import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, EnableDragContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext, SessionContext, SessionFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import jsxFunctions from "../structures/JSXFunctions"
import buyLinkIcon from "../assets/icons/buy-link.png"
import functions from "../structures/Functions"
import "./styles/commentary.less"

interface Props {
    link: string
}

const BuyLink: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">Buy Link</div>
                <img className="commentary-img-static" src={buyLinkIcon} style={{filter: getFilter()}}/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    {jsxFunctions.renderCommentaryText(props.link)}   
                </span>
            </div>
        </div>
    )
}

export default BuyLink