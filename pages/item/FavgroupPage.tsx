/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, 
useFlagSelector, useCacheActions, useGroupDialogActions, useSearchActions, useActiveSelector,
useMiscDialogActions} from "../../store"
import {useNavigate, useParams, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import ReorderIcon from "../../assets/svg/reorder.svg"
import CancelIcon from "../../assets/svg/cancel.svg"
import AcceptIcon from "../../assets/svg/accept.svg"
import AddIcon from "../../assets/svg/add.svg"
import EditIcon from "../../assets/svg/edit.svg"
import RemapIcon from "../../assets/svg/remap.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import LockIcon from "../../assets/svg/lock.svg"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import {ReactSortable} from "react-sortablejs"
import TinyImage from "../../components/image/TinyImage"
import usePaginatedScroll from "../../components/site/usePaginatedScroll"
import PageControls from "../../components/site/PageControls"
import {GroupItem, Favgroup} from "../../types/Types"
import "./styles/grouppage.less"

let pageAmount = 50

const FavgroupPage: React.FunctionComponent = () => {
    const {i18n, siteHue, siteLightness, siteSaturation} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {reorderState} = useActiveSelector()
    const {setHeaderText, setSidebarText, setActiveFavgroup, setActiveDropdown, setReorderState} = useActiveActions()
    const {groupFlag} = useFlagSelector()
    const {setGroupFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setPremiumRequired} = useMiscDialogActions()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setAddFavgroupPostObj, setEditFavGroupObj, setDeleteFavGroupObj, setRemapFavGroupObj} = useGroupDialogActions()
    const {ratingType, scroll} = useSearchSelector()
    const {setSearch, setSearchFlag, setScroll} = useSearchActions()
    const [deleteMode, setDeleteMode] = useState(false)
    const {setNavigationPosts} = useCacheActions()
    const [favgroup, setFavgroup] = useState(null as Favgroup | null)
    const navigate = useNavigate()
    const location = useLocation()
    const {username, favgroup: favgroupName} = useParams() as {username: string, favgroup: string}

    useEffect(() => {
        setHideNavbar(true)
        setHideTitlebar(true)
        setHideSidebar(false)
        setRelative(false)
        setActiveDropdown("none")
        setSidebarText("")
    }, [location])

    useEffect(() => {
        if (!session.cookie) return
    }, [session])

    useEffect(() => {
        setRelative(mobile ? true : false)
    }, [mobile])

    const loadInitial = async () => {
        if (!favgroup) return []
        const items = [] as GroupItem[]

        for (const post of favgroup.posts) {
            if (functions.post.isR18(post.rating)) if (!session.showR18) continue
            const imageLink = functions.link.getThumbnailLink(post.images[0], "medium", session, mobile)
            const liveLink = functions.link.getThumbnailLink(post.images[0], "medium", session, mobile, true)

            const img = await functions.crypto.decryptThumb(imageLink, session)
            const live = await functions.crypto.decryptThumb(liveLink, session)
            items.push({id: post.order, image: img, live, post})
        }
        return items
    }

    const {items, setItems, visibleItems, setVisible, page, setPage, maxPage, 
        initItems, toggleScroll} = usePaginatedScroll({loadInitial, pageAmount})

    const favgroupInfo = async () => {
        let favgroup = await functions.http.get("/api/favgroup", {name: favgroupName, username}, session, setSessionFlag).catch(() => null)
        if (!favgroup) return functions.dom.replaceLocation("/404")
        if (functions.post.isR18(favgroup.rating)) {
            if (!session.cookie) return
            if (!session.showR18) return functions.dom.replaceLocation("/404")
        }
        setFavgroup(favgroup)
    }

    useEffect(() => {
        favgroupInfo()
    }, [favgroupName, session])

    useEffect(() => {
        if (groupFlag) {
            favgroupInfo()
            setGroupFlag(false)
        }
    }, [favgroupName, session, groupFlag])

    useEffect(() => {
        if (favgroup) {
            document.title = favgroup.name
            setHeaderText(favgroup.name)
            if (favgroup.private) {
                if (session.username !== username) return functions.dom.replaceLocation("/403")
            }
            initItems()
        }
    }, [favgroup, ratingType, session])

    const syncList = (newList: GroupItem[]) => {
        setVisible(newList)

        const baseOffset = scroll ? 0 : (page - 1) * pageAmount

        setItems((prev) => {
            const updated = [...prev]
            updated.splice(baseOffset, newList.length, ...newList)
            return updated
        })
    }

    const favgroupImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!favgroup) return jsx

        for (let i = 0; i < visibleItems.length; i++) {
            const item = visibleItems[i]
            if (!item) continue

            const openPost = async (event: React.MouseEvent) => {
                if (deleteMode) {
                    await functions.http.delete("/api/favgroup/post/delete", {postID: item.post.postID, name: favgroup.name}, 
                        session, setSessionFlag)
                    return setGroupFlag(true)
                }
                if (reorderState) return
                functions.post.openPost(item.post, event, navigate, session, setSessionFlag)
                setNavigationPosts(favgroup.posts)
                setTimeout(() => {
                    setActiveFavgroup(favgroup)
                }, 200)
            }

            jsx.push(
                <li key={item.post.postID} style={{marginRight: "20px", marginTop: "10px"}}>
                    <TinyImage className="group-thumbnail-img-outlined" image={item.image} live={item.live} height={300}
                    onClick={openPost} style={{cursor: reorderState ? (deleteMode ? "crosshair" : "move") : "pointer"}}/>
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
        if (!favgroup) return
        let posts = [] as {postID: string, order: number}[]
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            posts.push({postID: item.post.postID, order: i + 1})
        }
        functions.http.put("/api/favgroup/reorder", {name: favgroup.name, posts}, session, setSessionFlag)
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

    const showFavgroupAddDialog = async () => {
        if (permissions.isPremium(session)) {
            setAddFavgroupPostObj(favgroup)
        } else {
            setPremiumRequired(true)
        }
    }

    const showFavgroupDeleteDialog = async () => {
        setDeleteFavGroupObj(favgroup)
    }

    const showFavgroupEditDialog = async () => {
        setEditFavGroupObj(favgroup)
    }

    const showFavgroupRemapDialog = async () => {
        if (permissions.isPremium(session)) {
            setRemapFavGroupObj(favgroup)
        } else {
            setPremiumRequired(true)
        }
    }

    const favgroupOptionsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (session.username === username) {
            jsx.push(reorderState ? 
                <ReorderIcon className="group-opt-pink" onClick={() => changeReorderState()}/> :
                <ReorderIcon className="group-opt" onClick={() => changeReorderState()}/>)
            if (reorderState) {
                jsx.push(<AcceptIcon className="group-opt" onClick={() => commitReorder()}/>)
            }
            jsx.push(deleteMode ? 
                <CancelIcon className="group-opt-pink" onClick={() => setDeleteMode((prev: boolean) => !prev)}/> :
                <CancelIcon className="group-opt" onClick={() => setDeleteMode((prev: boolean) => !prev)}/>)
            jsx.push(<AddIcon className="group-opt" onClick={() => showFavgroupAddDialog()}/>)
            jsx.push(<EditIcon className="group-opt" onClick={() => showFavgroupEditDialog()}/>)
            jsx.push(<RemapIcon className="group-opt" onClick={() => showFavgroupRemapDialog()}/>)
            jsx.push(<DeleteIcon className="group-opt" onClick={() => showFavgroupDeleteDialog()}/>)
        }
        return jsx
    }

    const searchGroup = (event: React.MouseEvent, alias?: string) => {
        if (!favgroup) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open("/posts", "_blank")
        } else {
            navigate("/posts")
        }
        setSearch(`favgroup:${username}:${favgroup.name}`)
        setSearchFlag(true)
    }

    return (
        <>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {favgroup ? 
                <div className="group-page">
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {favgroup.private ? <LockIcon className="group-icon"/> : null}
                        <span className="group-heading">{favgroup.name}</span>
                        {favgroupOptionsJSX()}
                    </div>
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span><span className="group-label" onClick={searchGroup}>{i18n.sort.posts}</span> <span className="group-label-alt">{favgroup.postCount}</span></span>
                        <div className="group-page-container" onClick={() => toggleScroll()}>
                            {scroll ?
                            <ScrollIcon className="group-mini-icon"/> :
                            <PagesIcon className="group-mini-icon"/>}
                            <span className="group-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span>
                        </div>
                    </div>
                    {favgroupImagesJSX()}
                </div> : null}
                <Footer/>
            </div>
        </div>
        </>
    )
}

export default FavgroupPage