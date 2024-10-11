import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/icons/search.png"
import sort from "../assets/icons/sort.png"
import sortRev from "../assets/icons/sort-reverse.png"
import Message from "../components/Message"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, 
SiteLightnessContext, SiteSaturationContext, ScrollContext, MailPageContext, ShowPageDialogContext,
PageFlagContext, SoftDeleteMessageIDContext, SoftDeleteMessageFlagContext, HasNotificationContext, SessionFlagContext} from "../Context"
import SoftDeleteMessageDialog from "../dialogs/SoftDeleteMessageDialog"
import permissions from "../structures/Permissions"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import "./styles/itemspage.less"

const MailPage: React.FunctionComponent = (props) => {
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
    const {mailPage, setMailPage} = useContext(MailPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {softDeleteMessageID, setSoftDeleteMessageID} = useContext(SoftDeleteMessageIDContext)
    const {softDeleteMessageFlag, setSoftDeleteMessageFlag} = useContext(SoftDeleteMessageFlagContext)
    const {hasNotification, setHasNotification} = useContext(HasNotificationContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [messageSearchFlag, setMessageSearchFlag] = useState(null) as any
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [sortType, setSortType] = useState("date")
    const [sortReverse, setSortReverse] = useState(false)
    const [messages, setMessages] = useState([]) as any
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleMessages, setVisibleMessages] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("mailPage")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (savedPage) setMailPage(Number(savedPage))
            if (queryParam) updateMessages(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setMailPage(Number(pageParam))
            }
        }
        window.addEventListener("load", onDOMLoaded)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
        }
    }, [])

    useEffect(() => {
        if (hasNotification) updateMessages()
    }, [hasNotification])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateMessages = async (query?: string) => {
        const result = await functions.get("/api/search/messages", {sort: functions.parseSort(sortType, sortReverse), query: query ? query : searchQuery}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleMessages([])
        setMessages(result)
    }

    const softDeleteMessage = async () => {
        await functions.post("/api/message/softdelete", {messageID: softDeleteMessageID}, session, setSessionFlag)
        updateMessages()
    }

    useEffect(() => {
        if (softDeleteMessageFlag && softDeleteMessageID) {
            softDeleteMessage()
            setSoftDeleteMessageFlag(false)
            setSoftDeleteMessageID(null)
        }
    }, [softDeleteMessageFlag, softDeleteMessageID, session])

    useEffect(() => {
        if (messageSearchFlag) {
            setTimeout(() => {
                setSearchQuery(messageSearchFlag)
                updateMessages(messageSearchFlag)
                setMessageSearchFlag(null)
            }, 500)
        }
    }, [messageSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Mail"
        updateMessages()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            functions.replaceLocation("/401")
        }
    }, [session])

    useEffect(() => {
        updateMessages()
    }, [sortType, sortReverse])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateMessages = () => {
            let currentIndex = index
            const newVisibleMessages = visibleMessages as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!messages[currentIndex]) break
                newVisibleMessages.push(messages[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleMessages(functions.removeDuplicates(newVisibleMessages))
        }
        if (scroll) updateMessages()
    }, [scroll, messages, session])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (mailPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (messages[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.get("/api/search/messages", {sort: functions.parseSort(sortType, sortReverse), query: searchQuery, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanMessages = messages.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanMessages.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, messageCount: cleanMessages[0]?.messageCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setMessages(result)
            } else {
                setMessages((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setMessages(result)
                } else {
                    setMessages((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!messages[currentIndex]) return updateOffset()
                const newVisibleMessages = visibleMessages as any
                for (let i = 0; i < 15; i++) {
                    if (!messages[currentIndex]) return updateOffset()
                    newVisibleMessages.push(messages[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleMessages(functions.removeDuplicates(newVisibleMessages))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleMessages, index, session, sortType, sortReverse])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleMessages([])
            setMailPage(1)
            updateMessages()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const pageOffset = (mailPage - 1) * getPageAmount()
            if (messages[pageOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const messageAmount = Number(messages[0]?.messageCount)
            let maximum = pageOffset + getPageAmount()
            if (maximum > messageAmount) maximum = messageAmount
            const maxTag = messages[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, messages, mailPage, ended, session, sortType, sortReverse])

    useEffect(() => {
        if (searchQuery) {
            scroll ? history.replace(`${location.pathname}?query=${searchQuery}`) : history.replace(`${location.pathname}?query=${searchQuery}&page=${mailPage}`)
        } else {
            if (!scroll) history.replace(`${location.pathname}?page=${mailPage}`)
        }
    }, [scroll, searchQuery, mailPage])

    useEffect(() => {
        if (messages?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setMailPage(maxTagPage)
            }
        }
    }, [messages, mailPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("mailPage", String(mailPage))
    }, [mailPage])

    const maxPage = () => {
        if (!messages?.length) return 1
        if (Number.isNaN(Number(messages[0]?.messageCount))) return 10000
        return Math.ceil(Number(messages[0]?.messageCount) / getPageAmount())
    }

    const firstPage = () => {
        setMailPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = mailPage - 1 
        if (newPage < 1) newPage = 1 
        setMailPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = mailPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setMailPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setMailPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setMailPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (mailPage > maxPage() - 3) increment = -4
        if (mailPage > maxPage() - 2) increment = -5
        if (mailPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (mailPage > maxPage() - 2) increment = -3
            if (mailPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = mailPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
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
                <img className="itemsort-img" src={sortReverse ? sortRev : sort} style={{filter: getFilter()}} onClick={() => setSortReverse((prev: boolean) => !prev)}/>
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateMessagesJSX = () => {
        const jsx = [] as any
        jsx.push(<Message titlePage={true}/>)
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleMessages) as any
        } else {
            const postOffset = (mailPage - 1) * getPageAmount()
            visible = messages.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<Message key={visible[i].messageID} message={visible[i]} onDelete={updateMessages} onEdit={updateMessages}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {mailPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {mailPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {mailPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {mailPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
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

    const readAll = async () => {
        await functions.post("/api/message/bulkread", {readStatus: true}, session, setSessionFlag)
        updateMessages()
        setHasNotification(false)
    }

    const unreadAll = async () => {
        await functions.post("/api/message/bulkread", {readStatus: false}, session, setSessionFlag)
        updateMessages()
        setHasNotification(true)
    }

    const getReadButtons = () => {
        const style = {marginLeft: mobile ? "0px" : "15px", marginRight: mobile ? "15px" : "0px", marginTop: mobile ? "10px" : "0px"}
        return (
            <div className="item-button-container" style={{marginLeft: "0px", justifyContent: "flex-start"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <button className="item-button" style={style} onClick={() => readAll()}>Read All</button>
                <button className="item-button" style={style} onClick={() => unreadAll()}>Unread All</button>
            </div> 
        )
    }

    return (
        <>
        <DragAndDrop/>
        <SoftDeleteMessageDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">Mail</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateMessages() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateMessages()}>
                                <img src={search}/>
                            </button>
                        </div>
                        {!mobile ? <>{getReadButtons()}</> : null}
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            <img className="itemsort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="itemsort-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div> : null}
                        <div className={`item-dropdown ${activeDropdown === "sort" ? "" : "hide-item-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="item-dropdown-row" onClick={() => setSortType("random")}>
                                <span className="item-dropdown-text">Random</span>
                            </div>
                            <div className="item-dropdown-row" onClick={() => setSortType("date")}>
                                <span className="item-dropdown-text">Date</span>
                            </div>
                        </div>
                    </div>
                    {mobile ? <>{getReadButtons()}</> : null}
                    <table className="items-container">
                        {generateMessagesJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default MailPage