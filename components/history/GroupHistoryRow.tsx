import React, {useEffect, useRef, useState} from "react"
import {useNavigate} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useGroupDialogSelector, useGroupDialogActions, useLayoutSelector,
useFilterSelector, useInteractionActions} from "../../store"
import functions from "../../functions/Functions"
import groupHistoryRevert from "../../assets/icons/revert.png"
import groupHistoryDelete from "../../assets/icons/delete.png"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import permissions from "../../structures/Permissions"
import EffectImage from "../image/EffectImage"
import "./styles/historyrow.less"
import {GroupHistory, PostFull} from "../../types/Types"

interface Props {
    groupHistory: GroupHistory
    historyIndex: number
    previousHistory: GroupHistory | null
    currentHistory: GroupHistory
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
    exact?: boolean
}

const GroupHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {deleteGroupHistoryID, revertGroupHistoryID, deleteGroupHistoryFlag, revertGroupHistoryFlag} = useGroupDialogSelector()
    const {setDeleteGroupHistoryID, setRevertGroupHistoryID, setDeleteGroupHistoryFlag, setRevertGroupHistoryFlag} = useGroupDialogActions()
    const navigate = useNavigate()
    const [groupPost, setGroupPost] = useState(null as PostFull | null)
    const [img, setImg] = useState("")
    const [postIndex, setPostIndex] = useState(0)
    const [userRole, setUserRole] = useState("")
    const slug = props.groupHistory.slug
    let prevHistory = props.previousHistory || Boolean(props.exact)

    const updatePost = async () => {
        let targetID = props.groupHistory.addedPosts?.length ? props.groupHistory.addedPosts[0] : 
        props.groupHistory.removedPosts?.length ? props.groupHistory.removedPosts[0] : props.groupHistory.posts[0].postID
        const post = await functions.http.get("/api/post", {postID: targetID}, session, setSessionFlag)
        if (!post) return
        setGroupPost(post)
    }

    const updateUserRole = async () => {
        const user = await functions.http.get("/api/user", {username: props.groupHistory.user}, session, setSessionFlag)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateUserRole()
        updatePost()
    }, [props.groupHistory, session])

    const revertGroupHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.http.put("/api/group/reorder", {slug: props.currentHistory.slug, posts: props.groupHistory.posts}, session, setSessionFlag)
        await functions.http.put("/api/group/edit", {slug: props.currentHistory.slug, name: props.groupHistory.name, description: props.groupHistory.description}, session, setSessionFlag)
        if (props.currentHistory.slug !== props.groupHistory.slug) {
            navigate(`/group/history/${props.groupHistory.slug}`)
        } else {
            props.onEdit?.()
        }
    }

    useEffect(() => {
        if (revertGroupHistoryFlag && props.groupHistory.historyID === revertGroupHistoryID?.historyID) {
            revertGroupHistory().then(() => {
                setRevertGroupHistoryFlag(false)
                setRevertGroupHistoryID(null)
            }).catch(() => {
                setRevertGroupHistoryFlag(false)
                setRevertGroupHistoryID({failed: true, historyID: props.groupHistory.historyID})
            })
        }
    }, [revertGroupHistoryFlag, revertGroupHistoryID, session, props.current])

    const deleteGroupHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.http.delete("/api/group/history/delete", {slug: props.currentHistory.slug, historyID: props.groupHistory.historyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteGroupHistoryFlag && props.groupHistory.historyID === deleteGroupHistoryID?.historyID) {
            deleteGroupHistory().then(() => {
                setDeleteGroupHistoryFlag(false)
                setDeleteGroupHistoryID(null)
            }).catch(() => {
                setDeleteGroupHistoryFlag(false)
                setDeleteGroupHistoryID({failed: true, historyID: props.groupHistory.historyID})
            })
        }
    }, [deleteGroupHistoryFlag, deleteGroupHistoryID, session, props.current])

    const revertGroupHistoryDialog = async () => {
        setRevertGroupHistoryID({failed: false, historyID: props.groupHistory.historyID})
    }

    const deleteGroupHistoryDialog = async () => {
        setDeleteGroupHistoryID({failed: false, historyID: props.groupHistory.historyID})
    }

    const groupHistoryOptions = () => {
        if (session.banned) return null
        if (permissions.isMod(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertGroupHistoryDialog}>
                        <img className="historyrow-options-img" src={groupHistoryRevert}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                    <div className="historyrow-options-container" onClick={deleteGroupHistoryDialog}>
                        <img className="historyrow-options-img" src={groupHistoryDelete}/>
                        <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertGroupHistoryDialog}>
                        <img className="historyrow-options-img" src={groupHistoryRevert}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        let historyIndex = props.current ? "" : `?history=${props.groupHistory.historyID}`
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/group/${props.currentHistory.slug}${historyIndex}`, "_blank")
        } else {
            navigate(`/group/${props.currentHistory.slug}${historyIndex}`)
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.groupHistory.user}`, "_blank")
        } else {
            navigate(`/user/${props.groupHistory.user}`)
        }
    }

    const dateTextJSX = () => {
        let firstHistory = props.historyIndex === Number(props.groupHistory.historyCount)
        if (props.exact) firstHistory = false
        let targetDate = props.groupHistory.date
        const editText = firstHistory ? i18n.time.created : i18n.time.edited
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (userRole === "premium-curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (userRole === "curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (userRole === "premium-contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (userRole === "contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text contributor-color">{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (userRole === "premium") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.date.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.util.toProperCase(props.groupHistory.user) || i18n.user.deleted}</span>
    }

    const updateImg = async (event: React.MouseEvent) => {
        event.preventDefault()
        if (props.groupHistory.posts.length > 1) {
            let newPostIndex = postIndex + 1 
            if (newPostIndex > props.groupHistory.posts.length - 1) newPostIndex = 0
            const post = await functions.http.get("/api/post", {postID: props.groupHistory.posts[newPostIndex].postID}, session, setSessionFlag)
            if (!post) return
            const filename = post.images[0]?.filename
            const newImgLink = functions.link.getThumbnailLink(post.images[0], "medium", session, mobile)
            const newImg = await functions.crypto.decryptThumb(newImgLink, session)
            setImg(newImg)
            setPostIndex(newPostIndex)
        }
    }

    const openPost = (postID: string, event: React.MouseEvent) => {
        functions.post.openPost(postID, event, navigate, session, setSessionFlag)
    }

    const postDiff = () => {
        const addedPostsJSX = props.groupHistory.addedPosts.map((postID: string) => <span className="tag-add-clickable" onClick={(event) => openPost(postID, event)}>+{postID}</span>)
        const removedPostsJSX = props.groupHistory.removedPosts.map((postID: string) => <span className="tag-remove-clickable" onClick={(event) => openPost(postID, event)}>-{postID}</span>)
        if (![...addedPostsJSX, ...removedPostsJSX].length) return null
        return [...addedPostsJSX, ...removedPostsJSX]
    }

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        let changes = props.groupHistory.changes || {}
        let postChanges = props.groupHistory.addedPosts?.length || props.groupHistory.removedPosts?.length
        if (!prevHistory || changes.name) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.name}: </span>{props.groupHistory.name}</span>)
        }
        if (!prevHistory || changes.description) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.description}: </span>{props.groupHistory.description || i18n.labels.none}</span>)
        }
        if (postChanges) {
            if (postDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.sort.posts}: </span>{postDiff()}</span>)
            }
        }
        if (!jsx.length && !props.groupHistory.orderChanged) {
            jsx.push(<span className="historyrow-text">{i18n.labels.noData}</span>)
        }
        return jsx
    }

    return (
        <div className="historyrow">
            {session.username ? groupHistoryOptions() : null}
            <div className="historyrow-container">
                <EffectImage className="historyrow-img" post={groupPost} onClick={imgClick} height={200}/>
                {!mobile ? <span className="historyrow-tag-text" style={{width: "max-content"}} onClick={imgClick} onAuxClick={imgClick}>{props.groupHistory.name}</span> : null}
            </div>
            {mobile ? <div className="historyrow-container">
                <span className="historyrow-tag-text" style={{width: "max-content"}} onClick={imgClick} onAuxClick={imgClick}>{props.groupHistory.name}</span>
            </div> : null}
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {dateTextJSX()}
                        {props.groupHistory.orderChanged ? <span className="historyrow-text-strong">[{i18n.labels.orderUpdated}]</span> : null}
                        {diffJSX()}
                        {props.groupHistory.reason ? <span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.reason}:</span> {props.groupHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GroupHistoryRow