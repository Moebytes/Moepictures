import React from "react"
import ad from "../../assets/images/ad.png"
import "./styles/adbanner.less"

interface Props {
    negMargin?: boolean
}

const AdBanner: React.FunctionComponent<Props> = (props) => {
    return (
        <div className="ad-banner" style={{marginBottom: props.negMargin ? "-10px" : "0px"}}>
            <img draggable={false} className="ad-banner-ad" src={ad} crossOrigin="anonymous"/>
        </div>
    )
}

export default AdBanner