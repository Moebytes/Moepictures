import React, {useEffect, useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import GroupHistoryRow from "../../components/history/GroupHistoryRow"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useSearchSelector, useActiveActions, useFlagActions, useLayoutSelector, useThemeSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {GroupHistory} from "../../types/Types"
import "./styles/historypage.less"

let limit = 100
let pageAmount = 15

interface Props {
    all?: boolean
}

const GroupHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {scroll} = useSearchSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const navigate = useNavigate()
    const {group: slug, username} = useParams() as {group: string, username?: string}

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(slug ? `/group/history/${slug}` : "/group/history")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
    }, [session])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
    }, [])

    useEffect(() => {
        document.title = i18n.history.group
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async () => {
        let result = [] as GroupHistory[]
        if (props.all) {
            result = await functions.http.get("/api/group/history", null, session, setSessionFlag)
        } else {
            result = await functions.http.get("/api/group/history", {slug, username}, session, setSessionFlag)
            if (!result.length) {
                const groupObject = await functions.http.get("/api/group", {name: slug}, session, setSessionFlag)
                if (!groupObject) return []
                const creator = await functions.http.get("/api/user", {username: groupObject.creator}, session, setSessionFlag)
                if (!creator) return []
                const historyObject = groupObject as unknown as GroupHistory
                historyObject.date = groupObject.createDate
                historyObject.user = {...creator}
                result = [historyObject]
            }
        }
        return result
    }

    const updateOffset = async (offset: number) => {
        const result = await functions.http.get("/api/group/history", {slug, username, offset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItems} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "historyCount"})

    useEffect(() => {
        initItems()
    }, [slug, session])

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as GroupHistory[]
        if (!session.showR18) {
            visible = visible.filter((item) => !functions.post.isR18(item.rating))
        }
        let current = visible[0]
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            let previous = visible[i + 1] as GroupHistory | null
            if (current.groupID !== visible[i].groupID) {
                current = visible[i]
                currentIndex = i
            }
            if (previous?.groupID !== current.groupID) previous = null
            if (username && !functions.compare.hasHistoryChanges(visible[i])) continue
            jsx.push(<GroupHistoryRow key={i} historyIndex={i+1} groupHistory={visible[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={initItems} onEdit={initItems}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/>)
        }
        return jsx
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <span className="history-heading">{username ? `${functions.util.toProperCase(username)}'s ${i18n.history.group}` : i18n.history.group}</span>
                    <div className="history-container">
                        {generateRevisionsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default GroupHistoryPage