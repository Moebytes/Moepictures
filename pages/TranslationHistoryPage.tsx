import React, {useEffect, useContext, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import TranslationHistoryRow from "../components/TranslationHistoryRow"
import RevertTranslationHistoryDialog from "../dialogs/RevertTranslationHistoryDialog"
import DeleteTranslationHistoryDialog from "../dialogs/DeleteTranslationHistoryDialog"
import {ThemeContext, EnableDragContext, HideNavbarContext, HideSidebarContext, MobileContext, SessionContext, RedirectContext,
RelativeContext, HideTitlebarContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SessionFlagContext} from "../Context"
import permissions from "../structures/Permissions"
import "./styles/historypage.less"

interface Props {
    match?: any
    all?: boolean
}

const TranslationHistoryPage: React.FunctionComponent<Props> = (props) => {
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
    const {redirect, setRedirect} = useContext(RedirectContext)
    const [revisions, setRevisions] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const postID = props.match?.params.id
    const order = props.match?.params.order
    const username = props.match?.params.username
    const history = useHistory()

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(postID ? `/translation/history/${postID}/${order}` : "/translation/history")
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    const updateHistory = async () => {
        let result = [] as any
        if (props.all) {
            result = await functions.get("/api/translation/history", null, session, setSessionFlag)
        } else {
            result = await functions.get("/api/translation/history", {postID, order, username}, session, setSessionFlag)
        }
        if (!result.length) {
            const post = await functions.get("/api/post", {postID}, session, setSessionFlag)
            result = [{post, postID, order, updater: post.uploader, updatedDate: post.uploadDate, data: [{transcript: "No data"}]}]
        }
        setEnded(false)
        setIndex(0)
        setVisibleRevisions([])
        setRevisions(result)
    }

    useEffect(() => {
        updateHistory()
    }, [postID, session])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Translation History"
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
        const result = await functions.get("/api/translation/history", {postID, order, username, offset: newOffset}, session, setSessionFlag)
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
        let current = visibleRevisions[0]
        let currentIndex = 0
        for (let i = 0; i < visibleRevisions.length; i++) {
            let previous = visibleRevisions[i + 1]
            if (current.postID !== visibleRevisions[i].postID &&
                current.order !== visibleRevisions[i].order) {
                current = visibleRevisions[i]
                currentIndex = i
            }
            if (previous?.postID !== current.postID &&
                previous?.order !== current.order) previous = null
            jsx.push(<TranslationHistoryRow previousHistory={previous} translationHistory={visibleRevisions[i]} 
                onDelete={updateHistory} onEdit={updateHistory} current={i === currentIndex}/>)
        }
        return jsx
    }

    return (
        <>
        <RevertTranslationHistoryDialog/>
        <DeleteTranslationHistoryDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <span className="history-heading">Translation History</span>
                    <table className="history-container">
                        {generateRevisionsJSX()}
                    </table>
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default TranslationHistoryPage