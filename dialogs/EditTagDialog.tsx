import React, {useEffect, useContext, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {HideNavbarContext, HideSidebarContext, ThemeContext, EnableDragContext, EditTagIDContext, EditTagFlagContext, EditTagImplicationsContext, 
EditTagTypeContext, EditTagSocialContext, EditTagTwitterContext, EditTagKeyContext, EditTagAliasesContext, EditTagImageContext, EditTagWebsiteContext, 
EditTagFandomContext, EditTagDescriptionContext, EditTagReasonContext, HideTitlebarContext, SessionContext, EditTagPixivTagsContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext} from "../Context"
import functions from "../structures/Functions"
import uploadIcon from "../assets/icons/upload.png"
import "./styles/dialog.less"
import fileType from "magic-bytes.js"
import Draggable from "react-draggable"
import permissions from "../structures/Permissions"
import xButton from "../assets/icons/x-button.png"
import axios from "axios"

const EditTagDialog: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
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
    const {editTagSocial, setEditTagSocial} = useContext(EditTagSocialContext)
    const {editTagTwitter, setEditTagTwitter} = useContext(EditTagTwitterContext)
    const {editTagWebsite, setEditTagWebsite} = useContext(EditTagWebsiteContext)
    const {editTagFandom, setEditTagFandom} = useContext(EditTagFandomContext)
    const {editTagPixivTags, setEditTagPixivTags} = useContext(EditTagPixivTagsContext)
    const {editTagReason, setEditTagReason} = useContext(EditTagReasonContext)
    const {session, setSession} = useContext(SessionContext)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<any>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = "Moepictures: Edit Tag"
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
            await axios.post("/api/tag/edit/request", {tag: editTagID, key: editTagKey, description: editTagDescription, image, aliases: editTagAliases, implications: editTagImplications, pixivTags: editTagPixivTags, social: editTagSocial, twitter: editTagTwitter, website: editTagWebsite, fandom: editTagFandom, reason: editTagReason}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
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
                const webp = result?.mime === "image/webp"
                if (jpg || png || webp || gif) {
                    const MB = file.size / (1024*1024)
                    const maxSize = jpg ? 10 :
                                    png ? 10 :
                                    webp ? 10 :
                                    gif ? 25 : 25
                    if (MB <= maxSize) {
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
                <div className="dialog-row">
                    <span className="dialog-text">Website: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagWebsite} onChange={(event) => setEditTagWebsite(event.target.value)}/>
                </div>
                <div className="dialog-row">
                    <span className="dialog-text">Social: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagSocial} onChange={(event) => setEditTagSocial(event.target.value)}/>
                </div>
                <div className="dialog-row">
                    <span className="dialog-text">Twitter: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagTwitter} onChange={(event) => setEditTagTwitter(event.target.value)}/>
                </div>
                </>
            )
        }
        if (editTagType === "character") {
            jsx.push(
                <>
                <div className="dialog-row">
                    <span className="dialog-text">Wiki: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagFandom} onChange={(event) => setEditTagFandom(event.target.value)}/>
                </div>
                </>
            )
        }
        if (editTagType === "series") {
            jsx.push(
                <>
                <div className="dialog-row">
                    <span className="dialog-text">Website: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagWebsite} onChange={(event) => setEditTagWebsite(event.target.value)}/>
                </div>
                <div className="dialog-row">
                    <span className="dialog-text">Twitter: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagTwitter} onChange={(event) => setEditTagTwitter(event.target.value)}/>
                </div>
                </>
            )
        }
        return jsx 
    }

    if (editTagID) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">Edit Tag</span>
                            </div>
                            <span className="dialog-ban-text">You are banned. Cannot edit.</span>
                            <button className="dialog-ban-button" onClick={() => click("reject")}>
                                <span className="dialog-ban-button-text">←Back</span>
                            </button>
                        </div>
                    </Draggable>
                </div>
            )
        }

        if (session.username) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">Edit Tag</span>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Tag: </span>
                                <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagKey} onChange={(event) => setEditTagKey(event.target.value)} style={{width: "max-content"}}/>
                            </div>
                            {tagSocialJSX()}
                            <div className="dialog-row">
                                <span className="dialog-text">Image: </span>
                                <label htmlFor="tag-img" className="dialog-button" style={{marginLeft: "5px"}}>
                                    <img className="dialog-button-img-small" src={uploadIcon}/>
                                    <span className="dialog-button-text-small">Upload</span>
                                </label>
                                <input id="tag-img" type="file" onChange={(event) => uploadTagImg(event)}/>
                                {editTagImage && editTagImage !== "delete" ? 
                                <img className="dialog-x-button" src={xButton} style={{filter: getFilter()}} onClick={() => setEditTagImage("delete")}/>
                                : null}
                            </div>
                            {editTagImage && editTagImage !== "delete" ? 
                            <div className="dialog-row">
                                <img className="dialog-img" src={editTagImage === "delete" ? "" : editTagImage}/>
                            </div>
                            : null}
                            <div className="dialog-row">
                                <span className="dialog-text">Description: </span>
                            </div>
                            <div className="dialog-row">
                                <textarea className="dialog-textarea-small" spellCheck={false} value={editTagDescription} onChange={(event) => setEditTagDescription(event.target.value)}></textarea>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Aliases: </span>
                            </div>
                            <div className="dialog-row">
                                <textarea className="dialog-textarea-small" spellCheck={false} value={editTagAliases.join(" ")} onChange={(event) => setEditTagAliases(event.target.value.split(/ +/g))}></textarea>
                            </div>
                            <div className="dialog-row">
                                <span className="dialog-text">Implications: </span>
                            </div>
                            <div className="dialog-row">
                                <textarea className="dialog-textarea-small" spellCheck={false} value={editTagImplications.join(" ")} onChange={(event) => setEditTagImplications(event.target.value.split(/ +/g))}></textarea>
                            </div>
                            {editTagType !== "artist" ? <>
                            <div className="dialog-row">
                                <span className="dialog-text">Pixiv Tags: </span>
                            </div>
                            <div className="dialog-row">
                                <textarea className="dialog-textarea-small" spellCheck={false} value={editTagPixivTags.join(" ")} onChange={(event) => setEditTagPixivTags(event.target.value.split(/ +/g))}></textarea>
                            </div></> : null}
                            <div className="dialog-row">
                                <span className="dialog-text">Reason: </span>
                                <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={editTagReason} onChange={(event) => setEditTagReason(event.target.value)}/>
                            </div>
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                                <button onClick={() => click("accept")} className="dialog-button">{"Edit"}</button>
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
                <div className="dialog-box" style={{marginTop: "-30px", height: submitted ? "125px" : "max-content"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">Edit Tag Request</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Your tag edit request was submitted.</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => close()} className="dialog-button">{"OK"}</button>
                        </div> 
                        </> : <>
                        <div className="dialog-row">
                            <span className="dialog-text">Tag: </span>
                            <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagKey} onChange={(event) => setEditTagKey(event.target.value)} style={{width: "max-content"}}/>
                        </div>
                        {tagSocialJSX()}
                        <div className="dialog-row">
                            <span className="dialog-text">Image: </span>
                            <label htmlFor="tag-img" className="dialog-button" style={{marginLeft: "5px"}}>
                                <img className="dialog-button-img-small" src={uploadIcon}/>
                                <span className="dialog-button-text-small">Upload</span>
                            </label>
                            <input id="tag-img" type="file" onChange={(event) => uploadTagImg(event)}/>
                            {editTagImage && editTagImage !== "delete" ? 
                            <img className="dialog-x-button" src={xButton} style={{filter: getFilter()}} onClick={() => setEditTagImage("delete")}/>
                            : null}
                        </div>
                        {editTagImage && editTagImage !== "delete" ? 
                        <div className="dialog-row">
                            <img className="dialog-img" src={editTagImage === "delete" ? "" : editTagImage}/>
                        </div>
                        : null}
                        <div className="dialog-row">
                            <span className="dialog-text">Description: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea-small" spellCheck={false} value={editTagDescription} onChange={(event) => setEditTagDescription(event.target.value)}></textarea>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Aliases: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea-small" spellCheck={false} value={editTagAliases.join(" ")} onChange={(event) => setEditTagAliases(event.target.value.split(/ +/g))}></textarea>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">Implications: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea-small" spellCheck={false} value={editTagImplications.join(" ")} onChange={(event) => setEditTagImplications(event.target.value.split(/ +/g))}></textarea>
                        </div>
                        {editTagType !== "artist" ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">Pixiv Tags: </span>
                        </div>
                        <div className="dialog-row">
                            <textarea className="dialog-textarea-small" spellCheck={false} value={editTagPixivTags.join(" ")} onChange={(event) => setEditTagPixivTags(event.target.value.split(/ +/g))}></textarea>
                        </div></> : null}
                        <div className="dialog-row">
                            <span className="dialog-text">Reason: </span>
                            <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={editTagReason} onChange={(event) => setEditTagReason(event.target.value)}/>
                        </div>
                        {/*error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null*/}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{"Cancel"}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{"Submit Request"}</button>
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