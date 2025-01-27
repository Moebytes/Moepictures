import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, 
useFlagSelector, useCacheActions, useGroupDialogActions, useSearchActions,
useGroupDialogSelector, useFilterSelector} from "../../store"
import {useHistory, useLocation} from "react-router-dom"
import TitleBar from "../../components/site/TitleBar"
import NavBar from "../../components/site/NavBar"
import SideBar from "../../components/site/SideBar"
import Footer from "../../components/site/Footer"
import functions from "../../structures/Functions"
import cryptoFunctions from "../../structures/CryptoFunctions"
import permissions from "../../structures/Permissions"
import groupReorder from "../../assets/icons/group-reorder.png"
import groupReorderActive from "../../assets/icons/group-reorder-active.png"
import groupHistory from "../../assets/icons/tag-history.png"
import groupAdd from "../../assets/icons/group-add.png"
import groupEdit from "../../assets/icons/tag-edit.png"
import groupDelete from "../../assets/icons/tag-delete.png"
import groupCancel from "../../assets/icons/group-cancel.png"
import groupCancelActive from "../../assets/icons/group-cancel-active.png"
import groupAccept from "../../assets/icons/group-accept.png"
import Reorder from "react-reorder"
import historyIcon from "../../assets/icons/history-state.png"
import currentIcon from "../../assets/icons/current.png"
import jsxFunctions from "../../structures/JSXFunctions"
import GroupThumbnail from "../../components/search/GroupThumbnail"
import "./styles/grouppage.less"
import {GroupPosts, GroupHistory, GroupItem, PostOrdered} from "../../types/Types"

interface Props {
    match: {params: {group: string}}
}

let limit = 25

const GroupPage: React.FunctionComponent<Props> = (props) => {
    const {siteHue, siteLightness, siteSaturation, i18n} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveGroup, setActiveDropdown} = useActiveActions()
    const {groupFlag} = useFlagSelector()
    const {setGroupFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setAddGroupPostObj, setDeleteGroupPostObj, setEditGroupObj, setDeleteGroupObj, setRevertGroupHistoryID, setRevertGroupHistoryFlag} = useGroupDialogActions()
    const {ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const {revertGroupHistoryID, revertGroupHistoryFlag} = useGroupDialogSelector()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {setPosts} = useCacheActions()
    const [reorderState, setReorderState] = useState(false)
    const [deleteMode, setDeleteMode] = useState(false)
    const [historyID, setHistoryID] = useState(null as string | null)
    const [group, setGroup] = useState(null as GroupPosts | null)
    const [items, setItems] = useState([] as GroupItem[])
    const history = useHistory()
    const location = useLocation()
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const slug = props.match.params.group

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

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
        limit = mobile ? 5 : 25
    }, [mobile])

    const groupInfo = async () => {
        let group = null as GroupPosts | null
        if (historyID) {
            const history = await functions.get("/api/group/history", {slug, historyID}, session, setSessionFlag).catch(() => null)
            group = history as unknown as GroupPosts
            let posts = await functions.get("/api/posts", {postIDs: group.posts.map((p) => p.postID)}, session, setSessionFlag).catch(() => []) as PostOrdered[]
            group.posts = posts.map((post: PostOrdered, i: number) => ({...post, order: group?.posts[i].order || 1}))
        } else {
            group = await functions.get("/api/group", {name: slug}, session, setSessionFlag).catch(() => null) as GroupPosts
        }
        if (!group) return functions.replaceLocation("/404")
        if (functions.isR18(group.rating)) {
            if (!session.cookie) return
            if (!session.showR18) return functions.replaceLocation("/404")
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

    const updateItems = async () => {
        if (!group) return
        let items = [] as GroupItem[]
        for (let i = 0; i < group.posts.length; i++) {
            const post = group.posts[i]
            if (!session.username) if (post.rating !== functions.r13()) continue
            if (functions.isR18(post.rating)) if (!session.showR18) continue
            const imageLink = functions.getThumbnailLink(post.images[0], "medium", session, mobile)
            const liveLink = functions.getThumbnailLink(post.images[0], "medium", session, mobile, true)
            let img = await functions.decryptThumb(imageLink, session)
            let live = await functions.decryptThumb(liveLink, session)
            items.push({id: post.order, image: img, live, post})
        }
        setItems(items)
    }

    useEffect(() => {
        if (group) {
            document.title = group.name
            setHeaderText(group.name)
            updateItems()
        }
    }, [group, ratingType, session])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const reorder = (event: React.MouseEvent, from: number, to: number) => {
        setItems((prev) => {
            const newState = [...prev]
            newState.splice(to, 0, newState.splice(from, 1)[0])
            return newState
        })
    }

    const groupImagesJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!group) return jsx
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const openPost = async (event: React.MouseEvent) => {
                if (deleteMode) {
                    return setDeleteGroupPostObj({postID: item.post.postID, group})
                }
                if (reorderState) return
                functions.openPost(item.post, event, history, session, setSessionFlag)
                setPosts(group.posts)
                setTimeout(() => {
                    setActiveGroup(group)
                }, 200)
            }
            jsx.push(
                <li key={item.id} style={{marginRight: "20px", marginTop: "10px"}}>
                    <GroupThumbnail image={item.image} live={item.live} onClick={openPost} style={{cursor: reorderState ? (deleteMode ? "crosshair" : "move") : "pointer"}}/>
                </li>
            )
        }
        return (
            <Reorder onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}
            reorderId="group-reorder-container" className="group-image-container" disabled={!reorderState || deleteMode}
            component="ul" holdTime={50} onReorder={reorder}>{jsx}</Reorder>
        )
    }

    const commitReorder = async () => {
        if (!group) return
        let posts = [] as {postID: string, order: number}[]
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            posts.push({postID: item.post.postID, order: i + 1})
        }
        functions.put("/api/group/reorder", {slug: group.slug, posts}, session, setSessionFlag)
        setReorderState(false)
    }

    const cancelReorder = () => {
        setReorderState(false)
        updateItems()
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

    const groupOptionsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (!group) return jsx
        if (session.username) {
            jsx.push(<img className="group-opt" src={groupHistory} onClick={() => history.push(`/group/history/${group.slug}`)} style={{filter: getFilter()}}/>)
            if (!session.banned) {
                jsx.push(<img className="group-opt" src={reorderState ? groupReorderActive : groupReorder} onClick={() => changeReorderState()} style={{filter: reorderState ? "" : getFilter()}}/>)
                if (reorderState) {
                    jsx.push(<img className="group-opt" src={groupAccept} onClick={() => commitReorder()} style={{filter: getFilter()}}/>)
                }
            }
            jsx.push(<img className="group-opt" src={deleteMode ? groupCancelActive : groupCancel} onClick={() => setDeleteMode((prev: boolean) => !prev)} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={groupAdd} onClick={() => showGroupAddDialog()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={groupEdit} onClick={() => showGroupEditDialog()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={groupDelete} onClick={() => showGroupDeleteDialog()} style={{filter: getFilter()}}/>)
        }
        return jsx
    }

    const searchGroup = (event: React.MouseEvent, alias?: string) => {
        if (!group) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open("/posts", "_blank")
        } else {
            history.push("/posts")
        }
        setSearch(`group:${group.slug}`)
        setSearchFlag(true)
    }

    const currentHistory = (key?: string) => {
        history.push(`/group/${key ? key : slug}`)
        setHistoryID(null)
    }

    const revertGroupHistory = async () => {
        if (!group) return
        await functions.put("/api/group/reorder", {slug, posts: group.posts}, session, setSessionFlag)
        await functions.put("/api/group/edit", {slug, name: group.name, description: group.description}, session, setSessionFlag)
        currentHistory(functions.generateSlug(group.name))
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
                <button className="history-button" onClick={() => history.push(`/group/history/${slug}`)}>
                    <img src={historyIcon}/>
                    <span>History</span>
                </button>
                {session.username ? <button className="history-button" onClick={revertGroupHistoryDialog}>
                    <span>⌫Revert</span>
                </button> : null}
                <button className="history-button" onClick={() => currentHistory()}>
                    <img src={currentIcon}/>
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
                        <span className="group-text">{group.description ? jsxFunctions.renderCommentaryText(group.description) : i18n.labels.noDesc}</span>
                    </div>
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span><span className="group-label" onClick={searchGroup}>{i18n.sort.posts}</span> <span className="group-label-alt">{group.postCount}</span></span>
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