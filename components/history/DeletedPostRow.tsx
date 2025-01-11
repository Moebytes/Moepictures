import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions, useLayoutSelector,
useFilterSelector, useInteractionActions} from "../../store"
import functions from "../../structures/Functions"
import undeleteIcon from "../../assets/icons/revert.png"
import deleteIcon from "../../assets/icons/delete.png"
import {DeletedPost} from "../../types/Types"
import "./styles/historyrow.less"

interface Props {
    post: DeletedPost
    onDelete?: () => void
}

const DeletedPostRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {permaDeletePostID, permaDeletePostFlag} = usePostDialogSelector()
    const {setUndeletePostID, setPermaDeletePostID, setPermaDeletePostFlag} = usePostDialogActions()
    const [img, setImg] = useState("")
    const [imageIndex, setImageIndex] = useState(0)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    const updateImage = async () => {
        const thumbLink = functions.getThumbnailLink(props.post.images[0].type, props.post.postID, 1, props.post.images[0].filename, "medium", mobile)
        const thumb = await functions.decryptThumb(thumbLink, session)
        setImg(thumb)
    }

    useEffect(() => {
        updateImage()
    }, [session, props.post])

    const undeletePostDialog = async () => {
        setUndeletePostID({postID: props.post.postID})
    }

    const deletePost = async () => {
        await functions.delete("/api/post/delete", {postID: props.post.postID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (permaDeletePostFlag && props.post.postID === permaDeletePostID) {
            deletePost()
            setPermaDeletePostFlag(false)
            setPermaDeletePostID(null)
        }
    }, [permaDeletePostFlag, permaDeletePostID, session])

    const deletePostDialog = async () => {
        setPermaDeletePostID(props.post.postID)
    }

    const deleteHistoryOptions = () => {
        return (
            <div className="historyrow-options">
                <div className="historyrow-options-container" onClick={undeletePostDialog}>
                    <img className="historyrow-options-img" src={undeleteIcon}/>
                    <span className="historyrow-options-text">{i18n.buttons.undelete}</span>
                </div>
                <div className="historyrow-options-container" onClick={deletePostDialog}>
                    <img className="historyrow-options-img" src={deleteIcon}/>
                    <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                </div>
            </div>
        )
    }

    const imgClick = (event: React.MouseEvent) => {
        functions.openPost(props.post, event, history, session, setSessionFlag)
    }

    const updateImg = async (event: React.MouseEvent) => {
        event.preventDefault()
        if (props.post.images.length > 1) {
            let newImageIndex = imageIndex + 1 
            if (newImageIndex > props.post.images.length - 1) newImageIndex = 0
            const newImage = props.post.images[newImageIndex]
            const thumbLink = functions.getThumbnailLink(newImage.type, props.post.postID, newImage.order, newImage.filename, "medium", mobile)
            const thumb = await functions.decryptThumb(thumbLink, session)
            setImg(thumb)
            setImageIndex(newImageIndex)
        }
    }

    const printMirrors = () => {
        const mapped = Object.values(props.post.mirrors || {}) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="historyrow-label-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m, i18n) + append}</span>
        })
    }

    useEffect(() => {
        if (!imageFiltersRef.current) return
        imageFiltersRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [brightness, contrast, hue, saturation, blur])

    return (
        <div className="historyrow">
            {deleteHistoryOptions()}
            <div className="historyrow-container" ref={imageFiltersRef}>
                {functions.isVideo(img) ? <video className="historyrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></video> :
                <img className="historyrow-img" src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}/>}
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="historyrow-user-text" style={{color: "var(--deletedColor)"}}>{i18n.time.deleted} {functions.timeUntil(props.post.deletionDate, i18n)}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.title}:</span> {props.post.title || i18n.labels.none}</span>
                        {props.post.englishTitle ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sidebar.english}:</span> {props.post.englishTitle}</span> : null}
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sort.posted}:</span> {props.post.posted ? functions.formatDate(new Date(props.post.posted)) : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.tag.artist}:</span> {props.post.artist ? props.post.artist : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.source}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.post.source, "_blank")}>{functions.getSiteName(props.post.source, i18n)}</span></span>
                        {props.post.mirrors ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.mirrors}:</span> {printMirrors()}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DeletedPostRow