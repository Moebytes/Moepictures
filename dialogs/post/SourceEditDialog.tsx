/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useFlagActions, useActiveActions} from "../../store"
import functions from "../../functions/Functions"
import {motion, useDragControls} from "framer-motion"
import permissions from "../../structures/Permissions"
import {UploadImage} from "../../types/Types"
import "../dialog.less"

const SourceEditDialog: React.FunctionComponent = (props) => {
    const {i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setPostFlag} = useFlagActions()
    const {sourceEditID} = usePostDialogSelector()
    const {setSourceEditID} = usePostDialogActions()
    const {setActionBanner} = useActiveActions()
    const [title, setTitle] = useState("")
    const [englishTitle, setEnglishTitle] = useState("")
    const [commentary, setCommentary] = useState("")
    const [englishCommentary, setEnglishCommentary] = useState("")
    const [artist, setArtist] = useState("")
    const [posted, setPosted] = useState("")
    const [source, setSource] = useState("")
    const [mirrors, setMirrors] = useState("")
    const [bookmarks, setBookmarks] = useState("")
    const [buyLink, setBuyLink] = useState("")
    const [pixivTags, setPixivTags] = useState("")
    const [drawingTools, setDrawingTools] = useState("")
    const [userProfile, setUserProfile] = useState("")
    const [sourceImageCount, setSourceImageCount] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [reason, setReason] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const controls = useDragControls()

    const updateFields = async () => {
        if (!sourceEditID) return
        setTitle(sourceEditID.post.title || "")
        setEnglishTitle(sourceEditID.post.englishTitle || "")
        setArtist(sourceEditID.post.artist || "")
        setCommentary(sourceEditID.post.commentary || "")
        setEnglishCommentary(sourceEditID.post.englishCommentary || "")
        setMirrors(sourceEditID.post.mirrors ? Object.values(sourceEditID.post.mirrors).join("\n") : "")
        if (sourceEditID.post.posted) setPosted(functions.date.formatDate(new Date(sourceEditID.post.posted), true))
        setSource(sourceEditID.post.source || "")
        setBookmarks(String(sourceEditID.post.bookmarks) || "")
        setBuyLink(sourceEditID.post.buyLink || "")
        setPixivTags(sourceEditID.post.pixivTags?.join(", ") || "")
        setDrawingTools(sourceEditID.post.drawingTools?.join(", ") || "")
        setUserProfile(sourceEditID.post.userProfile || "")
        setSourceImageCount(String(sourceEditID.post.sourceImageCount || ""))
    }

    const reset = () => {
        setTitle("")
        setEnglishTitle("")
        setArtist("")
        setCommentary("")
        setEnglishCommentary("")
        setMirrors("")
        setPosted("")
        setSource("")
        setBookmarks("")
        setBuyLink("")
        setPixivTags("")
        setUserProfile("")
        setDrawingTools("")
        setSourceImageCount("")
    }

    useEffect(() => {
        if (sourceEditID) {
            document.body.style.pointerEvents = "none"
            document.body.style.userSelect = "none"
            updateFields()
        } else {
            document.body.style.pointerEvents = "all"
            document.body.style.userSelect = "auto"
            setEnableDrag(true)
            reset()
        }
    }, [sourceEditID])

    const sourceEdit = async () => {
        if (!sourceEditID) return
        if (sourceEditID.unverified || permissions.isContributor(session)) {
            const data = {
                postID: sourceEditID.post.postID,
                unverified: sourceEditID.unverified,
                type: sourceEditID.post.type,
                rating: sourceEditID.post.rating,
                style: sourceEditID.post.style,
                source: {
                    title,
                    englishTitle,
                    artist,
                    posted,
                    source,
                    commentary,
                    englishCommentary,
                    userProfile,
                    bookmarks: functions.util.safeNumber(bookmarks),
                    pixivTags: pixivTags.trim() ? pixivTags.split(",") : null,
                    drawingTools: drawingTools.trim() ? drawingTools.split(",") : null,
                    sourceImageCount: functions.util.safeNumber(sourceImageCount),
                    buyLink,
                    mirrors
                },
                reason
            }
            setSourceEditID(null)
            await functions.http.put("/api/post/quickedit", data, session, setSessionFlag)
            setPostFlag(sourceEditID.post.postID)
            setActionBanner("source-edit")
        } else {
            const badReason = functions.validation.validateReason(reason, i18n)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                return setError(false)
            }
            const data = {
                postID: sourceEditID.post.postID,
                unverified: sourceEditID.unverified,
                type: sourceEditID.post.type,
                rating: sourceEditID.post.rating,
                style: sourceEditID.post.style,
                source: {
                    title,
                    englishTitle,
                    artist,
                    posted,
                    source,
                    commentary,
                    englishCommentary,
                    userProfile,
                    bookmarks: functions.util.safeNumber(bookmarks),
                    pixivTags: pixivTags.trim() ? pixivTags.split(",") : null,
                    drawingTools: drawingTools.trim() ? drawingTools.split(",") : null,
                    sourceImageCount: functions.util.safeNumber(sourceImageCount),
                    buyLink,
                    mirrors
                },
                reason
            }
            await functions.http.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const sourceLookup = async () => {
        if (!sourceEditID) return
        setError(true)
        if (!errorRef.current) await functions.timeout(20)
        errorRef.current!.innerText = i18n.buttons.fetching
        try {
            let image = sourceEditID.post.images[sourceEditID.order - 1]
            if (typeof image === "string") throw new Error("History state")
            let link = functions.link.getImageLink(image)
            let response = await functions.http.getBuffer(functions.util.appendURLParams(link, {upscaled: false}), {"x-force-upscale": "false"})
            let current = null as UploadImage | null
            if (response.byteLength) {
                const decrypted = await functions.crypto.decryptBuffer(response, link, session)
                const bytes = new Uint8Array(decrypted)
                const result = functions.byte.bufferFileType(bytes)?.[0] || {}
                const pixivID = sourceEditID.post.source?.match(/\d+/)?.[0] || "image"
                const ext = result.typename === "mkv" ? "webm" : result.typename
                current = {
                    link,
                    ext,
                    originalLink: link,
                    bytes: Object.values(bytes),
                    size: decrypted.byteLength,
                    width: image.width,
                    height: image.height,
                    altSource: "",
                    directLink: "",
                    thumbnail: "",
                    thumbnailExt: "",
                    name: `${pixivID}.${ext}`
                }
            }
            if (!current) throw new Error("Bad image")
            const sourceLookup = await functions.http.post("/api/misc/sourcelookup", {current, rating: functions.r13()}, session, setSessionFlag)

            setTitle(sourceLookup.source.title)
            setEnglishTitle(sourceLookup.source.englishTitle)
            setArtist(sourceLookup.source.artist)
            setCommentary(sourceLookup.source.commentary)
            setEnglishCommentary(sourceLookup.source.englishCommentary)
            setMirrors(sourceLookup.source.mirrors)
            setPosted(functions.date.formatDate(new Date(sourceLookup.source.posted), true))
            setSource(sourceLookup.source.source)
            setBookmarks(sourceLookup.source.bookmarks)
            setPixivTags(sourceLookup.source.pixivTags.join(", "))
            setDrawingTools(sourceLookup.source.drawingTools.join(", "))
            setUserProfile(sourceLookup.source.userProfile)
            setSourceImageCount(String(sourceLookup.source.sourceImageCount || ""))
        } catch (e) {
            console.log(e)
            errorRef.current!.innerText = i18n.pages.upload.nothingFound
            await functions.timeout(3000)
        }
        return setError(false)
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            sourceEdit()
        } else {
            setSourceEditID(null)
        }
    }

    const close = () => {
        setSourceEditID(null)
        setSubmitted(false)
        setReason("")
    }

    const mainJSX = () => {
        return (
            <>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.title}: </span>
                <input className="dialog-input-small" type="text" spellCheck={false} value={title} onChange={(event) => setTitle(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.englishTitle}: </span>
                <input className="dialog-input-small" type="text" spellCheck={false} value={englishTitle} onChange={(event) => setEnglishTitle(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.tag.artist}: </span>
                <input className="dialog-input-small" type="text" spellCheck={false} value={artist} onChange={(event) => setArtist(event.target.value)} style={{width: "30%"}}/>
                <span className="dialog-text nowrap">{i18n.labels.imageCount}: </span>
                <input className="dialog-input-small" style={{width: "15%"}} type="text" spellCheck={false} value={sourceImageCount} onChange={(event) => setSourceImageCount(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.sort.posted}: </span>
                <input className="dialog-input-small" style={{width: "30%"}} type="date" spellCheck={false} value={posted} onChange={(event) => setPosted(event.target.value)}/>
                <span className="dialog-text">{i18n.sort.bookmarks}: </span>
                <input className="dialog-input-small" style={{width: "15%"}} type="text" spellCheck={false} value={bookmarks} onChange={(event) => setBookmarks(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.source}: </span>
                <input className="dialog-input" type="text" spellCheck={false} value={source} onChange={(event) => setSource(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text nowrap">{i18n.labels.userProfile}: </span>
                <input className="dialog-input" type="text" spellCheck={false} value={userProfile} onChange={(event) => setUserProfile(event.target.value)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.commentary}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="dialog-textarea-tiny" style={{resize: "vertical"}} spellCheck={false} value={commentary} onChange={(event) => setCommentary(event.target.value)}></textarea>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.englishCommentary}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="dialog-textarea-tiny" style={{resize: "vertical"}} spellCheck={false} value={englishCommentary} onChange={(event) => setEnglishCommentary(event.target.value)}></textarea>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.mirrors}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="dialog-textarea-tiny" style={{resize: "vertical"}} spellCheck={false} value={mirrors} onChange={(event) => setMirrors(event.target.value)}></textarea>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text nowrap">{i18n.labels.pixivTags}: </span>
                <input className="dialog-input" style={{width: "75%"}} type="text" spellCheck={false} value={pixivTags} onChange={(event) => setPixivTags(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text nowrap">{i18n.labels.drawingTools}: </span>
                <input className="dialog-input" style={{width: "75%"}} type="text" spellCheck={false} value={drawingTools} onChange={(event) => setDrawingTools(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text nowrap">{i18n.labels.buyLink}: </span>
                <input className="dialog-input" style={{width: "75%"}} type="text" spellCheck={false} value={buyLink} onChange={(event) => setBuyLink(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.reason}: </span>
                <input style={{width: "100%"}} className="dialog-input" type="text" spellCheck={false} value={reason} onChange={(event) => setReason(event.target.value)}/>
            </div>
            </>
        )
    }

    if (sourceEditID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.sidebar.sourceEdit}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </motion.div>
                </div>
            )
        }

        if (sourceEditID.post.locked && !permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.sidebar.sourceEdit}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.locked}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </motion.div>
                </div>
            )
        }

        if (sourceEditID.unverified || permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                    className="dialog-box" style={{marginTop: "-50px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                                <span className="dialog-title">{i18n.sidebar.sourceEdit}</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row" style={{marginLeft: "0px"}}>
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                <button onClick={() => sourceLookup()} style={{backgroundColor: "var(--buttonBG)", marginLeft: "-5px"}} className="dialog-button">{i18n.buttons.fetch}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.edit}</button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )
        }

        return (
            <div className="dialog">
                <motion.div drag dragControls={controls} dragListener={false} dragMomentum={false}
                className="dialog-box" style={{marginTop: "-50px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container" onPointerDown={(event) => controls.start(event)}>
                            <span className="dialog-title">{i18n.dialogs.sourceEdit.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.editGroup.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div> 
                        </> : <>
                        {mainJSX()}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row" style={{marginLeft: "0px"}}>
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => sourceLookup()} style={{backgroundColor: "var(--buttonBG)", marginLeft: "-5px"}} className="dialog-button">{i18n.buttons.fetch}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submitRequest}</button>
                        </div>
                        </>}
                    </div>
                </motion.div>
            </div>
        )
    }
    return null
}

export default SourceEditDialog