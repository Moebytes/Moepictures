import React, {useContext, useEffect, useRef, useState} from "react"
import useIntersectionObserver from "./useIntersectionObserver"
import loading from "../assets/purple/loading.gif"
import loadingMagenta from "../assets/magenta/loading.gif"
import {ThemeContext, SizeTypeContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, SquareContext, PixelateContext} from "../App"
import functions from "../structures/Functions"
import "../styles/image.less"

interface Props {
    img: string
    width?: number
    height?: number
}

const Image: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const [imageSize, setImageSize] = useState(270) as any
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {square, setSquare} = useContext(SquareContext)
    const containerRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLImageElement>(null)
    const lightnessRef = useRef<HTMLDivElement>(null)
    const ref = useRef<HTMLImageElement>(null)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [pixelWidth, setPixelWidth] = useState(0)
    const [pixelHeight, setPixelHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)

    const getImagesPerRow = () => {
        if (sizeType === "tiny") return 9
        if (sizeType === "small") return 7
        if (sizeType === "medium") return 5
        if (sizeType === "large") return 4
        if (sizeType === "massive") return 3
        return 5
    }

    const getBorder = () => {
        if (sizeType === "tiny" || sizeType === "small") {
            return "2px solid var(--imageBorder)"
        } else {
            return "3px solid var(--imageBorder)"
        }
    }

    const getSquareOffset = () => {
        if (sizeType === "tiny") return 10
        if (sizeType === "small") return 12
        if (sizeType === "medium") return 15
        if (sizeType === "large") return 20
        if (sizeType === "massive") return 30
        return 5
    }

    const updateSquare = () => {
        if (!containerRef.current || !ref.current || !pixelateRef.current) return
        if (square) {
            const width = window.innerWidth - document.querySelector(".sidebar")?.clientWidth!
            const containerWidth = Math.floor(width / getImagesPerRow()) - getSquareOffset()
            containerRef.current.style.width = `${containerWidth}px`
            containerRef.current.style.height = `${containerWidth}px`
            containerRef.current.style.marginBottom = "3px"
            const landscape = ref.current.width <= ref.current.height
            if (landscape) {
                ref.current.style.width = `${containerWidth}px`
                ref.current.style.height = "auto"
            } else {
                ref.current.style.width = "auto"
                ref.current.style.height = `${containerWidth}px`
            }
        } else {
            containerRef.current.style.width = "max-content"
            containerRef.current.style.height = "max-content"
            ref.current.style.width = "auto"
            ref.current.style.height = `${imageSize}px`
            containerRef.current.style.marginBottom = "10px"
        }
    }

    useEffect(() => {
        updateSquare()
    }, [square, sizeType, imageSize, imageWidth, imageHeight])


    useEffect(() => {
        if (!containerRef.current) return
        if (imageLoaded) {
            containerRef.current.style.border = getBorder()
        } else {
            containerRef.current.style.border = "none"
        }
    }, [imageLoaded, sizeType])

    useEffect(() => {
        if (sizeType === "tiny") {
            setImageSize(160)
        } else if (sizeType === "small") {
            setImageSize(200)
        } else if (sizeType === "medium") {
            setImageSize(270)
        } else if (sizeType === "large") {
            setImageSize(400)
        } else if (sizeType === "massive") {
            setImageSize(500)
        }
    }, [sizeType])

    useEffect(() => {
        if (!containerRef.current) return
        const element = containerRef.current.querySelector(".image-filters") as any
        let newContrast = contrast
        const image = element.querySelector(".image") as any
        const sharpenOverlay = element.querySelector(".sharpen-overlay") as any
        const lightnessOverlay = element.querySelector(".lightness-overlay") as any
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${image.src})`
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
            const color = lightness < 100 ? "black" : "white"
            lightnessOverlay.style.backgroundColor = color
            lightnessOverlay.style.opacity = `${Math.abs((lightness - 100) / 100)}`
        } else {
            lightnessOverlay.style.backgroundColor = "transparent"
            lightnessOverlay.style.opacity = "0"
        }
        element.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen])

    useEffect(() => {
        if (!pixelateRef.current || !containerRef.current || !ref.current) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d") as any
        const imageWidth = ref.current.width 
        const imageHeight = ref.current.height
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = ref.current.width
        pixelateCanvas.height = ref.current.height
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(ref.current, 0, 0, pixelWidth, pixelHeight)
            if (landscape) {
                pixelateCanvas.style.width = `${imageWidth * pixelate}px`
                pixelateCanvas.style.height = "auto"
            } else {
                pixelateCanvas.style.width = "auto"
                pixelateCanvas.style.height = `${imageHeight * pixelate}px`
            }
            pixelateCanvas.style.opacity = "1"
        } else {
            pixelateCanvas.style.width = "none"
            pixelateCanvas.style.height = "none"
            pixelateCanvas.style.opacity = "0"
        }
    }, [pixelate, square, imageSize])

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current || !overlayRef.current || !pixelateRef.current) return
        const rect = ref.current.getBoundingClientRect()
        const width = rect?.width
        const height = rect?.height
        const x = event.clientX - rect.x
        const y = event.clientY - rect.y
        const translateX = ((x / width) - 0.5) * 3
        const translateY = ((y / height) - 0.5) * 3
        ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        overlayRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        pixelateRef.current.style.transformOrigin = "top left"
        pixelateRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
    }

    const cancelImageAnimation = () => {
        if (!ref.current || !overlayRef.current || !pixelateRef.current) return
        ref.current.style.transform = "scale(1)"
        overlayRef.current.style.transform = "scale(1)"
        pixelateRef.current.style.transformOrigin = "none"
        pixelateRef.current.style.transform = "scale(1)"
    }

    const getLoading = () => {
        if (theme.includes("magenta")) return loadingMagenta
        return loading
    }

    const onLoad = (event: any) => {
        setImageWidth(event.target.width)
        setImageHeight(event.target.height)
        setNaturalWidth(event.target.naturalWidth)
        setNaturalHeight(event.target.naturalHeight)
        setImageLoaded(true)
        event.target.style.opacity = "1"
    }

    return (
        <div className="image-box" ref={containerRef}>
            <div className="image-filters" onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                <div className="lightness-overlay" ref={lightnessRef}></div>
                <img className="sharpen-overlay" ref={overlayRef} src={props.img}/>
                <canvas className="pixelate-canvas" ref={pixelateRef}></canvas>
                <img className="image" ref={ref} src={props.img} onLoad={(event) => onLoad(event)}/>
            </div>
            {!imageLoaded ? 
                <img className="loading" src={getLoading()}/>
            : null}
        </div>
    )
}

export default Image