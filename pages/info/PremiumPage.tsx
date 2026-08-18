/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useThemeSelector, useInteractionActions, useSessionSelector,
useLayoutActions, useActiveActions, useLayoutSelector} from "../../store"
import premiumImg from "../../assets/images/premiumupgrade.png"
import upscaledImg from "../../assets/images/upscaled.png"
import imageFiltersImg from "../../assets/images/imagefilters2.png"
import bookmarksImg from "../../assets/images/bookmarks.png"
import historyImg from "../../assets/images/searchhistory.png"
import savedSearchesImg from "../../assets/images/savedsearches.png"
import favoriteGroupsImg from "../../assets/images/favgroups2.png"
import autosearchImg from "../../assets/images/autosearching.png"
import autoscrollImg from "../../assets/images/autoscrolling.png"
import animatedImg from "../../assets/images/animatedavatar.gif"
import changeUsernameImg from "../../assets/images/changeusername.png"
import upscaledImages from "../../assets/images/premium-upscaled-images.png"
import imageFilters from "../../assets/images/premium-image-filters.png"
import autosearch from "../../assets/images/premium-autosearch.png"
import autoscroll from "../../assets/images/premium-autoscroll.png"
import searchHistory from "../../assets/images/premium-search-history.png"
import favoriteGroups from "../../assets/images/premium-favorite-groups.png"
import savedSearches from "../../assets/images/premium-saved-searches.png"
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
    const navigate = useNavigate()

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
        functions.dom.changeTitle(i18n.roles.premium, i18n)
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

                    {i18n.premium.premium.line2}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={premiumImg}/></div></>
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
        if (premiumFeature === "favorite-groups") {
            return (
                <><img className="premium-banner" src={favoriteGroups}/>
                <span className="premium-text" style={{color: "#e84bff"}}>
                    {i18n.premium.favoriteGroups.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={favoriteGroupsImg}/></div></>
            )
        }
        if (premiumFeature === "saved-searches") {
            return (
                <><img className="premium-banner" src={savedSearches}/>
                <span className="premium-text" style={{color: "#8352FF"}}>
                    {i18n.premium.savedSearches.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={savedSearchesImg}/></div></>
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
        if (premiumFeature === "image-filters") {
            return (
                <><img className="premium-banner" src={imageFilters}/>
                <span className="premium-text" style={{color: "#304FFF"}}>
                    {i18n.premium.imageFilters.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={imageFiltersImg}/></div></>
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
        if (premiumFeature === "autoscroll") {
            return (
                <><img className="premium-banner" src={autoscroll}/>
                <span className="premium-text" style={{color: "#FF38B3"}}>
                    {i18n.premium.autoScroll.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={autoscrollImg}/></div></>
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
                <span className="premium-text" style={{color: "#ff2ca9"}}>
                    {i18n.premium.changeUsername.header}
                </span>
                <div className="premium-img-container"><img className="premium-img" src={changeUsernameImg}/></div></>
            )
        }
        if (premiumFeature === "purchase") {
            return (
                <><div className="premium-row">
                    <span className="premium-heading">{i18n.premium.purchase.title}</span>
                </div>
                <span className="premium-text" style={{color: "var(--text)"}}>
                    {i18n.premium.purchase.line1}<br/><br/>

                    <a className="premium-link" onClick={() => navigate("/mobile")}>{`${functions.config.getDomain()}/mobile`}</a>
                </span></>
            )
        }
    }

    const lightenColor = (color: string) => {
        return `color-mix(${color} 70%, transparent)`
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
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#ff2792")} : {color: "#ff2792"}} 
                            onClick={() => setPremiumFeature("search-history")}>{i18n.history.search}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#e84bff")} : {color: "#e84bff"}} 
                            onClick={() => setPremiumFeature("favorite-groups")}>{i18n.help.favoriteGroups.title}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#8352FF")} : {color: "#8352FF"}} 
                            onClick={() => setPremiumFeature("saved-searches")}>{i18n.options.savedSearches}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#2f91ff")} : {color: "#2f91ff"}} 
                            onClick={() => setPremiumFeature("upscaled-images")}>{i18n.user.upscaledImages}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#304FFF")} : {color: "#304FFF"}} 
                            onClick={() => setPremiumFeature("image-filters")}>{i18n.mobilePremium.imageFilters.title}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#5b2fff")} : {color: "#5b2fff"}} 
                            onClick={() => setPremiumFeature("autosearch")}>{i18n.premium.autoSearch.title}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#FF38B3")} : {color: "#FF38B3"}} 
                            onClick={() => setPremiumFeature("autoscroll")}>{i18n.mobilePremium.autoScroll.title}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#3a51ff")} : {color: "#3a51ff"}} 
                            onClick={() => setPremiumFeature("bookmark-sort")}>{i18n.premium.bookmarkSort.title}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#fb1d90")} : {color: "#fb1d90"}} 
                            onClick={() => setPremiumFeature("animated-avatar")}>{i18n.premium.animatedAvatar.title}</span>
                        <span className="premium-nav-text" style={mobile ? {backgroundColor: lightenColor("#ff2ca9")} : {color: "#ff2ca9"}} 
                            onClick={() => setPremiumFeature("change-username")}>{i18n.user.changeUsername}</span>
                        <span className="premium-nav-text" onClick={() => setPremiumFeature("purchase")}>{i18n.premium.purchase.title}</span>
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