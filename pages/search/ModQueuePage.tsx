import React, {useEffect, useReducer, useState} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import {useInteractionActions, useSessionSelector, useSessionActions, useLayoutActions, 
useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, useActiveSelector, 
usePageSelector, useSearchActions, usePageActions, useThemeSelector} from "../../store"
import permissions from "../../structures/Permissions"
import ModPosts from "../../components/mod/ModPosts"
import ModPostEdits from "../../components/mod/ModPostEdits"
import ModPostDeletions from "../../components/mod/ModPostDeletions"
import ModTagDeletions from "../../components/mod/ModTagDeletions"
import ModTagAliases from "../../components/mod/ModTagAliases"
import ModTagEdits from "../../components/mod/ModTagEdits"
import ModNotes from "../../components/mod/ModNotes"
import ModGroups from "../../components/mod/ModGroups"
import ModGroupEdits from "../../components/mod/ModGroupEdits"
import ModGroupDeletions from "../../components/mod/ModGroupDeletions"
import ModReports from "../../components/mod/ModReports"
import ModRejected from "../../components/mod/ModRejected"
import functions from "../../structures/Functions"
import modPostUploadIcon from "../../assets/icons/mod-post-upload.png"
import modPostEditIcon from "../../assets/icons/mod-post-edit.png"
import modPostDeleteIcon from "../../assets/icons/mod-post-delete.png"
import modTagEditIcon from "../../assets/icons/mod-tag-edit.png"
import modTagAliasIcon from "../../assets/icons/mod-tag-alias.png"
import modTagDeleteIcon from "../../assets/icons/mod-tag-delete.png"
import modGroupAddIcon from "../../assets/icons/mod-group-add.png"
import modGroupEditIcon from "../../assets/icons/mod-group-edit.png"
import modGroupDeleteIcon from "../../assets/icons/mod-group-delete.png"
import modNoteIcon from "../../assets/icons/history-note.png"
import modReportIcon from "../../assets/icons/mod-report.png"
import modRejectedIcon from "../../assets/icons/tag-delete.png"
import modPostUploadActiveIcon from "../../assets/icons/mod-post-upload-active.png"
import modGroupAddActiveIcon from "../../assets/icons/mod-group-add-active.png"
import modPostEditActiveIcon from "../../assets/icons/mod-post-edit-active.png"
import modPostDeleteActiveIcon from "../../assets/icons/mod-post-delete-active.png"
import modTagEditActiveIcon from "../../assets/icons/mod-tag-edit-active.png"
import modTagAliasActiveIcon from "../../assets/icons/mod-tag-alias-active.png"
import modTagDeleteActiveIcon from "../../assets/icons/mod-tag-delete-active.png"
import modGroupEditActiveIcon from "../../assets/icons/mod-group-edit-active.png"
import modGroupDeleteActiveIcon from "../../assets/icons/mod-group-delete-active.png"
import modNoteActiveIcon from "../../assets/icons/history-note-active.png"
import modReportActiveIcon from "../../assets/icons/mod-report-active.png"
import modRejectedActiveIcon from "../../assets/icons/tag-delete-active.png"
import modPostUploadNotifIcon from "../../assets/icons/mod-post-upload-notif.png"
import modGroupAddNotifIcon from "../../assets/icons/mod-group-add-notif.png"
import modPostEditNotifIcon from "../../assets/icons/mod-post-edit-notif.png"
import modPostDeleteNotifIcon from "../../assets/icons/mod-post-delete-notif.png"
import modTagEditNotifIcon from "../../assets/icons/mod-tag-edit-notif.png"
import modTagAliasNotifIcon from "../../assets/icons/mod-tag-alias-notif.png"
import modTagDeleteNotifIcon from "../../assets/icons/mod-tag-delete-notif.png"
import modGroupEditNotifIcon from "../../assets/icons/mod-group-edit-notif.png"
import modGroupDeleteNotifIcon from "../../assets/icons/mod-group-delete-notif.png"
import modNoteNotifIcon from "../../assets/icons/history-note-notif.png"
import modReportNotifIcon from "../../assets/icons/mod-report-notif.png"
import modRejectedNotifIcon from "../../assets/icons/tag-delete-notif.png"
import "./styles/modqueuepage.less"

let replace = true

const ModQueuePage: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {modState} = useActiveSelector()
    const {setHeaderText, setSidebarText, setModState} = useActiveActions()
    const {setRedirect} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {scroll} = useSearchSelector()
    const {setScroll} = useSearchActions()
    const {modPage} = usePageSelector()
    const {setModPage} = usePageActions()
    const [queryPage, setQueryPage] = useState(1)
    const [items, setItems] = useState({} as {[key: string]: any[]})
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(() => {
        const typeParam = new URLSearchParams(window.location.search).get("type")
        if (typeParam) setModState(typeParam)
        const pageParam = new URLSearchParams(window.location.search).get("page")
        if (pageParam) setQueryPage(Number(pageParam))
        const onDOMLoaded = () => {
            const savedState = localStorage.getItem("modState")
            if (savedState) setModState(savedState)
            setTimeout(() => {
                if (pageParam) setModPage(Number(pageParam))
            }, 200)
        }
        const updateStateChange = () => {
            replace = true
            const pageParam = new URLSearchParams(window.location.search).get("page")
            if (pageParam) setModPage(Number(pageParam))
        }
        window.addEventListener("load", onDOMLoaded)
        window.addEventListener("popstate", updateStateChange)
        window.addEventListener("pushstate", updateStateChange)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
            window.removeEventListener("popstate", updateStateChange)
            window.removeEventListener("pushstate", updateStateChange)
        }
    }, [])

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        localStorage.setItem("modState", modState)
    }, [modState])

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search)
        if (modState) searchParams.set("type", modState)
        if (!scroll) searchParams.set("page", String(modPage))
        if (replace) {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`, {replace: true})
            replace = false
        } else {
            if (!scroll) navigate(`${location.pathname}?${searchParams.toString()}`)
        }
    }, [scroll, modState, modPage])

    useEffect(() => {
        setRelative(false)
        setHideNavbar(false)
        setHeaderText("")
        setSidebarText("")
    }, [])

    useEffect(() => {
        document.title = i18n.navbar.modQueue
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
        if (!permissions.isMod(session)) {
            functions.replaceLocation("/401")
        }
    }, [session])

    const checkNotifications = async () => {
        const posts = await functions.get("/api/post/list/unverified", null, session, setSessionFlag)
        const postEdits = await functions.get("/api/post-edits/list/unverified", null, session, setSessionFlag)
        const postDeletions = await functions.get("/api/post/delete/request/list", null, session, setSessionFlag)
        const tagEdits = await functions.get("/api/tag/edit/request/list", null, session, setSessionFlag)
        const tagDeletions = await functions.get("/api/tag/delete/request/list", null, session, setSessionFlag)
        const tagAliases = await functions.get("/api/tag/aliasto/request/list", null, session, setSessionFlag)
        const groups = await functions.get("/api/group/request/list", null, session, setSessionFlag)
        const groupEdits = await functions.get("/api/group/edit/request/list", null, session, setSessionFlag)
        const groupDeletions = await functions.get("/api/group/delete/request/list", null, session, setSessionFlag)
        const notes = await functions.get("/api/note/list/unverified", null, session, setSessionFlag)
        const reports = await functions.get("/api/search/reports", null, session, setSessionFlag)
        const rejected = await functions.get("/api/post/deleted/unverified", null, session, setSessionFlag)
        const items = {
            "posts": posts,
            "post-edits": postEdits,
            "post-deletions": postDeletions,
            "tag-edits": tagEdits,
            "tag-aliases": tagAliases,
            "tag-deletions": tagDeletions,
            "groups": groups,
            "group-edits": groupEdits,
            "group-deletions": groupDeletions,
            "notes": notes,
            "reports": reports,
            "rejected": rejected
        }
        setItems(items)
    }

    useEffect(() => {
        checkNotifications()
    }, [])

    const generateModJSX = () => {
        if (modState === "posts") return <ModPosts/>
        if (modState === "post-edits") return <ModPostEdits/>
        if (modState === "post-deletions") return <ModPostDeletions/>
        if (modState === "tag-edits") return <ModTagEdits/>
        if (modState === "tag-aliases") return <ModTagAliases/>
        if (modState === "tag-deletions") return <ModTagDeletions/>
        if (modState === "groups") return <ModGroups/>
        if (modState === "group-edits") return <ModGroupEdits/>
        if (modState === "group-deletions") return <ModGroupDeletions/>
        if (modState === "notes") return <ModNotes/>
        if (modState === "reports") return <ModReports/>
        if (modState === "rejected") return <ModRejected/>
        return null
    }

    const getText = () => {
        if (modState === "posts") return i18n.sort.posts
        if (modState === "post-edits") return i18n.mod.postEdits
        if (modState === "post-deletions") return i18n.mod.postDeletions
        if (modState === "tag-edits") return i18n.mod.tagEdits
        if (modState === "tag-aliases") return i18n.mod.tagAliases
        if (modState === "tag-deletions") return i18n.mod.tagDeletions
        if (modState === "groups") return i18n.sort.groups
        if (modState === "group-edits") return i18n.mod.groupEdits
        if (modState === "group-deletions") return i18n.mod.groupDeletions
        if (modState === "notes") return i18n.navbar.notes
        if (modState === "reports") return i18n.mod.reports
        if (modState === "rejected") return i18n.mod.rejected
        return ""
    }

    const getIcon = (type: string) => {
        const hasNotifications = items[type]?.length
        if (type === "posts") return modState === "posts" ? modPostUploadActiveIcon : (hasNotifications ? modPostUploadNotifIcon : modPostUploadIcon)
        if (type === "post-edits") return modState === "post-edits" ? modPostEditActiveIcon : (hasNotifications ? modPostEditNotifIcon : modPostEditIcon)
        if (type === "post-deletions") return modState === "post-deletions" ? modPostDeleteActiveIcon : (hasNotifications ? modPostDeleteNotifIcon : modPostDeleteIcon)
        if (type === "tag-edits") return modState === "tag-edits" ? modTagEditActiveIcon : (hasNotifications ? modTagEditNotifIcon : modTagEditIcon)
        if (type === "tag-aliases") return modState === "tag-aliases" ? modTagAliasActiveIcon : (hasNotifications ? modTagAliasNotifIcon : modTagAliasIcon)
        if (type === "tag-deletions") return modState === "tag-deletions" ? modTagDeleteActiveIcon : (hasNotifications ? modTagDeleteNotifIcon : modTagDeleteIcon)
        if (type === "groups") return modState === "groups" ? modGroupAddActiveIcon : (hasNotifications ? modGroupAddNotifIcon : modGroupAddIcon)
        if (type === "group-edits") return modState === "group-edits" ? modGroupEditActiveIcon : (hasNotifications ? modGroupEditNotifIcon : modGroupEditIcon)
        if (type === "group-deletions") return modState === "group-deletions" ? modGroupDeleteActiveIcon : (hasNotifications ? modGroupDeleteNotifIcon : modGroupDeleteIcon)
        if (type === "notes") return modState === "notes" ? modNoteActiveIcon : (hasNotifications ? modNoteNotifIcon : modNoteIcon)
        if (type === "reports") return modState === "reports" ? modReportActiveIcon : (hasNotifications ? modReportNotifIcon : modReportIcon)
        if (type === "rejected") return modState === "rejected" ? modRejectedActiveIcon : (hasNotifications ? modRejectedNotifIcon : modRejectedIcon)
        return ""
    }

    if (!session.cookie) return null

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content">
                <div className="modqueue" onMouseEnter={() => setEnableDrag(true)} onMouseLeave={() => setEnableDrag(false)}>
                    {mobile ? <>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={getIcon("posts")} 
                        style={{filter: modState === "posts" ? "" : getFilter()}} onClick={() => setModState("posts")}/>
                        <img className="modqueue-icon" src={getIcon("post-edits")} 
                        style={{filter: modState === "post-edits" ? "" : getFilter()}} onClick={() => setModState("post-edits")}/>
                        {permissions.isAdmin(session) ? 
                            <img className="modqueue-icon" src={getIcon("post-deletions")} 
                            style={{filter: modState === "post-deletions" ? "" : getFilter()}} onClick={() => setModState("post-deletions")}/> 
                        : null}
                    </div>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={getIcon("tag-edits")} 
                        style={{filter: modState === "tag-edits" ? "" : getFilter()}} onClick={() => setModState("tag-edits")}/>
                        <img className="modqueue-icon" src={getIcon("tag-aliases")} 
                        style={{filter: modState === "tag-aliases" ? "" : getFilter()}} onClick={() => setModState("tag-aliases")}/>
                        <img className="modqueue-icon" src={getIcon("tag-deletions")} 
                        style={{filter: modState === "tag-deletions" ? "" : getFilter()}} onClick={() => setModState("tag-deletions")}/>
                    </div>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={getIcon("groups")} 
                        style={{filter: modState === "groups" ? "" : getFilter()}} onClick={() => setModState("groups")}/>
                        <img className="modqueue-icon" src={getIcon("group-edits")} 
                        style={{filter: modState === "group-edits" ? "" : getFilter()}} onClick={() => setModState("group-edits")}/>
                        <img className="modqueue-icon" src={getIcon("group-deletions")} 
                        style={{filter: modState === "group-deletions" ? "" : getFilter()}} onClick={() => setModState("group-deletions")}/>
                    </div>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={getIcon("notes")} 
                        style={{filter: modState === "notes" ? "" : getFilter()}} onClick={() => setModState("notes")}/>
                        <img className="modqueue-icon" src={getIcon("reports")} 
                        style={{filter: modState === "reports" ? "" : getFilter()}} onClick={() => setModState("reports")}/>
                        <img className="modqueue-icon" src={getIcon("rejected")} 
                        style={{filter: modState === "rejected" ? "" : getFilter()}} onClick={() => setModState("rejected")}/>
                    </div>
                    </> : <>
                    <div className="modqueue-icons">
                        <img className="modqueue-icon" src={getIcon("posts")} 
                        style={{filter: modState === "posts" ? "" : getFilter()}} onClick={() => setModState("posts")}/>
                        <img className="modqueue-icon" src={getIcon("post-edits")} 
                        style={{filter: modState === "post-edits" ? "" : getFilter()}} onClick={() => setModState("post-edits")}/>
                        {permissions.isAdmin(session) ? 
                            <img className="modqueue-icon" src={getIcon("post-deletions")} 
                            style={{filter: modState === "post-deletions" ? "" : getFilter()}} onClick={() => setModState("post-deletions")}/> 
                        : null}
                        <img className="modqueue-icon" src={getIcon("tag-edits")} 
                        style={{filter: modState === "tag-edits" ? "" : getFilter()}} onClick={() => setModState("tag-edits")}/>
                        <img className="modqueue-icon" src={getIcon("tag-aliases")} 
                        style={{filter: modState === "tag-aliases" ? "" : getFilter()}} onClick={() => setModState("tag-aliases")}/>
                        <img className="modqueue-icon" src={getIcon("tag-deletions")} 
                        style={{filter: modState === "tag-deletions" ? "" : getFilter()}} onClick={() => setModState("tag-deletions")}/>
                        <img className="modqueue-icon" src={getIcon("groups")} 
                        style={{filter: modState === "groups" ? "" : getFilter()}} onClick={() => setModState("groups")}/>
                        <img className="modqueue-icon" src={getIcon("group-edits")} 
                        style={{filter: modState === "group-edits" ? "" : getFilter()}} onClick={() => setModState("group-edits")}/>
                        <img className="modqueue-icon" src={getIcon("group-deletions")} 
                        style={{filter: modState === "group-deletions" ? "" : getFilter()}} onClick={() => setModState("group-deletions")}/>
                        <img className="modqueue-icon" src={getIcon("notes")} 
                        style={{filter: modState === "notes" ? "" : getFilter()}} onClick={() => setModState("notes")}/>
                        <img className="modqueue-icon" src={getIcon("reports")} 
                        style={{filter: modState === "reports" ? "" : getFilter()}} onClick={() => setModState("reports")}/>
                        <img className="modqueue-icon" src={getIcon("rejected")} 
                        style={{filter: modState === "rejected" ? "" : getFilter()}} onClick={() => setModState("rejected")}/>
                    </div></>}
                    <div className="modqueue-heading-container">
                        <span className="modqueue-heading">{getText()}</span>
                    </div>
                    {generateModJSX()}
                </div>
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default ModQueuePage