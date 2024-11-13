import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import functions from "../structures/Functions"
import GroupHistoryRow from "../components/GroupHistoryRow"
import RevertGroupHistoryDialog from "../dialogs/RevertGroupHistoryDialog"
import DeleteGroupHistoryDialog from "../dialogs/DeleteGroupHistoryDialog"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector} from "../store"
import permissions from "../structures/Permissions"
import "./styles/historypage.less"

interface Props {
    match?: any
    all?: boolean
}

const GroupHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {restrictType} = useSearchSelector()
    const [revisions, setRevisions] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const slug = props.match?.params.group
    const username = props.match?.params.username
    const history = useHistory()

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(slug ? `/group/history/${slug}` : "/group/history")
            history.push("/login")
            setSidebarText("Login required.")
        }
    }, [session])

    const updateHistory = async () => {
        let result = [] as any
        if (props.all) {
            result = await functions.get("/api/group/history", null, session, setSessionFlag)
        } else {
            result = await functions.get("/api/group/history", {slug, username}, session, setSessionFlag)
            if (!result.length) {
                const groupObject = await functions.get("/api/group", {name: slug}, session, setSessionFlag)
                groupObject.date = groupObject.createDate
                groupObject.user = groupObject.creator
                result = [groupObject]
            }
        }
        setEnded(false)
        setIndex(0)
        setVisibleRevisions([])
        setRevisions(result)
    }

    useEffect(() => {
        updateHistory()
    }, [slug, session])

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setHeaderText("")
        setSidebarText("")
        document.title = "Group History"
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
            if (revisions[currentIndex].restrict === "explicit") if (restrictType !== "explicit") {
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
        const result = await functions.get("/api/group/history", {slug, username, offset: newOffset}, session, setSessionFlag)
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
                    if (revisions[currentIndex].restrict === "explicit") if (restrictType !== "explicit") {
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
            if (current.groupID !== visibleRevisions[i].groupID) {
                current = visibleRevisions[i]
                currentIndex = i
            }
            if (previous?.groupID !== current.groupID) previous = null
            jsx.push(<GroupHistoryRow historyIndex={i+1} groupHistory={visibleRevisions[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={updateHistory} onEdit={updateHistory}/>)
        }
        return jsx
    }

    return (
        <>
        <RevertGroupHistoryDialog/>
        <DeleteGroupHistoryDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                <div className="history-page">
                    <span className="history-heading">{username ? `${functions.toProperCase(username)}'s Group History` : "Group History"}</span>
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

export default GroupHistoryPage