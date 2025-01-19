import React, {useEffect, useState} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
useLayoutActions, useActiveActions, useFlagActions, useLayoutSelector, useSearchSelector, 
useFlagSelector, useCacheActions, useGroupDialogActions, useSearchActions} from "../../store"
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
import lockIcon from "../../assets/icons/private-lock.png"
import Reorder from "react-reorder"
import EffectImage from "../../components/image/EffectImage"
import "./styles/grouppage.less"
import {GroupItem, Favgroup} from "../../types/Types"

interface Props {
    match: {params: {username: string, favgroup: string}}
}

let limit = 25

const FavgroupPage: React.FunctionComponent<Props> = (props) => {
    const {i18n, siteHue, siteLightness, siteSaturation} = useThemeSelector()
    const {setHideNavbar, setHideTitlebar, setHideSidebar, setRelative} = useLayoutActions()
    const {setEnableDrag} = useInteractionActions()
    const {setHeaderText, setSidebarText, setActiveFavgroup, setActiveDropdown} = useActiveActions()
    const {groupFlag} = useFlagSelector()
    const {setGroupFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {mobile} = useLayoutSelector()
    const {setAddFavgroupPostObj, setEditFavGroupObj, setDeleteFavGroupObj} = useGroupDialogActions()
    const {ratingType} = useSearchSelector()
    const {setSearch, setSearchFlag} = useSearchActions()
    const [reorderState, setReorderState] = useState(false)
    const [deleteMode, setDeleteMode] = useState(false)
    const {setPosts} = useCacheActions()
    const [favgroup, setFavgroup] = useState(null as Favgroup | null)
    const [items, setItems] = useState([] as GroupItem[])
    const history = useHistory()
    const location = useLocation()
    const username = props.match.params.username
    const favgroupName = props.match.params.favgroup

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
    }, [location])

    useEffect(() => {
        if (!session.cookie) return
        if (!session.username) {
            functions.replaceLocation("/401")
        }
    }, [session])

    useEffect(() => {
        limit = mobile ? 5 : 25
    }, [mobile])

    const favgroupInfo = async () => {
        let favgroup = await functions.get("/api/favgroup", {name: favgroupName, username}, session, setSessionFlag).catch(() => null)
        if (!favgroup) return functions.replaceLocation("/404")
        if (functions.isR18(favgroup.rating)) {
            if (!session.cookie) return
            if (!session.showR18) return functions.replaceLocation("/404")
        }
        setFavgroup(favgroup)
    }

    useEffect(() => {
        if (session.username) {
            favgroupInfo()
        }
    }, [favgroupName, session])

    useEffect(() => {
        if (groupFlag) {
            favgroupInfo()
            setGroupFlag(false)
        }
    }, [favgroupName, session, groupFlag])

    const updateItems = async () => {
        if (!favgroup) return
        let items = [] as GroupItem[]
        for (let i = 0; i < favgroup.posts.length; i++) {
            const post = favgroup.posts[i]
            if (functions.isR18(post.rating)) if (!session.showR18) continue
            const imageLink = functions.getThumbnailLink(post.images[0]?.type, post.postID, post.images[0]?.order, post.images[0]?.filename, "medium", mobile)
            let img = await functions.decryptThumb(imageLink, session)
            items.push({id: post.order, image: img, post})
        }
        setItems(items)
    }

    useEffect(() => {
        if (favgroup) {
            document.title = favgroup.name
            setHeaderText(favgroup.name)
            if (favgroup.private) {
                if (session.username !== username) return functions.replaceLocation("/403")
            }
            updateItems()
        }
    }, [favgroup, ratingType, session])

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

    const favgroupImagesJSX = () => {
        if (!favgroup) return
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const openPost = async (event: React.MouseEvent) => {
                if (deleteMode) {
                    await functions.delete("/api/favgroup/post/delete", {postID: item.post.postID, name: favgroup.name}, session, setSessionFlag)
                    return setGroupFlag(true)
                }
                if (reorderState) return
                functions.openPost(item.post, event, history, session, setSessionFlag)
                setPosts(favgroup.posts)
                setTimeout(() => {
                    setActiveFavgroup(favgroup)
                }, 200)
            }
            jsx.push(
                <li key={item.id} style={{marginRight: "20px", marginTop: "10px"}}>
                    <EffectImage className="group-thumbnail-img-outlined" image={item.image} height={300}
                    onClick={openPost} style={{cursor: reorderState ? (deleteMode ? "crosshair" : "move") : "pointer"}}/>
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
        if (!favgroup) return
        let posts = [] as {postID: string, order: number}[]
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            posts.push({postID: item.post.postID, order: i + 1})
        }
        functions.put("/api/favgroup/reorder", {name: favgroup.name, posts}, session, setSessionFlag)
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

    const showFavgroupAddDialog = async () => {
        setAddFavgroupPostObj(favgroup)
    }

    const showFavgroupDeleteDialog = async () => {
        setDeleteFavGroupObj(favgroup)
    }

    const showFavgroupEditDialog = async () => {
        setEditFavGroupObj(favgroup)
    }

    const favgroupOptionsJSX = () => {
        let jsx = [] as React.ReactElement[]
        if (session.username === username) {
            jsx.push(<img className="group-opt" src={reorderState ? groupReorderActive : groupReorder} onClick={() => changeReorderState()} style={{filter: reorderState ? "" : getFilter()}}/>)
            if (reorderState) {
                jsx.push(<img className="group-opt" src={groupAccept} onClick={() => commitReorder()} style={{filter: getFilter()}}/>)
            }
            jsx.push(<img className="group-opt" src={deleteMode ? groupCancelActive : groupCancel} onClick={() => setDeleteMode((prev: boolean) => !prev)} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={groupAdd} onClick={() => showFavgroupAddDialog()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={groupEdit} onClick={() => showFavgroupEditDialog()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={groupDelete} onClick={() => showFavgroupDeleteDialog()} style={{filter: getFilter()}}/>)
        }
        return jsx
    }

    const searchGroup = (event: React.MouseEvent, alias?: string) => {
        if (!favgroup) return
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open("/posts", "_blank")
        } else {
            history.push("/posts")
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
                        {favgroup.private ? <img className="group-icon" src={lockIcon} style={{filter: getFilter()}}/> : null}
                        <span className="group-heading">{favgroup.name}</span>
                        {favgroupOptionsJSX()}
                    </div>
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span><span className="group-label" onClick={searchGroup}>{i18n.sort.posts}</span> <span className="group-label-alt">{favgroup.postCount}</span></span>
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