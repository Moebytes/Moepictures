import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import {useActiveSelector, useActiveActions} from "../store"
import functions from "../structures/Functions"
import "./styles/actionbanner.less"

let timeout = null as any

const ActionBanner: React.FunctionComponent = (props) => {
    const {actionBanner} = useActiveSelector()
    const {setActionBanner} = useActiveActions()
    const [stickyText, setStickyText] = useState("")

    useEffect(() => {
        if (actionBanner === "copy-tags") {
            setStickyText("Copied Tags!")
            document.documentElement.style.setProperty("--actionBannerColor", "#ce1a4dCC")
        }
        if (actionBanner === "copy-hash") {
            setStickyText("Copied Hash!")
            document.documentElement.style.setProperty("--actionBannerColor", "#501aceCC")
        }
        if (actionBanner === "tag-edit") {
            setStickyText("Edited Tags!")
            document.documentElement.style.setProperty("--actionBannerColor", "#1a62ceCC")
        }
        if (actionBanner === "source-edit") {
            setStickyText("Edited Source!")
            document.documentElement.style.setProperty("--actionBannerColor", "#1a62ceCC")
        }
        if (actionBanner === "logout-sessions") {
            setStickyText("Logged out other sessions!")
            document.documentElement.style.setProperty("--actionBannerColor", "#f71b86CC")
        }
        if (actionBanner === "blacklist") {
            setStickyText("Blacklisted IP!")
            document.documentElement.style.setProperty("--actionBannerColor", "#f71b86CC")
        }
        if (actionBanner === "unblacklist") {
            setStickyText("Unblacklisted IP!")
            document.documentElement.style.setProperty("--actionBannerColor", "#501aceCC")
        }
        if (actionBanner === "remove-banner") {
            setStickyText("Removed Banner!")
            document.documentElement.style.setProperty("--actionBannerColor", "#ce1a4dCC")
        }
    }, [actionBanner])

    if (actionBanner) {
        if (timeout && stickyText === actionBanner) {
            // ignore block
        } else {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                setActionBanner(null)
                timeout = null
            }, 2000)
        }
    }

    return (
        <div className={`action-banner ${actionBanner ? "action-banner-visible" : ""}`}>
            <span className="action-banner-text">{stickyText}</span>
            <span className="action-banner-x" onClick={() => setActionBanner(null)}>x</span>
        </div>
    )
}

export default ActionBanner