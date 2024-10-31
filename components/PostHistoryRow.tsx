import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, SessionFlagContext, MobileContext, DeletePostHistoryIDContext, 
RevertPostHistoryIDContext, DeletePostHistoryFlagContext, RevertPostHistoryFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import postHistoryRevert from "../assets/icons/revert.png"
import postHistoryDelete from "../assets/icons/delete.png"
import adminCrown from "../assets/icons/admin-crown.png"
import modCrown from "../assets/icons/mod-crown.png"
import permissions from "../structures/Permissions"
import "./styles/historyrow.less"
import crypto from "crypto"
import path from "path"

interface Props {
    postHistory: any
    historyIndex: number
    previousHistory: any
    currentHistory: any
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
    exact?: any
}

const PostHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deletePostHistoryID, setDeletePostHistoryID} = useContext(DeletePostHistoryIDContext)
    const {revertPostHistoryID, setRevertPostHistoryID} = useContext(RevertPostHistoryIDContext)
    const {deletePostHistoryFlag, setDeletePostHistoryFlag} = useContext(DeletePostHistoryFlagContext)
    const {revertPostHistoryFlag, setRevertPostHistoryFlag} = useContext(RevertPostHistoryFlagContext)
    const history = useHistory()
    const [img, setImg] = useState("")
    const [currentImg, setCurrentImg] = useState("")
    const [imageIndex, setImageIndex] = useState(0)
    const [userRole, setUserRole] = useState("")
    const [tagCategories, setTagCategories] = useState({} as {artists: any, characters: any, series: any, tags: any})
    const ref = useRef(null) as any
    const postID = props.postHistory.postID
    let prevHistory = props.previousHistory || Boolean(props.exact)

    const updateImages = async () => {
        const filename = props.postHistory.images[0]?.filename ? props.postHistory.images[0].filename : props.postHistory.images[0]
        const initialImg = functions.getThumbnailLink(props.postHistory.images[0]?.type, props.postHistory.postID, 1, filename, "medium", mobile)
        const currentFilename = props.currentHistory.images[0]?.filename ? props.currentHistory.images[0].filename : props.currentHistory.images[0]
        const currentImg = functions.getThumbnailLink(props.currentHistory.images[0]?.type, props.currentHistory.postID, 1, currentFilename, "medium", mobile)
        setImg(initialImg + `#${path.extname(filename)}`)
        setCurrentImg(currentImg + `#${path.extname(currentFilename)}`)
    }

    const updateUserRole = async () => {
        const user = await functions.get("/api/user", {username: props.postHistory.user}, session, setSessionFlag)
        if (user?.role) setUserRole(user.role)
    }

    const updateTagCategories = async () => {
        if (!props.postHistory.addedTags || !props.postHistory.removedTags) return
        let tagMap = [...props.postHistory.addedTags, ...props.postHistory.removedTags]
        const tagCategories = await functions.tagCategories(tagMap, session, setSessionFlag)
        setTagCategories(tagCategories)
    }

    useEffect(() => {
        updateUserRole()
        updateImages()
        updateTagCategories()
    }, [props.postHistory, session])

    const revertPostHistory = async () => {
        if (props.current) return Promise.reject()
        const imgChanged = await functions.imagesChanged(props.postHistory, props.currentHistory)
        const tagsChanged = functions.tagsChanged(props.postHistory, props.currentHistory)
        const srcChanged = functions.sourceChanged(props.postHistory, props.currentHistory)
        let source = undefined as any
        if (imgChanged || srcChanged) {
            source = {
                title: props.postHistory.title,
                translatedTitle: props.postHistory.translatedTitle,
                artist: props.postHistory.artist,
                drawn: props.postHistory.drawn ? functions.formatDate(new Date(props.postHistory.drawn), true) : "",
                link: props.postHistory.link,
                commentary: props.postHistory.commentary,
                translatedCommentary: props.postHistory.translatedCommentary,
                bookmarks: props.postHistory.bookmarks,
                purchaseLink: props.postHistory.purchaseLink,
                mirrors: props.postHistory.mirrors ? Object.values(props.postHistory.mirrors).join("\n") : ""
            }
        }
        if (imgChanged || (srcChanged && tagsChanged)) {
            if (imgChanged && !permissions.isMod(session)) return Promise.reject("img")
            const {images, upscaledImages} = await functions.parseImages(props.postHistory)
            const newTags = await functions.parseNewTags(props.postHistory, session, setSessionFlag)
            await functions.put("/api/post/edit", {postID: props.postHistory.postID, images, upscaledImages, type: props.postHistory.type, restrict: props.postHistory.restrict, source,
            style: props.postHistory.style, artists: props.postHistory.artists, characters: props.postHistory.characters, preserveThirdParty: props.postHistory.thirdParty,
            series: props.postHistory.series, tags: props.postHistory.tags, newTags, reason: props.postHistory.reason}, session, setSessionFlag)
        } else {
            await functions.put("/api/post/quickedit", {postID: props.postHistory.postID, type: props.postHistory.type, restrict: props.postHistory.restrict, source,
            style: props.postHistory.style, artists: props.postHistory.artists, characters: props.postHistory.characters, preserveThirdParty: props.postHistory.thirdParty,
            series: props.postHistory.series, tags: props.postHistory.tags, reason: props.postHistory.reason}, session, setSessionFlag)
        }
        props.onEdit?.()
    }

    useEffect(() => {
        if (revertPostHistoryFlag && props.postHistory.historyID === revertPostHistoryID?.historyID) {
            revertPostHistory().then(() => {
                setRevertPostHistoryFlag(false)
                setRevertPostHistoryID(null)
            }).catch((error) => {
                setRevertPostHistoryFlag(false)
                setRevertPostHistoryID({failed: error ? error : true, historyID: props.postHistory.historyID})
            })
        }
    }, [revertPostHistoryFlag, revertPostHistoryID, props.current, currentImg, session])

    const deletePostHistory = async () => {
        if (props.current) return Promise.reject()
        await functions.delete("/api/post/history/delete", {postID, historyID: props.postHistory.historyID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deletePostHistoryFlag && props.postHistory.historyID === deletePostHistoryID?.historyID) {
            deletePostHistory().then(() => {
                setDeletePostHistoryFlag(false)
                setDeletePostHistoryID(null)
            }).catch(() => {
                setDeletePostHistoryFlag(false)
                setDeletePostHistoryID({failed: true, historyID: props.postHistory.historyID})
            })
        }
    }, [deletePostHistoryFlag, deletePostHistoryID, session, props.current])

    const revertPostHistoryDialog = async () => {
        const post = await functions.get("/api/post", {postID: props.postHistory.postID}, session, setSessionFlag)
        if (post.locked && !permissions.isMod(session)) return setRevertPostHistoryID({failed: "locked", historyID: props.postHistory.historyID})
        setRevertPostHistoryID({failed: false, historyID: props.postHistory.historyID})
    }

    const deletePostHistoryDialog = async () => {
        setDeletePostHistoryID({failed: false, historyID: props.postHistory.historyID})
    }

    const postHistoryOptions = () => {
        if (session.banned) return null
        if (permissions.isMod(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertPostHistoryDialog}>
                        <img className="historyrow-options-img" src={postHistoryRevert}/>
                        <span className="historyrow-options-text">Revert</span>
                    </div>
                    <div className="historyrow-options-container" onClick={deletePostHistoryDialog}>
                        <img className="historyrow-options-img" src={postHistoryDelete}/>
                        <span className="historyrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertPostHistoryDialog}>
                        <img className="historyrow-options-img" src={postHistoryRevert}/>
                        <span className="historyrow-options-text">Revert</span>
                    </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        let historyIndex = props.current ? "" : `?history=${props.postHistory.historyID}`
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.postHistory.postID}${historyIndex}`, "_blank")
        } else {
            history.push(`/post/${props.postHistory.postID}${historyIndex}`)
        }
    }

    const userClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/user/${props.postHistory.user}`, "_blank")
        } else {
            history.push(`/user/${props.postHistory.user}`)
        }
    }

    const dateTextJSX = () => {
        let firstHistory = props.historyIndex === Number(props.postHistory.historyCount)
        if (props.exact) firstHistory = false
        const targetDate = firstHistory ? props.postHistory.uploadDate : props.postHistory.date
        const editText = firstHistory ? "Uploaded" : "Edited"
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate)} by {functions.toProperCase(props.postHistory.user)}</span>
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
        if (props.postHistory.images.length > 1) {
            let newImageIndex = imageIndex + 1 
            if (newImageIndex > props.postHistory.images.length - 1) newImageIndex = 0
            const filename = props.postHistory.images[newImageIndex]?.filename ? props.postHistory.images[newImageIndex].filename : props.postHistory.images[newImageIndex]
            const newImg = functions.getThumbnailLink(props.postHistory.images[newImageIndex]?.type, props.postHistory.postID, 1, filename, "medium", mobile)
            setImg(newImg + `#${path.extname(filename)}`)
            setImageIndex(newImageIndex)
        }
    }

    const calculateDiff = (addedTags: string[], removedTags: string[]) => {
        const addedTagsJSX = addedTags.map((tag: string) => <span className="tag-add">+{tag}</span>)
        const removedTagsJSX = removedTags.map((tag: string) => <span className="tag-remove">-{tag}</span>)
        if (![...addedTags, ...removedTags].length) return null
        return [...addedTagsJSX, ...removedTagsJSX]
    }

    const artistsDiff = () => {
        if (!prevHistory) return props.postHistory.artists.join(" ")
        if (!tagCategories.artists) return null
        const tagCategory = tagCategories.artists.map((t: any) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) =>  tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const charactersDiff = () => {
        if (!prevHistory) return props.postHistory.characters.join(" ")
        if (!tagCategories.characters) return null
        const tagCategory = tagCategories.characters.map((t: any) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) => tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const seriesDiff = () => {
        if (!prevHistory) return props.postHistory.series.join(" ")
        if (!tagCategories.series) return null
        const tagCategory = tagCategories.series.map((t: any) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) => tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const tagsDiff = () => {
        const removeArr = [...props.postHistory.artists, ...props.postHistory.characters, ...props.postHistory.series]
        const filteredTags = props.postHistory.tags.filter((tag: string) => !removeArr.includes(tag))
        if (!prevHistory) return filteredTags.join(" ")
        if (!tagCategories.tags) return null
        const tagCategory = tagCategories.tags.map((t: any) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) => tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const printMirrors = () => {
        if (!props.postHistory.mirrors) return "None"
        const mapped = Object.values(props.postHistory.mirrors) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="historyrow-label-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m) + append}</span>
        })
    }

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        let changes = props.postHistory.changes || {}
        let tagChanges = props.postHistory.addedTags?.length || props.postHistory.removedTags?.length
        if ((!prevHistory && props.postHistory.images.length > 1) || changes.images) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Images:</span> {props.postHistory.images.length}</span>)
        }
        if (!prevHistory || changes.type) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Type:</span> {functions.toProperCase(props.postHistory.type)}</span>)
        }
        if (!prevHistory || changes.restrict) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Restrict:</span> {functions.toProperCase(props.postHistory.restrict)}</span>)
        }
        if (!prevHistory || changes.style) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Style:</span> {functions.toProperCase(props.postHistory.style)}</span>)
        }
        if (!prevHistory || tagChanges) {
            if (artistsDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Artists:</span> {artistsDiff()}</span>)
            }
        }
        if (!prevHistory || tagChanges) {
            if (charactersDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Characters:</span> {charactersDiff()}</span>)
            }
        }
        if (!prevHistory || tagChanges) {
            if (seriesDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Series:</span> {seriesDiff()}</span>)
            }
        }
        if (!prevHistory || tagChanges) {
            if (tagsDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Tags:</span> {tagsDiff()}</span>)
            }
        }
        if (!prevHistory || changes.title) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Title:</span> {props.postHistory.title || "None"}</span>)
        }
        if (!prevHistory || changes.translatedTitle) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Translated Title:</span> {props.postHistory.translatedTitle || "None"}</span>)
        }
        if (!prevHistory || changes.artist) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Artist:</span> {props.postHistory.artist || "Unknown"}</span>)
        }
        if (!prevHistory || changes.drawn) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Drawn:</span> {props.postHistory.drawn ? functions.formatDate(new Date(props.postHistory.drawn)) : "Unknown"}</span>)
        }
        if (!prevHistory || changes.link) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Link:</span> <span className="historyrow-label-link" onClick={() => window.open(props.postHistory.link, "_blank")}>{functions.getSiteName(props.postHistory.link)}</span></span>)
        }
        if (!prevHistory || changes.mirrors) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Mirrors:</span> {printMirrors()}</span>)
        }
        if ((!prevHistory && props.postHistory.bookmarks) || changes.bookmarks) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Bookmarks:</span> {props.postHistory.bookmarks || "?"}</span>)
        }
        if ((!prevHistory && props.postHistory.purchaseLink) || changes.purchaseLink) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Buy Link:</span> {props.postHistory.purchaseLink || "None"}</span>)
        }
        if (!prevHistory || changes.commentary) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Commentary:</span> {props.postHistory.commentary || "None"}</span>)
        }
        if (!prevHistory || changes.translatedCommentary) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">Translated Commentary:</span> {props.postHistory.translatedCommentary || "None"}</span>)
        }
        return jsx
    }

    return (
        <div className="historyrow">
            {session.username ? postHistoryOptions() : null}
            <div className="historyrow-container">
                {functions.isVideo(img) ? <video className="historyrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></video> :
                functions.isGIF(img) ? <img className="historyrow-img" src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}/> : 
                <canvas className="historyrow-img" ref={ref} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></canvas>}
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container">
                        {dateTextJSX()}
                        {props.postHistory.imageChanged ? <span className="historyrow-text-strong">[Image Updated]</span> : null}
                        {diffJSX()}
                        {props.postHistory.reason ? <span className="historyrow-text"><span className="historyrow-label-text">Reason:</span> {props.postHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostHistoryRow