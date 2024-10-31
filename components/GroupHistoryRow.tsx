import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SessionContext, SessionFlagContext, MobileContext, DeleteGroupHistoryIDContext, 
RevertGroupHistoryIDContext, DeleteGroupHistoryFlagContext, RevertGroupHistoryFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import groupHistoryRevert from "../assets/icons/revert.png"
import groupHistoryDelete from "../assets/icons/delete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import permissions from "../structures/Permissions"
import path from "path"
import "./styles/historyrow.less"

interface Props {
    groupHistory: any
    historyIndex: number
    previousHistory: any
    currentHistory: any
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
    exact?: any
}

const GroupHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteGroupHistoryID, setDeleteGroupHistoryID} = useContext(DeleteGroupHistoryIDContext)
    const {revertGroupHistoryID, setRevertGroupHistoryID} = useContext(RevertGroupHistoryIDContext)
    const {deleteGroupHistoryFlag, setDeleteGroupHistoryFlag} = useContext(DeleteGroupHistoryFlagContext)
    const {revertGroupHistoryFlag, setRevertGroupHistoryFlag} = useContext(RevertGroupHistoryFlagContext)
    const history = useHistory()
    const [img, setImg] = useState("")
    const [postIndex, setPostIndex] = useState(0)
    const [userRole, setUserRole] = useState("")
    const ref = useRef(null) as any
    const slug = props.groupHistory.slug
    let prevHistory = props.previousHistory || Boolean(props.exact)

    const updateImages = async () => {
        let targetID = props.groupHistory.addedPosts?.length ? props.groupHistory.addedPosts[0] : 
        props.groupHistory.removedPosts?.length ? props.groupHistory.removedPosts[0] : props.groupHistory.posts[0].postID
        const post = await functions.get("/api/post", {postID: targetID}, session, setSessionFlag)
        const filename = post.images[0]?.filename
        const initialImg = functions.getThumbnailLink(post.images[0]?.type, post.postID, post.images[0]?.order, filename, "medium", mobile)
        setImg(initialImg + `#${path.extname(filename)}`)
        const index = props.groupHistory.posts.findIndex((p: any) => String(p.postID) === String(targetID))
        setPostIndex(index)
    }

    const updateUserRole = async () => {
        const user = await functions.get("/api/user", {username: props.groupHistory.user}, session, setSessionFlag)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateUserRole()
        updateImages()
    }, [props.groupHistory, session])

    const revertGroupHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.put("/api/group/reorder", {slug: props.currentHistory.slug, posts: props.groupHistory.posts}, session, setSessionFlag)
        await functions.put("/api/group/edit", {slug: props.currentHistory.slug, name: props.groupHistory.name, description: props.groupHistory.description}, session, setSessionFlag)
        if (props.currentHistory.slug !== props.groupHistory.slug) {
            history.push(`/group/history/${props.groupHistory.slug}`)
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
        await functions.delete("/api/group/history/delete", {slug: props.currentHistory.slug, historyID: props.groupHistory.historyID}, session, setSessionFlag)
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
                        <span className="historyrow-options-text">Revert</span>
                    </div>
                    <div className="historyrow-options-container" onClick={deleteGroupHistoryDialog}>
                        <img className="historyrow-options-img" src={groupHistoryDelete}/>
                        <span className="historyrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertGroupHistoryDialog}>
                        <img className="historyrow-options-img" src={groupHistoryRevert}/>
                        <span className="historyrow-options-text">Revert</span>
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
            history.push(`/group/${props.currentHistory.slug}${historyIndex}`)
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.groupHistory.user}`, "_blank")
        } else {
            history.push(`/user/${props.groupHistory.user}`)
        }
    }

    const dateTextJSX = () => {
        let firstHistory = props.historyIndex === Number(props.groupHistory.historyCount)
        if (props.exact) firstHistory = false
        let targetDate = firstHistory ? props.groupHistory.createDate : props.groupHistory.date
        if (!targetDate) targetDate = props.groupHistory.date
        const editText = firstHistory ? "Uploaded" : "Edited"
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.groupHistory.user)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.groupHistory.user)}</span>
    }

    const loadImage = async () => {
        if (functions.isGIF(img)) return
        if (!ref.current) return
        let src = await cryptoFunctions.decryptedLink(img)
        if (functions.isModel(src)) {
            src = await functions.modelImage(src)
        } else if (functions.isAudio(src)) {
            src = await functions.songCover(src)
        }
        const imgElement = document.createElement("img")
        imgElement.src = src 
        imgElement.onload = () => {
            if (!ref.current) return
            const refCtx = ref.current.getContext("2d")
            ref.current.width = imgElement.width
            ref.current.height = imgElement.height
            refCtx?.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height)
        }
    }

    useEffect(() => {
        loadImage()
    }, [img])

    const updateImg = async (event: React.MouseEvent) => {
        event.preventDefault()
        if (props.groupHistory.posts.length > 1) {
            let newPostIndex = postIndex + 1 
            if (newPostIndex > props.groupHistory.posts.length - 1) newPostIndex = 0
            const post = await functions.get("/api/post", {postID: props.groupHistory.posts[newPostIndex].postID}, session, setSessionFlag)
            const filename = post.images[0]?.filename
            const newImg = functions.getThumbnailLink(post.images[0]?.type, post.postID, post.images[0]?.order, filename, "medium", mobile)
            setImg(newImg + `#${path.extname(filename)}`)
            setPostIndex(newPostIndex)
        }
    }

    const postDiff = () => {
        const addedPostsJSX = props.groupHistory.addedPosts.map((postID: string) => <span className="tag-add-clickable" onClick={() => history.push(`/post/${postID}`)}>+{postID}</span>)
        const removedPostsJSX = props.groupHistory.removedPosts.map((postID: string) => <span className="tag-remove-clickable" onClick={() => history.push(`/post/${postID}`)}>-{postID}</span>)
        if (![...addedPostsJSX, ...removedPostsJSX].length) return null
        return [...addedPostsJSX, ...removedPostsJSX]
    }

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        let changes = props.groupHistory.changes || {}
        let postChanges = props.groupHistory.addedPosts?.length || props.groupHistory.removedPosts?.length
        if (!prevHistory || changes.name) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Name:</span> {props.groupHistory.name}</span>)
        }
        if (!prevHistory || changes.description) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Description:</span> {props.groupHistory.description || "None"}</span>)
        }
        if (postChanges) {
            if (postDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Posts:</span> {postDiff()}</span>)
            }
        }
        return jsx
    }

    return (
        <div className="historyrow">
            {session.username ? groupHistoryOptions() : null}
            <div className="historyrow-container">
                {functions.isVideo(img) ? <video className="historyrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></video> :
                functions.isGIF(img) ? <img className="historyrow-img" src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}/> : 
                <canvas className="historyrow-img" ref={ref} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></canvas>}
                {!mobile ? <span className="historyrow-tag-text" style={{width: "max-content"}} onClick={imgClick} onAuxClick={imgClick}>{props.groupHistory.name}</span> : null}
            </div>
            {mobile ? <div className="historyrow-container">
                <span className="historyrow-tag-text" style={{width: "max-content"}} onClick={imgClick} onAuxClick={imgClick}>{props.groupHistory.name}</span>
            </div> : null}
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container">
                        {dateTextJSX()}
                        {props.groupHistory.orderChanged ? <span className="historyrow-text-strong">[Order Updated]</span> : null}
                        {diffJSX()}
                        {props.groupHistory.reason ? <span className="historyrow-text"><span className="historyrow-label-text">Reason:</span> {props.groupHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GroupHistoryRow