import React, {useEffect, useState, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import PostHistoryRow from "../../components/history/PostHistoryRow"
import TagHistoryRow from "../../components/history/TagHistoryRow"
import NoteHistoryRow from "../../components/history/NoteHistoryRow"
import GroupHistoryRow from "../../components/history/GroupHistoryRow"
import SearchHistoryRow from "../../components/history/SearchHistoryRow"
import AliasHistoryRow from "../../components/history/AliasHistoryRow"
import DeletedPostRow from "../../components/history/DeletedPostRow"
import scrollIcon from "../../assets/icons/scroll.png"
import search from "../../assets/icons/search.png"
import pageIcon from "../../assets/icons/page.png"
import searchHistoryDelete from "../../assets/icons/delete.png"
import permissions from "../../structures/Permissions"
import historyPost from "../../assets/icons/history-post.png"
import historyPostActive from "../../assets/icons/history-post-active.png"
import historySearch from "../../assets/icons/history-search.png"
import historySearchActive from "../../assets/icons/history-search-active.png"
import historyTag from "../../assets/icons/history-tag.png"
import historyTagActive from "../../assets/icons/history-tag-active.png"
import historyNote from "../../assets/icons/history-note.png"
import historyNoteActive from "../../assets/icons/history-note-active.png"
import historyGroup from "../../assets/icons/history-group.png"
import historyGroupActive from "../../assets/icons/history-group-active.png"
import historyAlias from "../../assets/icons/history-alias.png"
import historyAliasActive from "../../assets/icons/history-alias-active.png"
import historyDelete from "../../assets/icons/tag-delete.png"
import historyDeleteActive from "../../assets/icons/tag-delete-active.png"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions, useSearchDialogActions, useSearchDialogSelector, usePostDialogActions,
usePostDialogSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {History, PostHistory, TagHistory, NoteHistory, GroupHistory, SearchHistory, AliasHistorySearch, DeletedPost} from "../../types/Types"
import "./styles/historypage.less"

let pageAmount = 15

const HistoryPage: React.FunctionComponent = () => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {historyPage} = usePageSelector()
    const {setHistoryPage} = usePageActions()
    const {historyFlag} = useFlagSelector()
    const {setHistoryFlag} = useFlagActions()
    const {showDeleteAllHistoryDialog} = useSearchDialogSelector()
    const {setShowDeleteAllHistoryDialog} = useSearchDialogActions()
    const {permaDeleteAllDialog} = usePostDialogSelector()
    const {setPermaDeleteAllDialog} = usePostDialogActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const [historyTab, setHistoryTab] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [commitSearch, setCommitSearch] = useState("")
    const navigate = useNavigate()

    useEffect(() => {
        const typeParam = new URLSearchParams(window.location.search).get("type")
        if (typeParam) setHistoryTab(typeParam)
        const onDOMLoaded = () => {
            const savedTab = localStorage.getItem("historyTab")
            if (savedTab) setHistoryTab(savedTab)
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/history")
            navigate("/login")
            setSidebarText("Login required.")
        }
        const typeParam = new URLSearchParams(window.location.search).get("type")
        if (!typeParam) setHistoryTab(permissions.isPremium(session) ? "search" : "post")
    }, [session])


    useEffect(() => {
        document.title = i18n.history[historyTab]
    }, [historyTab, i18n])

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
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async () => {
        let result = [] as History[]
        if (historyTab === "post") {
            result = await functions.http.get("/api/post/history", {query: searchQuery}, session, setSessionFlag)
        }
        if (historyTab === "tag") {
            result = await functions.http.get("/api/tag/history", {query: searchQuery}, session, setSessionFlag)
        }
        if (historyTab === "note") {
            result = await functions.http.get("/api/note/history", {query: searchQuery}, session, setSessionFlag)
        }
        if (historyTab === "group") {
            result = await functions.http.get("/api/group/history", {query: searchQuery}, session, setSessionFlag)
        }
        if (historyTab === "alias") {
            result = await functions.http.get("/api/alias/history", {query: searchQuery}, session, setSessionFlag)
        }
        if (historyTab === "search") {
            result = await functions.http.get("/api/user/history", {query: searchQuery}, session, setSessionFlag).catch(() => [])
        }
        if (historyTab === "delete") {
            result = await functions.http.get("/api/post/deleted", {query: searchQuery}, session, setSessionFlag).catch(() => [])
        }
        result = result.map((r) => ({itemType: historyTab, ...r}))
        setCommitSearch(searchQuery)
        return result
    }

    const updateOffset = async (newOffset: number) => {
        let result = [] as History[]
        if (historyTab === "post") {
            result = await functions.http.get("/api/post/history", {query: searchQuery, offset: newOffset}, session, setSessionFlag).catch(() => [])
        }
        if (historyTab === "tag") {
            result = await functions.http.get("/api/tag/history", {query: searchQuery, offset: newOffset}, session, setSessionFlag).catch(() => [])
        }
        if (historyTab === "note") {
            result = await functions.http.get("/api/note/history", {query: searchQuery, offset: newOffset}, session, setSessionFlag).catch(() => [])
        }
        if (historyTab === "group") {
            result = await functions.http.get("/api/group/history", {query: searchQuery, offset: newOffset}, session, setSessionFlag).catch(() => [])
        }
        if (historyTab === "alias") {
            result = await functions.http.get("/api/alias/history", {query: searchQuery, offset: newOffset}, session, setSessionFlag).catch(() => [])
        }
        if (historyTab === "search") {
            result = await functions.http.get("/api/user/history", {query: searchQuery, offset: newOffset}, session, setSessionFlag).catch(() => [])
        }
        if (historyTab === "delete") {
            result = await functions.http.get("/api/post/deleted", {query: searchQuery, offset: newOffset}, session, setSessionFlag).catch(() => [])
        }
        result = result.map((r) => ({itemType: historyTab, ...r}))
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItemLoader, setManagedPage, toggleScroll} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, countKey: "historyCount"})

    const resetState = () => {
        setPage(1)
    }

    useEffect(() => {
        resetState()
        initItemLoader()
    }, [session, historyTab])

    useEffect(() => {
        if (historyPage) setManagedPage(historyPage)
    }, [])

    useEffect(() => {
        setHistoryPage(page)
    }, [page])

    useEffect(() => {
        if (historyFlag) {
            initItemLoader()
            setHistoryFlag(false)
        }
    }, [historyFlag, session])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (historyTab) searchParams.set("type", historyTab)
    }, [scroll, historyTab])

    useEffect(() => {
        localStorage.setItem("historyTab", String(historyTab))
    }, [historyTab])

    const generateHistoryJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as History[]
        visible = visible.filter((i: any) => i.itemType === historyTab)
        if (!session.showR18) {
            visible = visible.filter((item) => historyTab === "tag" ||  historyTab === "alias" ? 
            !(item as TagHistory).r18 : !functions.post.isR18((item as PostHistory).rating))
        }
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (historyTab === "post") {
                let current = visible[0] as PostHistory
                let item = visible[i] as PostHistory
                let previous = visible[i + 1] as PostHistory | null
                if (current.postID !== item.postID) {
                    current = item
                    currentIndex = i
                }
                if (previous?.postID !== current.postID) previous = null
                jsx.push(<PostHistoryRow key={i} historyIndex={i+1} postHistory={item} 
                    previousHistory={previous} currentHistory={current} current={i === currentIndex}
                    onDelete={initItemLoader} onEdit={initItemLoader} exact={commitSearch ? true : false}/>)
            }

            if (historyTab === "tag") {
                let current = visible[0] as TagHistory
                let item = visible[i] as TagHistory
                let previous = visible[i + 1] as TagHistory | null
                if (current.tag !== item.tag) {
                    current = item
                    currentIndex = i
                }
                if (previous?.tag !== current.tag) previous = null
                jsx.push(<TagHistoryRow key={i} historyIndex={i+1} tagHistory={item} 
                    previousHistory={previous} currentHistory={current} current={i === currentIndex}
                    onDelete={initItemLoader} onEdit={initItemLoader}/>)
            }

            if (historyTab === "group") {
                let current = visible[0] as GroupHistory
                let item = visible[i] as GroupHistory
                let previous = visible[i + 1] as GroupHistory | null
                if (current.groupID !== item.groupID) {
                    current = item
                    currentIndex = i
                }
                if (previous?.groupID !== current.groupID) previous = null
                jsx.push(<GroupHistoryRow key={i} historyIndex={i+1} groupHistory={item} 
                    previousHistory={previous} currentHistory={current} current={i === currentIndex}
                    onDelete={initItemLoader} onEdit={initItemLoader}/>)
            }

            if (historyTab === "note") {
                let current = visible[0] as NoteHistory
                let item = visible[i] as NoteHistory
                let previous = visible[i + 1] as NoteHistory | null
                if (current.postID !== item.postID &&
                    current.order !== item.order) {
                    current = item
                    currentIndex = i
                }
                if (previous?.postID !== current.postID &&
                    previous?.order !== current.order) previous = null
                jsx.push(<NoteHistoryRow key={i} previousHistory={previous} noteHistory={item} 
                    onDelete={initItemLoader} onEdit={initItemLoader} current={i === currentIndex}/>)
            }

            if (historyTab === "alias") {
                jsx.push(<AliasHistoryRow key={i} history={visible[i] as AliasHistorySearch} onDelete={initItemLoader} onEdit={initItemLoader}/>)
            }

            if (historyTab === "search") {
                jsx.push(<SearchHistoryRow key={i} history={visible[i] as SearchHistory} onDelete={initItemLoader}/>)
            }

            if (historyTab === "delete") {
                jsx.push(<DeletedPostRow key={i} post={visible[i] as DeletedPost} onDelete={initItemLoader}/>)
            }
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/>)
        }
        return jsx
    }

    const generateHeaderJSX = () => {
        if (historyTab === "post") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.post}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItemLoader() : null}/>
                        <button className="history-search-button" style={{filter: getFilterSearch()}} onClick={() => initItemLoader()}>
                            <img src={search}/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "tag") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.tag}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItemLoader() : null}/>
                        <button className="history-search-button" style={{filter: getFilterSearch()}} onClick={() => initItemLoader()}>
                            <img src={search}/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "group") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.group}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItemLoader() : null}/>
                        <button className="history-search-button" style={{filter: getFilterSearch()}} onClick={() => initItemLoader()}>
                            <img src={search}/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "note") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.note}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItemLoader() : null}/>
                        <button className="history-search-button" style={{filter: getFilterSearch()}} onClick={() => initItemLoader()}>
                            <img src={search}/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "alias") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.alias}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItemLoader() : null}/>
                        <button className="history-search-button" style={{filter: getFilterSearch()}} onClick={() => initItemLoader()}>
                            <img src={search}/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                </div></>
            )
        }
        if (historyTab === "search") {
            return (
                <><div className="history-row">
                    <span className="history-heading" style={{cursor: "pointer"}} onClick={searchHistoryHeaderClick}>{i18n.history.search}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItemLoader() : null}/>
                        <button className="history-search-button" style={{filter: getFilterSearch()}} onClick={() => initItemLoader()}>
                            <img src={search}/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                    <div className="history-item" onClick={() => setShowDeleteAllHistoryDialog(!showDeleteAllHistoryDialog)}>
                        <img className="history-img" src={searchHistoryDelete}/>
                        {!mobile ? <span className="history-opt-text">{i18n.buttons.deleteAll}</span> : null}
                    </div>
                </div></>
            )
        }
        if (historyTab === "delete") {
            return (
                <><div className="history-row">
                    <span className="history-heading">{i18n.history.delete}</span>
                </div>
                <div className="history-row">
                    <div className="history-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <input className="history-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItemLoader() : null}/>
                        <button className="history-search-button" style={{filter: getFilterSearch()}} onClick={() => initItemLoader()}>
                            <img src={search}/>
                        </button>
                    </div>
                    <div className="history-item" onClick={() => toggleScroll()}>
                        <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="history-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                    </div>
                    <div className="history-item" onClick={() => setPermaDeleteAllDialog(!permaDeleteAllDialog)}>
                        <img className="history-img" src={searchHistoryDelete}/>
                        {!mobile ? <span className="history-opt-text">{i18n.buttons.deleteAll}</span> : null}
                    </div>
                </div></>
            )
        }
    }

    const searchHistoryClick = () => {
        if (permissions.isPremium(session)) {
            setHistoryTab("search")
        } else {
            setPremiumRequired(true)
        }
    }

    const searchHistoryHeaderClick = () => {
        navigate("/posts")
        setSearch(`history:${session.username}`)
        setSearchFlag(true)
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <div className="history-icons">
                        <img className="history-icon" onClick={searchHistoryClick} src={historyTab === "search" ? historySearchActive : historySearch} style={{filter: historyTab === "search" ? "" : getFilter()}}/>
                        <img className="history-icon" onClick={() => setHistoryTab("post")} src={historyTab === "post" ? historyPostActive : historyPost} style={{filter: historyTab === "post" ? "" : getFilter()}}/>
                        <img className="history-icon" onClick={() => setHistoryTab("tag")} src={historyTab === "tag" ? historyTagActive : historyTag} style={{filter: historyTab === "tag" ? "" : getFilter()}}/>
                        <img className="history-icon" onClick={() => setHistoryTab("group")} src={historyTab === "group" ? historyGroupActive : historyGroup} style={{filter: historyTab === "group" ? "" : getFilter()}}/>
                        <img className="history-icon" onClick={() => setHistoryTab("note")} src={historyTab === "note" ? historyNoteActive : historyNote} style={{filter: historyTab === "note" ? "" : getFilter()}}/>
                        <img className="history-icon" onClick={() => setHistoryTab("alias")} src={historyTab === "alias" ? historyAliasActive : historyAlias} style={{filter: historyTab === "alias" ? "" : getFilter()}}/>
                        {permissions.isAdmin(session) ? <img className="history-icon" onClick={() => setHistoryTab("delete")} src={historyTab === "delete" ? historyDeleteActive : historyDelete} style={{filter: historyTab === "delete" ? "" : getFilter()}}/> : null}
                    </div>
                    {generateHeaderJSX()}
                    <div className="history-container">
                        {generateHistoryJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default HistoryPage