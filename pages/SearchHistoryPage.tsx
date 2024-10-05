import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import SearchHistoryRow from "../components/SearchHistoryRow"
import DeleteSearchHistoryDialog from "../dialogs/DeleteSearchHistoryDialog"
import DeleteAllSearchHistoryDialog from "../dialogs/DeleteAllSearchHistoryDialog"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import searchHistoryDelete from "../assets/icons/delete.png"
import permissions from "../structures/Permissions"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext, ScrollContext, ShowPageDialogContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SessionFlagContext, HistoryPageContext, PageFlagContext,
SiteHueContext, SiteSaturationContext, SiteLightnessContext, ShowDeleteAllHistoryDialogContext, RedirectContext} from "../Context"
import "./styles/historypage.less"

const SearchHistoryPage: React.FunctionComponent = () => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {historyPage, setHistoryPage} = useContext(HistoryPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {redirect, setRedirect} = useContext(RedirectContext)
    const {showDeleteAllHistoryDialog, setShowDeleteAllHistoryDialog} = useContext(ShowDeleteAllHistoryDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const [history, setHistory] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleHistory, setVisibleHistory] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const historyState = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("historyPage")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (savedPage) setHistoryPage(Number(savedPage))
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setHistoryPage(Number(pageParam))
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect("/history")
            history.push("/login")
            setSidebarText("Login required.")
        }
        if (!permissions.isPremium(session)) {
            historyState.push("/401")
        }
    }, [session])

    const updateHistory = async () => {
        let result = await functions.get("/api/user/history", null, session, setSessionFlag).catch(() => [])
        setEnded(false)
        setIndex(0)
        setVisibleHistory([])
        if (result?.length) setHistory(result)
    }

    const deleteDuplicateHistory = async () => {
        await functions.delete("/api/user/history/delete", {duplicates: true}, session, setSessionFlag)
    }

    useEffect(() => {
        deleteDuplicateHistory().then(() => {
            updateHistory()
        })
    }, [session])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Search History"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateHistory = () => {
            let currentIndex = index
            const newVisibleHistory = [] as any
            for (let i = 0; i < 10; i++) {
                if (!history[currentIndex]) break
                newVisibleHistory.push(history[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleHistory(functions.removeDuplicates(newVisibleHistory))
        }
        if (scroll) updateHistory()
    }, [history, scroll, session])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (historyPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (history[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.get("/api/user/history", {offset: newOffset}, session, setSessionFlag).catch(() => [])
        let hasMore = result?.length >= 100
        const cleanHistory = history.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanHistory.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, historyCount: cleanHistory[0]?.historyCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setHistory(result)
            } else {
                setHistory((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setHistory(result)
                } else {
                    setHistory((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!history[currentIndex]) return updateOffset()
                const newHistory = visibleHistory as any
                for (let i = 0; i < 15; i++) {
                    if (!history[currentIndex]) return updateOffset()
                    newHistory.push(history[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleHistory(functions.removeDuplicates(newHistory))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleHistory, index])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleHistory([])
            setHistoryPage(1)
            updateHistory()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const historyOffset = (historyPage - 1) * getPageAmount()
            if (history[historyOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const historyAmount = Number(history[0]?.historyCount)
            let maximum = historyOffset + getPageAmount()
            if (maximum > historyAmount) maximum = historyAmount
            const maxTag = history[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, history, historyPage, ended])

    useEffect(() => {
        if (!scroll) historyState.replace(`${location.pathname}?page=${historyPage}`)
    }, [scroll, historyPage])

    useEffect(() => {
        if (history?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setHistoryPage(maxTagPage)
            }
        }
    }, [history, historyPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("historyPage", String(historyPage))
    }, [historyPage])

    const maxPage = () => {
        if (!history?.length) return 1
        if (Number.isNaN(Number(history[0]?.historyCount))) return 10000
        return Math.ceil(Number(history[0]?.historyCount) / getPageAmount())
    }

    const firstPage = () => {
        setHistoryPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = historyPage - 1 
        if (newPage < 1) newPage = 1 
        setHistoryPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = historyPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setHistoryPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setHistoryPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setHistoryPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (historyPage > maxPage() - 3) increment = -4
        if (historyPage > maxPage() - 2) increment = -5
        if (historyPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (historyPage > maxPage() - 2) increment = -3
            if (historyPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = historyPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const generateHistoryJSX = () => {
        const jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleHistory) as any
        } else {
            const postOffset = (historyPage - 1) * getPageAmount()
            visible = history.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<SearchHistoryRow history={visible[i]} onDelete={updateHistory}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {historyPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {historyPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {historyPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {historyPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
        }
        return jsx
    }

    const toggleScroll = () => {
        setScroll((prev: boolean) => {
            const newValue = !prev
            localStorage.setItem("scroll", `${newValue}`)
            return newValue
        })
    }

    return (
        <>
        <DragAndDrop/>
        <DeleteAllSearchHistoryDialog/>
        <DeleteSearchHistoryDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <div className="history-heading-container">
                        <span className="history-heading">Search History</span>
                        <div className="history-item" onClick={() => toggleScroll()}>
                            <img className="history-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="history-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div>
                        <div className="history-item" onClick={() => setShowDeleteAllHistoryDialog((prev: boolean) => !prev)}>
                            <img className="history-img" src={searchHistoryDelete}/>
                            <span className="history-opt-text">Delete All</span>
                        </div>
                    </div>
                    <table className="history-container">
                        {generateHistoryJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default SearchHistoryPage