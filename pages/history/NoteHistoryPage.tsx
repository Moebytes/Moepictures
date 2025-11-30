import React, {useEffect, useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import NoteHistoryRow from "../../components/history/NoteHistoryRow"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useSearchSelector, useActiveActions, useFlagActions, useLayoutSelector, useThemeSelector} from "../../store"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {NoteHistory} from "../../types/Types"
import "./styles/historypage.less"

let limit = 100
let pageAmount = 15

interface Props {
    all?: boolean
}

const NoteHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {scroll} = useSearchSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const navigate = useNavigate()
    const {id: postID, slug, order, username} = useParams() as {id: string, slug: string, order: string, username?: string}

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(postID ? `/note/history/${postID}/${slug}/${order}` : "/note/history")
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
        document.title = i18n.history.note
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
        let result = [] as NoteHistory[]
        if (props.all) {
            result = await functions.http.get("/api/note/history", null, session, setSessionFlag)
        } else {
            result = await functions.http.get("/api/note/history", {postID, order: Number(order), username}, session, setSessionFlag)
        }
        if (!result.length) {
            const post = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
            if (post) result = [{post, postID, order: Number(order), updater: post.uploader, updatedDate: post.uploadDate, notes: [{transcript: "No data"}]} as unknown as NoteHistory]
        }
        return result
    }

    const updateOffset = async (offset: number) => {
        const result = await functions.http.get("/api/note/history", {postID, order: Number(order), username, offset}, session, setSessionFlag)
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
        let visible = visibleItems as NoteHistory[]
        if (!session.showR18) {
            visible = visible.filter((item) => !functions.post.isR18(item.post.rating))
        }
        let current = visible[0]
        let currentIndex = 0
        for (let i = 0; i < visible.length; i++) {
            let previous = visible[i + 1] as NoteHistory | null
            if (current.postID !== visible[i].postID &&
                current.order !== visible[i].order) {
                current = visible[i]
                currentIndex = i
            }
            if (previous?.postID !== current.postID &&
                previous?.order !== current.order) previous = null
            if (username && !functions.compare.hasHistoryChanges(visible[i])) continue
            jsx.push(<NoteHistoryRow key={i} previousHistory={previous} noteHistory={visible[i]} 
                onDelete={initItems} onEdit={initItems} current={i === currentIndex}/>)
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
                    <span className="history-heading">{username ? `${functions.util.toProperCase(username)}'s ${i18n.history.note}` : i18n.history.note}</span>
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

export default NoteHistoryPage