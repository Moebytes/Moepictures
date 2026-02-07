import React, {useEffect, useState} from "react"
import {useLayoutSelector, useActiveSelector, useActiveActions, useThemeSelector} from "../../store"
import functions from "../../functions/Functions"
import "./styles/actionbanner.less"

let timeout = null as any

const ActionBanner: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {actionBanner} = useActiveSelector()
    const {setActionBanner} = useActiveActions()
    const [stickyText, setStickyText] = useState("")

    useEffect(() => {
        if (actionBanner === "login-required") {
            setStickyText(i18n.sidebar.loginRequired)
            document.documentElement.style.setProperty("--actionBannerColor", "#ff547cCC")
        }
        if (actionBanner === "copy-tags") {
            setStickyText(i18n.banner.copiedTags)
            document.documentElement.style.setProperty("--actionBannerColor", "#ed517dCC")
        }
        if (actionBanner === "copy-hash") {
            setStickyText(i18n.banner.copiedHash)
            document.documentElement.style.setProperty("--actionBannerColor", "#de62bfCC")
        }
        if (actionBanner === "tag-edit") {
            setStickyText(i18n.banner.editedTags)
            document.documentElement.style.setProperty("--actionBannerColor", "#5c8fdbCC")
        }
        if (actionBanner === "source-edit") {
            setStickyText(i18n.banner.editedSource)
            document.documentElement.style.setProperty("--actionBannerColor", "#5c8fdbCC")
        }
        if (actionBanner === "copy-notes") {
            setStickyText(i18n.banner.copiedNotes)
            document.documentElement.style.setProperty("--actionBannerColor", "#5c8fdbCC")
        }
        if (actionBanner === "paste-notes") {
            setStickyText(i18n.banner.pastedNotes)
            document.documentElement.style.setProperty("--actionBannerColor", "#73c1deCC")
        }
        if (actionBanner === "edit-thumbnail") {
            setStickyText(i18n.banner.updatedThumbnail)
            document.documentElement.style.setProperty("--actionBannerColor", "#db70b0CC")
        }
        if (actionBanner === "logout-sessions") {
            setStickyText(i18n.banner.logoutSessions)
            document.documentElement.style.setProperty("--actionBannerColor", "#ff8ac3CC")
        }
        if (actionBanner === "blacklist") {
            setStickyText(i18n.banner.blacklist)
            document.documentElement.style.setProperty("--actionBannerColor", "#ff8ac3CC")
        }
        if (actionBanner === "unblacklist") {
            setStickyText(i18n.banner.unblacklist)
            document.documentElement.style.setProperty("--actionBannerColor", "#db70b0CC")
        }
        if (actionBanner === "remove-banner") {
            setStickyText(i18n.banner.removeBanner)
            document.documentElement.style.setProperty("--actionBannerColor", "#d66082CC")
        }
        if (actionBanner === "account-restored") {
            setStickyText(i18n.banner.accountRestored)
            document.documentElement.style.setProperty("--actionBannerColor", "#89caf5CC")
        }
        if (actionBanner === "image-source") {
            setStickyText(i18n.banner.changedSource)
            document.documentElement.style.setProperty("--actionBannerColor", "#d488ebCC")
        }
    }, [actionBanner])

    const getDuration = () => {
        if (actionBanner === "account-restored") {
            return 5000
        } else {
            return 2000
        }
    }

    const getLeft = () => {
        if (actionBanner === "account-restored") {
            return "27%"
        } else {
            return mobile ? "32%" : "45%"
        }
    }

    if (actionBanner) {
        if (timeout && stickyText === actionBanner) {
            // ignore block
        } else {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                setActionBanner(null)
                timeout = null
            }, getDuration())
        }
    }

    return (
        <div className={`action-banner ${actionBanner ? "action-banner-visible" : ""}`} style={{left: getLeft()}}>
            <span className="action-banner-text">{stickyText}</span>
            <span className="action-banner-x" onClick={() => setActionBanner(null)}>x</span>
        </div>
    )
}

export default ActionBanner