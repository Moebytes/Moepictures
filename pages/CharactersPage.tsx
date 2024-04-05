import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import search from "../assets/icons/search.png"
import searchIconHover from "../assets/icons/search-hover.png"
import sort from "../assets/icons/sort.png"
import CharacterRow from "../components/CharacterRow"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import axios from "axios"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, MobileContext,
HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SiteHueContext, SiteLightnessContext,
SiteSaturationContext, ScrollContext, CharactersPageContext, ShowPageDialogContext, PageFlagContext} from "../Context"
import "./styles/characterspage.less"

const CharactersPage: React.FunctionComponent = (props) => {
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
    const {charactersPage, setCharactersPage} = useContext(CharactersPageContext)
    const {showPageDialog, setShowPageDialog} = useContext(ShowPageDialogContext)
    const {pageFlag, setPageFlag} = useContext(PageFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const [sortType, setSortType] = useState("posts")
    const [characters, setCharacters] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [searchQuery, setSearchQuery] = useState("")
    const [visibleCharacters, setVisibleCharacters] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [getSearchIconHover, setSearchIconHover] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const savedPage = localStorage.getItem("charactersPage")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (savedPage) setCharactersPage(Number(savedPage))
            if (queryParam) updateCharacters(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setCharactersPage(Number(pageParam))
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

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateCharacters = async (queryOverride?: string) => {
        let query = queryOverride ? queryOverride : searchQuery
        const result = await axios.get("/api/search/characters", {params: {sort: sortType, query}, withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setIndex(0)
        setVisibleCharacters([])
        setCharacters(result)
    }

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moebooru: Characters"
        updateCharacters()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateCharacters()
    }, [sortType])


    const getPageAmount = () => {
        return 15
    }

    useEffect(() => {
        const updateCharacters = () => {
            let currentIndex = index
            const newVisibleCharacters = visibleCharacters as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!characters[currentIndex]) break
                newVisibleCharacters.push(characters[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleCharacters(functions.removeDuplicates(newVisibleCharacters))
        }
        if (scroll) updateCharacters()
    }, [scroll, characters])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (charactersPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (characters[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await axios.get("/api/search/characters", {params: {sort: sortType, query: searchQuery, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        let hasMore = result?.length >= 100
        const cleanCharacters = characters.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanCharacters.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, tagCount: cleanCharacters[0]?.tagCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setCharacters(result)
            } else {
                setCharacters((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setCharacters(result)
                } else {
                    setCharacters((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!characters[currentIndex]) return updateOffset()
                const newVisibleCharacters = visibleCharacters as any
                for (let i = 0; i < 15; i++) {
                    if (!characters[currentIndex]) return updateOffset()
                    newVisibleCharacters.push(characters[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleCharacters(functions.removeDuplicates(newVisibleCharacters))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleCharacters, index])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleCharacters([])
            setCharactersPage(1)
            updateCharacters()
        }
    }, [scroll])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (charactersPage - 1) * getPageAmount()
            if (characters[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(characters[0]?.tagCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = characters[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, characters, charactersPage, ended])

    useEffect(() => {
        if (searchQuery) {
            scroll ? history.replace(`${location.pathname}?query=${searchQuery}`) : history.replace(`${location.pathname}?query=${searchQuery}&page=${charactersPage}`)
        } else {
            if (!scroll) history.replace(`${location.pathname}?page=${charactersPage}`)
        }
    }, [scroll, searchQuery, charactersPage])

    useEffect(() => {
        if (characters?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setCharactersPage(maxTagPage)
            }
        }
    }, [characters, charactersPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("charactersPage", String(charactersPage))
    }, [charactersPage])

    const maxPage = () => {
        if (!characters?.length) return 1
        if (Number.isNaN(Number(characters[0]?.tagCount))) return 10000
        return Math.ceil(Number(characters[0]?.tagCount) / getPageAmount())
    }

    const firstPage = () => {
        setCharactersPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = charactersPage - 1 
        if (newPage < 1) newPage = 1 
        setCharactersPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = charactersPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setCharactersPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setCharactersPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number) => {
        setCharactersPage(newPage)
        window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (charactersPage > maxPage() - 3) increment = -4
        if (charactersPage > maxPage() - 2) increment = -5
        if (charactersPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (charactersPage > maxPage() - 2) increment = -3
            if (charactersPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = charactersPage + increment
            if (pageNumber > maxPage()) break
            if (pageNumber >= 1) {
                jsx.push(<button key={pageNumber} className={`page-button ${increment === 0 ? "page-button-active" : ""}`} onClick={() => goToPage(pageNumber)}>{pageNumber}</button>)
                counter++
            }
            increment++
        }
        return jsx
    }

    const getSearchIcon = () => {
        return getSearchIconHover ? searchIconHover : search
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "cuteness") offset = -40
        if (sortType === "reverse cuteness") offset = -10
        if (sortType === "posts") offset = -45
        if (sortType === "reverse posts") offset = -15
        if (sortType === "alphabetic") offset = -25
        if (sortType === "reverse alphabetic") offset = 0
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="charactersort-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort")}}>
                <img className="charactersort-img" src={sort} style={{filter: getFilter()}}/>
                <span className="charactersort-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const generateCharactersJSX = () => {
        const jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleCharacters) as any
        } else {
            const postOffset = (charactersPage - 1) * getPageAmount()
            visible = characters.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            if (visible[i].fake) continue
            if (visible[i].tag === "original") continue
            if (visible[i].tag === "unknown-character") continue
            jsx.push(<CharacterRow character={visible[i]}/>)
        }
        if (!scroll) {
            jsx.push(
                <div className="page-container">
                    {charactersPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {charactersPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {charactersPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {charactersPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
                    {<button className="page-button" onClick={() => setShowPageDialog(true)}>{"?"}</button>}
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
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="characters">
                    <span className="characters-heading">Characters</span>
                    <div className="characters-row">
                        <div className="character-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="character-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateCharacters() : null}/>
                            <img className="character-search-icon" src={getSearchIcon()} style={{filter: getFilterSearch()}} onClick={() => updateCharacters()} onMouseEnter={() => setSearchIconHover(true)} onMouseLeave={() => setSearchIconHover(false)}/>
                        </div>
                        {getSortJSX()}
                        {!mobile ? <div className="charactersort-item" onClick={() => toggleScroll()}>
                            <img className="charactersort-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                            <span className="charactersort-text">{scroll ? "Scrolling" : "Pages"}</span>
                        </div> : null}
                        <div className={`character-dropdown ${activeDropdown === "sort" ? "" : "hide-character-dropdown"}`} 
                        style={{marginRight: getSortMargin(), top: mobile ? "229px" : "209px"}} onClick={() => setActiveDropdown("none")}>
                            <div className="character-dropdown-row" onClick={() => setSortType("alphabetic")}>
                                <span className="character-dropdown-text">Alphabetic</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("reverse alphabetic")}>
                                <span className="character-dropdown-text">Reverse Alphabetic</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="character-dropdown-text">Posts</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("reverse posts")}>
                                <span className="character-dropdown-text">Reverse Posts</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("cuteness")}>
                                <span className="character-dropdown-text">Cuteness</span>
                            </div>
                            <div className="character-dropdown-row" onClick={() => setSortType("reverse cuteness")}>
                                <span className="character-dropdown-text">Reverse Cuteness</span>
                            </div>
                        </div>
                    </div>
                    <table className="characters-container">
                        {generateCharactersJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default CharactersPage