import React, {useContext, useState, useEffect, useReducer} from "react"
import {HashLink as Link} from "react-router-hash-link"
import {useNavigate} from "react-router-dom"
import favicon from "../../assets/icons/favicon.png"
import eyedropper from "../../assets/icons/eyedropper.png"
import light from "../../assets/icons/light.png"
import logoutIcon from "../../assets/icons/logout.png"
import logoutModIcon from "../../assets/icons/logout-mod.png"
import logoutAdminIcon from "../../assets/icons/logout-admin.png"
import logoutSystemIcon from "../../assets/icons/logout-system.png"
import logoutPremiumIcon from "../../assets/icons/logout-premium.png"
import logoutCuratorIcon from "../../assets/icons/logout-curator.png"
import logoutContributorIcon from "../../assets/icons/logout-contributor.png"
import searchIcon from "../../assets/icons/search.png"
import crown from "../../assets/icons/crown.png"
import mail from "../../assets/icons/mail.png"
import mailNotif from "../../assets/icons/mail-notif.png"
import crownLight from "../../assets/icons/crown-light.png"
import mailLight from "../../assets/icons/mail-light.png"
import mailNotifLight from "../../assets/icons/mail-notif-light.png"
import eyedropperLight from "../../assets/icons/eyedropper-light.png"
import lightLight from "../../assets/icons/light-light.png"
import dark from "../../assets/icons/dark.png"
import userHistory from "../../assets/icons/user-history.png"
import userHistoryLight from "../../assets/icons/user-history-light.png"
import darkLight from "../../assets/icons/dark-light.png"
import permissions from "../../structures/Permissions"
import functions from "../../structures/Functions"
import SearchSuggestions from "../tooltip/SearchSuggestions"
import scrollIcon from "../../assets/icons/scroll-mobile.png"
import pageIconLight from "../../assets/icons/page-mobile-light.png"
import scrollIconLight from "../../assets/icons/scroll-mobile-light.png"
import pageIcon from "../../assets/icons/page-mobile.png"
import premiumStar from "../../assets/icons/premium-star.png"
import snowflake from "../../assets/icons/snowflake.png"
import snowflakeLight from "../../assets/icons/snowflake-light.png"
import snowflakeOn from "../../assets/icons/snowflake-on.png"
import music from "../../assets/icons/music.png"
import musicLight from "../../assets/icons/music-light.png"
import musicActive from "../../assets/icons/music-active.png"
import MiniAudioPlayer from "./MiniAudioPlayer"
import Slider from "react-slider"
import {useThemeSelector, useThemeActions, useLayoutSelector, useSearchActions, useSearchSelector, 
useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, usePlaybackSelector,
usePlaybackActions} from "../../store"
import {Themes} from "../../types/Types"
import "./styles/navbar.less"

interface Props {
    goBack?: boolean
}

const NavBar: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, i18n, siteHue, siteSaturation, siteLightness, particles, particleAmount, particleSize, particleSpeed} = useThemeSelector()
    const {setTheme, setSiteHue, setSiteSaturation, setSiteLightness, setParticles, setParticleAmount, setParticleSize, setParticleSpeed} = useThemeActions()
    const {mobile, tablet, relative, hideNavbar, hideSidebar, hideSortbar, hideTitlebar, hideMobileNavbar} = useLayoutSelector()
    const {setHideMobileNavbar, setHideNavbar} = useLayoutActions()
    const {audio, showMiniPlayer} = usePlaybackSelector()
    const {setShowMiniPlayer} = usePlaybackActions()
    const {search, scroll} = useSearchSelector()
    const {setSearch, setSearchFlag, setScroll} = useSearchActions()
    const {setEnableDrag} = useInteractionActions()
    const {session, userImg, hasNotification} = useSessionSelector()
    const {setSessionFlag, setHasNotification} = useSessionActions()
    const [showMiniTitle, setShowMiniTitle] = useState(false)
    const [suggestionsActive, setSuggestionsActive] = useState(false)
    const [marginR, setMarginR] = useState("60px")
    const [activeColorDropdown, setActiveColorDropdown] = useState(false)
    const [activeParticleDropdown, setActiveParticleDropdown] = useState(false)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

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
            functions.clearResponseCacheKey("/api/user/checkmail")
            const result = await functions.get("/api/user/checkmail", null, session, setSessionFlag)
            setHasNotification(result)
        }
        checkMail()
    }, [session])

    useEffect(() => {
        const scrollHandler = () => {
            if (hideTitlebar) {
                if (window.scrollY < functions.titlebarHeight()) {
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
            if (window.scrollY > functions.titlebarHeight()) {
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

    const lightChange = () => {
        let newTheme = ""
        if (theme.includes("light")) {
            newTheme = "dark"
        } else {
            newTheme = "light"
        }
        setTheme(newTheme as Themes)
    }

    const getEyedropperIcon = () => {
        if (theme.includes("light")) return eyedropperLight
        return eyedropper
    }

    const getThemeIcon = () => {
        if (theme.includes("light")) return darkLight
        return light
    }

    const getMailIcon = () => {
        if (theme.includes("light")) return hasNotification ? mailNotifLight : mailLight
        return hasNotification ? mailNotif : mail
    }

    const getHistoryIcon = () => {
        if (theme.includes("light")) return userHistoryLight
        return userHistory
    }

    const getCrownIcon = () => {
        if (theme.includes("light")) return crownLight
        return crown
    }

    const getSnowflakeIcon = () => {
        if (particles) return snowflakeOn
        if (theme.includes("light")) return snowflakeLight
        return snowflake
    }

    const getMusicIcon = () => {
        if (audio) return musicActive
        if (theme.includes("light")) return musicLight
        return music
    }

    const getScrollIcon = () => {
        if (theme.includes("light")) return scroll ? scrollIconLight : pageIconLight
        return scroll ? scrollIcon : pageIcon
    }

    const logout = async () => {
        await functions.post("/api/user/logout", null, session, setSessionFlag)
        setSessionFlag(true)
        history.go(0)
    }

    const postsClick = () => {
        if (props.goBack) {
            navigate("/posts?loaded=true")
        } else {
            navigate("/posts?loaded=true")
            setSearchFlag(true)
        }
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
        if (session.role === "admin") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text admin-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutAdminIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "mod") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text mod-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutModIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "system") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text system-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutSystemIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "premium-curator") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text curator-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutCuratorIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "curator") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text curator-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutCuratorIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "premium-contributor") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text premium-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutPremiumIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "contributor") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text contributor-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutContributorIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else if (session.role === "premium") {
            return (<>
                <span className="mobile-nav-text mobile-nav-user-text premium-color" onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                <img className="mobile-nav-logout-img" src={logoutPremiumIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
            </>
            )
        } else {
            return (<>
                    <span className={`mobile-nav-text mobile-nav-user-text ${session.banned ? "banned" : ""}`} onClick={() => {navigate("/profile"); setHideMobileNavbar(true)}}>{functions.toProperCase(session.username)}</span>
                    <img className="mobile-nav-logout-img" src={logoutIcon} onClick={() => {logout(); setHideMobileNavbar(true)}}/>
                </>
            )
        }
    }

    const generateUsernameJSX = () => {
        if (session.role === "admin") {
            return (<>
                <span className="nav-text nav-user-text admin-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutAdminIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "mod") {
            return (<>
                <span className="nav-text nav-user-text mod-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutModIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "system") {
            return (<>
                <span className="nav-text nav-user-text system-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutSystemIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "premium-curator") {
            return (<>
                <span className="nav-text nav-user-text curator-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutCuratorIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "curator") {
            return (<>
                <span className="nav-text nav-user-text curator-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutCuratorIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "premium-contributor") {
            return (<>
                <span className="nav-text nav-user-text premium-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutPremiumIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "contributor") {
            return (<>
                <span className="nav-text nav-user-text contributor-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutContributorIcon} onClick={logout}/>
            </>
            )
        } else if (session.role === "premium") {
            return (<>
                <span className="nav-text nav-user-text premium-color" onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutPremiumIcon} onClick={logout}/>
            </>
            )
        } else {
            return (<>
                <span className={`nav-text nav-user-text ${session.banned ? "banned" : ""}`} onClick={() => navigate("/profile")}>{functions.toProperCase(session.username)}</span>
                <img className="nav-logout-img" src={logoutIcon} onClick={logout}/>
            </>
            )
        }
    }

    useEffect(() => {
        if (mobile) setTimeout(() => forceUpdate(), 50)
    }, [mobile])

    const resetFilters = () => {
        setSiteHue(180)
        setSiteSaturation(100)
        setSiteLightness(50)
    }

    const getColorDropdownJSX = () => {
        let style = mobile ? {top: "500px"} : {top: "40px"}
        if (typeof window !== "undefined") style = {top: `${functions.navbarHeight()}px`}
        return (
            <div className={`title-dropdown ${activeColorDropdown ? "" : "hide-title-dropdown"}`} style={style} onMouseEnter={() => setHideNavbar(false)} onMouseLeave={() => setHideNavbar(true)}>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">{i18n.filters.hue}</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteHue(value)} min={60} max={272} step={1} value={siteHue}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">{i18n.filters.saturation}</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteSaturation(value)} min={50} max={100} step={1} value={siteSaturation}/>
                </div>
                <div className="title-dropdown-row">
                    <span className="title-dropdown-text">{i18n.filters.lightness}</span>
                    <Slider className="title-dropdown-slider" trackClassName="title-dropdown-slider-track" thumbClassName="title-dropdown-slider-thumb" onChange={(value) => setSiteLightness(value)} min={45} max={55} step={1} value={siteLightness}/>
                </div>
                <div className="title-dropdown-row" style={{justifyContent: "space-evenly"}}>
                    <button className="title-dropdown-button" onClick={() => resetFilters()}>{i18n.filters.reset}</button>
                    <button className="title-dropdown-button" onClick={() => lightChange()} style={{backgroundColor: theme.includes("light") ? "#f536ac" : "#36eaf7"}}>{theme.includes("light") ? i18n.buttons.dark : i18n.buttons.light}</button>
                </div>
            </div>
        )
    }

    const resetParticles = () => {
        setParticleAmount(25)
        setParticleSize(3)
        setParticleSpeed(2)
    }

    const getParticleDropdownJSX = () => {
        let style = mobile ? {top: "500px"} : {top: "40px"}
        if (typeof window !== "undefined") style = {top: `${functions.navbarHeight()}px`}
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
                    <button style={{backgroundColor: particles ? "#f536ac" : "#36eaf7"}} className="title-dropdown-button" onClick={() => setParticles(!particles)}>{particles ? i18n.buttons.disable : i18n.buttons.enable}</button>
                </div>
            </div>
        )
    }

    const toggleScroll = () => {
        const newValue = !scroll
        setScroll(newValue)
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
            return hideMobileNavbar ? `-${document.querySelector(".mobile-navbar")?.clientHeight || 500}px` : "0px"
        }
        return (
            <div className={`mobile-navbar ${hideMobileNavbar ? "hide-mobile-navbar" : ""}`} style={{marginTop: getMobileMargin()}}>
                <div className="mobile-nav-text-container">
                    {session.username ? 
                    <div className="mobile-nav-user-container">
                        <img className="mobile-nav-user-img" src={userImg} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateMobileUsernameJSX()}
                    </div> :
                    <span className="mobile-nav-text mobile-nav-login-text" onClick={() => {navigate("/login"); setHideMobileNavbar(true)}}>{i18n.navbar.login}</span>}
                    <span className="mobile-nav-text" onClick={() => {navigate("/posts"); setHideMobileNavbar(true); setSearchFlag(true)}}>{i18n.sort.posts}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/comments"); setHideMobileNavbar(true)}}>{i18n.navbar.comments}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/notes"); setHideMobileNavbar(true)}}>{i18n.navbar.notes}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/artists"); setHideMobileNavbar(true)}}>{i18n.navbar.artists}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/characters"); setHideMobileNavbar(true)}}>{i18n.navbar.characters}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/series"); setHideMobileNavbar(true)}}>{i18n.tag.series}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/tags"); setHideMobileNavbar(true)}}>{i18n.navbar.tags}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/groups"); setHideMobileNavbar(true)}}>{i18n.sort.groups}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/forum"); setHideMobileNavbar(true)}}>{i18n.navbar.forum}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/help"); setHideMobileNavbar(true)}}>{i18n.navbar.help}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/terms"); setHideMobileNavbar(true)}}>{i18n.navbar.terms}</span>
                    <span className="mobile-nav-text" onClick={() => {navigate("/contact"); setHideMobileNavbar(true)}}>{i18n.navbar.contact}</span>
                    {permissions.isPremiumEnabled() && session.username ? <div className="mobile-nav-img-container" onClick={() => {navigate("/premium"); setHideMobileNavbar(true)}}>
                        <img className="mobile-nav-img" src={premiumStar} style={{marginRight: "10px"}}/>
                        <span className="mobile-nav-text" style={{margin: "0px", color: "var(--premiumColor)"}}>{i18n.roles.premium}</span>
                    </div> : null}
                </div>
                <div className="mobile-nav-color-container">
                    {session.username ? <img className="nav-color" src={getHistoryIcon()} onClick={() => navigate("/history")} style={{filter: getFilter()}}/> : null}
                    <img className="mobile-nav-color" src={getMusicIcon()} onClick={miniPlayer} style={{filter: getFilter()}}/>
                    <img className="mobile-nav-color" src={getSnowflakeIcon()} onClick={particleChange} style={{filter: getFilter()}}/>
                    <img className="mobile-nav-color" src={getEyedropperIcon()} onClick={colorChange} style={{filter: getFilter()}}/>
                    {/* <img className="mobile-nav-color" src={getThemeIcon()} onClick={lightChange} style={{filter: getFilter()}}/> */}
                    {session.username ? <img className="nav-color" src={getMailIcon()} onClick={() => navigate("/mail")} style={{filter: getFilter()}}/> : null}
                    {permissions.isMod(session) ? <img className="nav-color" src={getCrownIcon()} onClick={() => navigate("/mod-queue")} style={{filter: getFilter()}}/> : null}
                    <img className="mobile-nav-color" src={getScrollIcon()} onClick={toggleScroll} style={{filter: getFilter()}}/>
                </div>
                <MiniAudioPlayer/>
                {getColorDropdownJSX()}
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
                {/*showMiniTitle && !relative ? 
                    <Link to="/" className="nav-mini-title-container">
                        <span className="nav-mini-title-a">M</span>
                        <span className="nav-mini-title-b">o</span>
                        <span className="nav-mini-title-a">e</span>
                        <span className="nav-mini-title-b">p</span>
                        <span className="nav-mini-title-a">i</span>
                        <span className="nav-mini-title-b">c</span>
                        <span className="nav-mini-title-a">t</span>
                        <span className="nav-mini-title-b">u</span>
                        <span className="nav-mini-title-a">r</span>
                        <span className="nav-mini-title-b">e</span>
                        <span className="nav-mini-title-a">s</span>
                    </Link>
                : null*/}
                <div className="nav-text-container">
                    {session.username ? 
                    <div className="nav-user-container" style={{marginRight: marginR}}>
                        <img className="nav-user-img" src={userImg} style={{filter: session.image ? "" : getFilter()}}/>
                        {generateUsernameJSX()}
                    </div> :
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text nav-login-text" onClick={() => navigate("/login")}>{i18n.navbar.login}</span>}
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => postsClick()}>{i18n.sort.posts}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/comments")}>{i18n.navbar.comments}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/notes")}>{i18n.navbar.notes}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/artists")}>{i18n.navbar.artists}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/characters")}>{i18n.navbar.characters}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/series")}>{i18n.tag.series}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/tags")}>{i18n.navbar.tags}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/groups")}>{i18n.sort.groups}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/forum")}>{i18n.navbar.forum}</span>
                    <span style={{marginRight: marginR, fontSize: getFontSize()}} className="nav-text" onClick={() => navigate("/help")}>{i18n.navbar.help}</span>
                    {permissions.isPremiumEnabled() && session.username ? <img style={{marginRight: "0px", marginTop: "2px"}} className="nav-img" onClick={() => navigate("/premium")} src={premiumStar}/> : null}
                </div>
                <div className="nav-color-container">
                    <div className={`nav-search-container ${!hideSidebar || tablet ? "hide-nav-search" : ""}`}>
                        <img className="nav-search-icon" src={searchIcon} onClick={() => setSearchFlag(true)}/>
                        <input className="nav-search" type="search" spellCheck={false} value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? setSearchFlag(true) : null} onFocus={() => setSuggestionsActive(true)} onBlur={() => setSuggestionsActive(false)}/>
                    </div>
                    {session.username ? <img className="nav-color" src={getHistoryIcon()} onClick={() => navigate("/history")} style={{filter: getFilter()}}/> : null}
                    <img className="nav-color" src={getMusicIcon()} onClick={miniPlayer} style={{filter: getFilter()}}/>
                    <img className="nav-color" src={getSnowflakeIcon()} onClick={particleChange} style={{filter: getFilter()}}/>
                    <img className="nav-color" src={getEyedropperIcon()} onClick={colorChange} style={{filter: getFilter()}}/>
                    {/* <img className="nav-color" src={getThemeIcon()} onClick={lightChange} style={{filter: getFilter()}}/> */}
                    {session.username ? <img className="nav-color" src={getMailIcon()} onClick={() => navigate("/mail")} style={{filter: getFilter()}}/> : null}
                    {permissions.isMod(session) && !hideSidebar ? <img className="nav-color" src={getCrownIcon()} onClick={() => navigate("/mod-queue")} style={{filter: getFilter()}}/> : null}
                </div>
                <MiniAudioPlayer/>
                {getColorDropdownJSX()}
                {getParticleDropdownJSX()}
            </div>
            </>
        )
    }
}

export default NavBar