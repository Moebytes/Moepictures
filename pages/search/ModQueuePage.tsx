/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

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
import functions from "../../functions/Functions"
import ModPostUploadIcon from "../../assets/svg/mod-post-upload.svg"
import ModPostEditIcon from "../../assets/svg/mod-post-edit.svg"
import ModPostDeleteIcon from "../../assets/svg/mod-post-delete.svg"
import ModTagEditIcon from "../../assets/svg/mod-tag-edit.svg"
import ModTagAliasIcon from "../../assets/svg/mod-tag-alias.svg"
import ModTagDeleteIcon from "../../assets/svg/mod-tag-delete.svg"
import ModGroupAddIcon from "../../assets/svg/mod-group-add.svg"
import ModGroupEditIcon from "../../assets/svg/mod-group-edit.svg"
import ModGroupDeleteIcon from "../../assets/svg/mod-group-delete.svg"
import ModNoteIcon from "../../assets/svg/note.svg"
import ModReportIcon from "../../assets/svg/report.svg"
import ModRejectedIcon from "../../assets/svg/delete.svg"

import ModPostUploadNotifIcon from "../../assets/svg/mod-post-upload-notif.svg"
import ModGroupAddNotifIcon from "../../assets/svg/mod-group-add-notif.svg"
import ModPostEditNotifIcon from "../../assets/svg/mod-post-edit-notif.svg"
import ModPostDeleteNotifIcon from "../../assets/svg/mod-post-delete-notif.svg"
import ModTagEditNotifIcon from "../../assets/svg/mod-tag-edit-notif.svg"
import ModTagAliasNotifIcon from "../../assets/svg/mod-tag-alias-notif.svg"
import ModTagDeleteNotifIcon from "../../assets/svg/mod-tag-delete-notif.svg"
import ModGroupEditNotifIcon from "../../assets/svg/mod-group-edit-notif.svg"
import ModGroupDeleteNotifIcon from "../../assets/svg/mod-group-delete-notif.svg"
import ModNoteNotifIcon from "../../assets/svg/note-notif.svg"
import ModReportNotifIcon from "../../assets/svg/report-notif.svg"
import ModRejectedNotifIcon from "../../assets/svg/delete-notif.svg"
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
            functions.dom.replaceLocation("/401")
        }
    }, [session])

    const checkNotifications = async () => {
        const posts = await functions.http.get("/api/post/list/unverified", null, session, setSessionFlag)
        const postEdits = await functions.http.get("/api/post-edits/list/unverified", null, session, setSessionFlag)
        const postDeletions = await functions.http.get("/api/post/delete/request/list", null, session, setSessionFlag)
        const tagEdits = await functions.http.get("/api/tag/edit/request/list", null, session, setSessionFlag)
        const tagDeletions = await functions.http.get("/api/tag/delete/request/list", null, session, setSessionFlag)
        const tagAliases = await functions.http.get("/api/tag/aliasto/request/list", null, session, setSessionFlag)
        const groups = await functions.http.get("/api/group/request/list", null, session, setSessionFlag)
        const groupEdits = await functions.http.get("/api/group/edit/request/list", null, session, setSessionFlag)
        const groupDeletions = await functions.http.get("/api/group/delete/request/list", null, session, setSessionFlag)
        const notes = await functions.http.get("/api/note/list/unverified", null, session, setSessionFlag)
        const reports = await functions.http.get("/api/search/reports", null, session, setSessionFlag)
        const rejected = await functions.http.get("/api/post/deleted/unverified", null, session, setSessionFlag)
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

    const getModIcon = (type: string) => {
        const hasNotifications = items[type]?.length
        if (type === "posts") return modState === "posts" ? 
            <ModPostUploadIcon className="modqueue-icon-pink" onClick={() => setModState("posts")}/> : 
            (hasNotifications ?
                <ModPostUploadNotifIcon className="modqueue-icon" onClick={() => setModState("posts")}/> : 
                <ModPostUploadIcon className="modqueue-icon" onClick={() => setModState("posts")}/>)
        if (type === "post-edits") return modState === "post-edits" ? 
            <ModPostEditIcon className="modqueue-icon-pink" onClick={() => setModState("post-edits")}/> : 
            (hasNotifications ?
                <ModPostEditNotifIcon className="modqueue-icon" onClick={() => setModState("post-edits")}/> : 
                <ModPostEditIcon className="modqueue-icon" onClick={() => setModState("post-edits")}/>)
        if (type === "post-deletions") return modState === "post-deletions" ? 
            <ModPostDeleteIcon className="modqueue-icon-pink" onClick={() => setModState("post-deletions")}/> : 
            (hasNotifications ?
                <ModPostDeleteNotifIcon className="modqueue-icon" onClick={() => setModState("post-deletions")}/> : 
                <ModPostDeleteIcon className="modqueue-icon" onClick={() => setModState("post-deletions")}/>)
        if (type === "tag-edits") return modState === "tag-edits" ? 
            <ModTagEditIcon className="modqueue-icon-pink" onClick={() => setModState("tag-edits")}/> : 
            (hasNotifications ?
                <ModTagEditNotifIcon className="modqueue-icon" onClick={() => setModState("tag-edits")}/> : 
                <ModTagEditIcon className="modqueue-icon" onClick={() => setModState("tag-edits")}/>)
        if (type === "tag-aliases") return modState === "tag-aliases" ? 
            <ModTagAliasIcon className="modqueue-icon-pink" onClick={() => setModState("tag-aliases")}/> : 
            (hasNotifications ?
                <ModTagAliasNotifIcon className="modqueue-icon" onClick={() => setModState("tag-aliases")}/> : 
                <ModTagAliasIcon className="modqueue-icon" onClick={() => setModState("tag-aliases")}/>)
        if (type === "tag-deletions") return modState === "tag-deletions" ? 
            <ModTagDeleteIcon className="modqueue-icon-pink" onClick={() => setModState("tag-deletions")}/> : 
            (hasNotifications ?
                <ModTagDeleteNotifIcon className="modqueue-icon" onClick={() => setModState("tag-deletions")}/> : 
                <ModTagDeleteIcon className="modqueue-icon" onClick={() => setModState("tag-deletions")}/>)
        if (type === "groups") return modState === "groups" ? 
            <ModGroupAddIcon className="modqueue-icon-pink" onClick={() => setModState("groups")}/> : 
            (hasNotifications ?
                <ModGroupAddNotifIcon className="modqueue-icon" onClick={() => setModState("groups")}/> : 
                <ModGroupAddIcon className="modqueue-icon" onClick={() => setModState("groups")}/>)
        if (type === "group-edits") return modState === "group-edits" ? 
            <ModGroupEditIcon className="modqueue-icon-pink" onClick={() => setModState("group-edits")}/> : 
            (hasNotifications ?
                <ModGroupEditNotifIcon className="modqueue-icon" onClick={() => setModState("group-edits")}/> : 
                <ModGroupEditIcon className="modqueue-icon" onClick={() => setModState("group-edits")}/>)
        if (type === "group-deletions") return modState === "group-deletions" ? 
            <ModGroupDeleteIcon className="modqueue-icon-pink" onClick={() => setModState("group-deletions")}/> : 
            (hasNotifications ?
                <ModGroupDeleteNotifIcon className="modqueue-icon" onClick={() => setModState("group-deletions")}/> : 
                <ModGroupDeleteIcon className="modqueue-icon" onClick={() => setModState("group-deletions")}/>)
        if (type === "notes") return modState === "notes" ? 
            <ModNoteIcon className="modqueue-icon-pink" onClick={() => setModState("notes")}/> : 
            (hasNotifications ?
                <ModNoteNotifIcon className="modqueue-icon" onClick={() => setModState("notes")}/> : 
                <ModNoteIcon className="modqueue-icon" onClick={() => setModState("notes")}/>)
        if (type === "reports") return modState === "reports" ? 
            <ModReportIcon className="modqueue-icon-pink" onClick={() => setModState("reports")}/> : 
            (hasNotifications ?
                <ModReportNotifIcon className="modqueue-icon" onClick={() => setModState("reports")}/> : 
                <ModReportIcon className="modqueue-icon" onClick={() => setModState("reports")}/>)
        if (type === "rejected") return modState === "rejected" ? 
            <ModRejectedIcon className="modqueue-icon-pink" onClick={() => setModState("rejected")}/> : 
            (hasNotifications ?
                <ModRejectedNotifIcon className="modqueue-icon" onClick={() => setModState("rejected")}/> : 
                <ModRejectedIcon className="modqueue-icon" onClick={() => setModState("rejected")}/>)
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
                        {getModIcon("posts")} 
                        {getModIcon("post-edits")} 
                        {permissions.isAdmin(session) ? 
                            (getModIcon("post-deletions"))
                        : null}
                    </div>
                    <div className="modqueue-icons">
                        {getModIcon("tag-edits")}
                        {getModIcon("tag-aliases")} 
                        {getModIcon("tag-deletions")} 
                    </div>
                    <div className="modqueue-icons">
                        {getModIcon("groups")} 
                        {getModIcon("group-edits")} 
                        {getModIcon("group-deletions")} 
                    </div>
                    <div className="modqueue-icons">
                        {getModIcon("notes")} 
                        {getModIcon("reports")} 
                        {getModIcon("rejected")}
                    </div>
                    </> : <>
                    <div className="modqueue-icons">
                        {getModIcon("posts")}
                        {getModIcon("post-edits")}
                        {permissions.isAdmin(session) ? 
                            (getModIcon("post-deletions"))
                        : null}
                        {getModIcon("tag-edits")}
                        {getModIcon("tag-aliases")}
                        {getModIcon("tag-deletions")}
                        {getModIcon("groups")}
                        {getModIcon("group-edits")}
                        {getModIcon("group-deletions")}
                        {getModIcon("notes")}
                        {getModIcon("reports")}
                        {getModIcon("rejected")}
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