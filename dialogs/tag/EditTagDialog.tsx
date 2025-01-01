import React, {useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useTagDialogSelector, useTagDialogActions, useSessionSelector, useSessionActions} from "../../store"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import uploadIcon from "../../assets/icons/upload.png"
import "../dialog.less"
import Draggable from "react-draggable"
import xButton from "../../assets/icons/x-button.png"
import lewdIcon from "../../assets/icons/lewd.png"
import radioButton from "../../assets/icons/radiobutton.png"
import radioButtonChecked from "../../assets/icons/radiobutton-checked.png"

const EditTagDialog: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {editTagObj} = useTagDialogSelector()
    const {setEditTagObj, setEditTagFlag} = useTagDialogActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState(false)
    const errorRef = useRef<HTMLSpanElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.dialogs.editTag.title
    }, [i18n])

    useEffect(() => {
        if (editTagObj) {
            // document.body.style.overflowY = "hidden"
            document.body.style.pointerEvents = "none"
        } else {
            // document.body.style.overflowY = "visible"
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
        }
    }, [editTagObj])

    const editTag = async () => {
        if (!editTagObj) return
        if (permissions.isContributor(session)) {
            setEditTagFlag(true)
        } else {
            const badReason = functions.validateReason(editTagObj.reason, i18n)
            if (badReason) {
                setError(true)
                if (!errorRef.current) await functions.timeout(20)
                errorRef.current!.innerText = badReason
                await functions.timeout(2000)
                setError(false)
                return
            }
            let image = null as Uint8Array | ["delete"] | null
            if (editTagObj.image) {
                if (editTagObj.image === "delete") {
                    image = ["delete"]
                } else {
                    const arrayBuffer = await fetch(editTagObj.image).then((r) => r.arrayBuffer())
                    const bytes = new Uint8Array(arrayBuffer)
                    image = bytes
                }
            }
            await functions.post("/api/tag/edit/request", {tag: editTagObj.tag, key: editTagObj.key, description: editTagObj.description, image, aliases: editTagObj.aliases, 
            implications: editTagObj.implications, pixivTags: editTagObj.pixivTags, social: editTagObj.social, twitter: editTagObj.twitter, website: editTagObj.website, fandom: editTagObj.fandom, 
            r18: editTagObj.r18, featuredPost: editTagObj.featuredPost, reason: editTagObj.reason}, session, setSessionFlag)
            setSubmitted(true)
        }
    }

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            editTag()
        } else {
            setEditTagObj(null)
        }
    }

    const close = () => {
        setEditTagObj(null)
        setSubmitted(false)
    }

    const uploadTagImg = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!editTagObj) return
        const file = event.target.files?.[0]
        if (!file) return
        const fileReader = new FileReader()
        await new Promise<void>((resolve) => {
            fileReader.onloadend = async (f: ProgressEvent<FileReader>) => {
                let bytes = new Uint8Array(f.target?.result as ArrayBuffer)
                const result = functions.bufferFileType(bytes)?.[0]
                const jpg = result?.mime === "image/jpeg"
                const png = result?.mime === "image/png"
                const gif = result?.mime === "image/gif"
                const webp = result?.mime === "image/webp"
                if (jpg || png || webp || gif) {
                    const MB = file.size / (1024*1024)
                    const maxSize = jpg ? 10 :
                                    png ? 10 :
                                    gif ? 25 : 25
                                    webp ? 25 : 25
                    if (MB <= maxSize) {
                        let url = URL.createObjectURL(file)
                        let croppedURL = ""
                        if (gif) {
                            const gifData = await functions.extractGIFFrames(url)
                            let frameArray = [] as Buffer[] 
                            let delayArray = [] as number[]
                            for (let i = 0; i < gifData.length; i++) {
                                const canvas = gifData[i].frame as HTMLCanvasElement
                                const cropped = await functions.crop(canvas.toDataURL(), 1, true)
                                frameArray.push(cropped)
                                delayArray.push(gifData[i].delay)
                            }
                            const firstURL = await functions.crop(gifData[0].frame.toDataURL(), 1, false)
                            const {width, height} = await functions.imageDimensions(firstURL, session)
                            const buffer = await functions.encodeGIF(frameArray, delayArray, width, height)
                            const blob = new Blob([buffer])
                            croppedURL = URL.createObjectURL(blob)
                        } else {
                            croppedURL = await functions.crop(url, 1, false)
                        }
                        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
                        bytes = new Uint8Array(arrayBuffer)
                        const blob = new Blob([bytes])
                        url = URL.createObjectURL(blob)
                        setEditTagObj({...editTagObj, image: url})
                    }
                }
                resolve()
            }
            fileReader.readAsArrayBuffer(file)
        })
        if (event.target) event.target.value = ""
    }

    const tagSocialJSX = () => {
        if (!editTagObj) return
        let jsx = [] as React.ReactElement[] 
        if (editTagObj.type === "artist") {
            jsx.push(
                <>
                <div className="dialog-row">
                    <span className="dialog-text">{i18n.labels.website}: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.website!} onChange={(event) => setEditTagObj({...editTagObj, website: event.target.value})}/>
                </div>
                <div className="dialog-row">
                    <span className="dialog-text">{i18n.labels.social}: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.social!} onChange={(event) => setEditTagObj({...editTagObj, social: event.target.value})}/>
                </div>
                <div className="dialog-row">
                    <span className="dialog-text">{i18n.labels.twitter}: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.twitter!} onChange={(event) => setEditTagObj({...editTagObj, twitter: event.target.value})}/>
                </div>
                </>
            )
        }
        if (editTagObj.type === "character") {
            jsx.push(
                <>
                <div className="dialog-row">
                    <span className="dialog-text">{i18n.labels.wiki}: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.fandom!} onChange={(event) => setEditTagObj({...editTagObj, fandom: event.target.value})}/>
                </div>
                </>
            )
        }
        if (editTagObj.type === "series") {
            jsx.push(
                <>
                <div className="dialog-row">
                    <span className="dialog-text">{i18n.labels.website}: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.website!} onChange={(event) => setEditTagObj({...editTagObj, website: event.target.value})}/>
                </div>
                <div className="dialog-row">
                    <span className="dialog-text">{i18n.labels.twitter}: </span>
                    <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.twitter!} onChange={(event) => setEditTagObj({...editTagObj, twitter: event.target.value})}/>
                </div>
                </>
            )
        }
        return jsx 
    }

    if (editTagObj?.failed === "implication") {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.editTag.request}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.editTag.implicationEdits}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    if (editTagObj?.failed) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "250px", height: "190px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.editTag.title}</span>
                        </div>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.editTag.error}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.ok}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }

    const mainJSX = () => {
        if (!editTagObj) return
        return (
            <>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.tag.tag}: </span>
                <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.key} onChange={(event) => setEditTagObj({...editTagObj, key: event.target.value})} style={{width: "max-content"}}/>
            </div>
            {tagSocialJSX()}
            <div className="dialog-row">
                <span className="dialog-text">{i18n.sortbar.type.image}: </span>
                <label htmlFor="tag-img" className="dialog-button" style={{marginLeft: "5px", paddingTop: "0px", paddingBottom: "0px"}}>
                    <img className="dialog-button-img-small" src={uploadIcon}/>
                    <span className="dialog-button-text-small">{i18n.buttons.upload}</span>
                </label>
                <input id="tag-img" type="file" onChange={(event) => uploadTagImg(event)}/>
                {editTagObj.image && editTagObj.image !== "delete" ? 
                <img className="dialog-x-button" src={xButton} style={{filter: getFilter()}} onClick={() => setEditTagObj({...editTagObj, image: "delete"})}/>
                : null}
                <span style={{marginLeft: "20px"}} className="dialog-text">{i18n.labels.featured}: </span>
                <input className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.featuredPost!} onChange={(event) => setEditTagObj({...editTagObj, featuredPost: event.target.value})} style={{width: "20%"}}/>
            </div>
            {editTagObj.image && editTagObj.image !== "delete" ? 
            <div className="dialog-row">
                <img className="dialog-img" src={editTagObj.image === "delete" ? "" : editTagObj.image}/>
            </div>
            : null}
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.description}: </span>
            </div>
            <div className="dialog-row">
                <textarea className="dialog-textarea-small" style={{resize: "vertical"}} spellCheck={false} value={editTagObj.description} onChange={(event) => setEditTagObj({...editTagObj, description: event.target.value})}></textarea>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.sort.aliases}: </span>
            </div>
            <div className="dialog-row">
                <textarea className="dialog-textarea-small" style={{resize: "vertical", height: "30px"}} spellCheck={false} value={editTagObj.aliases?.join(" ")} onChange={(event) => setEditTagObj({...editTagObj, aliases: event.target.value.split(/ +/g)})}></textarea>
            </div>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.implications}: </span>
            </div>
            <div className="dialog-row">
                <textarea className="dialog-textarea-small" style={{resize: "vertical", height: "30px"}} spellCheck={false} value={editTagObj.implications?.join(" ")} onChange={(event) => setEditTagObj({...editTagObj, implications: event.target.value.split(/ +/g)})}></textarea>
            </div>
            {editTagObj.type !== "artist" ? <>
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.pixivTags}: </span>
            </div>
            <div className="dialog-row">
                <textarea className="dialog-textarea-small" style={{resize: "vertical", height: "30px"}} spellCheck={false} value={editTagObj.pixivTags?.join(" ")} onChange={(event) => setEditTagObj({...editTagObj, pixivTags: event.target.value.split(/ +/g)})}></textarea>
            </div></> : null}
            <div className="dialog-row">
                <span className="dialog-text">{i18n.labels.reason}: </span>
                <input style={{width: "100%"}} className="dialog-input-taller" type="text" spellCheck={false} value={editTagObj.reason || ""} onChange={(event) => setEditTagObj({...editTagObj, reason: event.target.value})}/>
            </div>
            {!functions.arrayIncludes(editTagObj.type, ["artist", "character", "series"]) && session.showR18 ?
            <div className="dialog-row">
                <img className="dialog-checkbox" src={editTagObj.r18 ? radioButtonChecked : radioButton} onClick={() => setEditTagObj({...editTagObj, r18: !editTagObj.r18})} style={{marginLeft: "0px", filter: getFilter()}}/>
                <span className="dialog-text" style={{marginLeft: "10px"}}>R18</span>
                <img className="dialog-title-img" src={lewdIcon} style={{marginLeft: "15px", height: "50px", filter: getFilter()}}/>
            </div> : null}
            </>
        )
    }

    if (editTagObj) {
        if (session.banned) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.editTag.title}</span>
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

        if (permissions.isContributor(session)) {
            return (
                <div className="dialog">
                    <Draggable handle=".dialog-title-container">
                    <div className="dialog-box" style={{marginTop: "-30px"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                        <div className="dialog-container">
                            <div className="dialog-title-container">
                                <span className="dialog-title">{i18n.dialogs.editTag.title}</span>
                            </div>
                            {mainJSX()}
                            {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                            <div className="dialog-row">
                                <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
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
                <div className="dialog-box" style={{marginTop: "-30px", height: submitted ? "125px" : "max-content"}} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.dialogs.editTag.request}</span>
                        </div>
                        {submitted ? <>
                        <div className="dialog-row">
                            <span className="dialog-text">{i18n.dialogs.editTag.submitText}</span>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => close()} className="dialog-button">{i18n.buttons.ok}</button>
                        </div> 
                        </> : <>
                        {mainJSX()}
                        {error ? <div className="dialog-validation-container"><span className="dialog-validation" ref={errorRef}></span></div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.submitRequest}</button>
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