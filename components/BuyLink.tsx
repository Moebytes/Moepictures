import React, {useContext, useEffect, useRef, useState} from "react"
import {EnableDragContext, SessionContext, SessionFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import jsxFunctions from "../structures/JSXFunctions"
import buyLinkIcon from "../assets/icons/buy-link.png"
import functions from "../structures/Functions"
import {useThemeSelector} from "../store"
import "./styles/commentary.less"

interface Props {
    link: string
}

const BuyLink: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
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