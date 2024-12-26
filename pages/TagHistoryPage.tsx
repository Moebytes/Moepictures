import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import TagHistoryRow from "../components/TagHistoryRow"
import RevertTagHistoryDialog from "../dialogs/RevertTagHistoryDialog"
import DeleteTagHistoryDialog from "../dialogs/DeleteTagHistoryDialog"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, useThemeSelector} from "../store"
import permissions from "../structures/Permissions"
import {TagHistory} from "../types/Types"
import "./styles/historypage.less"

interface Props {
    match: {params: {tag: string, username?: string}}
    all?: boolean
}

const TagHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {ratingType} = useSearchSelector()
    const [revisions, setRevisions] = useState([] as TagHistory[])
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([] as TagHistory[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const tag = props.match?.params.tag
    const username = props.match?.params.username
    const history = useHistory()

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(tag ? `/tag/history/${tag}` : "/tag/history")
            history.push("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
    }, [session])

    const updateHistory = async () => {
        let result = [] as TagHistory[]
        if (props.all) {
            result = await functions.get("/api/tag/history", null, session, setSessionFlag)
        } else {
            result = await functions.get("/api/tag/history", {tag, username}, session, setSessionFlag)
            if (!result.length) {
                const tagObject = await functions.get("/api/tag", {tag}, session, setSessionFlag)
                if (!tagObject) return
                const historyObject = tagObject as unknown as TagHistory
                if (!tagObject.createDate && !tagObject.creator) {
                    const oldestPost = await functions.get("/api/search/posts", {query: tag, type: "all", rating: "all", style: "all", sort: "reverse date", limit: 1}, session, setSessionFlag)
                    tagObject.createDate = oldestPost[0].uploadDate
                    tagObject.creator = oldestPost[0].uploader
                }
                historyObject.date = tagObject.createDate 
                historyObject.user = tagObject.creator
                historyObject.key = tag
                historyObject.aliases = tagObject.aliases.map((alias) => alias?.alias || "")
                historyObject.implications = tagObject.implications.map((implication) => implication?.implication || "")
                result = [historyObject]
            }
        }
        setEnded(false)
        setIndex(0)
        setVisibleRevisions([])
        setRevisions(result)
    }

    useEffect(() => {
        updateHistory()
    }, [tag, session])

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
        document.title = i18n.history.tag
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
        const newVisibleRevisions = [] as TagHistory[]
        for (let i = 0; i < 10; i++) {
            if (!revisions[currentIndex]) break
            if (revisions[currentIndex].r18) if (!functions.isR18(ratingType)) {
                currentIndex++
                continue
            }
            newVisibleRevisions.push(revisions[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleRevisions(newVisibleRevisions)
    }, [revisions, session])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await functions.get("/api/tag/history", {tag, username, offset: newOffset}, session, setSessionFlag)
        if (result?.length) {
            setOffset(newOffset)
            setRevisions((prev) => [...prev, ...result])
        } else {
            setEnded(true)
        }
    }

    useEffect(() => {
        if (!session.cookie) return
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!revisions[currentIndex]) return updateOffset()
                const newRevisions = visibleRevisions
                for (let i = 0; i < 10; i++) {
                    if (!revisions[currentIndex]) return updateOffset()
                    if (revisions[currentIndex].r18) if (!functions.isR18(ratingType)) {
                        currentIndex++
                        continue
                    }
                    newRevisions.push(revisions[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleRevisions(newRevisions)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const generateRevisionsJSX = () => {
        const jsx = [] as React.ReactElement[]
        let current = visibleRevisions[0]
        let currentIndex = 0
        for (let i = 0; i < visibleRevisions.length; i++) {
            let previous = visibleRevisions[i + 1] as TagHistory | null
            if (current.tag !== visibleRevisions[i].tag) {
                current = visibleRevisions[i]
                currentIndex = i
            }
            if (previous?.tag !== current.tag) previous = null
            jsx.push(<TagHistoryRow key={i} historyIndex={i+1} tagHistory={visibleRevisions[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={updateHistory} onEdit={updateHistory}/>)
        }
        return jsx
    }

    return (
        <>
        <RevertTagHistoryDialog/>
        <DeleteTagHistoryDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <span className="history-heading">{username ? `${functions.toProperCase(username)}'s ${i18n.history.tag}` : i18n.history.tag}</span>
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

export default TagHistoryPage