/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useInteractionActions, useSessionSelector,
useLayoutActions, useActiveActions, useLayoutSelector} from "../../store"
import premiumImg from "../../assets/images/premiumupgrade.png"
import upscaledImg from "../../assets/images/upscaled.png"
import bookmarksImg from "../../assets/images/bookmarks.png"
import historyImg from "../../assets/images/searchhistory.png"
import autosearchImg from "../../assets/images/autosearchimg.png"
import animatedImg from "../../assets/images/animatedavatar.gif"
import changeUsernameImg from "../../assets/images/changeusername.png"
import upscaledImages from "../../assets/images/premium-upscaled-images.png"
import autosearch from "../../assets/images/premium-autosearch.png"
import searchHistory from "../../assets/images/premium-search-history.png"
import bookmarkSort from "../../assets/images/premium-bookmark-sort.png"
import animatedAvatar from "../../assets/images/premium-animated-avatar.png"
import changeUsername from "../../assets/images/premium-change-username.png"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import PremiumStarIcon from "../../assets/svg/premium-star.svg"
import "./styles/premiumpage.less"

const PremiumPage: React.FunctionComponent = () => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {mobile} = useLayoutSelector()
    const [premiumFeature, setPremiumFeature] = useState("premium")

    useEffect(() => {
        if (!session.cookie) return
        let condition = permissions.isPremiumEnabled() ? session.username : permissions.isAdmin(session)
        if (!condition) {
            functions.dom.replaceLocation("/401")
        }
    }, [session])

    const urlState = () => {
        if (window.location.hash) setPremiumFeature(window.location.hash.replace("#", ""))
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setHeaderText("")
        setSidebarText("")
        window.scrollTo(0, 0)
        urlState()
    }, [])

    useEffect(() => {
        document.title = i18n.roles.premium
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (premiumFeature === "premium") {
            window.history.pushState(null, document.title, window.location.pathname + window.location.search)
        } else {
            window.location.hash = premiumFeature
        }
    }, [premiumFeature])

    const getContainerJSX = () => {
        if (premiumFeature === "premium") {
            return (
                <><div className="premium-row">
                    <span className="premium-heading">{i18n.premium.premium.title}</span>
                    <PremiumStarIcon className="premium-star"/>
                </div>
                <span className="premium-text">
                    {i18n.premium.premium.line1}<br/><br/>

                    {i18n.premium.premium.line2}<br/><br/>

                    {i18n.premium.premium.line3}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={premiumImg}/></div></>
            )
        }
        if (premiumFeature === "upscaled-images") {
            return (
                <><img className="premium-banner" src={upscaledImages}/>
                <span className="premium-text" style={{color: "#2f91ff"}}>
                    {i18n.premium.upscaledImages.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={upscaledImg} style={{maxWidth: "100%"}}/></div></>
            )
        }
        if (premiumFeature === "autosearch") {
            return (
                <><img className="premium-banner" src={autosearch}/>
                <span className="premium-text" style={{color: "#5b2fff"}}>
                    {i18n.premium.autoSearch.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={autosearchImg}/></div></>
            )
        }
        if (premiumFeature === "search-history") {
            return (
                <><img className="premium-banner" src={searchHistory}/>
                <span className="premium-text" style={{color: "#ff2792"}}>
                    {i18n.premium.searchHistory.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={historyImg}/></div></>
            )
        }
        if (premiumFeature === "bookmark-sort") {
            return (
                <><img className="premium-banner" src={bookmarkSort}/>
                <span className="premium-text" style={{color: "#3a51ff"}}>
                    {i18n.premium.bookmarkSort.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={bookmarksImg}/></div></>
            )
        }
        if (premiumFeature === "animated-avatar") {
            return (
                <><img className="premium-banner" src={animatedAvatar}/>
                <span className="premium-text" style={{color: "#fb1d90"}}>
                    {i18n.premium.animatedAvatar.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={animatedImg}/></div></>
            )
        }
        if (premiumFeature === "change-username") {
            return (
                <><img className="premium-banner" src={changeUsername}/>
                <span className="premium-text" style={{color: "#5e2cff"}}>
                    {i18n.premium.changeUsername.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={changeUsernameImg}/></div></>
            )
        }
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {session.username ? <div className="premium">
                    <div className="premium-nav">
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("premium")}>{i18n.roles.premium}</span>
                        <span className="premium-nav-text" style={{color: "#2f91ff"}} onClick={() => setPremiumFeature("upscaled-images")}>{i18n.user.upscaledImages}</span>
                        <span className="premium-nav-text" style={{color: "#5b2fff"}} onClick={() => setPremiumFeature("autosearch")}>{i18n.premium.autoSearch.title}</span>
                        <span className="premium-nav-text" style={{color: "#ff2792"}} onClick={() => setPremiumFeature("search-history")}>{i18n.history.search}</span>
                        <span className="premium-nav-text" style={{color: "#3a51ff"}} onClick={() => setPremiumFeature("bookmark-sort")}>{i18n.premium.bookmarkSort.title}</span>
                        <span className="premium-nav-text" style={{color: "#fb1d90"}} onClick={() => setPremiumFeature("animated-avatar")}>{i18n.premium.animatedAvatar.title}</span>
                        <span className="premium-nav-text" style={{color: "#5e2cff"}} onClick={() => setPremiumFeature("change-username")}>{i18n.user.changeUsername}</span>
                    </div>
                    <div className="premium-container">
                        {getContainerJSX()}
                    </div> 
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PremiumPage