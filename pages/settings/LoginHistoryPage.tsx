/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useRef, useState, useMemo} from "react"
import {usePageURL, getPageNumber} from "../../components/site/usePageURL"
import {useSearchActions, useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useSearchSelector, useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector} from "../../store"
import {useGetLoginHistoryPageQuery, useInvalidateSession} from "../../api"
import {useNavigate, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import Footer from "../../components/site/Footer"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import functions from "../../functions/Functions"
import PageControls from "../../components/site/PageControls"
import {LoginHistory} from "../../types/Types"
import "./styles/sitepage.less"

let pageAmount = 50

const LoginHistoryPage: React.FunctionComponent = () => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {scroll} = useSearchSelector()
    const {mobile, tablet} = useLayoutSelector()
    const {setActionBanner} = useActiveActions()
    const location = useLocation()
    const [page, setPage] = useState(getPageNumber(location.search))
    const [query, setQuery] = useState(new URLSearchParams(location.search).get("query") ?? "")
    const [searchQuery, setSearchQuery] = useState(query)
    const [refreshKey, setRefreshKey] = useState(0)
    const refreshRef = useRef(false)
    const navigate = useNavigate()
    const invalidateSession = useInvalidateSession()

    usePageURL(page, setPage, query, setQuery)

    useEffect(() => {
        setHideNavbar(false)
        setHideTitlebar(false)
        setHideSidebar(false)
        setRelative(true)
        setHeaderText("")
        setSidebarText("")
        setEnableDrag(false)
    }, [])

    useEffect(() => {
        functions.dom.changeTitle(i18n.user.loginHistory, i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        setSearchQuery(query)
    }, [query])

    const pageQuery = useGetLoginHistoryPageQuery(
        null, {skip: false}
    )

    const items = useMemo(() => {
        let result = pageQuery.currentData ?? []
        return result
    }, [pageQuery.currentData])

    const visibleItems = useMemo(() => {
        return scroll ? items : items.slice((page - 1) * pageAmount, page * pageAmount)
    }, [items, page, scroll])
    
    const totalCount = items.length
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    const refreshItems = async (value?: string, reset?: boolean) => {
        const nextQuery = typeof value === "string" ? value : searchQuery
        if (reset || nextQuery !== query) setPage(1)
        setQuery(nextQuery)

        if (refreshRef.current) setRefreshKey((prev) => prev + 1)
        refreshRef.current = true
    }

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/login-history")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
        refreshItems()
    }, [session])

    const logoutOtherSessions = async () => {
        await functions.http.post("/api/user/logout-sessions", null, session, setSessionFlag)
        invalidateSession()
        setActionBanner("logout-sessions")
    }

    const failedLogin = (log: LoginHistory) => {
        if (log.type === "login failed") return true
        if (log.type === "login 2fa failed") return true
        if (log.type === "2fa disabled") return true
        if (log.type === "password reset") return true
        if (log.type === "password changed") return true
        if (log.type === "email changed") return true
        if (log.type === "username changed") return true
        return false
    }

    const loginHistoryJSX = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < visibleItems.length; i++) {
            const log = visibleItems[i]
            jsx.push(
                <div className="sitepage-table-row">
                    <div className="sitepage-table-column" style={{width: "130px"}}>
                        <span className={`sitepage-table-name ${failedLogin(log) ? "artist-tag-color" : ""}`}>{log.type}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name-strong">{log.ip}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name">{log.device}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name">{log.region}</span>
                    </div>
                    <div className="sitepage-table-column">
                        <span className="sitepage-table-name-strong">{functions.date.prettyDate(log.timestamp, i18n)}</span>
                    </div>
                </div>
            )
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return (
            <div className="sitepage-table">
                {jsx}
            </div>
        )
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                {session.username ?
                <div className="sitepage" style={{width: mobile || tablet ? "100%" : "70%", height: "max-content"}}>
                    <div className="sitepage-title-container">
                        <span className="sitepage-title">{i18n.user.loginHistory}</span>
                    </div>
                    <span className="sitepage-link">{i18n.pages.loginHistory.heading}</span>
                    <div className="sitepage-button-container" style={{justifyContent: "flex-start"}}>
                        <button style={{marginRight: "20px"}} className="sitepage-button" onClick={() => navigate("/profile")}>←{i18n.buttons.back}</button>
                        <button className="sitepage-button" onClick={logoutOtherSessions}>{i18n.pages.loginHistory.logoutSessions}</button>
                    </div>
                    {loginHistoryJSX()}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default LoginHistoryPage