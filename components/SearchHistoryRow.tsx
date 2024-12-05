import React, {useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useSessionSelector, useSessionActions, useSearchDialogSelector, useSearchDialogActions, useLayoutSelector} from "../store"
import functions from "../structures/Functions"
import searchHistoryDelete from "../assets/icons/delete.png"
import "./styles/historyrow.less"
import path from "path"

interface Props {
    history: any
    onDelete?: () => void
}

const SearchHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {i18n} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {deleteSearchHistoryID, deleteSearchHistoryFlag} = useSearchDialogSelector()
    const {setDeleteSearchHistoryID, setDeleteSearchHistoryFlag} = useSearchDialogActions()
    const [img, setImg] = useState("")
    const ref = useRef(null) as any
    const history = useHistory()

    const updateImage = async () => {
        const thumb = functions.getThumbnailLink(props.history.post.images[0].type, props.history.postID, 1, props.history.post.images[0].filename, "medium", mobile)
        setImg(thumb + `#${path.extname(thumb)}`)
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

    const loadImage = async () => {
        if (functions.isGIF(img)) return
        if (!ref.current) return
        let src = await functions.decryptThumb(img, session)
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
    }, [img, session])

    const printMirrors = () => {
        const mapped = Object.values(props.history.post.mirrors) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="historyrow-label-link" onClick={() => window.open(m, "_blank")}>{functions.getSiteName(m, i18n) + append}</span>
        })
    }

    return (
        <div className="historyrow">
            {searchHistoryOptions()}
            <div className="historyrow-container">
                {functions.isVideo(img) ? <video className="historyrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick}></video> :
                functions.isGIF(img) ? <img className="historyrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}/> : 
                <canvas className="historyrow-img" ref={ref} onClick={imgClick} onAuxClick={imgClick}></canvas>}
            </div>
            <div className="historyrow-container-row">
                <div className="historyrow-container">
                    <div className="historyrow-user-container">
                        <span className="historyrow-user-text">{i18n.time.viewed} {functions.prettyDate(new Date(props.history.viewDate), i18n)}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.title}:</span> {props.history.post.title || i18n.labels.none}</span>
                        {props.history.post.translatedTitle ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sidebar.translated}:</span> {props.history.post.translatedTitle}</span> : null}
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.sort.posted}:</span> {props.history.post.posted ? functions.formatDate(new Date(props.history.post.posted)) : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.tag.artist}:</span> {props.history.post.artist ? props.history.post.artist : i18n.labels.unknown}</span>
                        <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.link}:</span> <span className="historyrow-label-link" onClick={() => window.open(props.history.post.link, "_blank")}>{functions.getSiteName(props.history.post.link, i18n)}</span></span>
                        {props.history.post.mirrors ? <span className="historyrow-text"><span className="historyrow-label-text-strong">{i18n.labels.mirrors}:</span> {printMirrors()}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchHistoryRow