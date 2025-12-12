import React, {useEffect} from "react"
import ad from "../../assets/images/ad.png"
import functions from "../../functions/Functions"
import {PostSearch, PostHistory} from "../../types/Types"
import {useLayoutSelector} from "../../store"
import "./styles/adbanner.less"

interface Props {
    post: PostSearch | PostHistory
    negMargin?: boolean
}

const AdBanner: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()

    useEffect(() => {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
    }, [])

    if (functions.post.isR18(props.post.rating)) return null

    return (
        <div className="ad-banner" style={{marginBottom: props.negMargin ? "-10px" : "0px"}}>
            <ins className="adsbygoogle" style={{
                    display: "inline-block", 
                    minWidth: "200px", 
                    maxWidth: mobile ? "350px" : "800px", 
                    height: "100px"
                }}
                data-ad-client="ca-pub-9022780620749989"
                data-ad-slot="7308241770"
                data-ad-format="fluid">
            </ins>
        </div>
    )
}

export default AdBanner