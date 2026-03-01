/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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
import {CommentSort, ForumPostSearch} from "../../types/Types"
import "./styles/itemspage.less"

let limit = 100
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
    const {forumPostSearchFlag} = useFlagSelector()
    const {setForumPostSearchFlag} = useFlagActions()
    const {ratingType} = useSearchSelector()
    const {username} = useParams() as {username: string}

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

    const loadInitial = async (query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        const result = await functions.http.get("/api/user/forumposts", {username, query, sort}, session, setSessionFlag)
        return result
    }

    const updateOffset = async (offset: number, query?: string) => {
        let sort = functions.validation.parseSort(sortType, sortReverse)
        let result = await functions.http.get("/api/user/forumposts", {username, sort, query, offset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, setSearchQuery, initItems, setManagedPage} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "postCount"})

    useEffect(() => {
        if (forumPostSearchFlag) {
            setTimeout(() => {
                setSearchQuery(forumPostSearchFlag)
                initItems(forumPostSearchFlag)
                setForumPostSearchFlag(null)
            }, 200)
        }
    }, [forumPostSearchFlag])

    useEffect(() => {
        initItems()
    }, [sortType, sortReverse, session])

    useEffect(() => {
        if (forumPostsPage) setManagedPage(forumPostsPage)
    }, [])

    useEffect(() => {
        setForumPostsPage(page)
    }, [page])

    const generateForumPostsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as ForumPostSearch[]
        for (let i = 0; i < visible.length; i++) {
            const forumPost = visible[i]
            if (forumPost.fake) continue
            if (!functions.post.isR18(ratingType)) if (forumPost.r18) continue
            jsx.push(<ForumPostRow forumPost={forumPost} onDelete={initItems} onEdit={initItems}/>)
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