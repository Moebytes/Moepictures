import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, QuoteTextContext, SessionContext, MobileContext, DeletePostHistoryIDContext, 
RevertPostHistoryIDContext, DeletePostHistoryFlagContext, RevertPostHistoryFlagContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import postHistoryRevert from "../assets/purple/revert.png"
import postHistoryDelete from "../assets/purple/delete.png"
import adminCrown from "../assets/purple/admin-crown.png"
import modCrown from "../assets/purple/mod-crown.png"
import permissions from "../structures/Permissions"
import "./styles/posthistoryrow.less"
import localforage from "localforage"
import crypto from "crypto"
import axios from "axios"
import path from "path"

interface Props {
    postHistory: any
    currentHistory: any
    onDelete?: () => void
    onEdit?: () => void
    current?: boolean
}

const PostHistoryRow: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {session, setSession} = useContext(SessionContext)
    const {deletePostHistoryID, setDeletePostHistoryID} = useContext(DeletePostHistoryIDContext)
    const {revertPostHistoryID, setRevertPostHistoryID} = useContext(RevertPostHistoryIDContext)
    const {deletePostHistoryFlag, setDeletePostHistoryFlag} = useContext(DeletePostHistoryFlagContext)
    const {revertPostHistoryFlag, setRevertPostHistoryFlag} = useContext(RevertPostHistoryFlagContext)
    const history = useHistory()
    const initialImg = functions.getImageLink(props.postHistory.images[0]?.type, props.postHistory.postID, props.postHistory.images[0]?.filename ? props.postHistory.images[0].filename : props.postHistory.images[0])
    const currentImg = functions.getImageLink(props.currentHistory.images[0]?.type, props.currentHistory.postID, props.currentHistory.images[0]?.filename ? props.currentHistory.images[0].filename : props.currentHistory.images[0])
    const [img, setImg] = useState(initialImg)
    const [imageIndex, setImageIndex] = useState(0)
    const [userRole, setUserRole] = useState("")
    const ref = useRef(null) as any
    const postID = props.postHistory.postID

    const updateUserRole = async () => {
        const user = await axios.get("/api/user", {params: {username: props.postHistory.user}, withCredentials: true}).then((r) => r.data)
        if (user?.role) setUserRole(user.role)
    }

    useEffect(() => {
        updateUserRole()
    }, [])

    const imagesChanged = async () => {
        if (props.postHistory.images.length !== props.currentHistory.images.length) return true
        for (let i = 0; i < props.postHistory.images.length; i++) {
            const imgLink = functions.getImageLink(props.postHistory.images[i]?.type, props.postHistory.postID, props.postHistory.images[i]?.filename ? props.postHistory.images[i].filename : props.postHistory.images[i])
            const currentLink = functions.getImageLink(props.currentHistory.images[i]?.type, props.currentHistory.postID, props.currentHistory.images[i]?.filename ? props.currentHistory.images[i].filename : props.currentHistory.images[i])

            let img = imgLink
            if (functions.isImage(img)) {
                img = await cryptoFunctions.decryptedLink(img)
            } else if (functions.isModel(img)) {
                img = await functions.modelImage(img)
            } else if (functions.isAudio(img)) {
                img = await functions.songCover(img)
            }
            let current = currentLink
            if (functions.isImage(current)) {
                current = await cryptoFunctions.decryptedLink(current)
            } else if (functions.isModel(img)) {
                current = await functions.modelImage(current)
            } else if (functions.isAudio(img)) {
                current = await functions.songCover(current)
            }
            const imgBuffer = await axios.get(img, {responseType: "arraybuffer", withCredentials: true}).then((r) => r.data)
            const currentBuffer = await axios.get(currentImg, {responseType: "arraybuffer", withCredentials: true}).then((r) => r.data)

            const imgMD5 = crypto.createHash("md5").update(Buffer.from(imgBuffer)).digest("hex")
            const currentMD5 = crypto.createHash("md5").update(Buffer.from(currentBuffer)).digest("hex")

            if (imgMD5 !== currentMD5) return true
        }
        return false
    }

    const sourceChanged = () => {
        if (props.postHistory.title !== props.currentHistory.title) return true
        if (props.postHistory.translatedTitle !== props.currentHistory.translatedTitle) return true
        if (props.postHistory.drawn !== props.currentHistory.drawn) return true
        if (props.postHistory.link !== props.currentHistory.link) return true
        if (props.postHistory.artist !== props.currentHistory.artist) return true
        if (props.postHistory.commentary !== props.currentHistory.commentary) return true
        if (props.postHistory.translatedCommentary !== props.currentHistory.translatedCommentary) return true
        return false
    }

    const parseImages = async () => {
        let images = [] as any
        for (let i = 0; i < props.postHistory.images.length; i++) {
            const imgLink = functions.getImageLink(props.postHistory.images[i]?.type, props.postHistory.postID, props.postHistory.images[i]?.filename ? props.postHistory.images[i].filename : props.postHistory.images[i])
            let link = imgLink
            let ext = path.extname(imgLink)
            if (functions.isImage(link)) {
                link = await cryptoFunctions.decryptedLink(link)
                link += `#${ext}`
            }
            const buffer = await axios.get(link, {responseType: "arraybuffer", withCredentials: true}).then((r) => r.data) as Buffer
            let thumbnail = ""
            if (ext === ".mp4" || ext === ".webm") {
                thumbnail = await functions.videoThumbnail(link)
            } else if (ext === ".glb" || ext === ".fbx" || ext === ".obj") {
                thumbnail = await functions.modelImage(link)
            } else if (ext === ".mp3" || ext === ".wav") {
                thumbnail = await functions.songCover(link)
            }
            images.push({link, ext: ext.replace(".", ""), size: buffer.byteLength, thumbnail,
            originalLink: imgLink, bytes: Object.values(new Uint8Array(buffer)), name: path.basename(imgLink)})
        }
        return images
    }

    const parseNewTags = async () => {
        const tags = props.postHistory.tags
        if (!tags?.[0]) return []
        const savedTags = await localforage.getItem("tags") as any
        let notExists = [] as any
        for (let i = 0; i < tags.length; i++) {
            const exists = savedTags.find((t: any) => t.tag === tags[i])
            if (!exists) notExists.push({tag: tags[i], desc: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`})
        }
        return notExists
    }

    const revertPostHistory = async () => {
        if (props.current) return Promise.reject()
        const imgChanged = await imagesChanged()
        const srcChanged = sourceChanged()
        if (imgChanged || srcChanged) {
            if (imgChanged && !permissions.isStaff(session)) return Promise.reject("img")
            const images = await parseImages()
            const newTags = await parseNewTags()
            const source = {
                title: props.postHistory.title,
                translatedTitle: props.postHistory.translatedTitle,
                artist: props.postHistory.artist,
                drawn: props.postHistory.drawn,
                link: props.postHistory.link,
                commentary: props.postHistory.commentary,
                translatedCommentary: props.postHistory.translatedCommentary
            }
            await axios.put("/api/post/edit", {postID: props.postHistory.postID, images, type: props.postHistory.type, restrict: props.postHistory.restrict, source,
            style: props.postHistory.style, artists: props.postHistory.artists, characters: props.postHistory.characters, preserveThirdParty: props.postHistory.thirdParty,
            series: props.postHistory.series, tags: props.postHistory.tags, newTags, reason: props.postHistory.reason}, {withCredentials: true})
        } else {
            await axios.put("/api/post/quickedit", {postID: props.postHistory.postID, type: props.postHistory.type, restrict: props.postHistory.restrict,
            style: props.postHistory.style, artists: props.postHistory.artists, characters: props.postHistory.characters, preserveThirdParty: props.postHistory.thirdParty,
            series: props.postHistory.series, tags: props.postHistory.tags, reason: props.postHistory.reason}, {withCredentials: true})
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
    }, [revertPostHistoryFlag, revertPostHistoryID, props.current])

    const deletePostHistory = async () => {
        if (props.current) return Promise.reject()
        await axios.delete("/api/post/history/delete", {params: {postID, historyID: props.postHistory.historyID}, withCredentials: true})
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
    }, [deletePostHistoryFlag, deletePostHistoryID, props.current])

    const revertPostHistoryDialog = async () => {
        setRevertPostHistoryID({failed: false, historyID: props.postHistory.historyID})
    }

    const deletePostHistoryDialog = async () => {
        setDeletePostHistoryID({failed: false, historyID: props.postHistory.historyID})
    }

    const postHistoryOptions = () => {
        if (permissions.isStaff(session)) {
            return (
                <div className="posthistoryrow-options">
                    <div className="posthistoryrow-options-container" onClick={revertPostHistoryDialog}>
                        <img className="posthistoryrow-options-img" src={postHistoryRevert}/>
                        <span className="posthistoryrow-options-text">Revert</span>
                    </div>
                    <div className="posthistoryrow-options-container" onClick={deletePostHistoryDialog}>
                        <img className="posthistoryrow-options-img" src={postHistoryDelete}/>
                        <span className="posthistoryrow-options-text">Delete</span>
                    </div>
                </div>
            )
        } else {
            return (
                <div className="posthistoryrow-options">
                    <div className="posthistoryrow-options-container" onClick={revertPostHistoryDialog}>
                    <img className="posthistoryrow-options-img" src={postHistoryRevert}/>
                    <span className="posthistoryrow-options-text">Revert</span>
                </div>
                </div>
            )
        }
    }

    const imgClick = (event: React.MouseEvent) => {
        if (event.ctrlKey || event.metaKey || event.button === 1) {
            window.open(`/post/${props.postHistory.postID}`, "_blank")
        } else {
            history.push(`/post/${props.postHistory.postID}`)
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
        if (userRole === "admin") {
            return (
                <div className="posthistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="posthistoryrow-user-text admin-color">Edited {functions.timeAgo(props.postHistory.date)} by {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="posthistoryrow-user-label" src={adminCrown}/>
                </div>
            )
        } else if (userRole === "mod") {
            return (
                <div className="posthistoryrow-username-container" onClick={userClick} onAuxClick={userClick}>
                    <span className="posthistoryrow-user-text mod-color">Edited {functions.timeAgo(props.postHistory.date)} by {functions.toProperCase(props.postHistory.user)}</span>
                    <img className="posthistoryrow-user-label" src={modCrown}/>
                </div>
            )
        }
        return <span className="posthistoryrow-user-text" onClick={userClick} onAuxClick={userClick}>Edited {functions.timeAgo(props.postHistory.date)} by {functions.toProperCase(props.postHistory.user)}</span>
    }

    const getDomain = () => {
        if (props.postHistory.link) {
            try {
                const domain = new URL(props.postHistory.link).hostname.replace("www.", "")
                .split(".")?.[0] || ""
                if (domain.toLowerCase() === "yande") return "Yandere"
                return functions.toProperCase(domain)
            } catch {
                return "Unknown"
            }
        }
        return "Unknown"
    }

    const loadImage = async () => {
        if (functions.isGIF(img)) return
        if (!ref.current) return
        let src = img
        if (functions.isImage(src)) {
            src = await cryptoFunctions.decryptedLink(src)
        } else if (functions.isModel(src)) {
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

    const updateImg = (event: React.MouseEvent) => {
        event.preventDefault()
        if (props.postHistory.images.length > 1) {
            let newImageIndex = imageIndex + 1 
            if (newImageIndex > props.postHistory.images.length - 1) newImageIndex = 0
            const newImg = functions.getImageLink(props.postHistory.images[newImageIndex]?.type, props.postHistory.postID, props.postHistory.images[newImageIndex]?.filename ? props.postHistory.images[newImageIndex].filename : props.postHistory.images[newImageIndex])
            setImageIndex(newImageIndex)
            setImg(newImg)
        }
    }

    return (
        <div className="posthistoryrow">
            <div className="posthistoryrow-container">
                {functions.isVideo(img) ? <video className="posthistoryrow-img" autoPlay muted loop disablePictureInPicture src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></video> :
                functions.isGIF(img) ? <img className="posthistoryrow-img" src={img} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}/> : 
                <canvas className="posthistoryrow-img" ref={ref} onClick={imgClick} onAuxClick={imgClick} onContextMenu={updateImg}></canvas>}
            </div>
            <div className="posthistoryrow-container-row">
                <div className="posthistoryrow-container">
                    <div className="posthistoryrow-user-container">
                        {dateTextJSX()}
                        {props.postHistory.images.length > 1 ? <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Images:</span> {props.postHistory.images.length}</span> : null}
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Type:</span> {functions.toProperCase(props.postHistory.type)}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Restrict:</span> {functions.toProperCase(props.postHistory.restrict)}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Style:</span> {functions.toProperCase(props.postHistory.style)}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Artists:</span> {props.postHistory.artists.join(" ")}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Characters:</span> {props.postHistory.characters.join(" ")}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Series:</span> {props.postHistory.series.join(" ")}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Tags:</span> {props.postHistory.tags.join(" ")}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Title:</span>{props.postHistory.title || "None"}</span>
                        {props.postHistory.translatedTitle ? <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Translated:</span> {props.postHistory.translatedTitle}</span> : null}
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Drawn:</span> {props.postHistory.drawn ? functions.formatDate(new Date(props.postHistory.drawn)) : "Unknown"}</span>
                        <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Link:</span> <span className="posthistoryrow-label-link" onClick={() => window.open(props.postHistory.link, "_blank")}>{getDomain()}</span></span>
                        {props.postHistory.commentary ? <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Commentary:</span> {props.postHistory.commentary}</span> : null}
                        {props.postHistory.translatedCommentary ? <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Translated:</span> {props.postHistory.translatedCommentary}</span> : null}
                        {props.postHistory.reason ? <span className="posthistoryrow-text"><span className="posthistoryrow-label-text">Reason:</span> {props.postHistory.reason}</span> : null}
                    </div>
                </div>
            </div>
            {session.username ? postHistoryOptions() : null}
        </div>
    )
}

export default PostHistoryRow