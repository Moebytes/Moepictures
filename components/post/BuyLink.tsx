import React from "react"
import {useInteractionActions, useThemeSelector} from "../../store"
import buyLinkIcon from "../../assets/icons/buy-link.png"
import functions from "../../functions/Functions"
import "./styles/commentary.less"

interface Props {
    link: string
}

const BuyLink: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    return (
        <div className="commentary">
            <div className="commentary-title-container">
                <div className="commentary-title">{i18n.labels.buyLink}</div>
                <img className="commentary-img-static" src={buyLinkIcon} style={{filter}}/>
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