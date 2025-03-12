import React, {useEffect, useState, useReducer} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
usePostDialogSelector, usePostDialogActions, useActiveActions} from "../../store"
import functions from "../../structures/Functions"
import imageFunctions from "../../structures/ImageFunctions"
import permissions from "../../structures/Permissions"
import historyIcon from "../../assets/icons/history-state.png"
import uploadIcon from "../../assets/icons/upload.png"
import Carousel from "../../components/site/Carousel"
import "../dialog.less"
import Draggable from "react-draggable"
import {ThumbnailUpdate} from "../../types/PostTypes"

const EditThumbnailDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {setSessionFlag} = useSessionActions()
    const {session} = useSessionSelector()
    const {editThumbnailID} = usePostDialogSelector()
    const {setActionBanner} = useActiveActions()
    const {setEditThumbnailID} = usePostDialogActions()
    const [images, setImages] = useState([] as string[])
    const [thumbnail, setThumbnail] = useState("")
    const [order, setOrder] = useState(1)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.sidebar.editThumbnail
    }, [i18n])

    const loadImages = async () => {
        if (!editThumbnailID) return
        let images = [] as string[]
        for (let i = 0; i < editThumbnailID.post.images.length; i++) {
            let image = editThumbnailID.post.images[i]
            if (typeof image === "string") throw new Error("History state")
            let thumbnail = functions.getThumbnailLink(image, "massive", session)
            const decrypted = await functions.decryptThumb(thumbnail, session)
            images.push(decrypted)
        }
        setImages(images)
        setThumbnail(images[editThumbnailID.order - 1])
        setOrder(editThumbnailID.order)
    }

    useEffect(() => {
        if (editThumbnailID) {
            document.body.style.pointerEvents = "all"
            loadImages()
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            setThumbnail("")
            setOrder(1)
        }
    }, [editThumbnailID, session])

    const updateThumbnail = async (updateAll?: boolean) => {
        if (!editThumbnailID) return
        if (permissions.isMod(session)) {
            let thumbnails = [] as ThumbnailUpdate[]
            for (let i = 0; i < images.length; i++) {
                if (!updateAll) if (i !== order - 1) continue
                const bytes = await fetch(images[i]).then((r) => r.arrayBuffer())
                const result = functions.bufferFileType(bytes)?.[0] || {}
                const thumbnailExt = result.typename || "jpg"
                thumbnails.push({order: i + 1, thumbnail: images[i], thumbnailExt})
            }
            await functions.put("/api/post/thumbnail", {postID: editThumbnailID.post.postID, 
            unverified: editThumbnailID.unverified, thumbnails}, session, setSessionFlag)
            setActionBanner("edit-thumbnail")
        }
    }

    const click = (button: "accept" | "reject", updateAll?: boolean) => {
        if (button === "accept") {
            updateThumbnail(updateAll)
        }
        setEditThumbnailID(null)
    }

    const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const bytes = await imageFunctions.readFileBytes(file)
        const base64 = functions.arrayBufferToBase64(bytes)
        images[order - 1] = base64
        setImages(structuredClone(images))
        setThumbnail(base64)
    }

    const autoGenerate = async () => {
        if (!editThumbnailID) return
        let image = editThumbnailID.post.images[order - 1]
        const imageLink = typeof image === "string" ? functions.getRawImageLink(image) : functions.getImageLink(image)
        const decrypted = await functions.decryptItem(imageLink, session)
        const {thumbnail} = await imageFunctions.thumbnail(decrypted)
        images[order - 1] = thumbnail
        setImages(structuredClone(images))
        setThumbnail(thumbnail)
    }

    const set = (image: string, index: number) => {
        setThumbnail(image)
        setOrder(index + 1)
    }

    if (editThumbnailID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "max-content", marginTop: "-25px", paddingLeft: "20px", paddingRight: "20px"}} onMouseEnter={() => setEnableDrag(false)} 
                onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.sidebar.editThumbnail}</span>
                        </div>
                        <div className="dialog-row-start" style={{marginTop: "10px", width: "100%"}}>
                            <button onClick={autoGenerate} style={{backgroundColor: "var(--buttonBG)", marginRight: "20px"}} className="dialog-button">
                                <img className="dialog-button-img-small" src={historyIcon}/>
                                <span className="dialog-button-text-small">{i18n.buttons.autogenerate}</span>
                            </button>
                            <label htmlFor="file-upload" style={{backgroundColor: "var(--buttonBG)"}} className="dialog-button">
                                <img className="dialog-button-img-small" src={uploadIcon}/>
                                <span className="dialog-button-text-small">{i18n.buttons.upload}</span>
                            </label>
                            <input id="file-upload" type="file" onChange={(event) => uploadFile(event)}/>
                        </div>
                        {images.length > 1 ? <div className="dialog-row-start" style={{width: "500px"}}>
                            <Carousel images={images} set={set} index={order-1} height={100} marginTop={10}/>
                        </div> : null}
                        {thumbnail ? <div className="dialog-row" style={{justifyContent: "center"}}>
                            <img style={{height: "500px", width: "auto"}} src={thumbnail}/>
                        </div> : null}
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => click("accept", true)} style={{backgroundColor: "var(--buttonBG)", marginLeft: "-5px"}} className="dialog-button">{i18n.buttons.updateAll}</button>
                            <button onClick={() => click("accept")} className="dialog-button">{i18n.buttons.update}</button>
                        </div>
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default EditThumbnailDialog