import React, {useEffect, useState, useRef, useReducer} from "react"
import {useNavigate} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import search from "../../assets/icons/search.png"
import sort from "../../assets/icons/sort.png"
import sortRev from "../../assets/icons/sort-reverse.png"
import CommentRow from "../../components/search/CommentRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useActiveSelector, useSearchActions, useSearchSelector, usePageSelector, useFlagSelector,
useMiscDialogActions} from "../../store"
import permissions from "../../structures/Permissions"
import scrollIcon from "../../assets/icons/scroll.png"
import pageIcon from "../../assets/icons/page.png"
import "./styles/itemspage.less"
import {CommentSearch, CommentSort} from "../../types/Types"

let replace = true

const CommentsPage: React.FunctionComponent = (props) => {
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
    const {commentsPage} = usePageSelector()
    const {setCommentsPage} = usePageActions()
    const {setShowPageDialog} = useMiscDialogActions()
    const {pageFlag} = useFlagSelector()
    const {setPageFlag} = useFlagActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [comments, setComments] = useState([] as CommentSearch[])
    const [searchQuery, setSearchQuery] = useState("")
    const [index, setIndex] = useState(0)
    const [visibleComments, setVisibleComments] = useState([] as CommentSearch[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [queryPage, setQueryPage] = useState(1)
    const {commentID, commentJumpFlag, commentSearchFlag} = useFlagSelector()
    const {setCommentID, setCommentJumpFlag, setCommentSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const sortRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    useEffect(() => {
        const queryParam = new URLSearchParams(window.location.search).get("query")
        const pageParam = new URLSearchParams(window.location.search).get("page")
        const commentParam = new URLSearchParams(window.location.search).get("comment")
        const onDOMLoaded = () => {
            if (queryParam) setCommentSearchFlag(queryParam)
            if (pageParam) {
                setQueryPage(Number(pageParam))
                setCommentsPage(Number(pageParam))
            }
            if (commentParam) {
                setCommentID(Number(commentParam))
                setCommentJumpFlag(true)
            }
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setCommentsPage(Number(pageParam))
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
        if (comments && commentID && commentJumpFlag) {
            setTimeout(() => {
                onCommentJump(commentID)
                setCommentJumpFlag(false)
            }, 200)
        }
    }, [comments, commentJumpFlag, commentID])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const getFilterSearch = () => {
        if (theme.includes("light")) return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation - 60}%) brightness(${siteLightness + 220}%)`
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateComments = async (query?: string) => {
        const result = await functions.http.get("/api/search/comments", {sort: functions.validation.parseSort(sortType, sortReverse), query: query ? query : searchQuery}, session, setSessionFlag)
        setEnded(false)
        setIndex(0)
        setVisibleComments([])
        setComments(result)
    }

    useEffect(() => {
        if (commentSearchFlag) {
            setTimeout(() => {
                setSearchQuery(commentSearchFlag)
                updateComments(commentSearchFlag)
                setCommentSearchFlag(null)
            }, 200)
        }
    }, [commentSearchFlag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        updateComments()
    }, [])

    useEffect(() => {
        document.title = i18n.navbar.comments
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        updateComments()
    }, [sortType, sortReverse, session])

    const getPageAmount = () => {
        return scroll ? 15 : 50
    }

    useEffect(() => {
        const updateComments = () => {
            let currentIndex = index
            const newVisibleComments = visibleComments
            for (let i = 0; i < getPageAmount(); i++) {
                if (!comments[currentIndex]) break
                newVisibleComments.push(comments[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleComments(functions.util.removeDuplicates(newVisibleComments))
        }
        if (scroll) updateComments()
    }, [scroll, comments, session])

    const updateOffset = async () => {
        if (ended) return
        let newOffset = offset + 100
        let padded = false
        if (!scroll) {
            newOffset = (commentsPage - 1) * getPageAmount()
            if (newOffset === 0) {
                if (comments[newOffset]?.fake) {
                    padded = true
                } else {
                    return
                }
            }
        }
        let result = await functions.http.get("/api/search/comments", {sort: functions.validation.parseSort(sortType, sortReverse), query: searchQuery, offset: newOffset}, session, setSessionFlag)
        let hasMore = result?.length >= 100
        const cleanComments = comments.filter((t) => !t.fake)
        if (!scroll) {
            if (cleanComments.length <= newOffset) {
                result = [...new Array(newOffset).fill({fake: true, commentCount: cleanComments[0]?.commentCount}), ...result]
                padded = true
            }
        }
        if (hasMore) {
            setOffset(newOffset)
            if (padded) {
                setComments(result)
            } else {
                setComments((prev) => functions.util.removeDuplicates([...prev, ...result]))
            }
        } else {
            if (result?.length) {
                if (padded) {
                    setComments(result)
                } else {
                    setComments((prev) => functions.util.removeDuplicates([...prev, ...result]))
                }
            }
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.dom.scrolledToBottom()) {
                let currentIndex = index
                if (!comments[currentIndex]) return updateOffset()
                const newVisibleComments = visibleComments
                for (let i = 0; i < 15; i++) {
                    if (!comments[currentIndex]) return updateOffset()
                    newVisibleComments.push(comments[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleComments(functions.util.removeDuplicates(newVisibleComments))
            }
        }
        if (scroll) window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [scroll, visibleComments, index, sortType, sortReverse])

    useEffect(() => {
        //window.scrollTo(0, 0)
        if (scroll) {
            setEnded(false)
            setIndex(0)
            setVisibleComments([])
            setCommentsPage(1)
            updateComments()
        }
    }, [scroll, session])

    useEffect(() => {
        if (!scroll) updateOffset()
    }, [])

    useEffect(() => {
        const updatePageOffset = () => {
            const artistOffset = (commentsPage - 1) * getPageAmount()
            if (comments[artistOffset]?.fake) {
                setEnded(false)
                return updateOffset()
            }
            const artistAmount = Number(comments[0]?.commentCount)
            let maximum = artistOffset + getPageAmount()
            if (maximum > artistAmount) maximum = artistAmount
            const maxTag = comments[maximum - 1]
            if (!maxTag) {
                setEnded(false)
                updateOffset()
            }
        }
        if (!scroll) updatePageOffset()
    }, [scroll, comments, commentsPage, ended, sortType, sortReverse])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
        if (!scroll) searchParams.set("page", String(commentsPage || ""))
        if (commentID) searchParams.set("comment", String(commentID))
        if (replace) {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`, {replace: true})
            replace = false
        } else {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, searchQuery, commentsPage, commentID])

    const onCommentJump = async (commentID: number) => {
        let index = -1
        for (let i = 0; i < comments.length; i++) {
            if (comments[i].commentID === String(commentID)) {
                index = i
                break
            }
        }
        if (index > -1) {
            const pageNumber = Math.ceil(index / getPageAmount())
            goToPage(pageNumber, true)
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

    useEffect(() => {
        if (comments?.length) {
            const maxTagPage = maxPage()
            if (maxTagPage === 1) return
            if (queryPage > maxTagPage) {
                setQueryPage(maxTagPage)
                setCommentsPage(maxTagPage)
            }
        }
    }, [comments, commentsPage, queryPage])

    useEffect(() => {
        if (pageFlag) {
            goToPage(pageFlag)
            setPageFlag(null)
        }
    }, [pageFlag])

    const maxPage = () => {
        if (!comments?.length) return 1
        if (Number.isNaN(Number(comments[0]?.commentCount))) return 10000
        return Math.ceil(Number(comments[0]?.commentCount) / getPageAmount())
    }

    const firstPage = () => {
        setCommentsPage(1)
        //window.scrollTo(0, 0)
    }

    const previousPage = () => {
        let newPage = commentsPage - 1 
        if (newPage < 1) newPage = 1 
        setCommentsPage(newPage)
        //window.scrollTo(0, 0)
    }

    const nextPage = () => {
        let newPage = commentsPage + 1 
        if (newPage > maxPage()) newPage = maxPage()
        setCommentsPage(newPage)
        //window.scrollTo(0, 0)
    }

    const lastPage = () => {
        setCommentsPage(maxPage())
        //window.scrollTo(0, 0)
    }

    const goToPage = (newPage: number, noScroll?: boolean) => {
        setCommentsPage(newPage)
        //if (!noScroll) window.scrollTo(0, 0)
    }

    const generatePageButtonsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let buttonAmount = 7
        if (mobile) buttonAmount = 3
        if (maxPage() < buttonAmount) buttonAmount = maxPage()
        let counter = 0
        let increment = -3
        if (commentsPage > maxPage() - 3) increment = -4
        if (commentsPage > maxPage() - 2) increment = -5
        if (commentsPage > maxPage() - 1) increment = -6
        if (mobile) {
            increment = -2
            if (commentsPage > maxPage() - 2) increment = -3
            if (commentsPage > maxPage() - 1) increment = -4
        }
        while (counter < buttonAmount) {
            const pageNumber = commentsPage + increment
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

    const generateCommentsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = [] as CommentSearch[]
        if (scroll) {
            visible = functions.util.removeDuplicates(visibleComments)
        } else {
            const postOffset = (commentsPage - 1) * getPageAmount()
            visible = comments.slice(postOffset, postOffset + getPageAmount())
        }
        for (let i = 0; i < visible.length; i++) {
            const comment = visible[i]
            if (comment.fake) continue
            if (!session.username) if (comment.post.rating !== functions.r13()) continue
            if (!functions.post.isR18(ratingType)) if (functions.post.isR18(comment.post.rating)) continue
            jsx.push(<CommentRow key={comment.commentID} comment={comment} onDelete={updateComments} onEdit={updateComments} onCommentJump={onCommentJump}/>)
        }
        if (!scroll) {
            jsx.push(
                <div key="page-numbers" className="page-container">
                    {commentsPage <= 1 ? null : <button className="page-button" onClick={firstPage}>{"<<"}</button>}
                    {commentsPage <= 1 ? null : <button className="page-button" onClick={previousPage}>{"<"}</button>}
                    {generatePageButtonsJSX()}
                    {commentsPage >= maxPage() ? null : <button className="page-button" onClick={nextPage}>{">"}</button>}
                    {commentsPage >= maxPage() ? null : <button className="page-button" onClick={lastPage}>{">>"}</button>}
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
                    <span className="items-heading">{i18n.navbar.comments}</span>
                    <div className="items-row">
                        <div className="item-search-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <input className="item-search" type="search" spellCheck="false" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => event.key === "Enter" ? updateComments() : null}/>
                            <button className="item-search-button" style={{filter: getFilterSearch()}} onClick={() => updateComments()}>
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