import React, {useEffect, useState} from "react"
import {useNavigate, useParams} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import NoteHistoryRow from "../../components/history/NoteHistoryRow"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, useThemeSelector} from "../../store"
import permissions from "../../structures/Permissions"
import {NoteHistory, Note} from "../../types/Types"
import "./styles/historypage.less"

interface Props {
    all?: boolean
}

const NoteHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {ratingType} = useSearchSelector()
    const [revisions, setRevisions] = useState([] as NoteHistory[])
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([] as NoteHistory[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
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

    const processRedirects = async () => {
        if (!postID || !session.cookie) return
        const postObject = await functions.get("/api/post", {postID}, session, setSessionFlag)
        if (postObject) functions.processRedirects(postObject, postID, slug, navigate, session, setSessionFlag)
    }

    useEffect(() => {
        updateHistory()
        processRedirects()
    }, [postID, session])

    const updateHistory = async () => {
        let result = [] as NoteHistory[]
        if (props.all) {
            result = await functions.get("/api/note/history", null, session, setSessionFlag)
        } else {
            result = await functions.get("/api/note/history", {postID, order: Number(order), username}, session, setSessionFlag)
        }
        if (!result.length) {
            const post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            if (post) result = [{post, postID, order: Number(order), updater: post.uploader, updatedDate: post.uploadDate, notes: [{transcript: "No data"}]} as unknown as NoteHistory]
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
        document.title = i18n.history.note
    }, [i18n])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        let currentIndex = index
        const newVisibleRevisions = [] as NoteHistory[]
        for (let i = 0; i < 10; i++) {
            if (!revisions[currentIndex]) break
            newVisibleRevisions.push(revisions[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleRevisions(functions.removeDuplicates(newVisibleRevisions))
    }, [revisions])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await functions.get("/api/note/history", {postID, order: Number(order), username, offset: newOffset}, session, setSessionFlag)
        if (result?.length) {
            setOffset(newOffset)
            setRevisions((prev) => functions.removeDuplicates([...prev, ...result]))
        } else {
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!revisions[currentIndex]) return updateOffset()
                const newRevisions = visibleRevisions
                for (let i = 0; i < 10; i++) {
                    if (!revisions[currentIndex]) return updateOffset()
                    newRevisions.push(revisions[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRevisions(functions.removeDuplicates(newRevisions))
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    }, [visibleRevisions])

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let visible = functions.removeDuplicates(visibleRevisions)
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
            jsx.push(<NoteHistoryRow key={i} previousHistory={previous} noteHistory={visible[i]} 
                onDelete={updateHistory} onEdit={updateHistory} current={i === currentIndex}/>)
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
                    <span className="history-heading">{username ? `${functions.toProperCase(username)}'s ${i18n.history.note}` : i18n.history.note}</span>
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