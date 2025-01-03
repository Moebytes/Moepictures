import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useSearchDialogSelector, useSearchDialogActions, useLayoutSelector,
useFilterSelector, useInteractionActions} from "../../store"
import functions from "../../structures/Functions"
import searchHistoryDelete from "../../assets/icons/delete.png"
import {SearchHistory} from "../../types/Types"
import "./styles/historyrow.less"

interface Props {
    history: SearchHistory
    onDelete?: () => void
}

const SearchHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setEnableDrag} = useInteractionActions()
    const {brightness, contrast, hue, saturation, blur} = useFilterSelector()
    const {deleteSearchHistoryID, deleteSearchHistoryFlag} = useSearchDialogSelector()
    const {setDeleteSearchHistoryID, setDeleteSearchHistoryFlag} = useSearchDialogActions()
    const [img, setImg] = useState("")
    const [imageIndex, setImageIndex] = useState(0)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const history = useHistory()

    const updateImage = async () => {
        const thumbLink = functions.getThumbnailLink(props.history.post.images[0].type, props.history.postID, 1, props.history.post.images[0].filename, "medium", mobile)
        const thumb = await functions.decryptThumb(thumbLink, session)
        setImg(thumb)
    }

    useEffect(() => {
        updateImage()
    }, [session, props.history])

    const deleteSearchHistory = async () => {
        await functions.delete("/api/user/history/delete", {postID: props.history.postID}, session, setSessionFlag)
        props.onDelete?.()
    }

    useEffect(() => {
        if (deleteSearchHistoryFlag && props.history.postID === deleteSearchHistoryID) {
            deleteSearchHistory()
            setDeleteSearchHistoryFlag(false)
            setDeleteSearchHistoryID(null)
        }
    }, [deleteSearchHistoryFlag, deleteSearchHistoryID, session])

    const deleteSearchHistoryDialog = async () => {
        setDeleteSearchHistoryID(props.history.postID)
    }

    const searchHistoryOptions = () => {
        return (
            <div className="historyrow-options">
                <div className="historyrow-options-container" onClick={deleteSearchHistoryDialog}>
                    <img className="historyrow-options-img" src={searchHistoryDelete}/>
                    <span className="historyrow-options-text">{i18n.buttons.delete}</span>
                </div>
            </div>
        )
    }

    const imgClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.history.postID}`, "_blank")
        } else {
            history.push(`/post/${props.history.postID}`)
        }
    }

    const updateImg = async (event: React.MouseEvent) => {
        event.preventDefault()
        if (props.history.images.length > 1) {
            let newImageIndex = imageIndex + 1 
            if (newImageIndex > props.history.images.length - 1) newImageIndex = 0
            const newImage = props.history.post.images[newImageIndex]
            const thumbLink = functions.getThumbnailLink(newImage.type, props.history.postID, newImage.order, newImage.filename, "medium", mobile)
            const thumb = await functions.decryptThumb(thumbLink, session)
            setImg(thumb)
            setImageIndex(newImageIndex)
        }
    }

    const printMirrors = () => {
        const mapped = Object.values(props.history.post.mirrors || {}) as string[]
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
            {searchHistoryOptions()}
            <div className="historyrow-container" ref={imageFiltersRef}>
                {functions.isVideo(img) ? <video className="historyrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></video> :
                <img className="historyrow-img" src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}/>}
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <span className="historyrow-user-text">{i18n.time.viewed} {functions.prettyDate(new Date(props.history.viewDate), i18n)}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.title}:</span> {props.history.post.title || i18n.labels.none}</span>
                        {props.history.post.englishTitle ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sidebar.english}:</span> {props.history.post.englishTitle}</span> : null}
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sort.posted}:</span> {props.history.post.posted ? functions.formatDate(new Date(props.history.post.posted)) : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.tag.artist}:</span> {props.history.post.artist ? props.history.post.artist : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.source}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.history.post.source, "_blank")}>{functions.getSiteName(props.history.post.source, i18n)}</span></span>
                        {props.history.post.mirrors ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.mirrors}:</span> {printMirrors()}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchHistoryRow