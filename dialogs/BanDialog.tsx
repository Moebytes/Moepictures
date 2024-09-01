import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, BanNameContext, HideTitlebarContext, UpdateUserFlagContext,
SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import functions from "../structures/Functions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import cryptoFunctions from "../structures/CryptoFunctions"
import axios from "axios"
import path from "path"

const BanDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {banName, setBanName} = useContext(BanNameContext)
    const {updateUserFlag, setUpdateUserFlag} = useContext(UpdateUserFlagContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [deleteUnverifiedChanges, setDeleteUnverifiedChanges] = useState(true)
    const [deleteHistoryChanges, setDeleteHistoryChanges] = useState(true)
    const [deleteComments, setDeleteComments] = useState(true)
    const [deleteMessages, setDeleteMessages] = useState(true)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Ban User"
    }, [])

    useEffect(() => {
        if (banName) {
            document.body.style.pointerEvents = "none"
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [banName])

    const parseImages = async (postHistory: any) => {
        let images = [] as any
        for (let i = 0; i < postHistory.images.length; i++) {
            const filename = postHistory.images[i]?.filename ? postHistory.images[0].filename : postHistory.images[0]
            const imgLink = functions.getImageLink(postHistory.images[i]?.type, postHistory.postID, i+1, filename)
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

    const parseNewTags = async (postHistory: any) => {
        const tags = postHistory.tags
        if (!tags?.[0]) return []
        const tagMap = await functions.tagsCache()
        let notExists = [] as any
        for (let i = 0; i < tags.length; i++) {
            const exists = tagMap[tags[i]]
            if (!exists) notExists.push({tag: tags[i], desc: `${functions.toProperCase(tags[i]).replaceAll("-", " ")}.`})
        }
        return notExists
    }

    const ban = async () => {
        const revertData = await axios.post("/api/user/ban", {username: banName, deleteUnverifiedChanges, deleteHistoryChanges, deleteComments, deleteMessages, reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true}).then((r) => r.data)
        if (revertData.revertPostIDs?.length) {
            for (const postID of revertData.revertPostIDs) {
                const result = await axios.get("/api/post/history", {params: {postID}, withCredentials: true}).then((r) => r.data)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                const images = await parseImages(currentHistory)
                const newTags = await parseNewTags(currentHistory)
                const source = {
                    title: currentHistory.title,
                    translatedTitle: currentHistory.translatedTitle,
                    artist: currentHistory.artist,
                    drawn: currentHistory.drawn,
                    link: currentHistory.link,
                    commentary: currentHistory.commentary,
                    translatedCommentary: currentHistory.translatedCommentary
                }
                await axios.put("/api/post/edit", {silent: true, postID: currentHistory.postID, images, type: currentHistory.type, restrict: currentHistory.restrict, source,
                style: currentHistory.style, artists: currentHistory.artists, characters: currentHistory.characters, preserveThirdParty: currentHistory.thirdParty,
                series: currentHistory.series, tags: currentHistory.tags, newTags, updatedDate: currentHistory.date, reason: currentHistory.reason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            }
        }
        if (revertData.revertTagIDs?.length) {
            for (const tag of revertData.revertTagIDs) {
                const result = await axios.get("/api/tag/history", {params: {tag}, withCredentials: true}).then((r) => r.data)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                let image = null as any
                if (!currentHistory.image) {
                    image = ["delete"]
                } else {
                    const imageLink = functions.getTagLink(currentHistory.type, currentHistory.image)
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                    const bytes = new Uint8Array(arrayBuffer)
                    image = Object.values(bytes)
                }
                await axios.put("/api/tag/edit", {silent: true, tag: currentHistory.tag, key: currentHistory.key, description: currentHistory.description,
                image, aliases: currentHistory.aliases, implications: currentHistory.implications, social: currentHistory.social, twitter: currentHistory.twitter,
                website: currentHistory.website, fandom: currentHistory.fandom, updatedDate: currentHistory.date}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
            }
        }
        setBanName(null)
        setUpdateUserFlag(true)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            ban()
        } else {
            setBanName(null)
        }
    }

    if (banName) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Ban User</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Ban this user? You can also provide a reason.</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Delete unverified changes?</span>
                            <img className="dialog-checkbox" src={deleteUnverifiedChanges ? checkboxChecked : checkbox} onClick={() => setDeleteUnverifiedChanges((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Delete history changes?</span>
                            <img className="dialog-checkbox" src={deleteHistoryChanges ? checkboxChecked : checkbox} onClick={() => setDeleteHistoryChanges((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Delete comments/replies?</span>
                            <img className="dialog-checkbox" src={deleteComments ? checkboxChecked : checkbox} onClick={() => setDeleteComments((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Delete messages?</span>
                            <img className="dialog-checkbox" src={deleteMessages ? checkboxChecked : checkbox} onClick={() => setDeleteMessages((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div> 
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Ban"}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default BanDialog