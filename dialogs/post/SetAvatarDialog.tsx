import React, {useEffect, useState, useRef, useReducer} from "react"
import {useThemeSelector, useInteractionActions, useSessionSelector, useSessionActions,
usePostDialogSelector, usePostDialogActions, useActiveActions, useLayoutSelector} from "../../store"
import functions from "../../functions/Functions"
import Carousel from "../../components/site/Carousel"
import Draggable from "react-draggable"
import permissions from "../../structures/Permissions"
import ReactCrop, {makeAspectCrop, centerCrop, PixelCrop, PercentCrop} from "react-image-crop"
import {PostSearch, GIFFrame} from "../../types/Types"
import "../dialog.less"

const preventScroll = (event: Event) => event.preventDefault()

const SetAvatarDialog: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {setSessionFlag, setUserImg} = useSessionActions()
    const {session} = useSessionSelector()
    const {setActionBanner} = useActiveActions()
    const {avatarID} = usePostDialogSelector()
    const {setAvatarID} = usePostDialogActions()
    const [images, setImages] = useState([] as string[])
    const [image, setImage] = useState("")
    const [order, setOrder] = useState(1)
    const [crop, setCrop] = useState({unit: "%", x: 25, y: 25, width: 50, height: 50, aspect: 1} as PercentCrop)
    const [pixelCrop, setPixelCrop] = useState({unit: "px", x: 0, y: 0, width: 100, height: 100, aspect: 1} as PixelCrop)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isAnimated, setIsAnimated] = useState(false)
    const ref = useRef<HTMLImageElement>(null)
    const previewRef = useRef<HTMLCanvasElement>(null)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        document.title = i18n.sidebar.setAvatar
    }, [i18n])

    const loadImages = async () => {
        if (!avatarID) return
        let images = [] as string[]
        for (let i = 0; i < avatarID.post.images.length; i++) {
            let image = avatarID.post.images[i]
            let img = typeof image === "string" ? functions.link.getRawThumbnailLink(image, "massive")
            : functions.link.getThumbnailLink(image, "massive", session)
            const decrypted = await functions.crypto.decryptThumb(img, session)
            images.push(decrypted)
        }
        setImages(images)
        setImage(images[avatarID.order - 1])
        setOrder(avatarID.order)
    }

    useEffect(() => {
        if (avatarID) {
            document.body.style.pointerEvents = "all"
            loadImages()
        } else {
            document.body.style.pointerEvents = "all"
            setEnableDrag(true)
            setImage("")
            setOrder(1)
        }
    }, [avatarID, session])

    useEffect(() => {
        if (!previewRef.current || !ref.current) return
        const image = ref.current
        const canvas = previewRef.current
        drawCanvas(image, canvas, crop)
    }, [crop])

    const onImageLoad = (event?: React.SyntheticEvent<HTMLImageElement>) => {
        if (!ref.current) return
        let width = ref.current.clientWidth
        let height = ref.current.clientHeight
        if (event) {
            width = event.currentTarget.width
            height = event.currentTarget.height
        }
        const newCrop = centerCrop(makeAspectCrop({unit: "%", width: 50}, 1, width, height), width, height)
        setCrop(newCrop as PercentCrop)
        const x = newCrop.x / 100 * width
        const y = newCrop.y / 100 * height
        const pixelWidth = newCrop.width / 100 * width
        const pixelHeight = newCrop.height / 100 * height
        setPixelCrop({unit: "px", x, y, width: pixelWidth, height: pixelHeight, aspect: 1} as unknown as PixelCrop)
    }

    const drawCanvas = (image: HTMLImageElement, canvas: HTMLCanvasElement, crop: PercentCrop)  => {
        const ctx = canvas.getContext("2d")
        if (!ctx) return

        const naturalWidth = image.naturalWidth || image.width
        const naturalHeight = image.naturalHeight || image.height
    
        const cropX = (crop.x / 100) * naturalWidth
        const cropY = (crop.y / 100) * naturalHeight
        const cropWidth = (crop.width / 100) * naturalWidth
        const cropHeight = (crop.height / 100) * naturalHeight
    
        const pixelRatio = window.devicePixelRatio
        canvas.width = Math.floor(cropWidth * pixelRatio)
        canvas.height = Math.floor(cropHeight * pixelRatio)
    
        ctx.imageSmoothingQuality = "high"
        ctx.scale(pixelRatio, pixelRatio)
    
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)
    }

    const getCroppedURL = async () => {
        if (!previewRef.current) return
        const url = previewRef.current.toDataURL("image/jpeg")
        let croppedURL = ""
        if (isAnimated && permissions.isPremium(session)) {
            let gifData = [] as GIFFrame[]
            const arrayBuffer = await fetch(image).then((r) => r.arrayBuffer())
            if (functions.file.isGIF(images[0])) {
                gifData = await functions.anim.extractGIFFrames(arrayBuffer)
            } else if (functions.file.isWebP(images[0])) {
                gifData = await functions.anim.extractAnimatedWebpFrames(arrayBuffer)
            } else if (functions.file.isPNG(images[0])) {
                gifData = await functions.anim.extractAnimatedPngFrames(arrayBuffer)
            }
            let frameArray = [] as ArrayBuffer[] 
            let delayArray = [] as number[]
            let firstURL = ""
            for (let i = 0; i < gifData.length; i++) {
                const frame = gifData[i].frame as HTMLCanvasElement
                const canvas = document.createElement("canvas")
                const image = document.createElement("img")
                image.src = frame.toDataURL()
                await new Promise<void>((resolve) => {
                    image.onload = () => resolve()
                })
                drawCanvas(image, canvas, crop)
                const cropped = await functions.image.crop(canvas.toDataURL("image/png"), 1, true, false)
                if (!firstURL) firstURL = await functions.image.crop(canvas.toDataURL("image/png"), 1, false, false)
                frameArray.push(cropped)
                delayArray.push(gifData[i].delay)
            }
            const {width, height} = await functions.image.imageDimensions(firstURL)
            const buffer = await functions.anim.encodeGIF(frameArray, delayArray, width, height)
            const blob = new Blob([new Uint8Array(buffer)])
            croppedURL = URL.createObjectURL(blob)
        } else {
            croppedURL = await functions.image.crop(url, 1, false, true)
        }
        return croppedURL
    }

    const setAvatar = async () => {
        if (!avatarID?.post) return
        const croppedURL = await getCroppedURL()
        if (!croppedURL) return
        const arrayBuffer = await fetch(croppedURL).then((r) => r.arrayBuffer())
        const bytes = new Uint8Array(arrayBuffer)
        await functions.http.post("/api/user/pfp", {postID: avatarID.post.postID, bytes: Object.values(bytes)}, session, setSessionFlag)
        setUserImg("")
        setSessionFlag(true)
    }

    const download = async () => {
        if (!avatarID?.post) return
        const croppedURL = await getCroppedURL()
        if (!croppedURL) return
        let ext = isAnimated && permissions.isPremium(session) ? "gif" : "jpg"
        functions.dom.download(`${avatarID.post.postID}-crop.${ext}`, croppedURL)
    }

    const dragStart = () => {
        document.addEventListener("touchmove", preventScroll, {passive: false})
    }

    const dragEnd = () => {
        document.removeEventListener("touchmove", preventScroll)
    }

    useEffect(() => {
        const checkImage = async () => {
            if (functions.file.isGIF(images[0])) return setIsAnimated(true)
            if (functions.file.isWebP(images[0])) {
                const buffer = await fetch(image).then((r) => r.arrayBuffer())
                const animatedWebp = functions.file.isAnimatedWebp(buffer)
                if (animatedWebp) return setIsAnimated(true)
            } else if (functions.file.isPNG(images[0])) {
                const buffer = await fetch(image).then((r) => r.arrayBuffer())
                const animatedPNG = functions.file.isAnimatedPng(buffer)
                if (animatedPNG) return setIsAnimated(true)
            }
            setIsAnimated(false)
        }
        checkImage()
    }, [image])

    const click = (button: "accept" | "reject") => {
        if (button === "accept") {
            setAvatar()
        }
        setAvatarID(null)
    }

    const set = (image: string, index: number) => {
        setImage(image)
        setOrder(index + 1)
    }

    if (avatarID) {
        return (
            <div className="dialog">
                <Draggable handle=".dialog-title-container">
                <div className="dialog-box" style={{width: "max-content", marginTop: "-25px", paddingLeft: "20px", paddingRight: "20px"}} onMouseEnter={() => setEnableDrag(false)} 
                onMouseLeave={() => setEnableDrag(true)}>
                    <div className="dialog-container">
                        <div className="dialog-title-container">
                            <span className="dialog-title">{i18n.sidebar.setAvatar}</span>
                        </div>
                        {images.length > 1 ? <div className="dialog-row-start" style={{width: "500px"}}>
                            <Carousel images={images} set={set} index={order-1} height={100} marginTop={10}/>
                        </div> : null}
                        {image ? <>
                        <div className="dialog-row" style={{justifyContent: "center", alignItems: "flex-start"}}>
                            <ReactCrop className="avatar-crop" crop={crop} onChange={(crop, percentCrop) => {setCrop(percentCrop); setPixelCrop(crop)}}
                            keepSelection={true} minWidth={25} minHeight={25} aspect={1} onDragStart={dragStart} onDragEnd={dragEnd}>
                                <img draggable={false} style={{maxHeight: mobile ? "300px" : "500px", height: "auto", width: "auto"}} src={image} onLoad={onImageLoad} ref={ref}/>
                            </ReactCrop>
                            {!mobile ? <div style={{display: "flex", flexDirection: "column", marginLeft: "10px"}}>
                                <canvas draggable={false} style={{height: "200px", width: "auto"}} ref={previewRef}></canvas>
                                <div className="dialog-row" style={{justifyContent: "space-evenly"}}>
                                    <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                                    <button onClick={() => click("accept")} style={{backgroundColor: "var(--buttonBG)"}} className="dialog-button">{i18n.sidebar.setAvatar}</button>
                                </div>
                                <div className="dialog-row" style={{justifyContent: "space-evenly"}}>
                                    <button onClick={() => download()} className="dialog-button">{i18n.buttons.download}</button>
                                </div>
                            </div> : null}
                        </div>
                        {mobile ? <>
                        <div className="dialog-row" style={{justifyContent: "center"}}>
                            <canvas draggable={false} style={{height: "200px", width: "auto"}} ref={previewRef}></canvas>
                        </div>
                        <div className="dialog-row">
                            <button onClick={() => click("reject")} className="dialog-button">{i18n.buttons.cancel}</button>
                            <button onClick={() => download()} style={{marginLeft: "5px"}} className="dialog-button">{i18n.buttons.download}</button>
                            <button onClick={() => click("accept")} style={{backgroundColor: "var(--buttonBG)"}} className="dialog-button">{i18n.sidebar.setAvatar}</button>
                        </div>
                        </> : null}
                        </> : null}
                    </div>
                </div>
                </Draggable>
            </div>
        )
    }
    return null
}

export default SetAvatarDialog