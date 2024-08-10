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
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext} from "../Context"
import permissions from "../structures/Permissions"
import "./styles/taghistorypage.less"
import axios from "axios"

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
    const [revisions, setRevisions] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const tag = props.match?.params.tag

    const updateHistory = async () => {
        let result = [] as any
        if (props.all) {
            result = await axios.get("/api/tag/history", {withCredentials: true}).then((r) => r.data)
        } else {
            result = await axios.get("/api/tag/history", {params: {tag}, withCredentials: true}).then((r) => r.data)
            const posts = await axios.get("/api/search/posts", {params: {query: tag, type: "all", restrict: "all", style: "all", sort: "reverse date", limit: 1}, withCredentials: true}).then((r) => r.data)
            for (let i = 0; i < result.length; i++) {
                result[i].uploadDate = posts[0].uploadDate
                result[i].uploader = posts[0].uploader
                if (i === result.length - 1) result[i].date = null
            }
            if (!result.length) {
                const tagObject = await axios.get("/api/tag", {params: {tag}, withCredentials: true}).then((r) => r.data)
                tagObject.uploadDate = posts[0].uploadDate
                tagObject.uploader = posts[0].uploader
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
    }, [tag])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moepictures: Tag History"
    }, [])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    useEffect(() => {
        let currentIndex = index
        const newVisibleRevisions = [] as any
        for (let i = 0; i < 10; i++) {
            if (!revisions[currentIndex]) break
            newVisibleRevisions.push(revisions[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleRevisions(newVisibleRevisions)
    }, [revisions])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/tag/history", {params: {tag, offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length) {
            setOffset(newOffset)
            setRevisions((prev: any) => [...prev, ...result])
        } else {
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!revisions[currentIndex]) return updateOffset()
                const newRevisions = visibleRevisions as any
                for (let i = 0; i < 10; i++) {
                    if (!revisions[currentIndex]) return updateOffset()
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
        for (let i = 0; i < visibleRevisions.length; i++) {
            jsx.push(<TagHistoryRow tagHistory={visibleRevisions[i]} onDelete={updateHistory} onEdit={updateHistory} current={i === 0}/>)
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