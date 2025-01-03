import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions, useLayoutSelector,
useFilterSelector, useInteractionActions} from "../../store"
import functions from "../../structures/Functions"
import postHistoryRevert from "../../assets/icons/revert.png"
import postHistoryDelete from "../../assets/icons/delete.png"
import adminCrown from "../../assets/icons/admin-crown.png"
import modCrown from "../../assets/icons/mod-crown.png"
import premiumCuratorStar from "../../assets/icons/premium-curator-star.png"
import curatorStar from "../../assets/icons/curator-star.png"
import premiumContributorPencil from "../../assets/icons/premium-contributor-pencil.png"
import contributorPencil from "../../assets/icons/contributor-pencil.png"
import premiumStar from "../../assets/icons/premium-star.png"
import permissions from "../../structures/Permissions"
import "./styles/historyrow.less"
import path from "path"
import {PostHistory, SourceData, TagCategories} from "../../types/Types"

interface Props {
    postHistory: PostHistory
    historyIndex: number
    previousHistory: PostHistory | null
    currentHistory: PostHistory
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
    exact?: boolean
    imageHeight?: number
}

const PostHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {deletePostHistoryID, revertPostHistoryID, deletePostHistoryFlag, revertPostHistoryFlag} = usePostDialogSelector()
    const {setDeletePostHistoryID, setRevertPostHistoryID, setDeletePostHistoryFlag, setRevertPostHistoryFlag} = usePostDialogActions()
    const history = useHistory()
    const [img, setImg] = useState("")
    const [currentImg, setCurrentImg] = useState("")
    const [imageIndex, setImageIndex] = useState(0)
    const [userRole, setUserRole] = useState("")
    const [tagCategories, setTagCategories] = useState({} as TagCategories)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const postID = props.postHistory.postID
    let prevHistory = props.previousHistory || Boolean(props.exact)

    const updateImages = async () => {
        const initialImg = await functions.decryptThumb(functions.getRawThumbnailLink(props.postHistory.images[0], "medium", mobile), session)
        const currentImg = await functions.decryptThumb(functions.getRawThumbnailLink(props.currentHistory.images[0], "medium", mobile), session)
        setImg(initialImg)
        setCurrentImg(currentImg)
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
        const imgChanged = await functions.imagesChanged(props.postHistory, props.currentHistory, session)
        const tagsChanged = functions.tagsChanged(props.postHistory, props.currentHistory)
        const srcChanged = functions.sourceChanged(props.postHistory, props.currentHistory)
        let source = null as SourceData | null
        if (imgChanged || srcChanged) {
            source = {
                title: props.postHistory.title,
                englishTitle: props.postHistory.englishTitle,
                artist: props.postHistory.artist,
                posted: props.postHistory.posted ? functions.formatDate(new Date(props.postHistory.posted), true) : "",
                source: props.postHistory.source,
                commentary: props.postHistory.commentary,
                englishCommentary: props.postHistory.englishCommentary,
                bookmarks: props.postHistory.bookmarks,
                buyLink: props.postHistory.buyLink,
                mirrors: props.postHistory.mirrors ? Object.values(props.postHistory.mirrors).join("\n") : ""
            }
        }
        if (imgChanged || (srcChanged && tagsChanged)) {
            if (imgChanged && !permissions.isMod(session)) return Promise.reject("img")
            const {images, upscaledImages} = await functions.parseImages(props.postHistory, session)
            const newTags = await functions.parseNewTags(props.postHistory, session, setSessionFlag)

            await functions.put("/api/post/edit", {postID: props.postHistory.postID, images, upscaledImages, 
            type: props.postHistory.type, rating: props.postHistory.rating, source: source!, style: props.postHistory.style, 
            artists: functions.tagObject(props.postHistory.artists), characters: functions.tagObject(props.postHistory.characters), 
            preserveChildren: Boolean(props.postHistory.parentID), series: functions.tagObject(props.postHistory.series), 
            parentID: props.postHistory.parentID, noImageUpdate: true, tags: props.postHistory.tags, newTags, 
            reason: props.postHistory.reason}, session, setSessionFlag)
        } else {
            await functions.put("/api/post/quickedit", {postID: props.postHistory.postID, type: props.postHistory.type, 
            rating: props.postHistory.rating, source: source!, style: props.postHistory.style, artists: props.postHistory.artists, 
            characters: props.postHistory.characters, series: props.postHistory.series, tags: props.postHistory.tags, 
            parentID: props.postHistory.parentID, reason: props.postHistory.reason}, session, setSessionFlag)
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
        if (!post) return
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
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
                    </div>
                    <div className="historyrow-options-container" onClick={deletePostHistoryDialog}>
                        <img className="historyrow-options-img" src={postHistoryDelete}/>
                        <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                    </div>
                </div>
            )
        } else if (permissions.isContributor(session)) {
            return (
                <div className="historyrow-options">
                    <div className="historyrow-options-container" onClick={revertPostHistoryDialog}>
                        <img className="historyrow-options-img" src={postHistoryRevert}/>
                        <span className="historyrow-options-text">{i18n.buttons.revert}</span>
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
        const editText = firstHistory ? i18n.time.uploaded : i18n.time.edited
        if (userRole === "admin") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text admin-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text mod-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={modCrown}/>
                </div>
            )
        } else if (userRole === "premium-curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumCuratorStar}/>
                </div>
            )
        } else if (userRole === "curator") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text curator-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={curatorStar}/>
                </div>
            )
        } else if (userRole === "premium-contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumContributorPencil}/>
                </div>
            )
        } else if (userRole === "contributor") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text contributor-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={contributorPencil}/>
                </div>
            )
        } else if (userRole === "premium") {
            return (
                <div className="historyrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="historyrow-user-text premium-color">{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="historyrow-user-label" src={premiumStar}/>
                </div>
            )
        }
        return <span className="historyrow-user-text" onClick={userClick} onAuxClick={userClick}>{editText} {functions.timeAgo(targetDate, i18n)} {i18n.time.by} {functions.toProperCase(props.postHistory.user) || i18n.user.deleted}</span>
    }

    const updateImg = async (event: React.MouseEvent) => {
        event.preventDefault()
        if (props.postHistory.images.length > 1) {
            let newImageIndex = imageIndex + 1 
            if (newImageIndex > props.postHistory.images.length - 1) newImageIndex = 0
            const newImg = await functions.decryptThumb(functions.getRawThumbnailLink(props.postHistory.images[newImageIndex], "medium", mobile), session)
            setImg(newImg)
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
        const tagCategory = tagCategories.artists.map((t) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) =>  tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const charactersDiff = () => {
        if (!prevHistory) return props.postHistory.characters.join(" ")
        if (!tagCategories.characters) return null
        const tagCategory = tagCategories.characters.map((t) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) => tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const seriesDiff = () => {
        if (!prevHistory) return props.postHistory.series.join(" ")
        if (!tagCategories.series) return null
        const tagCategory = tagCategories.series.map((t) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) => tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const tagsDiff = () => {
        const removeArr = [...props.postHistory.artists, ...props.postHistory.characters, ...props.postHistory.series]
        const filteredTags = props.postHistory.tags.filter((tag: string) => !removeArr.includes(tag))
        if (!prevHistory) return filteredTags.join(" ")
        if (!tagCategories.tags) return null
        const tagCategory = tagCategories.tags.map((t) => t.tag)
        const addedTags = props.postHistory.addedTags.filter((tag: string) => tagCategory.includes(tag))
        const removedTags = props.postHistory.removedTags.filter((tag: string) => tagCategory.includes(tag))
        return calculateDiff(addedTags, removedTags)
    }

    const printMirrors = () => {
        if (!props.postHistory.mirrors) return "None"
        const mapped = Object.values(props.postHistory.mirrors) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="historyrow-label-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m, i18n) + append}</span>
        })
    }

    const diffJSX = () => {
        let jsx = [] as React.ReactElement[]
        let changes = props.postHistory.changes || {}
        let tagChanges = props.postHistory.addedTags?.length || props.postHistory.removedTags?.length
        if (changes.parentID !== undefined && !changes.parentID) {
            jsx.push(<span className="historyrow-text-strong">[{i18n.labels.parentRemoved}]</span>)
        }
        if ((!prevHistory && props.postHistory.images.length > 1) || changes.images) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.images}:</span> {props.postHistory.images.length}</span>)
        }
        if ((!prevHistory && props.postHistory.parentID) || changes.parentID) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.parentID}:</span> <span className="historyrow-label-link" onClick={() => history.push(`/post/${props.postHistory.parentID}`)}>{props.postHistory.parentID}</span></span>)
        }
        if (!prevHistory || changes.type) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.sidebar.type}:</span> {functions.toProperCase(props.postHistory.type)}</span>)
        }
        if (!prevHistory || changes.rating) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.sidebar.rating}:</span> {functions.toProperCase(props.postHistory.rating)}</span>)
        }
        if (!prevHistory || changes.style) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.sidebar.style}:</span> {functions.toProperCase(props.postHistory.style)}</span>)
        }
        if (!prevHistory || tagChanges) {
            if (artistsDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.navbar.artists}:</span> {artistsDiff()}</span>)
            }
        }
        if (!prevHistory || tagChanges) {
            if (charactersDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.navbar.characters}:</span> {charactersDiff()}</span>)
            }
        }
        if (!prevHistory || tagChanges) {
            if (seriesDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.tag.series}:</span> {seriesDiff()}</span>)
            }
        }
        if (!prevHistory || tagChanges) {
            if (tagsDiff()) {
                jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.navbar.tags}:</span> {tagsDiff()}</span>)
            }
        }
        if (!prevHistory || changes.title) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.title}:</span> {props.postHistory.title || i18n.labels.none}</span>)
        }
        if (!prevHistory || changes.englishTitle) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.englishTitle}:</span> {props.postHistory.englishTitle || i18n.labels.none}</span>)
        }
        if (!prevHistory || changes.artist) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.tag.artist}:</span> {props.postHistory.artist || i18n.labels.unknown}</span>)
        }
        if (!prevHistory || changes.posted) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.sort.posted}:</span> {props.postHistory.posted ? functions.formatDate(new Date(props.postHistory.posted)) : i18n.labels.unknown}</span>)
        }
        if (!prevHistory || changes.source) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.source}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.postHistory.source, "_blank")}>{functions.getSiteName(props.postHistory.source, i18n)}</span></span>)
        }
        if (!prevHistory || changes.mirrors) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.mirrors}:</span> {printMirrors()}</span>)
        }
        if ((!prevHistory && props.postHistory.bookmarks) || changes.bookmarks) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.sort.bookmarks}:</span> {props.postHistory.bookmarks || "?"}</span>)
        }
        if ((!prevHistory && props.postHistory.buyLink) || changes.buyLink) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.buyLink}:</span> {props.postHistory.buyLink || i18n.labels.none}</span>)
        }
        if (!prevHistory || changes.commentary) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.commentary}:</span> {props.postHistory.commentary || i18n.labels.none}</span>)
        }
        if (!prevHistory || changes.englishCommentary) {
            jsx.push(<span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.englishCommentary}:</span> {props.postHistory.englishCommentary || i18n.labels.none}</span>)
        }
        return jsx
    }

    useEffect(() => {
        if (!imageFiltersRef.current) return
        imageFiltersRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [brightness, contrast, hue, saturation, blur])

    return (
        <div className="historyrow">
            {session.username ? postHistoryOptions() : null}
            <div className="historyrow-container" ref={imageFiltersRef}>
                {functions.isVideo(img) ? <video style={props.imageHeight ? {height: `${props.imageHeight}px`} : {}} className="historyrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></video> :
                <img style={props.imageHeight ? {height: `${props.imageHeight}px`} : {}} className="historyrow-img" src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}/>}
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        {dateTextJSX()}
                        {props.postHistory.imageChanged ? <span className="historyrow-text-strong">[{i18n.labels.imageUpdated}]</span> : null}
                        {diffJSX()}
                        {props.postHistory.reason ? <span className="historyrow-text"><span className="historyrow-label-text">{i18n.labels.reason}:</span> {props.postHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostHistoryRow