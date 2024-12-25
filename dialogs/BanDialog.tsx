import React, {useEffect, useState, useRef} from "react"
import {useInteractionActions, useSessionSelector, useSessionActions, useMiscDialogSelector, useMiscDialogActions,
useFlagActions} from "../store"
import {useThemeSelector} from "../store"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/dialog.less"
import Draggable from "react-draggable"
import checkbox from "../assets/icons/checkbox.png"
import checkboxChecked from "../assets/icons/checkbox-checked.png"
import path from "path"

const BanDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {banName} = useMiscDialogSelector()
    const {setBanName} = useMiscDialogActions()
    const {setUpdateUserFlag} = useFlagActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [reason, setReason] = useState("")
    const [deleteUnverifiedChanges, setDeleteUnverifiedChanges] = useState(true)
    const [deleteHistoryChanges, setDeleteHistoryChanges] = useState(true)
    const [deleteComments, setDeleteComments] = useState(true)
    const [deleteMessages, setDeleteMessages] = useState(true)
    const [days, setDays] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.ban.title
    }, [i18n])

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
        const revertData = await functions.post("/api/user/ban", {username: banName, deleteUnverifiedChanges, deleteHistoryChanges, deleteComments, deleteMessages, days: functions.safeNumber(days)!, reason}, session, setSessionFlag)
        if (revertData.revertPostIDs?.length) {
            for (const postID of revertData.revertPostIDs) {
                const result = await functions.get("/api/post/history", {postID}, session, setSessionFlag)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                const {images, upscaledImages} = await functions.parseImages(currentHistory, session)
                const newTags = await functions.parseNewTags(currentHistory, session, setSessionFlag)
                const source = {
                    title: currentHistory.title,
                    englishTitle: currentHistory.englishTitle,
                    artist: currentHistory.artist,
                    posted: currentHistory.posted,
                    source: currentHistory.source,
                    commentary: currentHistory.commentary,
                    englishCommentary: currentHistory.englishCommentary,
                    bookmarks: currentHistory.bookmarks,
                    buyLink: currentHistory.buyLink,
                    mirrors: currentHistory.mirrors ? Object.values(currentHistory.mirrors).join("\n") : null
                }
                await functions.put("/api/post/edit", {silent: true, postID: currentHistory.postID, images, upscaledImages, type: currentHistory.type, rating: currentHistory.rating, source,
                style: currentHistory.style, artists: functions.tagObject(currentHistory.artists), characters: functions.tagObject(currentHistory.characters), preserveChildren: Boolean(currentHistory.parentID),
                series: functions.tagObject(currentHistory.series), tags: currentHistory.tags, newTags, updatedDate: currentHistory.date, reason: currentHistory.reason}, session, setSessionFlag)
            }
        }
        if (revertData.revertTagIDs?.length) {
            for (const tag of revertData.revertTagIDs) {
                const result = await functions.get("/api/tag/history", {tag}, session, setSessionFlag)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                let image = null as Uint8Array | ["delete"] | null
                if (!currentHistory.image) {
                    image = ["delete"]
                } else {
                    const imageLink = functions.getTagLink(currentHistory.type, currentHistory.image, currentHistory.imageHash)
                    const arrayBuffer = await fetch(imageLink).then((r) => r.arrayBuffer())
                    const bytes = new Uint8Array(arrayBuffer)
                    image = bytes
                }
                await functions.put("/api/tag/edit", {silent: true, tag: currentHistory.tag, key: currentHistory.key, description: currentHistory.description,
                image: image!, aliases: currentHistory.aliases, implications: currentHistory.implications, social: currentHistory.social, twitter: currentHistory.twitter,
                website: currentHistory.website, fandom: currentHistory.fandom, type: currentHistory.type, updatedDate: currentHistory.date}, session, setSessionFlag)
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
        if (revertData.revertNoteIDs?.length) {
            for (const item of revertData.revertNoteIDs) {
                const result = await functions.get("/api/note/history", {postID: item.postID, order: item.order}, session, setSessionFlag)
                if (!result?.[0]) continue
                const currentHistory = result[0]
                await functions.put("/api/note/save", {silent: true, postID: currentHistory.postID, order: currentHistory.order, 
                data: currentHistory.notes}, session, setSessionFlag)
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
                            <span className="dialog-title">{i18n.dialogs.ban.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.ban.header}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.ban.unverifiedChanges}</span>
                            <img className="dialog-checkbox" src={deleteUnverifiedChanges ? checkboxChecked : checkbox} onClick={() => setDeleteUnverifiedChanges((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.ban.historyChanges}</span>
                            <img className="dialog-checkbox" src={deleteHistoryChanges ? checkboxChecked : checkbox} onClick={() => setDeleteHistoryChanges((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.ban.comments}</span>
                            <img className="dialog-checkbox" src={deleteComments ? checkboxChecked : checkbox} onClick={() => setDeleteComments((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.ban.messages}</span>
                            <img className="dialog-checkbox" src={deleteMessages ? checkboxChecked : checkbox} onClick={() => setDeleteMessages((prev: boolean) => !prev)} style={{filter: getFilter()}}/>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.days}: </span>
                            <input style={{width: "20%"}} className="dialog-input-taller" type="text" spellCheck={false} value={days} onChange={(event) => setDays(event.target.value)}/>
                        </div> 
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.labels.reason}: </span>
                            <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
                        </div> 
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.ban}</button>
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