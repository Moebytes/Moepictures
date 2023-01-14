import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditTagIDContext, EditTagFlagContext, EditTagImplicationsContext, 
EditTagTypeContext, EditTagPixivContext, EditTagTwitterContext, EditTagKeyContext, EditTagAliasesContext, EditTagImageContext, EditTagWebsiteContext, 
EditTagFandomContext, EditTagDescriptionContext, EditTagReasonContext, HideTitlebarContext, SessionContext} from "../Context"
import functions from "../structures/Functions"
import uploadIcon from "../assets/purple/upload.png"
import "./styles/edittagdialog.less"
import fileType from "magic-bytes.js"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import xButton from "../assets/magenta/x-button.png"
import axios from "axios"

const EditTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {editTagID, setEditTagID} = useContext(EditTagIDContext)
    const {editTagFlag, setEditTagFlag} = useContext(EditTagFlagContext)
    const {editTagKey, setEditTagKey} = useContext(EditTagKeyContext)
    const {editTagImage, setEditTagImage} = useContext(EditTagImageContext)
    const {editTagDescription, setEditTagDescription} = useContext(EditTagDescriptionContext)
    const {editTagAliases, setEditTagAliases} = useContext(EditTagAliasesContext)
    const {editTagImplications, setEditTagImplications} = useContext(EditTagImplicationsContext)
    const {editTagType, setEditTagType} = useContext(EditTagTypeContext)
    const {editTagPixiv, setEditTagPixiv} = useContext(EditTagPixivContext)
    const {editTagTwitter, setEditTagTwitter} = useContext(EditTagTwitterContext)
    const {editTagWebsite, setEditTagWebsite} = useContext(EditTagWebsiteContext)
    const {editTagFandom, setEditTagFandom} = useContext(EditTagFandomContext)
    const {editTagReason, setEditTagReason} = useContext(EditTagReasonContext)
    const {session, setSession} = useContext(SessionContext)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    useEffect(() => {
        document.title = "Moebooru: Edit Tag"
    }, [])

    useEffect(() => {
        if (editTagID) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editTagID])

    const editTag = async () => {
        if (session.username) {
            const badDesc = functions.validateDescription(editTagDescription)
            if (badDesc) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badDesc
                await functions.timeout(2000)
                setError(false)
                return
            }
            setEditTagFlag(true)
        } else {
            const badDesc = functions.validateDescription(editTagDescription)
            if (badDesc) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badDesc
                await functions.timeout(2000)
                setError(false)
                return
            }
            const badReason = functions.validateReason(editTagReason)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            let image = null as any
            if (editTagImage) {
                if (editTagImage === "delete") {
                    image = ["delete"]
                } else {
                    const arrayBuffer = await fetch(editTagImage).then((r) => r.arrayBuffer())
                    const bytes = new Uint8Array(arrayBuffer)
                    image = Object.values(bytes)
                }
            }
            await axios.post("/api/tag/edit/request", {tag: editTagID, key: editTagKey, description: editTagDescription, image, aliases: editTagAliases, implications: editTagImplications, pixiv: editTagPixiv, twitter: editTagTwitter, website: editTagWebsite, fandom: editTagFandom, reason: editTagReason}, {withCredentials: true})
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editTag()
        } else {
            setEditTagID(null)
        }
    }

    const close = () => {
        setEditTagID(null)
        setSubmitted(false)
        setEditTagReason("")
    }

    const uploadTagImg = async (event: any) => {
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: any) => {
                let bytes = new Uint8Array(f.target.result)
                const result = fileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                if (jpg || png || gif) {
                    let url = URL.createObjectURL(file)
                    let croppedURL = ""
                    if (gif) {
                        const gifData = await functions.extractGIFFrames(url)
                        let frameArray = [] as any 
                        let delayArray = [] as any
                        for (let i = 0; i < gifData.length; i++) {
                            const canvas = gifData[i].frame as HTMLCanvasElement
                            const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                            frameArray.push(cropped)
                            delayArray.push(gifData[i].delay)
                        }
                        const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1)
                        const {width, height} = await functions.imageDimensions(firstURL)
                        const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                        const blob = new Blob([buffer])
                        croppedURL = URL.createObjectURL(blob)
                    } else {
                        croppedURL = await functions.crop(url, 1)
                    }
                    const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                    bytes = new Uint8Array(arrayBuffer)
                    const blob = new Blob([bytes])
                    url = URL.createObjectURL(blob)
                    setEditTagImage(url)
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const tagSocialJSX = () => {
        let jsx = [] as any 
        if (editTagType === "artist") {
            jsx.push(
                <>
                <div className="edittag-dialog-row">
                    <span className="edittag-dialog-text">Website: </span>
                    <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagWebsite} onChange={(event) => setEditTagWebsite(event.target.value)}/>
                </div>
                <div className="edittag-dialog-row">
                    <span className="edittag-dialog-text">Pixiv: </span>
                    <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagPixiv} onChange={(event) => setEditTagPixiv(event.target.value)}/>
                </div>
                <div className="edittag-dialog-row">
                    <span className="edittag-dialog-text">Twitter: </span>
                    <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagTwitter} onChange={(event) => setEditTagTwitter(event.target.value)}/>
                </div>
                </>
            )
        }
        if (editTagType === "character") {
            jsx.push(
                <>
                <div className="edittag-dialog-row">
                    <span className="edittag-dialog-text">Wiki: </span>
                    <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagFandom} onChange={(event) => setEditTagFandom(event.target.value)}/>
                </div>
                </>
            )
        }
        if (editTagType === "series") {
            jsx.push(
                <>
                <div className="edittag-dialog-row">
                    <span className="edittag-dialog-text">Website: </span>
                    <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagWebsite} onChange={(event) => setEditTagWebsite(event.target.value)}/>
                </div>
                <div className="edittag-dialog-row">
                    <span className="edittag-dialog-text">Twitter: </span>
                    <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagTwitter} onChange={(event) => setEditTagTwitter(event.target.value)}/>
                </div>
                </>
            )
        }
        return jsx 
    }

    if (editTagID) {
        if (session.username) {
            return (
                <div className="edittag-dialog">
                    <Draggable handle=".edittag-dialog-title-container">
                    <div className="edittag-dialog-box" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="edittag-container">
                            <div className="edittag-dialog-title-container">
                                <span className="edittag-dialog-title">Edit Tag</span>
                            </div>
                            <div className="edittag-dialog-row">
                                <span className="edittag-dialog-text">Tag: </span>
                                <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagKey} onChange={(event) => setEditTagKey(event.target.value)} style={{width: "max-content"}}/>
                            </div>
                            {tagSocialJSX()}
                            <div className="edittag-dialog-row">
                                <span className="edittag-dialog-text">Image: </span>
                                <label htmlFor="tag-img" className="edittag-dialog-button">
                                    <img className="edittag-button-img-small" src={uploadIcon}/>
                                    <span className="edittag-button-text-small">Upload</span>
                                </label>
                                <input id="tag-img" type="file" onChange={(event) => uploadTagImg(event)}/>
                                {editTagImage && editTagImage !== "delete" ? 
                                <img className="edittag-x-button" src={xButton} onClick={() => setEditTagImage("delete")}/>
                                : null}
                            </div>
                            {editTagImage && editTagImage !== "delete" ? 
                            <div className="edittag-dialog-row">
                                <img className="edittag-img" src={editTagImage === "delete" ? "" : editTagImage}/>
                            </div>
                            : null}
                            <div className="edittag-dialog-row">
                                <span className="edittag-dialog-text">Description: </span>
                            </div>
                            <div className="edittag-dialog-row">
                                <textarea className="edittag-textarea" spellCheck={false} value={editTagDescription} onChange={(event) => setEditTagDescription(event.target.value)}></textarea>
                            </div>
                            <div className="edittag-dialog-row">
                                <span className="edittag-dialog-text">Aliases: </span>
                            </div>
                            <div className="edittag-dialog-row">
                                <textarea className="edittag-textarea" spellCheck={false} value={editTagAliases.join(" ")} onChange={(event) => setEditTagAliases(event.target.value.split(/ +/g))}></textarea>
                            </div>
                            <div className="edittag-dialog-row">
                                <span className="edittag-dialog-text">Implications: </span>
                            </div>
                            <div className="edittag-dialog-row">
                                <textarea className="edittag-textarea" spellCheck={false} value={editTagImplications.join(" ")} onChange={(event) => setEditTagImplications(event.target.value.split(/ +/g))}></textarea>
                            </div>
                            <div className="edittag-dialog-row">
                                <span className="edittag-dialog-text">Reason: </span>
                                <input style={{width: "100%"}} className="edittag-dialog-input" type="text" spellCheck={false} value={editTagReason} onChange={(event) => setEditTagReason(event.target.value)}/>
                            </div>
                            {error ? <div className="edittag-dialog-validation-container"><span className="edittag-dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="edittag-dialog-row">
                                <button onClick={() => click("reject")} className="edittag-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="edittag-button">{"Edit"}</button>
                            </div>
                        </div>
                    </div>
                    </Draggable>
                </div>
            )
        }

        return (
            <div className="edittag-dialog">
                <Draggable handle=".edittag-dialog-title-container">
                <div className="edittag-dialog-box" style={{height: submitted ? "125px" : "max-content"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="edittag-container">
                        <div className="edittag-dialog-title-container">
                            <span className="edittag-dialog-title">Edit Tag Request</span>
                        </div>
                        {submitted ? <>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Your tag edit request was submitted.</span>
                        </div>
                        <div className="edittag-dialog-row">
                            <button onClick={() => close()} className="edittag-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="edittag-button">{"OK"}</button>
                        </div> 
                        </> : <>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Tag: </span>
                            <input className="edittag-dialog-input" type="text" spellCheck={false} value={editTagKey} onChange={(event) => setEditTagKey(event.target.value)} style={{width: "max-content"}}/>
                        </div>
                        {tagSocialJSX()}
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Image: </span>
                            <label htmlFor="tag-img" className="edittag-dialog-button">
                                <img className="edittag-button-img-small" src={uploadIcon}/>
                                <span className="edittag-button-text-small">Upload</span>
                            </label>
                            <input id="tag-img" type="file" onChange={(event) => uploadTagImg(event)}/>
                            {editTagImage && editTagImage !== "delete" ? 
                            <img className="edittag-x-button" src={xButton} onClick={() => setEditTagImage("delete")}/>
                            : null}
                        </div>
                        {editTagImage && editTagImage !== "delete" ? 
                        <div className="edittag-dialog-row">
                            <img className="edittag-img" src={editTagImage === "delete" ? "" : editTagImage}/>
                        </div>
                        : null}
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Description: </span>
                        </div>
                        <div className="edittag-dialog-row">
                            <textarea className="edittag-textarea" spellCheck={false} value={editTagDescription} onChange={(event) => setEditTagDescription(event.target.value)}></textarea>
                        </div>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Aliases: </span>
                        </div>
                        <div className="edittag-dialog-row">
                            <textarea className="edittag-textarea" spellCheck={false} value={editTagAliases.join(" ")} onChange={(event) => setEditTagAliases(event.target.value.split(/ +/g))}></textarea>
                        </div>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Implications: </span>
                        </div>
                        <div className="edittag-dialog-row">
                            <textarea className="edittag-textarea" spellCheck={false} value={editTagImplications.join(" ")} onChange={(event) => setEditTagImplications(event.target.value.split(/ +/g))}></textarea>
                        </div>
                        <div className="edittag-dialog-row">
                            <span className="edittag-dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="edittag-dialog-input" type="text" spellCheck={false} value={editTagReason} onChange={(event) => setEditTagReason(event.target.value)}/>
                        </div>
                        {/*error ? <div className="edittag-dialog-validation-container"><span className="edittag-dialog-validation" ref={errorRef}></span></div> : null*/}
                        <div className="edittag-dialog-row">
                            <button onClick={() => click("reject")} className="edittag-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="edittag-button">{"Submit Request"}</button>
                        </div> </>}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditTagDialog