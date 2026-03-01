/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect , useState, useRef} from "react"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import search from "../../assets/svg/search.svg"
import sort from "../../assets/svg/sort.svg"
import sortRev from "../../assets/svg/sort-reverse.svg"
import scrollIcon from "../../assets/svg/scroll.svg"
import pageIcon from "../../assets/svg/pages.svg"
import ArtistRow from "../../components/search/ArtistRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useLayoutSelector, usePageActions, useActiveSelector, 
useSearchSelector, usePageSelector, useCacheSelector, useCacheActions} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {TagCategorySearch, CategorySort} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 10
let pageAmount = 5

const ArtistsPage: React.FunctionComponent = (props) => {
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
    const {artistsPage} = usePageSelector()
    const {setArtistsPage} = usePageActions()
    const {artists} = useCacheSelector()
    const {setArtists} = useCacheActions()
    const [sortType, setSortType] = useState("posts" as CategorySort)
    const [sortReverse, setSortReverse] = useState(false)
    const sortRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})
    const getFilterSearch = functions.color.filter({theme, siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

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
        document.title = i18n.navbar.artists
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async (query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        const result = await functions.http.get("/api/search/artists", {sort, query, limit}, session, setSessionFlag)
        return result
    }

    const updateOffset = async (offset: number, query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        let result = await functions.http.get("/api/search/artists", {sort, query, limit, offset}, session, setSessionFlag)
        return result
    }

    const {items, visibleItems, page, setPage, maxPage, searchQuery, setSearchQuery, initItems, setManagedPage, setManagedItems,
        toggleScroll} = usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "tagCount"})

    useEffect(() => {
        initItems()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (artistsPage) setManagedPage(artistsPage)
        if (artists.length) setManagedItems(artists)
    }, [])

    useEffect(() => {
        setArtists(items)
        setArtistsPage(page)
    }, [items, page])

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -25
        if (sortType === "cuteness") offset = -25
        if (sortType === "posts") offset = -30
        if (sortType === "alphabetic") offset = -10
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="itemsort-item" ref={sortRef}>
                <img className="itemsort-img" src={sortReverse ? getIcon(sortRev) : getIcon(sort)} style={{filter}} onClick={() => setSortReverse(!sortReverse)}/>
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{i18n.sort[sortType]}</span>
            </div>
        )
    }

    const generateArtistsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as TagCategorySearch[]
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (visible[i].tag === "unknown-artist") continue
            jsx.push(<ArtistRow artist={visible[i]}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
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
                <div className="items">
                    <span className="items-heading">{i18n.navbar.artists}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItems() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch}} onClick={() => initItems()}>
                                <img src={search}/>
                            </button>
                        </div>
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            <img className="itemsort-img" src={scroll ? getIcon(scrollIcon) : getIcon(pageIcon)} style={{filter}}/>
                            <span className="itemsort-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div> : null}
                        <div className={`item-dropdown ${activeDropdown === "sort" ? "" : "hide-item-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "220px" : "190px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="item-dropdown-row" onClick={() => setSortType("random")}>
                                <span className="item-dropdown-text">{i18n.sort.random}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="item-dropdown-text">{i18n.sort.alphabetic}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="item-dropdown-text">{i18n.sort.posts}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="item-dropdown-text">{i18n.sort.cuteness}</span>
                            </div>
                        </div>
                    </div>
                    <div className="items-container">
                        {generateArtistsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ArtistsPage