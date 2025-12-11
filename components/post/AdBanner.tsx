import React from "react"
import ad from "../../assets/images/ad.png"
import "./styles/adbanner.less"

interface Props {
    negMargin?: boolean
}

const AdBanner: React.FunctionComponent<Props> = (props) => {
    return (
        <div className="ad-banner" style={{marginBottom: props.negMargin ? "-10px" : "0px"}}>
            <ins className="adsbygoogle" style={{display: "flex"}}
                data-ad-client="ca-pub-9022780620749989"
                data-ad-slot="7308241770"
                data-ad-format="auto"
                data-full-width-responsive="true">
            </ins>
            {/* <img draggable={false} className="ad-banner-ad" src={ad} crossOrigin="anonymous"/> */}
        </div>
    )
}

export default AdBanner