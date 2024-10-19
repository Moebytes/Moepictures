import React, {useEffect, useContext, useState, useRef} from "react"
import {ThemeContext, SiteHueContext, SiteSaturationContext, SiteLightnessContext, EnableDragContext, HideNavbarContext, HideSidebarContext, RelativeContext, 
HideTitlebarContext, MobileContext, PostsContext, GroupFlagContext, ActiveDropdownContext, HeaderTextContext, SidebarTextContext, SessionContext, SessionFlagContext, 
RestrictTypeContext, ActiveGroupContext, EditGroupObjContext, DeleteGroupObjContext} from "../Context"
import {useHistory, useLocation} from "react-router-dom"
import TitleBar from "../components/TitleBar"
import NavBar from "../components/NavBar"
import SideBar from "../components/SideBar"
import Footer from "../components/Footer"
import EditGroupDialog from "../dialogs/EditGroupDialog"
import DeleteGroupDialog from "../dialogs/DeleteGroupDialog"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import permissions from "../structures/Permissions"
import groupReorder from "../assets/icons/group-reorder.png"
import groupReorderActive from "../assets/icons/group-reorder-active.png"
import groupHistory from "../assets/icons/tag-history.png"
import groupEdit from "../assets/icons/tag-edit.png"
import groupDelete from "../assets/icons/tag-delete.png"
import groupCancel from "../assets/icons/group-cancel.png"
import groupAccept from "../assets/icons/group-accept.png"
import Reorder from "react-reorder"
import "./styles/grouppage.less"

interface Props {
    match?: any
}

let limit = 25

const GroupPage: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {headerText, setHeaderText} = useContext(HeaderTextContext)
    const {sidebarText, setSidebarText} = useContext(SidebarTextContext)
    const {editGroupObj, setEditGroupObj} = useContext(EditGroupObjContext)
    const {editDeleteObj, setDeleteGroupObj} = useContext(DeleteGroupObjContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {activeGroup, setActiveGroup} = useContext(ActiveGroupContext)
    const {groupFlag, setGroupFlag} = useContext(GroupFlagContext)
    const [reorderState, setReorderState] = useState(false)
    const {posts, setPosts} = useContext(PostsContext)
    const [group, setGroup] = useState(null) as any
    const [items, setItems] = useState([]) as any
    const history = useHistory()
    const location = useLocation()
    const groupName = props?.match.params.group

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
        limit = mobile ? 5 : 25
    }, [mobile])

    const groupInfo = async () => {
        let group = await functions.get("/api/group", {name: groupName}, session, setSessionFlag)
        if (!group) return functions.replaceLocation("/404")
        setGroup(group)
    }

    useEffect(() => {
        groupInfo()
    }, [groupName, session])

    useEffect(() => {
        if (groupFlag) {
            groupInfo()
            setGroupFlag(false)
        }
    }, [groupName, session, groupFlag])

    const updateItems = async () => {
        let items = [] as any[]
        for (let i = 0; i < group.posts.length; i++) {
            const post = group.posts[i]
            const imageLink = functions.getThumbnailLink(post.images[0]?.type, post.postID, post.images[0]?.order, post.images[0]?.filename, "medium", mobile)
            let img = await cryptoFunctions.decryptedLink(imageLink)
            if (functions.isModel(img)) {
                img = await functions.modelImage(img)
            } else if (functions.isAudio(img)) {
                img = await functions.songCover(img)
            }
            items.push({id: post.order, image: img, post})
        }
        setItems(items)
    }

    useEffect(() => {
        if (group) {
            document.title = group.name
            setHeaderText(group.name)
            updateItems()
        }
    }, [group])

    useEffect(() => {
        if (mobile) {
            setRelative(true)
        } else {
            setRelative(false)
        }
    }, [mobile])

    const reorder = (event: React.MouseEvent, from: number, to: number) => {
        setItems((prev: any) => {
            const newState = [...prev]
            newState.splice(to, 0, newState.splice(from, 1)[0])
            return newState
        })
    }

    const groupImagesJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const openPost = (event: React.MouseEvent) => {
                if (reorderState) return
                if (event.ctrlKey || event.metaKey || event.button === 1) {
                    window.open(`/post/${item.post.postID}`, "_blank")
                } else {
                    history.push(`/post/${item.post.postID}`)
                }
                setPosts(group.posts)
                setTimeout(() => {
                    setActiveGroup(group.name)
                }, 200)
            }
            jsx.push(
                <li key={item.id} style={{marginRight: "20px", marginTop: "10px"}}>
                    <img draggable={false} className="group-image" src={item.image} onClick={openPost} style={{cursor: reorderState ? "move" : "pointer"}}/>
                </li>
            )
        }
        return (
            <Reorder onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}
            reorderId="group-reorder-container" className="group-image-container" disabled={!reorderState}
            component="ul" holdTime={50} onReorder={reorder}>{jsx}</Reorder>
        )
    }

    const commitReorder = async () => {
        let posts = [] as any[]
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            posts.push({postID: item.post.postID, order: i + 1})
        }
        await functions.put("/api/group/reorder", {slug: group.slug, posts}, session, setSessionFlag)
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

    const showGroupEditDialog = async () => {
        setEditGroupObj(group)
    }

    const showGroupDeleteDialog = async () => {
        setDeleteGroupObj(group)
    }

    const groupOptionsJSX = () => {
        let jsx = [] as any
        if (session.username) {
            jsx.push(<img className="group-opt" src={groupHistory} onClick={() => null} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={reorderState ? groupReorderActive : groupReorder} onClick={() => changeReorderState()} style={{filter: reorderState ? "" : getFilter()}}/>)
            if (reorderState) {
                jsx.push(<img className="group-opt" src={groupCancel} onClick={() => cancelReorder()} style={{filter: getFilter()}}/>)
                jsx.push(<img className="group-opt" src={groupAccept} onClick={() => commitReorder()} style={{filter: getFilter()}}/>)
            }
            jsx.push(<img className="group-opt" src={groupEdit} onClick={() => showGroupEditDialog()} style={{filter: getFilter()}}/>)
            jsx.push(<img className="group-opt" src={groupDelete} onClick={() => showGroupDeleteDialog()} style={{filter: getFilter()}}/>)
        }
        return jsx
    }

    return (
        <>
        <EditGroupDialog/>
        <DeleteGroupDialog/>
        <TitleBar/>
        <NavBar/>
        <div className="body">
            <SideBar/>
            <div className="content" onMouseEnter={() => setEnableDrag(true)}>
                {group ? 
                <div className="group-page">
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="group-heading">{group.name}</span>
                        {groupOptionsJSX()}
                    </div>
                    <div className="group-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="group-text">{group.description ? group.description : "No description."}</span>
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