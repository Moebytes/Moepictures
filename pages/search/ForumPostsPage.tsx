import React, {useEffect, useState} from "react"
import {useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import ForumPostRow from "../../components/search/ForumPostRow"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, usePageActions,
useSearchSelector, usePageSelector, useFlagSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import "./styles/itemspage.less"
import {CommentSort, ForumPostSearch} from "../../types/Types"

let pageAmount = 50

const ForumPostsPage: React.FunctionComponent = () => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText} = useActiveActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {forumPostsPage} = usePageSelector()
    const {setForumPostsPage} = usePageActions()
    const [sortType, setSortType] = useState("date" as CommentSort)
    const [sortReverse, setSortReverse] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const {forumPostSearchFlag} = useFlagSelector()
    const {setForumPostSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const {username} = useParams() as {username: string}

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
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
        document.title = `${functions.util.toProperCase(username)}'s ${i18n.user.forumPosts}`
    }, [i18n, username])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async (queryOverride?: string) => {
        let query = queryOverride ? queryOverride : searchQuery
        let sort = functions.validation.parseSort(sortType, sortReverse)
        const result = await functions.http.get("/api/user/forumposts", {username, query, sort}, session, setSessionFlag)
        return result
    }

    const updateOffset = async (newOffset: number) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        let result = await functions.http.get("/api/user/forumposts", {username, sort, query: searchQuery, offset: newOffset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItemLoader, setManagedPage, toggleScroll} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, countKey: "postCount"})

    useEffect(() => {
        if (forumPostSearchFlag) {
            setTimeout(() => {
                setSearchQuery(forumPostSearchFlag)
                initItemLoader(forumPostSearchFlag)
                setForumPostSearchFlag(null)
            }, 200)
        }
    }, [forumPostSearchFlag])

    useEffect(() => {
        initItemLoader()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (forumPostsPage) setManagedPage(forumPostsPage)
    }, [])

    useEffect(() => {
        setForumPostsPage(page)
    }, [page])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (searchQuery) searchParams.set("query", searchQuery)
    }, [searchQuery])

    const generateForumPostsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as ForumPostSearch[]
        for (let i = 0; i < visible.length; i++) {
            const forumPost = visible[i]
            if (forumPost.fake) continue
            if (!functions.post.isR18(ratingType)) if (forumPost.r18) continue
            jsx.push(<ForumPostRow forumPost={forumPost} onDelete={initItemLoader} onEdit={initItemLoader}/>)
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
                    <span className="items-heading">{`${functions.util.toProperCase(username)}'s ${i18n.user.forumPosts}`}</span>
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