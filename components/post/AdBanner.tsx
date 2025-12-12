import React, {useEffect} from "react"
import functions from "../../functions/Functions"
import {PostSearch, PostHistory, Tag, TagHistory} from "../../types/Types"
import "./styles/adbanner.less"

interface Props {
    item?: PostSearch | PostHistory | Tag | TagHistory |  null
    negMargin?: boolean
}

const AdBanner: React.FunctionComponent<Props> = (props) => {
    useEffect(() => {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    }, [])
    
    if (props.item && "rating" in props.item) {
        if (functions.post.isR18(props.item.rating)) return null
    } else if (props.item && "r18" in props.item) {
        if (props.item.r18) return null
    }

    return (
        <div className="ad-banner">
            <ins className="adsbygoogle ad-long-banner" style={{display: "block"}}
                data-ad-client="ca-pub-9022780620749989"
                data-ad-slot="7308241770">
            </ins>
        </div>
    )
}

export default AdBanner