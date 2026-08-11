/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import {useCacheSelector, useInteractionActions, useThemeSelector} from "../../store"
import BuyLinkIcon from "../../assets/svg/buy-link.svg"
import moeText from "../../moetext/MoeText"
import "./styles/commentary.less"

interface Props {
    link: string
}

const BuyLink: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {emojis} = useCacheSelector()
    const {setEnableDrag} = useInteractionActions()

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">{i18n.labels.buyLink}</div>
                <BuyLinkIcon className="commentary-img-static"/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    {moeText.renderCommentaryText(props.link, emojis)}   
                </span>
            </div>
        </div>
    )
}

export default BuyLink