import React, {useEffect, useState} from "react"
import {useActiveSelector, useActiveActions, useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import "./styles/actionbanner.less"

let timeout = null as any

const ActionBanner: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {actionBanner} = useActiveSelector()
    const {setActionBanner} = useActiveActions()
    const [stickyText, setStickyText] = useState("")

    useEffect(() => {
        if (actionBanner === "copy-tags") {
            setStickyText(i18n.banner.copiedTags)
            document.documentElement.style.setProperty("--actionBannerColor", "#ce1a4dCC")
        }
        if (actionBanner === "copy-hash") {
            setStickyText(i18n.banner.copiedHash)
            document.documentElement.style.setProperty("--actionBannerColor", "#501aceCC")
        }
        if (actionBanner === "tag-edit") {
            setStickyText(i18n.banner.editedTags)
            document.documentElement.style.setProperty("--actionBannerColor", "#1a62ceCC")
        }
        if (actionBanner === "source-edit") {
            setStickyText(i18n.banner.editedSource)
            document.documentElement.style.setProperty("--actionBannerColor", "#1a62ceCC")
        }
        if (actionBanner === "copy-notes") {
            setStickyText(i18n.banner.copiedNotes)
            document.documentElement.style.setProperty("--actionBannerColor", "#1a62ceCC")
        }
        if (actionBanner === "paste-notes") {
            setStickyText(i18n.banner.pastedNotes)
            document.documentElement.style.setProperty("--actionBannerColor", "#1ea3d4CC")
        }
        if (actionBanner === "edit-thumbnail") {
            setStickyText(i18n.banner.updatedThumbnail)
            document.documentElement.style.setProperty("--actionBannerColor", "#501aceCC")
        }
        if (actionBanner === "logout-sessions") {
            setStickyText(i18n.banner.logoutSessions)
            document.documentElement.style.setProperty("--actionBannerColor", "#f71b86CC")
        }
        if (actionBanner === "blacklist") {
            setStickyText(i18n.banner.blacklist)
            document.documentElement.style.setProperty("--actionBannerColor", "#f71b86CC")
        }
        if (actionBanner === "unblacklist") {
            setStickyText(i18n.banner.unblacklist)
            document.documentElement.style.setProperty("--actionBannerColor", "#501aceCC")
        }
        if (actionBanner === "remove-banner") {
            setStickyText(i18n.banner.removeBanner)
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