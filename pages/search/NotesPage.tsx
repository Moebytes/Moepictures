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
import NoteRow from "../../components/search/NoteRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions} from "../../store"
import permissions from "../../structures/Permissions"
import scrollIcon from "../../assets/icons/scroll.png"
import pageIcon from "../../assets/icons/page.png"
import "./styles/itemspage.less"
import {NoteSearch, CommentSort} from "../../types/Types"

let replace = false

const NotesPage: React.FunctionComponent = (props) => {
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {activeDropdown} = useActiveSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setScroll, setSearch, setSearchFlag} = useSearchActions()
    const {notesPage} = usePageSelector()
    const {setNotesPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [notes, setNotes] = useState([] as NoteSearch[])
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleNotes, setVisibleNotes] = useState([] as NoteSearch[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const {noteSearchFlag} = useFlagSelector()
    const {setNoteSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const sortRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    useEffect(() => {
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (queryParam) setNoteSearchFlag(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setNotesPage(Number(pageParam))
            }
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setNotesPage(Number(pageParam))
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

    const updateNotes = async (query?: string) => {
        const result = await functions.get("/api/search/notes", {sort: functions.parseSort(sortType, sortReverse), query: query ? query : searchQuery}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleNotes([])
        setNotes(result)
    }

    useEffect(() => {
        if (noteSearchFlag) {
            setTimeout(() => {
                setSearchQuery(noteSearchFlag)
                updateNotes(noteSearchFlag)
                setNoteSearchFlag(null)
            }, 200)
        }
    }, [noteSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        updateNotes()
    }, [])

    useEffect(() => {
        document.title = i18n.navbar.notes
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateNotes()
    }, [sortType, sortReverse, session])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateNotes = () => {
            let currentIndex = index
            const newVisibleNotes = visibleNotes
            for (let i = 0; i < getPageAmount(); i++) {
                if (!notes[currentIndex]) break
                newVisibleNotes.push(notes[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleNotes(functions.removeDuplicates(newVisibleNotes))
        }
        if (scroll) updateNotes()
    }, [scroll, notes, session])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (notesPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (notes[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.get("/api/search/notes", {sort: functions.parseSort(sortType, sortReverse), query: searchQuery, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanNotes = notes.filter((t) => !t.fake)
        if (!scroll) {
            if (cleanNotes.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, noteCount: cleanNotes[0]?.noteCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setNotes(result)
            } else {
                setNotes((prev) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setNotes(result)
                } else {
                    setNotes((prev) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!notes[currentIndex]) return updateOffset()
                const newVisibleNotes = visibleNotes
                for (let i = 0; i < 15; i++) {
                    if (!notes[currentIndex]) return updateOffset()
                    newVisibleNotes.push(notes[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleNotes(functions.removeDuplicates(newVisibleNotes))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleNotes, index, sortType, sortReverse])

    useEffect(() => {
        //window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleNotes([])
            setNotesPage(1)
            updateNotes()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (notesPage - 1) * getPageAmount()
            if (notes[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(notes[0]?.noteCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = notes[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, notes, notesPage, ended, sortType, sortReverse])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
        if (!scroll) searchParams.set("page", String(notesPage || ""))
        if (replace) {
            if (!scroll) history.replace(`${location.pathname}?${searchParams.toString()}`)
            replace = false
        } else {
            if (!scroll) history.push(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, searchQuery, notesPage])

    useEffect(() => {
        if (notes?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setNotesPage(maxTagPage)
            }
        }
    }, [notes, notesPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!notes?.length) return 1
        if (Number.isNaN(Number(notes[0]?.noteCount))) return 10000
        return Math.ceil(Number(notes[0]?.noteCount) / getPageAmount())
    }

    const firstPage = () => {
        setNotesPage(1)
        //window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = notesPage - 1 
        if (newPage < 1) newPage = 1 
        setNotesPage(newPage)
        //window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = notesPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setNotesPage(newPage)
        //window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setNotesPage(maxPage())
        //window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number, noScroll?: boolean) => {
        setNotesPage(newPage)
        //if (!noScroll) window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (notesPage > maxPage() - 3) increment = -4
        if (notesPage > maxPage() - 2) increment = -5
        if (notesPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (notesPage > maxPage() - 2) increment = -3
            if (notesPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = notesPage + increment
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

    const generateNotesJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = [] as NoteSearch[]
        if (scroll) {
            visible = functions.removeDuplicates(visibleNotes)
        } else {
            const postOffset = (notesPage - 1) * getPageAmount()
            visible = notes.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            const noteGroup = visible[i]
            if (noteGroup.fake) continue
            if (!session.username) if (noteGroup.post.rating !== functions.r13()) continue
            if (!functions.isR18(ratingType)) if (functions.isR18(noteGroup.post.rating)) continue
            jsx.push(<NoteRow key={noteGroup.noteID} note={noteGroup} onDelete={updateNotes} onEdit={updateNotes}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {notesPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {notesPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {notesPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {notesPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {maxPage() > 1 ? <button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button> : null}
                </div>
            )
        }
        return jsx
    }

    const toggleScroll = () => {
        const newValue = !scroll
        setScroll(newValue)
    }

    const searchUntranslated = () => {
        setSearch("+untranslated +partially-translated")
        setSearchFlag(true)
        history.push("/posts")
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
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateNotes() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateNotes()}>
                                <img src={search}/>
                            </button>
                        </div>
                        {!mobile ? getUntranslatedButton() : null}
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