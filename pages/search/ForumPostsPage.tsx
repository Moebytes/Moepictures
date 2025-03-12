import React, {useEffect, useState, useRef, useReducer} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import search from "../../assets/icons/search.png"
import sort from "../../assets/icons/sort.png"
import sortRev from "../../assets/icons/sort-reverse.png"
import ForumPostRow from "../../components/search/ForumPostRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions} from "../../store"
import permissions from "../../structures/Permissions"
import scrollIcon from "../../assets/icons/scroll.png"
import pageIcon from "../../assets/icons/page.png"
import "./styles/itemspage.less"
import {CommentSort, ForumPostSearch} from "../../types/Types"

let replace = true

const ForumPostsPage: React.FunctionComponent = () => {
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
    const {forumPostsPage} = usePageSelector()
    const {setForumPostsPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [forumPosts, setForumPosts] = useState([] as ForumPostSearch[])
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleForumPosts, setVisibleForumPosts] = useState([] as ForumPostSearch[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const {forumPostSearchFlag} = useFlagSelector()
    const {setForumPostSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const sortRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const {username} = useParams() as {username: string}

    useEffect(() => {
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const onDOMLoaded = () => {
            if (queryParam) setForumPostSearchFlag(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setForumPostsPage(Number(pageParam))
            }
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setForumPostsPage(Number(pageParam))
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

    const updateForumPosts = async (query?: string) => {
        const result = await functions.get("/api/user/forumposts", {username, sort: functions.parseSort(sortType, sortReverse), query: query ? query : searchQuery}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleForumPosts([])
        setForumPosts(result)
    }

    useEffect(() => {
        if (forumPostSearchFlag) {
            setTimeout(() => {
                setSearchQuery(forumPostSearchFlag)
                updateForumPosts(forumPostSearchFlag)
                setForumPostSearchFlag(null)
            }, 200)
        }
    }, [forumPostSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        updateForumPosts()
    }, [])

    useEffect(() => {
        document.title = `${functions.toProperCase(username)}'s ${i18n.user.forumPosts}`
    }, [i18n, username])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateForumPosts()
    }, [sortType, sortReverse, session])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateForumPosts = () => {
            let currentIndex = index
            const newVisibleForumPosts = visibleForumPosts
            for (let i = 0; i < getPageAmount(); i++) {
                if (!forumPosts[currentIndex]) break
                newVisibleForumPosts.push(forumPosts[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleForumPosts(functions.removeDuplicates(newVisibleForumPosts))
        }
        if (scroll) updateForumPosts()
    }, [scroll, forumPosts, session])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (forumPostsPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (forumPosts[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.get("/api/user/forumposts", {username, sort: functions.parseSort(sortType, sortReverse), query: searchQuery, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanForumPosts = forumPosts.filter((t) => !t.fake)
        if (!scroll) {
            if (cleanForumPosts.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, forumPostCount: cleanForumPosts[0]?.postCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setForumPosts(result)
            } else {
                setForumPosts((prev) => functions.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setForumPosts(result)
                } else {
                    setForumPosts((prev) => functions.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!forumPosts[currentIndex]) return updateOffset()
                const newVisibleForumPosts = visibleForumPosts
                for (let i = 0; i < 15; i++) {
                    if (!forumPosts[currentIndex]) return updateOffset()
                    newVisibleForumPosts.push(forumPosts[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleForumPosts(functions.removeDuplicates(newVisibleForumPosts))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleForumPosts, index, sortType, sortReverse])

    useEffect(() => {
        //window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleForumPosts([])
            setForumPostsPage(1)
            updateForumPosts()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const postOffset = (forumPostsPage - 1) * getPageAmount()
            if (forumPosts[postOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const postAmount = Number(forumPosts[0]?.postCount)
            let maximum = postOffset + getPageAmount()
            if (maximum > postAmount) maximum = postAmount
            const maxTag = forumPosts[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, forumPosts, forumPostsPage, ended, sortType, sortReverse])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
        if (!scroll) searchParams.set("page", String(forumPostsPage || ""))
        if (replace) {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`, {replace: true})
            replace = false
        } else {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, searchQuery, forumPostsPage])

    useEffect(() => {
        if (forumPosts?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setForumPostsPage(maxTagPage)
            }
        }
    }, [forumPosts, forumPostsPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!forumPosts?.length) return 1
        if (Number.isNaN(Number(forumPosts[0]?.postCount))) return 10000
        return Math.ceil(Number(forumPosts[0]?.postCount) / getPageAmount())
    }

    const firstPage = () => {
        setForumPostsPage(1)
        //window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = forumPostsPage - 1 
        if (newPage < 1) newPage = 1 
        setForumPostsPage(newPage)
        //window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = forumPostsPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setForumPostsPage(newPage)
        //window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setForumPostsPage(maxPage())
        //window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number, noScroll?: boolean) => {
        setForumPostsPage(newPage)
        //if (!noScroll) window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (forumPostsPage > maxPage() - 3) increment = -4
        if (forumPostsPage > maxPage() - 2) increment = -5
        if (forumPostsPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (forumPostsPage > maxPage() - 2) increment = -3
            if (forumPostsPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = forumPostsPage + increment
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

    const generateForumPostsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = [] as ForumPostSearch[]
        if (scroll) {
            visible = functions.removeDuplicates(visibleForumPosts)
        } else {
            const postOffset = (forumPostsPage - 1) * getPageAmount()
            visible = forumPosts.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            const forumPost = visible[i]
            if (forumPost.fake) continue
            if (!functions.isR18(ratingType)) if (forumPost.r18) continue
            jsx.push(<ForumPostRow key={`${forumPost.type}-${forumPost.id}`} forumPost={forumPost} onDelete={updateForumPosts} onEdit={updateForumPosts}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {forumPostsPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {forumPostsPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {forumPostsPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {forumPostsPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
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

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="items">
                    <span className="items-heading">{`${functions.toProperCase(username)}'s ${i18n.user.forumPosts}`}</span>
                    {/*<div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateForumPosts() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateForumPosts()}>
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
                        </div>
                    </div>*/}
                    <div className="items-container">
                        {generateForumPostsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ForumPostsPage