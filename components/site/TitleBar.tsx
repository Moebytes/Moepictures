/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import favicon from "../../assets/icons/favicon.png"
import {useThemeSelector, useSessionSelector, useLayoutSelector, useSearchActions, useSearchSelector, 
useInteractionActions, useLayoutActions, useActiveSelector, useInteractionSelector, useCacheSelector, 
usePageSelector, useFlagSelector, useActiveActions, useFlagActions, useSessionActions} from "../../store"
import functions from "../../functions/Functions"
import HamburgerIcon from "../../assets/svg/hamburger.svg"
import KeyIcon from "../../assets/svg/key.svg"
import LogoutIcon from "../../assets/svg/logout.svg"
import LockIcon from "../../assets/svg/lock.svg"
import PrivateIcon from "../../assets/svg/private.svg"
import {PostFull, PostHistory, UnverifiedPost, Themes} from "../../types/Types"
import "./styles/titlebar.less"

interface Props {
    reset?: boolean
    goBack?: boolean
    post?: PostFull | PostHistory | UnverifiedPost | null
    historyID?: string | null
    noteID?: string | null
    unverified?: boolean
}

const TitleBar: React.FunctionComponent<Props> = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {mobile, relative, hideTitlebar, hideMobileNavbar} = useLayoutSelector()
    const {setHideMobileNavbar, setRelative, setHideTitlebar} = useLayoutActions()
    const {search, ratingType, autoSearch} = useSearchSelector()
    const {setSearch, setSearchFlag, setImageType, setRatingType, setStyleType, setSortType} = useSearchActions()
    const {page} = usePageSelector()
    const {scrollY, mobileScrolling} = useInteractionSelector()
    const {session, userImg} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag, setMobileScrolling} = useInteractionActions()
    const {headerFlag} = useFlagSelector()
    const {setHeaderFlag} = useFlagActions()
    const {posts} = useCacheSelector()
    const {activeGroup, activeFavgroup, headerText} = useActiveSelector()
    const {setHeaderText} = useActiveActions()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        if (headerFlag) {
            setHeaderFlag(false)
            const text = functions.util.toProperCase(search.trim().split(/ +/g).map((t: string) => {
                if (t.startsWith("+-")) return `+-${t.replaceAll("+-", " ").trim()}`
                if (t.startsWith("-")) return `-${t.replaceAll("-", " ").trim()}`
                return t.replaceAll("-", " ")
            }).join(", "))
            functions.dom.changeTitle(text.trim(), i18n)
            setHeaderText(text)
        }
    }, [headerFlag])

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const toggleMobileNavbar = () => {
        setHideMobileNavbar(!hideMobileNavbar)
    }

    const titleClick = async (event: React.MouseEvent) => {
        if (mobile && (location.pathname === "/" || location.pathname === "/posts")) if (event.clientY < 180) return
        if (props.reset) {
            setSearch("")
            setImageType("all")
            setRatingType("all")
            setStyleType("all")
            setSortType("date")
            setSearchFlag(true)
            navigate("/posts")
            window.scrollTo(0, 0)
        } else {
            let pageText = page > 1 ? `?page=${page}` : ""
            navigate(`/posts${pageText}`, {
                state: {restorePosts: posts, restoreScrollY: scrollY, restorePage: page}
            })
        }
    }

    useEffect(() => {
        if (mobile) {
            setHideTitlebar(false)
            setHideMobileNavbar(true)
            setRelative(false)
        } else {
            setMobileScrolling(false)
        }
    }, [mobile])

    const logout = async () => {
        await functions.http.post("/api/user/logout", null, session, setSessionFlag)
        setSessionFlag(true)
        navigate(0)
    }

    const generateUsernameJSX = () => {
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
            <span className={`titlebar-user-text ${colorClass}`} 
                onClick={() => navigate("/profile")}>
                {functions.util.toProperCase(session.username)}
            </span>
            <LogoutIcon className="titlebar-logout-img" style={{color: `var(${svgColor})`}} onClick={logout}/>
            </>
        )
    }

    return (
        <div className={`titlebar ${hideTitlebar ? "hide-titlebar" : ""} ${relative ? "titlebar-relative" : ""} ${mobileScrolling ? "hide-mobile-titlebar" : ""}`} onMouseEnter={() => setEnableDrag(false)}>
            {mobile ?
            <div className="titlebar-hamburger-container">
                <HamburgerIcon className="titlebar-hamburger" onClick={toggleMobileNavbar}/>
            </div>
            : null}
            <div onClick={titleClick} className="titlebar-logo-container">
                <span className="titlebar-hover">
                    <div className="titlebar-text-container">
                            <span className="titlebar-text-a">M</span>
                            <span className="titlebar-text-b">o</span>
                            <span className="titlebar-text-a">e</span>
                            <span className="titlebar-text-b">p</span>
                            <span className="titlebar-text-a">i</span>
                            <span className="titlebar-text-b">c</span>
                            <span className="titlebar-text-a">t</span>
                            <span className="titlebar-text-b">u</span>
                            <span className="titlebar-text-a">r</span>
                            <span className="titlebar-text-b">e</span>
                            <span className="titlebar-text-a">s</span>
                    </div>
                    <div className="titlebar-image-container">
                        <img className="titlebar-img" src={favicon}/>
                    </div>
                </span>
            </div>
            {!mobile ? 
            <div className="titlebar-search-text-container">
                
                {props.post?.private ? <PrivateIcon className="titlebar-search-icon"/> : null}
                {props.post?.locked ? <LockIcon className="titlebar-search-icon-red"/> : null}
                <span className={`titlebar-search-text ${props.post?.hidden ? "strikethrough" : ""}`}>
                    {props.unverified && !props.post?.deleted ? <span style={{color: "var(--pendingColor)", marginRight: "10px"}}>[{i18n.labels.pending}]</span> : null}
                    {props.post?.deleted ? <span style={{color: "var(--deletedColor)", marginRight: "10px"}}>[{i18n.time.deleted} {functions.date.timeUntil(props.post.deletionDate, i18n)}]</span> : null}
                    {props.historyID ? <span style={{color: "var(--historyColor)", marginRight: "10px"}}>{`[${i18n.sidebar.history}: ${props.historyID}]`}</span> : null}
                    {props.noteID ? <span style={{color: "var(--noteColor)", marginRight: "10px"}}>{`[${i18n.labels.note}: ${props.noteID}]`}</span> : null}
                    {functions.post.isR18(ratingType) ? <span style={{color: "var(--r18Color)", marginRight: "10px"}}>[R18]</span> : null}
                    {activeGroup ? <span style={{color: "var(--text-strong)", marginRight: "10px"}}>[{activeGroup.name}]</span> : null}
                    {activeFavgroup ? <span style={{color: "var(--text-strong)", marginRight: "10px"}}>[{activeFavgroup.name}]</span> : null}
                    {autoSearch ? <span style={{color: "var(--premiumColor)", marginRight: "10px"}}>[{i18n.labels.autoSearch}]</span> : null}
                    {headerText}
                </span>
            </div> : null}
            {!mobile ? 
            <div className="titlebar-login-container">
                {session.username ? <>
                <img className="titlebar-user-img" src={userImg} style={{filter: session.image ? "" : filter}}/>
                {generateUsernameJSX()}
                </> : <>
                <KeyIcon className="titlebar-login-icon"/>
                <span className="titlebar-login-text" onClick={() => navigate("/login")}>{i18n.navbar.login}</span>
                </>}
            </div> : null}
        </div>
    )
}

export default TitleBar