/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import SearchIcon from "../../assets/svg/search.svg"
import SortIcon from "../../assets/svg/sort.svg"
import SortReverseIcon from "../../assets/svg/sort-reverse.svg"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import NoteRow from "../../components/search/NoteRow"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {NoteSearch, CommentSort} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 100
let pageAmount = 15

const NotesPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {activeDropdown} = useActiveSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {notesPage} = usePageSelector()
    const {setNotesPage} = usePageActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const {noteSearchFlag} = useFlagSelector()
    const {setNoteSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const sortRef = useRef<HTMLDivElement>(null)
    const loadingRef = useRef(true)
    const navigate = useNavigate()

    const getFilterSearch = functions.color.filter({theme, siteHue, siteSaturation, siteLightness})

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
        document.title = i18n.navbar.notes
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async (query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        const result = await functions.http.get("/api/search/notes", {sort, query}, session, setSessionFlag)
        return result
    }

    const updateOffset = async (offset: number, query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        let result = await functions.http.get("/api/search/notes", {sort, query, offset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, searchQuery, setSearchQuery, initItems, setManagedPage,
        toggleScroll} = usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "noteCount"})

    useEffect(() => {
        if (noteSearchFlag) {
            setTimeout(() => {
                setSearchQuery(noteSearchFlag)
                initItems(noteSearchFlag)
                setNoteSearchFlag(null)
            }, 200)
        }
    }, [noteSearchFlag])

    useEffect(() => {
        initItems()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (notesPage) setManagedPage(notesPage)
    }, [])

    useEffect(() => {
        setNotesPage(page)
    }, [page])

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -15
        if (sortType === "date") offset = -20
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="itemsort-item" ref={sortRef}>
                {sortReverse ?
                <SortReverseIcon className="itemsort-img" onClick={() => setSortReverse(!sortReverse)}/> :
                <SortIcon className="itemsort-img" onClick={() => setSortReverse(!sortReverse)}/>}
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{i18n.sort[sortType]}</span>
            </div>
        )
    }

    const generateNotesJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as NoteSearch[]
        for (let i = 0; i < visible.length; i++) {
            const noteGroup = visible[i]
            if (noteGroup.fake) continue
            if (!session.username) if (noteGroup.post.rating !== functions.r13()) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(noteGroup.post.rating)) continue
            jsx.push(<NoteRow note={noteGroup} onDelete={initItems} onEdit={initItems}/>)
        }
        if (jsx.length) {
            loadingRef.current = false
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    const searchUntranslated = () => {
        setSearch("+untranslated +partially-translated")
        setSearchFlag(true)
        navigate("/posts")
    }

    const getUntranslatedButton = () => {
        if (session.banned) return null
        const style = {marginLeft: mobile ? "0px" : "15px", marginTop: mobile ? "10px" : "0px", justifyContent: "flex-start"}
        if (session.username) {
            return (
                <div className="item-button-container" style={style} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <button className="item-button" onClick={() => searchUntranslated()}>{i18n.buttons.untranslated}</button>
                </div> 
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
                <div className="items">
                    <span className="items-heading">{i18n.navbar.notes}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItems() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch}} onClick={() => initItems()}>
                                <SearchIcon className="item-search-button-icon"/>
                            </button>
                        </div>
                        {!mobile ? getUntranslatedButton() : null}
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            {scroll ? 
                            <ScrollIcon className="itemsort-img"/> :
                            <PagesIcon className="itemsort-img"/>}
                            <span className="itemsort-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div> : null}
                        <div className={`item-dropdown ${activeDropdown === "sort" ? "" : "hide-item-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "220px" : "190px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="item-dropdown-row" onClick={() => setSortType("random")}>
                                <span className="item-dropdown-text">{i18n.sort.random}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("date")}>
                                <span className="item-dropdown-text">{i18n.sort.date}</span>
                            </div>
                        </div>
                    </div>
                    {loadingRef.current && <LoadingSpinner/>}
                    {mobile ? <div className="item-row">{getUntranslatedButton()}</div> : null}
                    <div className="items-container">
                        {generateNotesJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default NotesPage