import React, {useEffect, useState} from "react"
import {useHistory} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import GroupHistoryRow from "../../components/history/GroupHistoryRow"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, useThemeSelector} from "../../store"
import permissions from "../../structures/Permissions"
import {GroupHistory} from "../../types/Types"
import "./styles/historypage.less"

interface Props {
    match: {params: {group: string, username?: string}}
    all?: boolean
}

const GroupHistoryPage: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveDropdown} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {ratingType} = useSearchSelector()
    const [revisions, setRevisions] = useState([] as GroupHistory[])
    const [index, setIndex] = useState(0)
    const [visibleRevisions, setVisibleRevisions] = useState([] as GroupHistory[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const slug = props.match.params.group
    const username = props.match.params.username
    const history = useHistory()

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            setRedirect(slug ? `/group/history/${slug}` : "/group/history")
            history.push("/login")
            setSidebarText(i18n.sidebar.loginRequired)
        }
    }, [session])

    const updateHistory = async () => {
        let result = [] as GroupHistory[]
        if (props.all) {
            result = await functions.get("/api/group/history", null, session, setSessionFlag)
        } else {
            result = await functions.get("/api/group/history", {slug, username}, session, setSessionFlag)
            if (!result.length) {
                const groupObject = await functions.get("/api/group", {name: slug}, session, setSessionFlag)
                if (!groupObject) return
                const historyObject = groupObject as unknown as GroupHistory
                historyObject.date = groupObject.createDate
                historyObject.user = groupObject.creator
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
    }, [slug, session])

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
        document.title = i18n.history.group
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
        const newVisibleRevisions = [] as GroupHistory[]
        for (let i = 0; i < 10; i++) {
            if (!revisions[currentIndex]) break
            if (functions.isR18(revisions[currentIndex].rating)) if (!functions.isR18(ratingType)) {
                currentIndex++
                continue
            }
            newVisibleRevisions.push(revisions[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleRevisions(functions.removeDuplicates(newVisibleRevisions))
    }, [revisions, session])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await functions.get("/api/group/history", {slug, username, offset: newOffset}, session, setSessionFlag)
        if (result?.length) {
            setOffset(newOffset)
            setRevisions((prev) => functions.removeDuplicates([...prev, ...result]))
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
                    if (functions.isR18(revisions[currentIndex].rating)) if (!functions.isR18(ratingType)) {
                        currentIndex++
                        continue
                    }
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
            let previous = visible[i + 1] as GroupHistory | null
            if (current.groupID !== visible[i].groupID) {
                current = visible[i]
                currentIndex = i
            }
            if (previous?.groupID !== current.groupID) previous = null
            jsx.push(<GroupHistoryRow key={i} historyIndex={i+1} groupHistory={visible[i]} 
                previousHistory={previous} currentHistory={current} current={i === currentIndex}
                onDelete={updateHistory} onEdit={updateHistory}/>)
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
                    <span className="history-heading">{username ? `${functions.toProperCase(username)}'s ${i18n.history.group}` : i18n.history.group}</span>
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

export default GroupHistoryPage