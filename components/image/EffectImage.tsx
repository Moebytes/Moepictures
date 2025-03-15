import React, {useEffect, useState, useRef} from "react"
import {useSessionSelector, useLayoutSelector, useFilterSelector, useCacheActions} from "../../store"
import functions from "../../structures/Functions"
import emptyVideo from "../../assets/images/empty.mp4"
import {Post, PostHistory} from "../../types/Types"

interface Props {
    post?: Post | PostHistory | null
    order?: number
    image?: string
    live?: string
    className?: string
    onClick?: (event: React.MouseEvent) => void
    style?: React.CSSProperties
    noEncryption?: boolean
    height?: number
    lineMultiplier?: number
    maxLineWidth?: number
}

const EffectImage: React.FunctionComponent<Props> = (props) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, blur, lightness, sharpen, pixelate, splatter} = useFilterSelector()
    const {setPost} = useCacheActions()
    const [original, setOriginal] = useState("")
    const [originalLive, setOriginalLive] = useState("")
    const [img, setImg] = useState("")
    const [staticImg, setStaticImg] = useState("")
    const [liveImg, setLiveImg] = useState("")
    const [index, setIndex] = useState(0)
    const [hover, setHover] = useState(false)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const effectRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const lightnessRef = useRef<HTMLImageElement>(null)
    const ref = useRef<HTMLImageElement | HTMLVideoElement>(null)

    const setImage = async () => {
        if (props.post) {
            const image = props.post.images[(props.order || 1) - 1]
            const imageLink = typeof image === "string" ?
            functions.getRawThumbnailLink(image, "medium", mobile) : functions.getThumbnailLink(image, "tiny", session, mobile)
            setOriginal(imageLink)
            const liveLink = typeof image === "string" ? imageLink : functions.getThumbnailLink(image, "tiny", session, mobile, true)
            setOriginalLive(liveLink)
            if (props.noEncryption) {
                setStaticImg(imageLink)
                setLiveImg(liveLink)
                return setImg(imageLink)
            }
            let img = await functions.decryptThumb(imageLink, session, imageLink, mobile)
            let live = await functions.decryptThumb(liveLink, session, imageLink, mobile)
            setImg(img)
            setStaticImg(img)
            setLiveImg(live)
        } else if (props.image) {
            setOriginal(props.image)
            setOriginalLive(props.live || props.image)
            if (props.noEncryption) return setImg(props.image)
            let img = await functions.decryptThumb(props.image, session, props.image, mobile)
            let live = await functions.decryptThumb(props.live || props.image, session, props.image, mobile)
            setImg(img)
            setStaticImg(img)
            setLiveImg(live)
        }
    }

    useEffect(() => {
        setImage()
    }, [props.image, props.post, session])

    const updateIndex = async (event: React.MouseEvent) => {
        if (!props.post) return
        event.preventDefault()
        if (props.post.images.length > 1) {
            let newImageIndex = index + 1 
            if (newImageIndex > props.post.images.length - 1) newImageIndex = 0
            const newImage = props.post.images[newImageIndex]
            const imageLink = typeof newImage === "string" ?
            functions.getRawThumbnailLink(newImage, "medium", mobile) :
            functions.getThumbnailLink(newImage, "tiny", session, mobile)
            const liveLink = typeof newImage === "string" ? imageLink : 
            functions.getThumbnailLink(newImage, "tiny", session, mobile, true)
            const thumb = await functions.decryptThumb(imageLink, session)
            const liveThumb = await functions.decryptThumb(liveLink, session)
            setImg(thumb)
            setStaticImg(thumb)
            setLiveImg(liveThumb)
            setIndex(newImageIndex)
        }
    }

    const toggleLive = async () => {
        if (session.liveAnimationPreview) return
        if (!liveImg) return
        if (hover) {
            setImg(liveImg)
        } else {
            setImg(staticImg)
        }
    }

    useEffect(() => {
        toggleLive()
    }, [hover, liveImg, staticImg, session])

    useEffect(() => {
        if (!imageFiltersRef.current) return
        const element = imageFiltersRef.current
        let newContrast = contrast
        let image = img
        if (functions.isVideo(original)) image = ""
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!image || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${image})`
            sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
            sharpenOverlay.style.mixBlendMode = "overlay"
            sharpenOverlay.style.opacity = `${sharpenOpacity}`
        } else {
            sharpenOverlay.style.backgroundImage = "none"
            sharpenOverlay.style.filter = "none"
            sharpenOverlay.style.mixBlendMode = "normal"
            sharpenOverlay.style.opacity = "0"
        }
        if (lightness !== 100) {
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            lightnessOverlay.style.filter = filter
            lightnessOverlay.style.opacity = `${Math.abs((lightness - 100) / 100)}`
        } else {
            lightnessOverlay.style.filter = "none"
            lightnessOverlay.style.opacity = "0"
        }
        element.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [img, original, brightness, contrast, hue, saturation, lightness, blur, sharpen])

    useEffect(() => {
        setTimeout(() => {
            functions.pixelateEffect(pixelateRef.current, ref.current, pixelate)
        }, 100)
    }, [img, pixelate])

    useEffect(() => {
        setTimeout(() => {
            functions.splatterEffect(effectRef.current, ref.current, splatter, 
            {lineMultiplier: props.lineMultiplier || 4, maxLineWidth: props.maxLineWidth || 3})
        }, 100)
    }, [img, splatter])

    const getOriginal = () => {
        return hover ? originalLive : original
    }

    const getDisplay = (invert?: boolean) => {
        let condition = hover && functions.isVideo(getOriginal()) && !mobile
        if (invert) condition = !condition
        return condition ? {opacity: "0", position: "absolute",
        top: "0", left: "0", width: "100%", height: "100%"} as React.CSSProperties : {}
    }

    const dynamicSrc = () => {
        return functions.isVideo(getOriginal()) && !mobile ? staticImg : img
    }

    const clickFunc = (event: React.MouseEvent) => {
        if (props.onClick) {
            setPost(null)
            props.onClick(event)
        }
    }

    const className = props.className ? props.className : ""
    const containerPointEvents = {pointerEvents: "none"} as React.CSSProperties
    const containerStyle = props.style ? {...containerPointEvents, ...props.style} : containerPointEvents 
    let imageStyle = {pointerEvents: "all", width: "auto", height: props.height ? `${props.height}px` : "250px"} as React.CSSProperties

    return (
        <div className="image-filters" ref={imageFiltersRef} style={containerStyle} onClick={clickFunc} onAuxClick={clickFunc}
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            {!functions.isVideo(getOriginal()) ? <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={dynamicSrc()}/> : null}
            {!functions.isVideo(getOriginal()) ? <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={dynamicSrc()}/> : null}
            <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
            <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>
            <video draggable={false} autoPlay muted playsInline disablePictureInPicture className={className} src={functions.isVideo(getOriginal()) ? liveImg : emptyVideo} ref={ref as any} 
            style={{...imageStyle, ...getDisplay(true)}} onContextMenu={updateIndex}></video>
            <img draggable={false} className={className} src={dynamicSrc()} ref={ref as any} style={{...imageStyle, ...getDisplay()}} onContextMenu={updateIndex}/>
        </div>
    )
}

export default EffectImage