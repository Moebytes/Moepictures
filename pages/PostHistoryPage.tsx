import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import DragAndDrop from "../components/DragAndDrop"
import PostHistoryRow from "../components/PostHistoryRow"
import RevertPostHistoryDialog from "../dialogs/RevertPostHistoryDialog"
import DeletePostHistoryDialog from "../dialogs/DeletePostHistoryDialog"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext} from "../Context"
import permissions from "../structures/Permissions"
import "./styles/posthistorypage.less"
import axios from "axios"

interface Props {
    match?: any
    all?: boolean
}

const PostHistoryPage: React.FunctionComponent<Props> = (props) => {
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
    const postID = props.match?.params.id

    const updateHistory = async () => {
        let result = [] as any
        if (props.all) {
            result = await axios.get("/api/post/history", {withCredentials: true}).then((r) => r.data)
        } else {
            result = await axios.get("/api/post/history", {params: {postID}, withCredentials: true}).then((r) => r.data)
            if (!result.length) {
                const postObject = await axios.get("/api/post", {params: {postID}, withCredentials: true}).then((r) => r.data)
                postObject.date = postObject.uploadDate 
                postObject.user = postObject.uploader
                let categories = await functions.tagCategories(postObject.tags.map((tag: string) => ({tag})))
                postObject.artists = categories.artists.map((a: any) => a.tag)
                postObject.characters = categories.characters.map((c: any) => c.tag)
                postObject.series = categories.series.map((s: any) => s.tag)
                postObject.tags = categories.tags.map((t: any) => t.tag)
                result = [postObject]
            }
        }
        console.log(result)
        setEnded(false)
        setIndex(0)
        setVisibleRevisions([])
        setRevisions(result)
    }

    useEffect(() => {
        updateHistory()
    }, [postID])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Moepictures: Post History"
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
        const result = await axios.get("/api/post/history", {params: {postID, offset: newOffset}, withCredentials: true}).then((r) => r.data)
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
            jsx.push(<PostHistoryRow historyIndex={i+1} postHistory={visibleRevisions[i]} currentHistory={visibleRevisions[0]} onDelete={updateHistory} onEdit={updateHistory} current={i === 0}/>)
        }
        return jsx
    }

    return (
        <>
        <DragAndDrop/>
        <RevertPostHistoryDialog/>
        <DeletePostHistoryDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="post-history-page">
                    <span className="post-history-heading">Post History</span>
                    <table className="post-history-container">
                        {generateRevisionsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default PostHistoryPage