import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions, usePostDialogSelector, usePostDialogActions,
useFlagActions, useActiveActions} from "../../store"
import functions from "../../structures/Functions"
import Draggable from "react-draggable"
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
    const [submitted, setSubmitted] = useState(false)
    const [reason, setReason] = useState("")
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    const updateFields = async () => {
        if (!sourceEditID) return
        setTitle(sourceEditID.post.title || "")
        setEnglishTitle(sourceEditID.post.englishTitle || "")
        setArtist(sourceEditID.post.artist || "")
        setCommentary(sourceEditID.post.commentary || "")
        setEnglishCommentary(sourceEditID.post.englishCommentary || "")
        setMirrors(sourceEditID.post.mirrors ? Object.values(sourceEditID.post.mirrors).join("\n") : "")
        if (sourceEditID.post.posted) setPosted(functions.formatDate(new Date(sourceEditID.post.posted), true))
        setSource(sourceEditID.post.source || "")
        setBookmarks(String(sourceEditID.post.bookmarks) || "")
        setBuyLink(sourceEditID.post.buyLink || "")
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
    }

    useEffect(() => {
        document.title = i18n.sidebar.sourceEdit
    }, [i18n])

    useEffect(() => {
        if (sourceEditID) {
            document.body.style.pointerEvents = "none"
            updateFields()
        } else {
            document.body.style.pointerEvents = "all"
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
                    bookmarks: functions.safeNumber(bookmarks),
                    buyLink,
                    mirrors
                },
                reason
            }
            setSourceEditID(null)
            await functions.put("/api/post/quickedit", data, session, setSessionFlag)
            setPostFlag(true)
            setActionBanner("source-edit")
        } else {
            const badReason = functions.validateReason(reason, i18n)
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
                    bookmarks: functions.safeNumber(bookmarks),
                    buyLink,
                    mirrors
                },
                reason
            }
            await functions.put("/api/post/quickedit/unverified", data, session, setSessionFlag)
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
            let link = functions.getImageLink(image.type, image.postID, image.order, image.filename)
            let response = await fetch(`${link}?upscaled=false`, {headers: {"x-force-upscale": "false"}}).then((r) => r.arrayBuffer())
            let current = null as UploadImage | null
            if (response.byteLength) {
                const decrypted = await functions.decryptBuffer(response, link, session)
                const bytes = new Uint8Array(decrypted)
                const result = functions.bufferFileType(bytes)?.[0] || {}
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
                    thumbnail: "",
                    name: `${pixivID}.${ext}`
                }
            }
            if (!current) throw new Error("Bad image")
            const sourceLookup = await functions.post("/api/misc/sourcelookup", {current, rating: functions.r13()}, session, setSessionFlag)

            setTitle(sourceLookup.source.title)
            setEnglishTitle(sourceLookup.source.englishTitle)
            setArtist(sourceLookup.source.artist)
            setCommentary(sourceLookup.source.commentary)
            setEnglishCommentary(sourceLookup.source.englishCommentary)
            setMirrors(sourceLookup.source.mirrors)
            setPosted(functions.formatDate(new Date(sourceLookup.source.posted), true))
            setSource(sourceLookup.source.source)
            setBookmarks(sourceLookup.source.bookmarks)
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
                <input className="dialog-input-small" type="text" spellCheck={false} value={artist} onChange={(event) => setArtist(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.sort.posted}: </span>
                <input className="dialog-input-small" style={{width: "30%"}} type="date" spellCheck={false} value={posted} onChange={(event) => setPosted(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.source}: </span>
                <input className="dialog-input" type="text" spellCheck={false} value={source} onChange={(event) => setSource(event.target.value)}/>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.sort.bookmarks}: </span>
                <input className="dialog-input-small" style={{width: "15%"}} type="text" spellCheck={false} value={bookmarks} onChange={(event) => setBookmarks(event.target.value)}/>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.commentary}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="dialog-textarea-small" style={{resize: "vertical"}} spellCheck={false} value={commentary} onChange={(event) => setCommentary(event.target.value)}></textarea>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.englishCommentary}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="dialog-textarea-small" style={{resize: "vertical"}} spellCheck={false} value={englishCommentary} onChange={(event) => setEnglishCommentary(event.target.value)}></textarea>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.mirrors}: </span>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <textarea className="dialog-textarea-small" style={{resize: "vertical"}} spellCheck={false} value={mirrors} onChange={(event) => setMirrors(event.target.value)}></textarea>
            </div>
            <div className="dialog-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <span className="dialog-text">{i18n.labels.buyLink}: </span>
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
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.sidebar.sourceEdit}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.banText}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (sourceEditID.post.locked && !permissions.isMod(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.sidebar.sourceEdit}</span>
                            </div>
                            <span className="dialog-ban-text">{i18n.pages.edit.locked}</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←{i18n.buttons.back}</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (sourceEditID.unverified || permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-50px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
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
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{marginTop: "-50px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
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
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submit}</button>
                        </div>
                        </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default SourceEditDialog