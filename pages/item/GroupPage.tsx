/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, 
useFlagSelector, useCacheActions, useGroupDialogActions, useSearchActions,
useGroupDialogSelector, useActiveSelector} from "../../store"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import HistoryIcon from "../../assets/svg/history.svg"
import ReorderIcon from "../../assets/svg/reorder.svg"
import CancelIcon from "../../assets/svg/cancel.svg"
import AcceptIcon from "../../assets/svg/accept.svg"
import AddIcon from "../../assets/svg/add.svg"
import EditIcon from "../../assets/svg/edit.svg"
import RemapIcon from "../../assets/svg/remap.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import HistoryThinIcon from "../../assets/svg/history-thin.svg"
import CurrentIcon from "../../assets/svg/current.svg"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import {ReactSortable} from "react-sortablejs"
import GroupThumbnail from "../../components/search/GroupThumbnail"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {GroupPosts, GroupItem, PostOrdered} from "../../types/Types"
import "./styles/grouppage.less"

let pageAmount = 50

const GroupPage: React.FunctionComponent = () => {
    const {siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {reorderState} = useActiveSelector()
    const {setHeaderText, setSidebarText, setActiveGroup, setActiveDropdown, setReorderState} = useActiveActions()
    const {groupFlag} = useFlagSelector()
    const {setGroupFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setAddGroupPostObj, setDeleteGroupPostObj, setEditGroupObj, setDeleteGroupObj, 
    setRevertGroupHistoryID, setRevertGroupHistoryFlag, setRemapGroupObj} = useGroupDialogActions()
    const {ratingType, scroll} = useSearchSelector()
    const {setSearch, setSearchFlag, setScroll} = useSearchActions()
    const {revertGroupHistoryID, revertGroupHistoryFlag} = useGroupDialogSelector()
    const {setNavigationPosts} = useCacheActions()
    const [deleteMode, setDeleteMode] = useState(false)
    const [historyID, setHistoryID] = useState(null as string | null)
    const [group, setGroup] = useState(null as GroupPosts | null)
    const [listItems, setListItems] = useState([] as {id: number, item: GroupItem, jsx: React.ReactElement}[])
    const navigate = useNavigate()
    const location = useLocation()
    const {group: slug} = useParams() as {group: string}

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setSidebarText("")
        const historyParam = new URLSearchParams(window.location.search).get("history")
        setHistoryID(historyParam)
    }, [location])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async () => {
        if (!group) return []
        let items = [] as GroupItem[]

        for (let i = 0; i < group.posts.length; i++) {
            const post = group.posts[i]
            if (!session.username) if (post.rating !== functions.r13()) continue
            if (functions.post.isR18(post.rating)) if (!session.showR18) continue

            const imageLink = functions.link.getThumbnailLink(post.images[0], "medium", session, mobile)
            const liveLink = functions.link.getThumbnailLink(post.images[0], "medium", session, mobile, true)

            let img = await functions.crypto.decryptThumb(imageLink, session)
            let live = await functions.crypto.decryptThumb(liveLink, session)
            items.push({id: post.order, image: img, live, post})
        }

        return items
    }

    const {items, setItems, visibleItems, setVisible, page, setPage, maxPage, 
        initItems, toggleScroll} = usePaginatedScroll({loadInitial, pageAmount})

    const groupInfo = async () => {
        let group = null as GroupPosts | null
        if (historyID) {
            const history = await functions.http.get("/api/group/history", {slug, historyID}, session, setSessionFlag).then((r) => r[0])
            group = history as unknown as GroupPosts
            let posts = await functions.http.get("/api/posts", {postIDs: group.posts.map((p) => p.postID)}, session, setSessionFlag).catch(() => []) as PostOrdered[]
            group.posts = posts.map((post: PostOrdered, i: number) => ({...post, order: group?.posts[i].order || 1}))
        } else {
            group = await functions.http.get("/api/group", {name: slug}, session, setSessionFlag).catch(() => null) as GroupPosts
        }
        if (!group) return functions.dom.replaceLocation("/404")
        if (functions.post.isR18(group.rating)) {
            if (!session.cookie) return
            if (!session.showR18) return functions.dom.replaceLocation("/404")
        }
        setGroup(group)
    }

    useEffect(() => {
        groupInfo()
    }, [slug, historyID, session])

    useEffect(() => {
        if (groupFlag) {
            groupInfo()
            setGroupFlag(false)
        }
    }, [slug, historyID, session, groupFlag])

    useEffect(() => {
        if (group) {
            document.title = group.name
            setHeaderText(group.name)
            initItems()
        }
    }, [group, ratingType, session])

    const syncList = (newList: GroupItem[]) => {
        setVisible(newList)

        const baseOffset = scroll ? 0 : (page - 1) * pageAmount

        setItems((prev) => {
            const updated = [...prev]
            updated.splice(baseOffset, newList.length, ...newList)
            return updated
        })
    }

    const groupImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!group) return jsx

        for (let i = 0; i < visibleItems.length; i++) {
            const item = visibleItems[i]
            if (!item) continue

            const openPost = async (event: React.MouseEvent) => {
                if (deleteMode) {
                    return setDeleteGroupPostObj({postID: item.post.postID, group})
                }
                if (reorderState) return
                functions.post.openPost(item.post, event, navigate, session, setSessionFlag)
                setNavigationPosts(group.posts)
                setTimeout(() => {
                    setActiveGroup(group)
                }, 200)
            }

            jsx.push(
                <li key={item.id} style={{marginRight: "20px", marginTop: "10px"}}>
                    <GroupThumbnail image={item.image} live={item.live} onClick={openPost} 
                    style={{cursor: reorderState ? (deleteMode ? "crosshair" : "move") : "pointer"}}/>
                </li>
            )
        }
        return (
            <>
            <ReactSortable tag="ul" list={visibleItems} setList={syncList} animation={50}
            disabled={!reorderState || deleteMode} className="group-image-container"
            ghostClass="list-ghost" chosenClass="list-chosen" dragClass="list-drag">
                {jsx}
            </ReactSortable>
            {!scroll ? <PageControls page={page} maxPage={maxPage} setPage={setPage}/> : null}
            </>
        )
    }

    const commitReorder = async () => {
        if (!group) return
        let posts = [] as {postID: string, order: number}[]
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            posts.push({postID: item.post.postID, order: i + 1})
        }
        functions.http.put("/api/group/reorder", {slug: group.slug, posts}, session, setSessionFlag)
        setReorderState(false)
    }

    const cancelReorder = () => {
        setReorderState(false)
        initItems()
    }

    const changeReorderState = () => {
        if (reorderState) {
            cancelReorder()
        } else {
            setReorderState(true)
        }
    }

    const showGroupAddDialog = async () => {
        setAddGroupPostObj(group)
    }

    const showGroupEditDialog = async () => {
        setEditGroupObj(group)
    }

    const showGroupDeleteDialog = async () => {
        setDeleteGroupObj(group)
    }

    const showGroupRemapDialog = async () => {
        setRemapGroupObj(group)
    }

    const groupOptionsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!group) return jsx
        if (session.username) {
            jsx.push(<HistoryIcon className="group-opt" onClick={() => navigate(`/group/history/${group.slug}`)}/>)
            if (!session.banned) {
                jsx.push(reorderState ? 
                    <ReorderIcon className="group-opt-pink" onClick={() => changeReorderState()}/> :
                    <ReorderIcon className="group-opt" onClick={() => changeReorderState()}/>)
                if (reorderState) {
                    jsx.push(<AcceptIcon className="group-opt" onClick={() => commitReorder()}/>)
                }
            }
            jsx.push(deleteMode ? 
                <CancelIcon className="group-opt-pink" onClick={() => setDeleteMode((prev: boolean) => !prev)}/> :
                <CancelIcon className="group-opt" onClick={() => setDeleteMode((prev: boolean) => !prev)}/>)
            jsx.push(<AddIcon className="group-opt" onClick={() => showGroupAddDialog()}/>)
            jsx.push(<EditIcon className="group-opt" onClick={() => showGroupEditDialog()}/>)
            jsx.push(<RemapIcon className="group-opt" onClick={() => showGroupRemapDialog()}/>)
            jsx.push(<DeleteIcon className="group-opt" onClick={() => showGroupDeleteDialog()}/>)
        }
        return jsx
    }

    const searchGroup = (event: React.MouseEvent, alias?: string) => {
        if (!group) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open("/posts", "_blank")
        } else {
            navigate("/posts")
        }
        setSearch(`group:${group.slug}`)
        setSearchFlag(true)
    }

    const currentHistory = (key?: string) => {
        navigate(`/group/${key ? key : slug}`)
        setHistoryID(null)
    }

    const revertGroupHistory = async () => {
        if (!group) return
        await functions.http.put("/api/group/reorder", {slug, posts: group.posts}, session, setSessionFlag)
        await functions.http.put("/api/group/edit", {slug, name: group.name, description: group.description}, session, setSessionFlag)
        currentHistory(functions.post.generateSlug(group.name))
    }

    useEffect(() => {
        if (revertGroupHistoryFlag && historyID === revertGroupHistoryID?.historyID) {
            revertGroupHistory().then(() => {
                setRevertGroupHistoryFlag(false)
                setRevertGroupHistoryID(null)
            }).catch(() => {
                setRevertGroupHistoryFlag(false)
                setRevertGroupHistoryID({failed: true, historyID})
            })
        }
    }, [revertGroupHistoryFlag, revertGroupHistoryID, historyID, group, session])

    const revertGroupHistoryDialog = async () => {
        setRevertGroupHistoryID({failed: false, historyID})
    }

    const getHistoryButtons = () => {
        return (
            <div className="history-button-container">
                <button className="history-button" onClick={() => navigate(`/group/history/${slug}`)}>
                    <HistoryThinIcon className="history-button-icon"/>
                    <span>History</span>
                </button>
                {session.username ? <button className="history-button" onClick={revertGroupHistoryDialog}>
                    <span>⌫Revert</span>
                </button> : null}
                <button className="history-button" onClick={() => currentHistory()}>
                    <CurrentIcon className="history-button-icon"/>
                    <span>Current</span>
                </button>
            </div>
        )
    }

    return (
        <>
        <TitleBar historyID={historyID}/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {group ? 
                <div className="group-page">
                    {historyID ? getHistoryButtons() : null}
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="group-heading">{group.name}</span>
                        {groupOptionsJSX()}
                    </div>
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="group-text">{group.description ? functions.jsx.renderCommentaryText(group.description) : i18n.labels.noDesc}</span>
                    </div>
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span><span className="group-label" onClick={searchGroup}>{i18n.sort.posts}</span> <span className="group-label-alt">{group.postCount}</span></span>
                        <div className="group-page-container" onClick={() => toggleScroll()}>
                            {scroll ? 
                            <ScrollIcon className="group-mini-icon"/> :
                            <PagesIcon className="group-mini-icon"/>}
                            <span className="group-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div>
                    </div>
                    {groupImagesJSX()}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default GroupPage