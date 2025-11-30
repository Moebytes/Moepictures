import React, {useEffect, useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import TagHistoryRow from "../../components/history/TagHistoryRow"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useSearchSelector, useActiveActions, useFlagActions, useLayoutSelector, useThemeSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {TagHistory} from "../../types/Types"
import "./styles/historypage.less"

let limit = 100
let pageAmount = 15

interface Props {
    all?: boolean
}

const TagHistoryPage: React.FunctionComponent<Props> = (props) => {
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
    const {tag, username} = useParams() as {tag: string, username?: string}

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(tag ? `/tag/history/${tag}` : "/tag/history")
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
        document.title = i18n.history.tag
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async () => {
        let result = [] as TagHistory[]
        if (props.all) {
            result = await functions.http.get("/api/tag/history", null, session, setSessionFlag)
        } else {
            result = await functions.http.get("/api/tag/history", {tag, username}, session, setSessionFlag)
            if (!result.length) {
                const tagObject = await functions.http.get("/api/tag", {tag}, session, setSessionFlag)
                if (!tagObject) return []
                const historyObject = tagObject as unknown as TagHistory
                if (!tagObject.createDate && !tagObject.creator) {
                    const oldestPost = await functions.http.get("/api/search/posts", {query: tag, type: "all", rating: "all", style: "all", sort: "reverse date", limit: 1}, session, setSessionFlag)
                    tagObject.createDate = oldestPost[0].uploadDate
                    tagObject.creator = oldestPost[0].uploader
                }
                historyObject.date = tagObject.createDate 
                historyObject.user = tagObject.creator
                historyObject.key = tag
                historyObject.aliases = tagObject.aliases.map((alias) => alias?.alias || "")
                historyObject.implications = tagObject.implications.map((implication) => implication?.implication || "")
                result = [historyObject]
            }
        }
        return result
    }

    const updateOffset = async (newOffset: number) => {
        const result = await functions.http.get("/api/tag/history", {tag, username, offset: newOffset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItems} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "historyCount"})

    useEffect(() => {
        initItems()
    }, [tag, session])

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as TagHistory[]
        if (!session.showR18) {
            visible = visible.filter((item) => !item.r18)
        }
        let current = visible[0]
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            let previous = visible[i + 1] as TagHistory | null
            if (current.tag !== visible[i].tag) {
                current = visible[i]
                currentIndex = i
            }
            if (previous?.tag !== current.tag) previous = null
            if (username && !functions.compare.hasHistoryChanges(visible[i])) continue
            jsx.push(<TagHistoryRow key={i} historyIndex={i+1} tagHistory={visible[i]} 
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
                    <span className="history-heading">{username ? `${functions.util.toProperCase(username)}'s ${i18n.history.tag}` : i18n.history.tag}</span>
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

export default TagHistoryPage