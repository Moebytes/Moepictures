import React, {useEffect, useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import PostHistoryRow from "../../components/history/PostHistoryRow"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useSearchSelector, useActiveActions, useFlagActions, useLayoutSelector, useThemeSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {PostHistory} from "../../types/Types"
import "./styles/historypage.less"

let limit = 100
let pageAmount = 15

interface Props {
    all?: boolean
}

const PostHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {scroll} = useSearchSelector()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const navigate = useNavigate()
    const {id: postID, slug, username} = useParams() as {id: string, slug: string, username?: string}

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(postID ? `/post/history/${postID}/${slug}` : "/post/history")
            navigate("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
    }, [session])

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
        document.title = i18n.history.post
    }, [i18n])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const processRedirects = async () => {
        if (!postID || !session.cookie) return
        const postObject = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
        if (postObject) functions.post.processRedirects(postObject, postID, slug, navigate, session, setSessionFlag)
    }

    const loadInitial = async () => {
        let result = [] as PostHistory[]
        if (props.all) {
            result = await functions.http.get("/api/post/history", null, session, setSessionFlag)
        } else {
            result = await functions.http.get("/api/post/history", {postID, username}, session, setSessionFlag)
            if (!result.length) {
                const postObject = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
                if (!postObject) return []
                const historyObject = postObject as unknown as PostHistory
                historyObject.date = postObject.uploadDate
                historyObject.user = postObject.uploader
                historyObject.images = postObject.images.map((i) => functions.link.getThumbnailLink(i, "medium", session, mobile))
                let categories = await functions.tag.tagCategories(postObject.tags, session, setSessionFlag)
                historyObject.artists = categories.artists.map((a) => a.tag)
                historyObject.characters = categories.characters.map((c) => c.tag)
                historyObject.series = categories.series.map((s) => s.tag)
                historyObject.tags = [...categories.tags.map((t) => t.tag), ...categories.meta.map((m) => m.tag)]
                result = [historyObject]
            }
        }
        return result
    }

    const updateOffset = async (offset: number) => {
        const result = await functions.http.get("/api/post/history", {postID, username, offset}, session, setSessionFlag)
        return result
    }

    const {visibleItems, page, setPage, maxPage, initItems} = 
        usePaginatedScroll({loadInitial, updateOffset, pageAmount, limit, countKey: "historyCount"})

    useEffect(() => {
        initItems()
        processRedirects()
    }, [postID, session])

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = visibleItems as PostHistory[]
        if (!session.showR18) {
            visible = visible.filter((item) => !functions.post.isR18(item.rating))
        }
        let current = visible[0]
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            let previous = visible[i + 1] as PostHistory | null
            if (current.postID !== visible[i].postID) {
                current = visible[i]
                currentIndex = i
            }
            if (previous?.postID !== current.postID) previous = null
            jsx.push(<PostHistoryRow key={i} historyIndex={i+1} postHistory={visible[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={initItems} onEdit={initItems} imageHeight={300}/>)
        }
        if (!scroll) {
            jsx.push(<PageControls page={page} maxPage={maxPage} setPage={setPage} scrollToTop={true}/>)
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
                <div className="history-page">
                    <span className="history-heading">{username ? `${functions.util.toProperCase(username)}'s ${i18n.history.post}` : i18n.history.post}</span>
                    <div className="history-container">
                        {generateRevisionsJSX()}
                    </div>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PostHistoryPage