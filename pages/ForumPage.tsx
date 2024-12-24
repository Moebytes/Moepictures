import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import search from "../assets/icons/search.png"
import sort from "../assets/icons/sort.png"
import sortRev from "../assets/icons/sort-reverse.png"
import ThreadRow from "../components/ThreadRow"
import NewThreadDialog from "../dialogs/NewThreadDialog"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions, useThreadDialogActions, useThreadDialogSelector} from "../store"
import permissions from "../structures/Permissions"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import "./styles/itemspage.less"
import {ThreadSearch, CommentSort} from "../types/Types"

let replace = false

const ForumPage: React.FunctionComponent = (props) => {
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
    const {setScroll} = useSearchActions()
    const {forumPage} = usePageSelector()
    const {setForumPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag, threadSearchFlag} = useFlagSelector()
    const {setPageFlag, setThreadSearchFlag} = useFlagActions()
    const {showNewThreadDialog} = useThreadDialogSelector()
    const {setShowNewThreadDialog} = useThreadDialogActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [threads, setThreads] = useState([] as ThreadSearch[])
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleThreads, setVisibleThreads] = useState([] as ThreadSearch[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("forumPage")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (savedPage) setForumPage(Number(savedPage))
            if (queryParam) updateThreads(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setForumPage(Number(pageParam))
            }
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setForumPage(Number(pageParam))
        }
        window.addEventListener("load", onDOMLoaded)
        window.addEventListener("popstate", updateStateChange)
        window.addEventListener("pushstate", updateStateChange)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
            window.removeEventListener("popstate", updateStateChange)
            window.removeEventListener("pushstate", updateStateChange)
        }
    }, [])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateThreads = async (query?: string) => {
        const result = await functions.get("/api/search/threads", {sort: functions.parseSort(sortType, sortReverse), query: query ? query : searchQuery}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleThreads([])
        setThreads(result)
    }

    useEffect(() => {
        if (threadSearchFlag) {
            setTimeout(() => {
                setSearchQuery(threadSearchFlag)
                updateThreads(threadSearchFlag)
                setThreadSearchFlag(null)
            }, 500)
        }
    }, [threadSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        updateThreads()
    }, [])

    useEffect(() => {
        document.title = i18n.navbar.forum
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateThreads()
    }, [sortType, sortReverse, session])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateThreads = () => {
            let currentIndex = index
            const newVisibleThreads = visibleThreads as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!threads[currentIndex]) break
                newVisibleThreads.push(threads[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleThreads(functions.removeDuplicates(newVisibleThreads))
        }
        if (scroll) updateThreads()
    }, [scroll, threads])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (forumPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (threads[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.get("/api/search/threads", {sort: functions.parseSort(sortType, sortReverse), query: searchQuery, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanThreads = threads.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanThreads.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, threadCount: cleanThreads[0]?.threadCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setThreads(result)
            } else {
                setThreads((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setThreads(result)
                } else {
                    setThreads((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!threads[currentIndex]) return updateOffset()
                const newVisibleThreads = visibleThreads as any
                for (let i = 0; i < 15; i++) {
                    if (!threads[currentIndex]) return updateOffset()
                    newVisibleThreads.push(threads[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleThreads(functions.removeDuplicates(newVisibleThreads))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleThreads, index, session, sortType, sortReverse])

    useEffect(() => {
        //window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleThreads([])
            setForumPage(1)
            updateThreads()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (forumPage - 1) * getPageAmount()
            if (threads[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(threads[0]?.threadCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = threads[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, threads, forumPage, ended, session, sortType, sortReverse])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
        if (!scroll) searchParams.set("page", String(forumPage || ""))
        if (replace) {
            if (!scroll) history.replace(`${location.pathname}?${searchParams.toString()}`)
            replace = false
        } else {
            if (!scroll) history.push(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, searchQuery, forumPage])

    useEffect(() => {
        if (threads?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setForumPage(maxTagPage)
            }
        }
    }, [threads, forumPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("forumPage", String(forumPage || ""))
    }, [forumPage])

    const maxPage = () => {
        if (!threads?.length) return 1
        if (Number.isNaN(Number(threads[0]?.threadCount))) return 10000
        return Math.ceil(Number(threads[0]?.threadCount) / getPageAmount())
    }

    const firstPage = () => {
        setForumPage(1)
        //window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = forumPage - 1 
        if (newPage < 1) newPage = 1 
        setForumPage(newPage)
        //window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = forumPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setForumPage(newPage)
        //window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setForumPage(maxPage())
        //window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setForumPage(newPage)
        //window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (forumPage > maxPage() - 3) increment = -4
        if (forumPage > maxPage() - 2) increment = -5
        if (forumPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (forumPage > maxPage() - 2) increment = -3
            if (forumPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = forumPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const newThreadDialog = () => {
        setShowNewThreadDialog(!showNewThreadDialog)
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
                <img className="itemsort-img" src={sortReverse ? sortRev : sort} style={{filter: getFilter()}} onClick={() => setSortReverse(!sortReverse)}/>
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{i18n.sort[sortType]}</span>
            </div>
        )
    }

    const generateThreadsJSX = () => {
        const jsx = [] as any
        jsx.push(<ThreadRow key={"0"} titlePage={true}/>)
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleThreads) as any
        } else {
            const postOffset = (forumPage - 1) * getPageAmount()
            visible = threads?.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible?.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<ThreadRow key={visible[i].threadID} thread={visible[i]} onDelete={updateThreads} onEdit={updateThreads}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {forumPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {forumPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {forumPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {forumPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
        }
        return jsx
    }

    const toggleScroll = () => {
        const newValue = !scroll
        localStorage.setItem("scroll", `${newValue}`)
        setScroll(newValue)
    }

    const getNewThreadButton = () => {
        if (session.banned) return null
        const style = {marginLeft: mobile ? "0px" : "15px", marginTop: mobile ? "10px" : "0px"}
        if (session.username) {
            return (
                <div className="item-button-container" style={style} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <button className="item-button" onClick={() => newThreadDialog()}>{i18n.buttons.new}</button>
                </div> 
            )
        }
    }

    return (
        <>
        <CaptchaDialog/>
        <NewThreadDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">{i18n.navbar.forum}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateThreads() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateThreads()}>
                                <img src={search}/>
                            </button>
                        </div>
                        {!mobile ? getNewThreadButton() : null}
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            <img className="itemsort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="itemsort-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div> : null}
                        <div className={`item-dropdown ${activeDropdown === "sort" ? "" : "hide-item-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="item-dropdown-row" onClick={() => setSortType("random")}>
                                <span className="item-dropdown-text">{i18n.sort.random}</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("date")}>
                                <span className="item-dropdown-text">{i18n.sort.date}</span>
                            </div>
                        </div>
                    </div>
                    {mobile ? <div className="item-row">{getNewThreadButton()}</div> : null}
                    <table className="items-container">
                        {generateThreadsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ForumPage