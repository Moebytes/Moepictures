import React, {useEffect, useState, useRef} from "react"
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
import CommentRow from "../../components/search/CommentRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchSelector, usePageSelector, useFlagSelector} from "../../store"

import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {CommentSearch, CommentSort} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 100
let pageAmount = 15

const CommentsPage: React.FunctionComponent = (props) => {
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
    const {commentsPage} = usePageSelector()
    const {setCommentsPage} = usePageActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const {commentID, commentJumpFlag, commentSearchFlag} = useFlagSelector()
    const {setCommentID, setCommentJumpFlag, setCommentSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const sortRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (commentID && commentJumpFlag) {
            setTimeout(() => {
                onCommentJump(commentID)
                setCommentJumpFlag(false)
            }, 200)
        }
    }, [commentJumpFlag, commentID])
    
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
        document.title = i18n.navbar.comments
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async (query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        const result = await functions.http.get("/api/search/comments", {sort, query}, session, setSessionFlag)
        return result
    }

    const updateOffset = async (offset: number, query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        let result = await functions.http.get("/api/search/comments", {sort, query, offset}, session, setSessionFlag)
        return result
    }

    const {items, visibleItems, page, setPage, maxPage, searchQuery, setSearchQuery, initItems, setManagedPage,
        toggleScroll} = usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "commentCount"})

    useEffect(() => {
        if (commentSearchFlag) {
            setTimeout(() => {
                setSearchQuery(commentSearchFlag)
                initItems(commentSearchFlag)
                setCommentSearchFlag(null)
            }, 200)
        }
    }, [commentSearchFlag])
    
    useEffect(() => {
        initItems()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (commentsPage) setManagedPage(commentsPage)
    }, [])

    useEffect(() => {
        setCommentsPage(page)
    }, [page])

    const onCommentJump = async (commentID: number) => {
        let index = -1
        for (let i = 0; i < items.length; i++) {
            if (items[i].commentID === String(commentID)) {
                index = i
                break
            }
        }
        if (index > -1) {
            const pageNumber = Math.ceil(index / pageAmount)
            setPage(pageNumber)
            let element = document.querySelector(`[comment-id="${commentID}"]`)
            if (!element) {
                await functions.timeout(500)
                element = document.querySelector(`[comment-id="${commentID}"]`)
            }
            if (!element) return
            const position = element.getBoundingClientRect()
            const elementTop = position.top + window.scrollY
            window.scrollTo(0, elementTop - (window.innerHeight / 3))
            setCommentID(commentID)
        }
    }

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
                <img className="itemsort-img" src={sortReverse ? getIcon(sortRev) : getIcon(sort)} style={{filter}} onClick={() => setSortReverse(!sortReverse)}/>
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{i18n.sort[sortType]}</span>
            </div>
        )
    }

    const generateCommentsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as CommentSearch[]
        for (let i = 0; i < visible.length; i++) {
            const comment = visible[i]
            if (comment.fake) continue
            if (!session.username) if (comment.post.rating !== functions.r13()) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(comment.post.rating)) continue
            jsx.push(<CommentRow comment={comment} onDelete={initItems} onEdit={initItems} onCommentJump={onCommentJump}/>)
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
                    <span className="items-heading">{i18n.navbar.comments}</span>
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
                            <div className="item-dropdown-row" onClick={() => setSortType("date")}>
                                <span className="item-dropdown-text">{i18n.sort.date}</span>
                            </div>
                        </div>
                    </div>
                    <div className="items-container">
                        {generateCommentsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CommentsPage