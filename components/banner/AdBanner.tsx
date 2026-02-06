import React, {useRef, useEffect} from "react"
import functions from "../../functions/Functions"
import {useMiscDialogActions} from "../../store"
import {PostSearch, PostHistory, Tag, TagHistory} from "../../types/Types"
import "./styles/adbanner.less"

interface Props {
    item?: PostSearch | PostHistory | Tag | TagHistory |  null
    negMargin?: boolean
}

const AdBanner: React.FunctionComponent<Props> = (props) => {
    const {setShowAdDialog} = useMiscDialogActions()
    const adRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {}

        const checkAdBlocked = () => {
            if (!adRef.current) return
            if (noAds()) return
            const ins = adRef.current.querySelector(".adsbygoogle") as HTMLElement | null
            if (!ins || !ins.childElementCount || ins.offsetHeight === 0 || getComputedStyle(ins).display === "none") {
                const status = ins?.getAttribute("data-ad-status")
                // if (!status) setShowAdDialog(true)
            }
        }

        const adTimeout = setTimeout(checkAdBlocked, 5000)
        return () => clearTimeout(adTimeout)
    }, [])

    const noAds = () => {
        if (functions.config.isLocalHost()) return true
        if (props.item && "rating" in props.item) {
            if (functions.post.isR18(props.item.rating)) return true
        } else if (props.item && "r18" in props.item) {
            if (props.item.r18) return true
        }
        return false
    }

    if (noAds()) return null

    return (
        <div className="ad-banner" ref={adRef}>
            <ins className="adsbygoogle ad-long-banner" style={{display: "block"}}
                data-ad-client="ca-pub-9022780620749989"
                data-ad-slot="7308241770">
            </ins>
        </div>
    )
}

export default AdBanner