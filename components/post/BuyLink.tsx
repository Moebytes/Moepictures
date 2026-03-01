/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React from "react"
import {useInteractionActions, useThemeSelector} from "../../store"
import buyLinkIcon from "../../assets/svg/buy-link.svg"
import functions from "../../functions/Functions"
import "./styles/commentary.less"

interface Props {
    link: string
}

const BuyLink: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--text-strong")
    }

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">{i18n.labels.buyLink}</div>
                <img className="commentary-img-static" src={getIcon(buyLinkIcon)} style={{filter}}/>
            </div>
            <div className="commentary-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="commentary-text">
                    {functions.jsx.renderCommentaryText(props.link)}   
                </span>
            </div>
        </div>
    )
}

export default BuyLink