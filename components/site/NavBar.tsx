/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useState, useEffect, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import SearchIcon from "../../assets/svg/search.svg"
import HistoryIcon from "../../assets/svg/history-thin.svg"
import MusicIcon from "../../assets/svg/music.svg"
import SnowflakeIcon from "../../assets/svg/snowflake.svg"
import HueShiftIcon from "../../assets/svg/hueshift.svg"
import MailIcon from "../../assets/svg/mail.svg"
import MailNotifIcon from "../../assets/svg/mail-notif.svg"
import CrownIcon from "../../assets/svg/crown.svg"
import LogoutIcon from "../../assets/svg/logout.svg"
import SnowflakeButtonIcon from "../../assets/svg/snowflake2.svg"
import PremiumStarIcon from "../../assets/svg/star.svg"
import PhoneIcon from "../../assets/svg/iphone.svg"

import permissions from "../../structures/Permissions"
import functions from "../../functions/Functions"
import SearchSuggestions from "../tooltip/SearchSuggestions"
import MiniAudioPlayer from "./MiniAudioPlayer"
import Slider from "react-slider"
import {useThemeSelector, useThemeActions, useLayoutSelector, useSearchActions, useSearchSelector, 
useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, usePlaybackSelector,
usePlaybackActions, useInteractionSelector, useCacheSelector, usePageSelector} from "../../store"
import HSLDropdown from "../../ui/HSLDropdown"
import "./styles/navbar.less"

const NavBar: React.FunctionComponent = () => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {i18n, siteHue, siteSaturation, siteLightness, particles, particleAmount, particleSize, particleSpeed} = useThemeSelector()
    const {setParticles, setParticleAmount, setParticleSize, setParticleSpeed} = useThemeActions()
    const {mobile, tablet, relative, hideNavbar, hideSidebar, hideSortbar, hideTitlebar, hideMobileNavbar} = useLayoutSelector()
    const {setHideMobileNavbar, setHideNavbar} = useLayoutActions()
    const {audio, showMiniPlayer} = usePlaybackSelector()
    const {setShowMiniPlayer} = usePlaybackActions()
    const {search} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {page} = usePageSelector()
    const {scrollY} = useInteractionSelector()
    const {setEnableDrag} = useInteractionActions()
    const {posts} = useCacheSelector()
    const {session, userImg, hasNotification} = useSessionSelector()
    const {setSessionFlag, setHasNotification} = useSessionActions()
    const [showMiniTitle, setShowMiniTitle] = useState(false)
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const [marginR, setMarginR] = useState("60px")
    const [activeColorDropdown, setActiveColorDropdown] = useState(false)
    const [activeParticleDropdown, setActiveParticleDropdown] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        setShowMiniTitle(false)

        const handleScroll = () => {
            if (window.scrollY === 0) return
            return setHideMobileNavbar(true)
        }
        window.addEventListener("scroll", handleScroll)
        return () => {
            window.removeEventListener("scroll", handleScroll)
        }
    }, [])

    useEffect(() => {
        if (!session.username) return 
        const checkMail = async () => {
            functions.cache.clearResponseCacheKey("/api/user/checkmail")
            const result = await functions.http.get("/api/user/checkmail", null, session, setSessionFlag)
            setHasNotification(result)
        }
        checkMail()
    }, [session])

    useEffect(() => {
        const scrollHandler = () => {
            if (hideTitlebar) {
                if (window.scrollY < functions.dom.titlebarHeight()) {
                    setShowMiniTitle(false)
                } else {
                    setShowMiniTitle(true)
                }
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            setTimeout(() => {
                window.removeEventListener("scroll", scrollHandler)
            }, 10)
        }
    })

    useEffect(() => {
        if (!hideTitlebar) {
                setShowMiniTitle(false)
        } else {
            if (window.scrollY > functions.dom.titlebarHeight()) {
                setShowMiniTitle(true)
            }
        }
    }, [hideTitlebar])

    const colorChange = () => {
        setShowMiniPlayer(false)
        setActiveParticleDropdown(false)
        setActiveColorDropdown(!activeColorDropdown)
    }

    const particleChange = () => {
        setShowMiniPlayer(false)
        setActiveColorDropdown(false)
        setActiveParticleDropdown(!activeParticleDropdown)
    }

    const miniPlayer = () => {
        if (!audio) return
        setActiveParticleDropdown(false)
        setActiveColorDropdown(false)
        setShowMiniPlayer(!showMiniPlayer)
    }

    const logout = async () => {
        await functions.http.post("/api/user/logout", null, session, setSessionFlag)
        setSessionFlag(true)
        navigate(0)
    }

    const postsClick = () => {
        setHideMobileNavbar(true)
        let pageText = page > 1 ? `?page=${page}` : ""
        navigate(`/posts${pageText}`, {
            state: {restorePosts: posts, restoreScrollY: scrollY, restorePage: page}
        })
    }

    useEffect(() => {
        if (tablet) {
            let marginR = "25px"
            setMarginR(marginR)
        } else {
            let marginR = hideSidebar ? "40px" : "45px"
            setMarginR(marginR)
        }
    }, [session, hideSidebar, tablet])

    const generateMobileUsernameJSX = () => {
        const colorMap = {
            "admin": "admin-color",
            "mod": "mod-color",
            "system": "system-color",
            "curator": "curator-color",
            "contributor": "contributor-color"
        }
        const svgMap = {
            "admin": "--adminColor",
            "mod": "--modColor",
            "system": "--systemColor",
            "curator": "--curatorColor",
            "contributor": "--contributorColor",
            "user": "--userColor"
        }
        let colorClass = session.banned ? "banned" : colorMap[session.role] ?? ""
        let svgColor = session.banned ? "--banText" : svgMap[session.role] ?? "--userColor"

        if (session.role === "user" && session.premium) {
            colorClass = "premium-color"
            svgColor = "--premiumColor"
        }

        return (
            <>
            <span className={`mobile-nav-text mobile-nav-user-text ${colorClass}`} 
                onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>
                {functions.util.toProperCase(session.username)}
            </span>
            <LogoutIcon className="mobile-nav-logout-img" style={{color: `var(${svgColor})`}} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
        )
    }

    useEffect(() => {
        if (mobile) setTimeout(() => forceUpdate(), 50)
    }, [mobile])

    const resetParticles = () => {
        setParticleAmount(25)
        setParticleSize(3)
        setParticleSpeed(2)
    }

    const getParticleDropdownJSX = () => {
        let style = mobile ? {top: "428px"} : {top: "30px"}
        if (typeof window !== "undefined") {
            let navbarHeight = functions.dom.navbarHeight()
            if (navbarHeight) style = {top: `${navbarHeight}px`}
        }
        return (
            <div className={`title-dropdown ${activeParticleDropdown ? "" : "hide-title-dropdown"}`} style={style} onMouseEnter={() => setHideNavbar(false)} onMouseLeave={() => setHideNavbar(true)}>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">{i18n.labels.amount}</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setParticleAmount(value)} min={10} max={100} step={1} value={particleAmount}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">{i18n.labels.size}</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setParticleSize(value)} min={1} max={10} step={1} value={particleSize}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">{i18n.labels.speed}</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setParticleSpeed(value)} min={1} max={10} step={1} value={particleSpeed}/>
                </div>
                <div className="title-dropdown-row" style={{justifyContent: "space-evenly"}}>
                    <button className="title-dropdown-button" onClick={() => resetParticles()}>{i18n.filters.reset}</button>
                    <button style={{backgroundColor: particles ? "#f536ac" : "#36eaf7"}} className="title-dropdown-button" onClick={() => setParticles(!particles)}>
                        {/*particles ? i18n.buttons.disable : i18n.buttons.enable*/}
                        <SnowflakeButtonIcon className="title-dropdown-button-icon"/>
                    </button>
                </div>
            </div>
        )
    }

    const getFontSize = () => {
        if (tablet) {
            return "17px"
        } else {
            return "19px"
        }
    }

    if (mobile) {
        const getMobileMargin = () => {
            if (typeof window === "undefined") return "0px"
            return hideMobileNavbar ? `-${document.querySelector(".mobile-navbar")?.clientHeight || 500}px` : "0px"
        }
        return (
            <div className={`mobile-navbar ${hideMobileNavbar ? "hide-mobile-navbar" : ""}`} style={{marginTop: getMobileMargin()}}>
                <div className="mobile-nav-text-container">
                    {session.username ? 
                    <div className="mobile-nav-user-container">
                        <img className="mobile-nav-user-img" src={userImg}/>
                        {generateMobileUsernameJSX()}
                    </div> :
                    <span className="mobile-nav-text mobile-nav-login-text" onClick={() => {navigate("/login"); setHideMobileNavbar(true)}}>{i18n.navbar.login}</span>}
                    <span className="mobile-nav-text" onClick={() => postsClick()}>{i18n.sort.posts}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/comments"); setHideMobileNavbar(true)}}>{i18n.navbar.comments}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/notes"); setHideMobileNavbar(true)}}>{i18n.navbar.notes}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/artists"); setHideMobileNavbar(true)}}>{i18n.navbar.artists}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/characters"); setHideMobileNavbar(true)}}>{i18n.navbar.characters}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/series"); setHideMobileNavbar(true)}}>{i18n.tag.series}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/tags"); setHideMobileNavbar(true)}}>{i18n.navbar.tags}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/groups"); setHideMobileNavbar(true)}}>{i18n.sort.groups}</span>
                    {/* <span className="mobile-nav-text" onClick={() => {navigate("/forum"); setHideMobileNavbar(true)}}>{i18n.navbar.forum}</span> */}
                    <span className="mobile-nav-text" onClick={() => {navigate("/help"); setHideMobileNavbar(true)}}>{i18n.navbar.help}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/mobile"); setHideMobileNavbar(true)}}>{i18n.navbar.mobile}</span>
                    {permissions.isPremiumEnabled() && session.username ? <div className="mobile-nav-img-container" onClick={() => {navigate("/premium"); setHideMobileNavbar(true)}}>
                        {/* <PremiumStarIcon className="mobile-nav-img" style={{marginRight: "10px"}}/> */}
                        <span className="mobile-nav-text" style={{margin: "0px", color: "var(--premiumColor)"}}>{i18n.roles.premium}</span>
                    </div> : null}
                </div>
                <div className="mobile-nav-color-container">
                    {session.username ? <HistoryIcon className="mobile-nav-color" onClick={() => navigate("/history")}/> : null}
                    {audio ?
                    <MusicIcon className="mobile-nav-color-pink" onClick={miniPlayer}/> :
                    <MusicIcon className="mobile-nav-color" onClick={miniPlayer}/>}
                    {particles ?
                    <SnowflakeIcon className="mobile-nav-color-blue" onClick={particleChange}/> :
                    <SnowflakeIcon className="mobile-nav-color" onClick={particleChange}/>}
                    <HueShiftIcon className="mobile-nav-color" onClick={colorChange}/>
                    
                    {session.username ? (hasNotification ? 
                        <MailNotifIcon className="mobile-nav-color" onClick={() => navigate("/mail")}/> :
                        <MailIcon className="mobile-nav-color" onClick={() => navigate("/mail")}/>) : null}
                    {permissions.isMod(session) ? <CrownIcon className="mobile-nav-color" onClick={() => navigate("/mod-queue")}/> : null}
                </div>
                <MiniAudioPlayer/>
                <HSLDropdown active={activeColorDropdown}/>
                {getParticleDropdownJSX()}
            </div>
        )
    } else {
        const getX = () => {
            if (typeof document === "undefined") return 1220
            const element = document.querySelector(".nav-search")
            if (!element) return 1220
            const rect = element.getBoundingClientRect()
            return rect.right - 200
        }

        const getY = () => {
            if (typeof document === "undefined") return 1220
            const element = document.querySelector(".nav-search")
            if (!element) return 100
            const rect = element.getBoundingClientRect()
            return rect.bottom + window.scrollY
        }

        return (
            <>
            <SearchSuggestions active={suggestionsActive && hideSidebar} width={180} x={getX()} y={getY()}/>
            <div className={`navbar ${hideTitlebar ? "translate-navbar" : ""} ${hideSortbar && hideTitlebar && hideSidebar ? "hide-navbar" : ""} ${hideSortbar && hideNavbar && showMiniTitle ? "hide-navbar" : ""}
            ${relative ? "navbar-relative" : ""}`} onMouseEnter={() => setEnableDrag(false)}>
                <div className="nav-text-container">
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => postsClick()}>{i18n.sort.posts}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/comments")}>{i18n.navbar.comments}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/notes")}>{i18n.navbar.notes}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/artists")}>{i18n.navbar.artists}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/characters")}>{i18n.navbar.characters}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/series")}>{i18n.tag.series}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/tags")}>{i18n.navbar.tags}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/groups")}>{i18n.sort.groups}</span>
                    {/* <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/forum")}>{i18n.navbar.forum}</span> */}
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/help")}>{i18n.navbar.help}</span>
                    <PhoneIcon  className="nav-img" style={{marginRight: marginR, marginTop: "2px"}} onClick={() => navigate("/mobile")}/>
                    {permissions.isPremiumEnabled() && session.username ? <PremiumStarIcon  className="premium-nav-img" style={{marginTop: "2px"}} onClick={() => navigate("/premium")}/> : null}
                    <div className={`nav-search-container ${!hideSidebar || tablet ? "hide-nav-search" : ""}`}>
                        <SearchIcon className="nav-search-icon" onClick={() => setSearchFlag(true)}/>
                        <input className="nav-search" type="search" spellCheck={false} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? setSearchFlag(true) : null} onFocus={() => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                    </div>
                </div>
                <div className="nav-color-container">
                    {session.username ? <HistoryIcon className="nav-color" onClick={() => navigate("/history")}/> : null}
                    {audio ?
                    <MusicIcon className="nav-color-pink" onClick={miniPlayer}/> :
                    <MusicIcon className="nav-color" onClick={miniPlayer}/>}
                    {particles ?
                    <SnowflakeIcon className="nav-color-blue" onClick={particleChange}/> :
                    <SnowflakeIcon className="nav-color" onClick={particleChange}/>}
                    <HueShiftIcon className="nav-color" onClick={colorChange}/>
                    
                    {session.username ? (hasNotification ? 
                        <MailNotifIcon className="nav-color" onClick={() => navigate("/mail")}/> :
                        <MailIcon className="nav-color" onClick={() => navigate("/mail")}/>) : null}
                    {permissions.isMod(session) && !hideSidebar ? <CrownIcon className="nav-color" onClick={() => navigate("/mod-queue")}/> : null}
                </div>
                <MiniAudioPlayer/>
                <HSLDropdown active={activeColorDropdown}/>
                {getParticleDropdownJSX()}
            </div>
            </>
        )
    }
}

export default NavBar