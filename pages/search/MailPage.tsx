/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
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
import RadioButtonIcon from "../../assets/svg/radiobutton.svg"
import RadioButtonCheckedIcon from "../../assets/svg/radiobutton-checked.svg"
import MessageRow from "../../components/search/MessageRow"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchSelector, usePageSelector, useFlagSelector,
useMessageDialogSelector, useMessageDialogActions} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {MessageSearch, CommentSort} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 100
let pageAmount = 50

const MailPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session, hasNotification} = useSessionSelector()
    const {setSessionFlag, setHasNotification} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {activeDropdown} = useActiveSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {mailPage} = usePageSelector()
    const {setMailPage} = usePageActions()
    const {messageSearchFlag} = useFlagSelector()
    const {setMessageSearchFlag} = useFlagActions()
    const {softDeleteMessageID, softDeleteMessageFlag} = useMessageDialogSelector()
    const {setSoftDeleteMessageID, setSoftDeleteMessageFlag, setDeleteUnreadDialog} = useMessageDialogActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [hideSystem, setHideSystem] = useState(false)
    const loadingRef = useRef(true)
    const sortRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const savedHideSystem = localStorage.getItem("hideSystem")
        if (savedHideSystem) setHideSystem(savedHideSystem === "true")
    }, [])

    useEffect(() => {
        localStorage.setItem("hideSystem", String(hideSystem))
    }, [hideSystem])

    useEffect(() => {
        if (hasNotification) initItems()
    }, [hasNotification])

    const softDeleteMessage = async () => {
        if (!softDeleteMessageID) return
        await functions.http.post("/api/message/softdelete", {messageID: softDeleteMessageID}, session, setSessionFlag)
        initItems()
    }

    useEffect(() => {
        if (softDeleteMessageFlag && softDeleteMessageID) {
            softDeleteMessage()
            setSoftDeleteMessageFlag(false)
            setSoftDeleteMessageID(null)
        }
    }, [softDeleteMessageFlag, softDeleteMessageID, session])

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
        functions.dom.changeTitle(i18n.navbar.mail, i18n)
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            functions.dom.replaceLocation("/401")
        }
    }, [session])

    const loadInitial = async (query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        const result = await functions.http.get("/api/search/messages", {sort, query, hideSystem}, session, setSessionFlag)
        return result
    }

    const updateOffset = async (offset: number, query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        let result = await functions.http.get("/api/search/messages", {sort, query, hideSystem, offset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, searchQuery, setSearchQuery, initItems, setManagedPage, toggleScroll} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "messageCount"})

    useEffect(() => {
        if (messageSearchFlag !== null) {
            setTimeout(() => {
                setSearchQuery(messageSearchFlag)
                initItems(messageSearchFlag)
                setMessageSearchFlag(null)
            }, 500)
        }
    }, [messageSearchFlag, hideSystem])

    useEffect(() => {
        initItems()
    }, [sortType, sortReverse, hideSystem])

    useEffect(() => {
        if (mailPage) setManagedPage(mailPage)
    }, [])

    useEffect(() => {
        setMailPage(page)
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

    const generateMessagesJSX = () => {
        const jsx = [] as React.ReactElement[]
        jsx.push(<MessageRow key={"0"} titlePage={true}/>)
        let visible = visibleItems as MessageSearch[]
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<MessageRow message={visible[i]} onDelete={initItems} onEdit={initItems}/>)
        }
        if (jsx.length) {
            loadingRef.current = false
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage}/>)
        }
        return jsx
    }

    const deleteUnread = async () => {
        setDeleteUnreadDialog(true)
    }

    const readAll = async () => {
        await functions.http.post("/api/message/bulkread", {readStatus: true}, session, setSessionFlag)
        initItems()
        setHasNotification(false)
    }

    const unreadAll = async () => {
        await functions.http.post("/api/message/bulkread", {readStatus: false}, session, setSessionFlag)
        initItems()
        setHasNotification(true)
    }

    const getReadButtons = () => {
        const style = {marginLeft: mobile ? "0px" : "15px", marginRight: mobile ? "15px" : "0px", marginTop: mobile ? "10px" : "0px"}
        return (
            <div className="item-button-container" style={{marginLeft: "0px", justifyContent: "flex-start"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <button className="item-button" style={style} onClick={() => deleteUnread()}>{i18n.buttons.deleteUnread}</button>
                <button className="item-button" style={style} onClick={() => readAll()}>{i18n.buttons.readAll}</button>
                <button className="item-button" style={style} onClick={() => unreadAll()}>{i18n.buttons.unreadAll}</button>
            </div> 
        )
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">{i18n.navbar.mail}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? initItems() : null}/>
                            <button className="item-search-button" onClick={() => initItems()}>
                                <SearchIcon className="item-search-button-icon"/>
                            </button>
                        </div>
                        {!mobile ? <>{getReadButtons()}</> : null}
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            {scroll ? 
                            <ScrollIcon className="itemsort-img"/> :
                            <PagesIcon className="itemsort-img"/>}
                            <span className="itemsort-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div> : null}
                        {!mobile ? <div className="itemsort-item" onClick={() => setHideSystem((prev: boolean) => !prev)}>
                            {hideSystem ?
                            <RadioButtonCheckedIcon className="itemsort-img"/> :
                            <RadioButtonIcon className="itemsort-img"/>}
                            <span className="itemsort-text">{i18n.buttons.hideSystem}</span>
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
                    {mobile ? <>{getReadButtons()}</> : null}
                    {mobile ? <div className="itemsort-item" onClick={() => setHideSystem((prev: boolean) => !prev)} 
                        style={{marginLeft: "0px", marginTop: "7px"}}>
                        {hideSystem ?
                        <RadioButtonCheckedIcon className="itemsort-img"/> :
                        <RadioButtonIcon className="itemsort-img"/>}
                        <span className="itemsort-text">{i18n.buttons.hideSystem}</span>
                    </div> : null}
                    {loadingRef.current && <LoadingSpinner/>}
                    <div className="items-container">
                        {generateMessagesJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default MailPage