import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import search from "../../assets/icons/search.png"
import sort from "../../assets/icons/sort.png"
import sortRev from "../../assets/icons/sort-reverse.png"
import MessageRow from "../../components/search/MessageRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions,
useMessageDialogSelector,
useMessageDialogActions} from "../../store"
import permissions from "../../structures/Permissions"
import scrollIcon from "../../assets/icons/scroll.png"
import pageIcon from "../../assets/icons/page.png"
import radioButton from "../../assets/icons/radiobutton.png"
import radioButtonChecked from "../../assets/icons/radiobutton-checked.png"
import "./styles/itemspage.less"
import {MessageSearch, CommentSort} from "../../types/Types"

let replace = false

const MailPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session, hasNotification} = useSessionSelector()
    const {setSessionFlag, setHasNotification} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {activeDropdown} = useActiveSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setScroll} = useSearchActions()
    const {mailPage} = usePageSelector()
    const {setMailPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag, messageSearchFlag} = useFlagSelector()
    const {setPageFlag, setMessageSearchFlag} = useFlagActions()
    const {softDeleteMessageID, softDeleteMessageFlag} = useMessageDialogSelector()
    const {setSoftDeleteMessageID, setSoftDeleteMessageFlag} = useMessageDialogActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [messages, setMessages] = useState([] as MessageSearch[])
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleMessages, setVisibleMessages] = useState([] as MessageSearch[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const [hideSystem, setHideSystem] = useState(false)
    const sortRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedHideSystem = localStorage.getItem("hideSystem")
        if (savedHideSystem) setHideSystem(savedHideSystem === "true")
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
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setMailPage(Number(pageParam))
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

    useEffect(() => {
        localStorage.setItem("hideSystem", String(hideSystem))
    }, [hideSystem])

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
        const result = await functions.get("/api/search/messages", {sort: functions.parseSort(sortType, sortReverse), query: query ? query : searchQuery, hideSystem}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleMessages([])
        setMessages(result)
    }

    const softDeleteMessage = async () => {
        if (!softDeleteMessageID) return
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
    }, [messageSearchFlag, hideSystem])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        updateMessages()
    }, [hideSystem])

    useEffect(() => {
        document.title = i18n.navbar.mail
    }, [i18n])

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
    }, [sortType, sortReverse, hideSystem])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateMessages = () => {
            let currentIndex = index
            const newVisibleMessages = visibleMessages
            for (let i = 0; i < getPageAmount(); i++) {
                if (!messages[currentIndex]) break
                newVisibleMessages.push(messages[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleMessages(functions.removeDuplicates(newVisibleMessages))
        }
        if (scroll) updateMessages()
    }, [scroll, messages, session, hideSystem])

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
        let result = await functions.get("/api/search/messages", {sort: functions.parseSort(sortType, sortReverse), query: searchQuery, hideSystem, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanMessages = messages.filter((t) => !t.fake)
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
                setMessages((prev) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setMessages(result)
                } else {
                    setMessages((prev) => functions.removeDuplicates([...prev, ...result]))
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
                const newVisibleMessages = visibleMessages
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
        //window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleMessages([])
            setMailPage(1)
            updateMessages()
        }
    }, [scroll, session, hideSystem])

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
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
        if (!scroll) searchParams.set("page", String(mailPage || ""))
        if (replace) {
            if (!scroll) history.replace(`${location.pathname}?${searchParams.toString()}`)
            replace = false
        } else {
            if (!scroll) history.push(`${location.pathname}?${searchParams.toString()}`)
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
        localStorage.setItem("mailPage", String(mailPage || ""))
    }, [mailPage])

    const maxPage = () => {
        if (!messages?.length) return 1
        if (Number.isNaN(Number(messages[0]?.messageCount))) return 10000
        return Math.ceil(Number(messages[0]?.messageCount) / getPageAmount())
    }

    const firstPage = () => {
        setMailPage(1)
        //window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = mailPage - 1 
        if (newPage < 1) newPage = 1 
        setMailPage(newPage)
        //window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = mailPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setMailPage(newPage)
        //window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setMailPage(maxPage())
        //window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setMailPage(newPage)
        //window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
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
                <img className="itemsort-img" src={sortReverse ? sortRev : sort} style={{filter: getFilter()}} onClick={() => setSortReverse(!sortReverse)}/>
                <span className="itemsort-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>{i18n.sort[sortType]}</span>
            </div>
        )
    }

    const generateMessagesJSX = () => {
        const jsx = [] as React.ReactElement[]
        jsx.push(<MessageRow key={"0"} titlePage={true}/>)
        let visible = [] as MessageSearch[]
        if (scroll) {
            visible = functions.removeDuplicates(visibleMessages)
        } else {
            const postOffset = (mailPage - 1) * getPageAmount()
            visible = messages.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            jsx.push(<MessageRow key={visible[i].messageID} message={visible[i]} onDelete={updateMessages} onEdit={updateMessages}/>)
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
        const newValue = !scroll
        localStorage.setItem("scroll", `${newValue}`)
        setScroll(newValue)
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
                <button className="item-button" style={style} onClick={() => readAll()}>{i18n.buttons.readAll}</button>
                <button className="item-button" style={style} onClick={() => unreadAll()}>{i18n.buttons.unreadAll}</button>
                {mobile ? <div className="itemsort-item" onClick={() => setHideSystem((prev: boolean) => !prev)} style={{marginLeft: "0px", marginTop: "7px"}}>
                    <img className="itemsort-img" src={hideSystem ? radioButtonChecked : radioButton} style={{filter: getFilter()}}/>
                    <span className="itemsort-text">{i18n.buttons.hideSystem}</span>
                </div> : null}
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
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateMessages() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateMessages()}>
                                <img src={search}/>
                            </button>
                        </div>
                        {!mobile ? <>{getReadButtons()}</> : null}
                        {getSortJSX()}
                        {!mobile ? <div className="itemsort-item" onClick={() => toggleScroll()}>
                            <img className="itemsort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="itemsort-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div> : null}
                        {!mobile ? <div className="itemsort-item" onClick={() => setHideSystem((prev: boolean) => !prev)}>
                            <img className="itemsort-img" src={hideSystem ? radioButtonChecked : radioButton} style={{filter: getFilter()}}/>
                            <span className="itemsort-text">{i18n.buttons.hideSystem}</span>
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
                    {mobile ? <>{getReadButtons()}</> : null}
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