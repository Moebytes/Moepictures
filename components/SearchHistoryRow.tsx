import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SessionContext, MobileContext, SessionFlagContext, DeleteSearchHistoryIDContext,
DeleteSearchHistoryFlagContext} from "../Context"
import functions from "../structures/Functions"
import searchHistoryDelete from "../assets/icons/delete.png"
import cryptoFunctions from "../structures/CryptoFunctions"
import "./styles/searchhistoryrow.less"
import path from "path"

interface Props {
    history: any
    onDelete?: () => void
}

const SearchHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {deleteSearchHistoryID, setDeleteSearchHistoryID} = useContext(DeleteSearchHistoryIDContext)
    const {deleteSearchHistoryFlag, setDeleteSearchHistoryFlag} = useContext(DeleteSearchHistoryFlagContext)
    const [img, setImg] = useState("")
    const ref = useRef(null) as any
    const history = useHistory()

    const updateImage = async () => {
        const thumb = functions.getThumbnailLink(props.history.post.images[0].type, props.history.postID, 1, props.history.post.images[0].filename, "medium")
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
            <div className="searchhistoryrow-options">
                <div className="searchhistoryrow-options-container" onClick={deleteSearchHistoryDialog}>
                    <img className="searchhistoryrow-options-img" src={searchHistoryDelete}/>
                    <span className="searchhistoryrow-options-text">Delete</span>
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
    
    const getDomain = (link: string) => {
        try {
            const domain = new URL(link).hostname.replace("www.", "")
            .split(".")?.[0] || ""
            if (domain.toLowerCase() === "yande") return "Yandere"
            return functions.toProperCase(domain)
        } catch {
            return "Unknown"
        }
    }

    const printMirrors = () => {
        const mapped = Object.values(props.history.post.mirrors) as string[]
        return mapped.map((m, i) => {
            let append = i !== mapped.length - 1 ? ", " : ""
            return <span className="searchhistoryrow-label-link" onClick={() => window.open(m, "_blank")}>{getDomain(m) + append}</span>
        })
    }

    return (
        <div className="searchhistoryrow">
            {searchHistoryOptions()}
            <div className="searchhistoryrow-container">
                {functions.isVideo(img) ? <video className="searchhistoryrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick}></video> :
                functions.isGIF(img) ? <img className="searchhistoryrow-img" src={img} onClick={imgClick} onAuxClick={imgClick}/> : 
                <canvas className="searchhistoryrow-img" ref={ref} onClick={imgClick} onAuxClick={imgClick}></canvas>}
            </div>
            <div className="searchhistoryrow-container-row">
                <div className="searchhistoryrow-container">
                    <div className="searchhistoryrow-user-container">
                        <span className="searchhistoryrow-user-text">Viewed on {functions.prettyDate(new Date(props.history.viewDate))}</span>
                        <span className="searchhistoryrow-text"><span className="searchhistoryrow-label-text">Title:</span> {props.history.post.title || "None"}</span>
                        {props.history.post.translatedTitle ? <span className="searchhistoryrow-text"><span className="searchhistoryrow-label-text">Translated:</span> {props.history.post.translatedTitle}</span> : null}
                        <span className="searchhistoryrow-text"><span className="searchhistoryrow-label-text">Drawn:</span> {props.history.post.drawn ? functions.formatDate(new Date(props.history.post.drawn)) : "Unknown"}</span>
                        <span className="searchhistoryrow-text"><span className="searchhistoryrow-label-text">Artist:</span> {props.history.post.artist ? props.history.post.artist : "Unknown"}</span>
                        <span className="searchhistoryrow-text"><span className="searchhistoryrow-label-text">Link:</span> <span className="searchhistoryrow-label-link" onClick={() => window.open(props.history.post.link, "_blank")}>{getDomain(props.history.post.link)}</span></span>
                        {props.history.post.mirrors ? <span className="searchhistoryrow-text"><span className="searchhistoryrow-label-text">Mirrors:</span> {printMirrors()}</span> : null}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SearchHistoryRow