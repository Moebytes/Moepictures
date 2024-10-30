import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, BanNameContext, HideTitlebarContext, UpdateUserFlagContext,
SiteHueContext, SiteLightnessContext, SiteSaturationContext, SessionContext, SessionFlagContext} from "../Context"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import cryptoFunctions from "../structures/CryptoFunctions"
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
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const [reason, setReason] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [deleteUnverifiedChanges, setDeleteUnverifiedChanges] = useState(true)
    const [deleteHistoryChanges, setDeleteHistoryChanges] = useState(true)
    const [deleteComments, setDeleteComments] = useState(true)
    const [deleteMessages, setDeleteMessages] = useState(true)
    const [days, setDays] = useState("")
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

    const ban = async () => {
        if (!permissions.isMod(session)) return setBanName(null)
        if (days && Number.isNaN(Number(days))) {
            setError(true)
            if (!errorRef.current) await functions.timeout(20)
            errorRef.current!.innerText = "Invalid days."
            await functions.timeout(2000)
            return setError(false)
        }
        const revertData = await functions.post("/api/user/ban", {username: banName, deleteUnverifiedChanges, deleteHistoryChanges, deleteComments, deleteMessages, days, reason}, session, setSessionFlag)
        if (revertData.revertPostIDs?.length) {
            for (const postID of revertData.revertPostIDs) {
                const result = await functions.get("/api/post/history", {postID}, session, setSessionFlag)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                const {images, upscaledImages} = await functions.parseImages(currentHistory)
                const newTags = await functions.parseNewTags(currentHistory, session, setSessionFlag)
                const source = {
                    title: currentHistory.title,
                    translatedTitle: currentHistory.translatedTitle,
                    artist: currentHistory.artist,
                    drawn: currentHistory.drawn,
                    link: currentHistory.link,
                    commentary: currentHistory.commentary,
                    translatedCommentary: currentHistory.translatedCommentary
                }
                await functions.put("/api/post/edit", {silent: true, postID: currentHistory.postID, images, upscaledImages, type: currentHistory.type, restrict: currentHistory.restrict, source,
                style: currentHistory.style, artists: currentHistory.artists, characters: currentHistory.characters, preserveThirdParty: currentHistory.thirdParty,
                series: currentHistory.series, tags: currentHistory.tags, newTags, updatedDate: currentHistory.date, reason: currentHistory.reason}, session, setSessionFlag)
            }
        }
        if (revertData.revertTagIDs?.length) {
            for (const tag of revertData.revertTagIDs) {
                const result = await functions.get("/api/tag/history", {tag}, session, setSessionFlag)
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
                await functions.put("/api/tag/edit", {silent: true, tag: currentHistory.tag, key: currentHistory.key, description: currentHistory.description,
                image, aliases: currentHistory.aliases, implications: currentHistory.implications, social: currentHistory.social, twitter: currentHistory.twitter,
                website: currentHistory.website, fandom: currentHistory.fandom, updatedDate: currentHistory.date}, session, setSessionFlag)
            }
        }
        if (revertData.revertGroupIDs?.length) {
            for (const slug of revertData.revertGroupIDs) {
                const result = await functions.get("/api/group/history", {slug}, session, setSessionFlag)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                await functions.put("/api/group/reorder", {silent: true, slug: currentHistory.slug, posts: currentHistory.posts}, session, setSessionFlag)
                await functions.put("/api/group/edit", {silent: true, slug: currentHistory.slug, name: currentHistory.name, description: currentHistory.description}, session, setSessionFlag)
            }
        }
        if (revertData.revertTranslationIDs?.length) {
            for (const item of revertData.revertTranslationIDs) {
                const result = await functions.get("/api/translation/history", {postID: item.postID, order: item.order}, session, setSessionFlag)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                await functions.put("/api/translation/save", {silent: true, postID: currentHistory.postID, order: currentHistory.order, 
                data: currentHistory.data}, session, setSessionFlag)
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
                            <span className="dialog-text">Days: </span>
                            <input style={{width: "20%"}} className="dialog-input-taller" type="text" spellCheck={false} value={days} onChange={(event) => setDays(event.target.value)}/>
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