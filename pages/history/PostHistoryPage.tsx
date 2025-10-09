import React, {useEffect, useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import PostHistoryRow from "../../components/history/PostHistoryRow"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, useThemeSelector} from "../../store"
import permissions from "../../structures/Permissions"
import {PostHistory, TagHistory} from "../../types/Types"
import "./styles/historypage.less"

interface Props {
    all?: boolean
}

const PostHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {ratingType} = useSearchSelector()
    const [revisions, setRevisions] = useState([] as PostHistory[])
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([] as PostHistory[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
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

    const processRedirects = async () => {
        if (!postID || !session.cookie) return
        const postObject = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
        if (postObject) functions.post.processRedirects(postObject, postID, slug, navigate, session, setSessionFlag)
    }

    useEffect(() => {
        updateHistory()
        processRedirects()
    }, [postID, session])

    const updateHistory = async () => {
        let result = [] as PostHistory[]
        if (props.all) {
            result = await functions.http.get("/api/post/history", null, session, setSessionFlag)
        } else {
            result = await functions.http.get("/api/post/history", {postID, username}, session, setSessionFlag)
            if (!result.length) {
                const postObject = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
                if (!postObject) return
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
        setEnded(false)
        setIndex(0)
        setVisibleRevisions([])
        setRevisions(result)
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
        document.title = i18n.history.post
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
        let currentIndex = index
        const newVisibleRevisions = [] as PostHistory[]
        for (let i = 0; i < 10; i++) {
            if (!revisions[currentIndex]) break
            if (functions.post.isR18(revisions[currentIndex].rating)) if (!permissions.isMod(session)) {
                currentIndex++
                continue
            }
            newVisibleRevisions.push(revisions[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleRevisions(functions.util.removeDuplicates(newVisibleRevisions))
    }, [revisions, session])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await functions.http.get("/api/post/history", {postID, username, offset: newOffset}, session, setSessionFlag)
        if (result?.length) {
            setOffset(newOffset)
            setRevisions((prev) => functions.util.removeDuplicates([...prev, ...result]))
        } else {
            setEnded(true)
        }
    }

    useEffect(() => {
        if (!session.cookie) return
        const scrollHandler = async () => {
            if (functions.dom.scrolledToBottom()) {
                let currentIndex = index
                if (!revisions[currentIndex]) return updateOffset()
                const newRevisions = visibleRevisions
                for (let i = 0; i < 10; i++) {
                    if (!revisions[currentIndex]) return updateOffset()
                    if (functions.post.isR18(revisions[currentIndex].rating)) if (!permissions.isMod(session)) {
                        currentIndex++
                        continue
                    }
                    newRevisions.push(revisions[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRevisions(functions.util.removeDuplicates(newRevisions))
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [visibleRevisions])

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = functions.util.removeDuplicates(visibleRevisions)
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
                onDelete={updateHistory} onEdit={updateHistory} imageHeight={300}/>)
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