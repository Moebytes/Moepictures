import React, {useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import search from "../assets/icons/search.png"
import sort from "../assets/icons/sort.png"
import sortRev from "../assets/icons/sort-reverse.png"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions} from "../store"
import permissions from "../structures/Permissions"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import PageDialog from "../dialogs/PageDialog"
import CaptchaDialog from "../dialogs/CaptchaDialog"
import cryptoFunctions from "../structures/CryptoFunctions"
import "./styles/itemspage.less"

let replace = false
let limit = 100

interface Props {
    group: any
}

const GroupThumbnail: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const [img, setImg] = useState("")
    const history = useHistory()

    const updateImage = async () => {
        const post = props.group.posts[0]
        const imageLink = functions.getThumbnailLink(post.images[0]?.type, post.postID, post.images[0]?.order, post.images[0]?.filename, "medium", mobile)
        let img = await functions.decryptThumb(imageLink, session)
        setImg(img)
    }

    useEffect(() => {
        updateImage()
    }, [props.group, session])

    const click = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/group/${props.group.slug}`, "_blank")
        } else {
            history.push(`/group/${props.group.slug}`)
        }
    }

    return (
        <div className="group-thumbnail" onClick={click}>
            <img draggable={false} className="group-thumbnail-img" src={img}/>
            <div className="group-thumbnail-text-container">
                <span className="group-thumbnail-text">{props.group.name}</span>
            </div>
        </div>
    )
}

const GroupsPage: React.FunctionComponent = (props) => {
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
    const {setScroll} = useSearchActions()
    const {groupsPage} = usePageSelector()
    const {setGroupsPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag, groupSearchFlag} = useFlagSelector()
    const {setPageFlag, setGroupSearchFlag} = useFlagActions()
    const [sortType, setSortType] = useState("date")
    const [sortReverse, setSortReverse] = useState(false)
    const [groups, setGroups] = useState([]) as any
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleGroups, setVisibleGroups] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const {restrictType} = useSearchSelector()
    const sortRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedScroll = localStorage.getItem("scroll")
        if (savedScroll) setScroll(savedScroll === "true")
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            const savedPage = localStorage.getItem("groupsPage")
            if (savedPage) setGroupsPage(Number(savedPage))
            if (queryParam) setGroupSearchFlag(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setGroupsPage(Number(pageParam))
            }
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setGroupsPage(Number(pageParam))
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

    const updateGroups = async (query?: string) => {
        let restrict = restrictType === "explicit" ? "explicit" : "all"
        const result = await functions.get("/api/search/groups", {sort: functions.parseSort(sortType, sortReverse), query: query ? query : searchQuery, restrict, limit}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleGroups([])
        setGroups(result)
    }

    useEffect(() => {
        if (groupSearchFlag) {
            setTimeout(() => {
                setSearchQuery(groupSearchFlag)
                updateGroups(groupSearchFlag)
                setGroupSearchFlag(null)
            }, 200)
        }
    }, [groupSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Groups"
        updateGroups()
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateGroups()
    }, [sortType, sortReverse, restrictType, session])

    const getPageAmount = () => {
        return scroll ? 15 : 25
    }

    useEffect(() => {
        const updateGroups = () => {
            let currentIndex = index
            const newVisibleGroups = visibleGroups as any
            for (let i = 0; i < getPageAmount(); i++) {
                if (!groups[currentIndex]) break
                newVisibleGroups.push(groups[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleGroups(functions.removeDuplicates(newVisibleGroups))
        }
        if (scroll) updateGroups()
    }, [scroll, groups, restrictType, session])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + limit
        let padded = false
        if (!scroll) {
            newOffset = (groupsPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (groups[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let restrict = restrictType === "explicit" ? "explicit" : "all"
        let result = await functions.get("/api/search/groups", {sort: functions.parseSort(sortType, sortReverse), query: searchQuery, restrict, limit, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= limit
        const cleanGroups = groups.filter((t: any) => !t.fake)
        if (!scroll) {
            if (cleanGroups.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, groupCount: cleanGroups[0]?.groupCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setGroups(result)
            } else {
                setGroups((prev: any) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setGroups(result)
                } else {
                    setGroups((prev: any) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!groups[currentIndex]) return updateOffset()
                const newVisibleGroups = visibleGroups as any
                for (let i = 0; i < 15; i++) {
                    if (!groups[currentIndex]) return updateOffset()
                    newVisibleGroups.push(groups[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleGroups(functions.removeDuplicates(newVisibleGroups))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleGroups, index, sortType, sortReverse, restrictType])

    useEffect(() => {
        window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleGroups([])
            setGroupsPage(1)
            updateGroups()
        }
    }, [scroll, restrictType, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const groupOffset = (groupsPage - 1) * getPageAmount()
            if (groups[groupOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const groupAmount = Number(groups[0]?.groupCount)
            let maximum = groupOffset + getPageAmount()
            if (maximum > groupAmount) maximum = groupAmount
            const maxTag = groups[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, groups, groupsPage, ended, sortType, sortReverse, restrictType])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
        if (!scroll) searchParams.set("page", String(groupsPage || ""))
        if (replace) {
            if (!scroll) history.replace(`${location.pathname}?${searchParams.toString()}`)
            replace = false
        } else {
            if (!scroll) history.push(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, searchQuery, groupsPage])

    useEffect(() => {
        if (groups?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setGroupsPage(maxTagPage)
            }
        }
    }, [groups, groupsPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    useEffect(() => {
        localStorage.setItem("groupsPage", String(groupsPage || ""))
    }, [groupsPage])

    const maxPage = () => {
        if (!groups?.length) return 1
        if (Number.isNaN(Number(groups[0]?.groupCount))) return 10000
        return Math.ceil(Number(groups[0]?.groupCount) / getPageAmount())
    }

    const firstPage = () => {
        setGroupsPage(1)
        window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = groupsPage - 1 
        if (newPage < 1) newPage = 1 
        setGroupsPage(newPage)
        window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = groupsPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setGroupsPage(newPage)
        window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setGroupsPage(maxPage())
        window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number, noScroll?: boolean) => {
        setGroupsPage(newPage)
        if (!noScroll) window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as any
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (groupsPage > maxPage() - 3) increment = -4
        if (groupsPage > maxPage() - 2) increment = -5
        if (groupsPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (groupsPage > maxPage() - 2) increment = -3
            if (groupsPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = groupsPage + increment
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
        if (sortType === "posts") offset = -20
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

    const generateGroupsJSX = () => {
        const jsx = [] as any
        let visible = [] as any
        if (scroll) {
            visible = functions.removeDuplicates(visibleGroups) as any
        } else {
            const postOffset = (groupsPage - 1) * getPageAmount()
            visible = groups.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            const group = visible[i]
            if (group.fake) continue
            jsx.push(<GroupThumbnail key={group.groupID} group={group}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {groupsPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {groupsPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {groupsPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {groupsPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
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

    return (
        <>
        <CaptchaDialog/>
        <PageDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">{i18n.navbar.groups}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateGroups() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateGroups()}>
                                <img src={search}/>
                            </button>
                        </div>
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
                            <div className="item-dropdown-row" onClick={() => setSortType("posts")}>
                                <span className="item-dropdown-text">{i18n.sort.posts}</span>
                            </div>
                        </div>
                    </div>
                    <table className="items-row-container">
                        {generateGroupsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default GroupsPage