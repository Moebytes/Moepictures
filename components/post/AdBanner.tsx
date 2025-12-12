import React, {useEffect} from "react"
import ad from "../../assets/images/ad.png"
import functions from "../../functions/Functions"
import {PostSearch, PostHistory} from "../../types/Types"
import "./styles/adbanner.less"

interface Props {
    post: PostSearch | PostHistory
    negMargin?: boolean
}

const AdBanner: React.FunctionComponent<Props> = (props) => {
    if (functions.post.isR18(props.post.rating)) return null

    useEffect(() => {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    }, [])

    return (
        <div className="ad-banner" style={{marginBottom: props.negMargin ? "-10px" : "0px"}}>
            <ins className="adsbygoogle" style={{display: "flex"}}
                data-ad-client="ca-pub-9022780620749989"
                data-ad-slot="7308241770"
                data-ad-format="auto"
                data-full-width-responsive="true">
            </ins>
        </div>
    )
}

export default AdBanner