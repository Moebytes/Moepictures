import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import TagHistoryRow from "../components/TagHistoryRow"
import RevertTagHistoryDialog from "../dialogs/RevertTagHistoryDialog"
import DeleteTagHistoryDialog from "../dialogs/DeleteTagHistoryDialog"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SessionFlagContext} from "../Context"
import permissions from "../structures/Permissions"
import matureTags from "../assets/json/mature-tags.json"
import "./styles/taghistorypage.less"

interface Props {
    match?: any
    all?: boolean
}

const TagHistoryPage: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [revisions, setRevisions] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const tag = props.match?.params.tag

    const updateHistory = async () => {
        let result = [] as any
        if (props.all) {
            result = await functions.get("/api/tag/history", null, session, setSessionFlag)
        } else {
            result = await functions.get("/api/tag/history", {tag}, session, setSessionFlag)
            if (!result.length) {
                const tagObject = await functions.get("/api/tag", {tag}, session, setSessionFlag)
                if (!tagObject.createDate && !tagObject.creator) {
                    const oldestPost = await functions.get("/api/search/posts", {query: tag, type: "all", restrict: "all", style: "all", sort: "reverse date", limit: 1}, session, setSessionFlag)
                    tagObject.createDate = oldestPost[0].uploadDate
                    tagObject.creator = oldestPost[0].uploader
                }
                tagObject.date = tagObject.createDate 
                tagObject.user = tagObject.creator
                tagObject.key = tag
                tagObject.aliases = tagObject.aliases.map((alias: any) => alias?.alias)
                tagObject.implications = tagObject.implications.map((implication: any) => implication?.implication)
                result = [tagObject]
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
        document.title = "Tag History"
    }, [])

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
        const newVisibleRevisions = [] as any
        for (let i = 0; i < 10; i++) {
            if (!revisions[currentIndex]) break
            if (functions.arrayIncludes(revisions[currentIndex].tag, matureTags, true)) if (!permissions.isElevated(session)) {
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
        const result = await functions.get("/api/tag/history", {tag, offset: newOffset}, session, setSessionFlag)
        if (result?.length) {
            setOffset(newOffset)
            setRevisions((prev: any) => [...prev, ...result])
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
                const newRevisions = visibleRevisions as any
                for (let i = 0; i < 10; i++) {
                    if (!revisions[currentIndex]) return updateOffset()
                    if (functions.arrayIncludes(revisions[currentIndex].tag, matureTags, true)) if (!permissions.isElevated(session)) {
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
        const jsx = [] as any
        let current = visibleRevisions[0]
        let currentIndex = 0
        for (let i = 0; i < visibleRevisions.length; i++) {
            let previous = visibleRevisions[i + 1]
            if (current.tag !== visibleRevisions[i].tag) {
                current = visibleRevisions[i]
                currentIndex = i
            }
            if (previous?.tag !== current.tag) previous = null
            jsx.push(<TagHistoryRow historyIndex={i+1} tagHistory={visibleRevisions[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={updateHistory} onEdit={updateHistory}/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <RevertTagHistoryDialog/>
        <DeleteTagHistoryDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="tag-history-page">
                    <span className="tag-history-heading">Tag History</span>
                    <table className="tag-history-container">
                        {generateRevisionsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TagHistoryPage