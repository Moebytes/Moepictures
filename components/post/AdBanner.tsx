import React, {useRef, useEffect} from "react"
import functions from "../../functions/Functions"
import {PostSearch, PostHistory, Tag, TagHistory} from "../../types/Types"
import "./styles/adbanner.less"

interface Props {
    item?: PostSearch | PostHistory | Tag | TagHistory |  null
    negMargin?: boolean
}

const AdBanner: React.FunctionComponent<Props> = (props) => {
    const adRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch {}

        const googlefcPresent = () => {
            if (window.frames["googlefcPresent"]) return
            if (!document.body) {
                return setTimeout(googlefcPresent, 0)
            }

            const iframe = document.createElement("iframe")
            iframe.name = "googlefcPresent"
            iframe.style.display = "none"
            iframe.style.width = "0"
            iframe.style.height = "0"
            iframe.style.border = "none"
            iframe.style.position = "absolute"
            iframe.style.left = "-1000px"
            iframe.style.top = "-1000px"

            document.body.appendChild(iframe)
        }

        const checkAdBlocked = () => {
            if (!adRef.current) return
            if (noAds()) return
            const ins = adRef.current.querySelector(".adsbygoogle") as HTMLElement | null
            if (!ins || ins.offsetHeight === 0 || getComputedStyle(ins).display === "none") {
                if (!document.getElementById("fc-message")) {
                    const script = document.createElement("script")
                    script.id = "fc-message"
                    script.src = "/message.js"
                    script.async = true
                    document.head.appendChild(script)
                }
            }
        }

        googlefcPresent()
        const adTimeout = setTimeout(checkAdBlocked, 3000)
        return () => clearTimeout(adTimeout)
    }, [])

    const noAds = () => {
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