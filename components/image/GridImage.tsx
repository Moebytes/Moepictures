import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, useFilterSelector} from "../../store"
import JSZip from "jszip"
import path from "path"
import functions from "../../functions/Functions"

const GridImage = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {sizeType, format} = useSearchSelector()
    const [img, setImg] = useState(props.cached ? props.img : "")
    const {imageLoaded, setImageLoaded} = props
    const {imageWidth, setImageWidth} = props
    const {imageHeight, setImageHeight} = props
    const {naturalWidth, setNaturalWidth} = props
    const {naturalHeight, setNaturalHeight} = props
    const {imageRef, lightnessRef, overlayRef, effectRef, pixelateRef} = props

    useImperativeHandle(props.componentRef, () => ({
        shouldWait: async () => {
            return false
        },
        load: async () => {
            loadImage()
        },
        update: async () => {}
    }))

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const loadImage = async () => {
        const decryptedImg = await functions.crypto.decryptThumb(props.img, session, `${props.img}-${sizeType}`)
        setImg(decryptedImg)
    }
        
    useEffect(() => {
        setImageLoaded(false)
        if (props.autoLoad) loadImage()
    }, [props.img])

    const render = <T extends boolean>(frame: HTMLImageElement | HTMLCanvasElement | ImageBitmap, buffer?: T) => {
        const canvas = document.createElement("canvas")!
        canvas.width = naturalWidth
        canvas.height = naturalHeight
        const ctx = canvas.getContext("2d")!
        let newContrast = contrast
        ctx.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
        if (pixelate !== 1) {
            let pixelateCanvas = document.createElement("canvas")
            functions.image.pixelateEffect(pixelateCanvas, frame, pixelate, {directWidth: true})
            ctx.imageSmoothingEnabled = false
            ctx.drawImage(pixelateCanvas, 0, 0, canvas.width, canvas.height)
            ctx.imageSmoothingEnabled = true
        }
        if (splatter !== 0) {
            const splatterCanvas = document.createElement("canvas")
            functions.image.splatterEffect(splatterCanvas, frame, splatter)
            ctx.drawImage(splatterCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (sharpen !== 0) {
            const sharpnessCanvas = document.createElement("canvas")
            sharpnessCanvas.width = naturalWidth
            sharpnessCanvas.height = naturalHeight
            const sharpnessCtx = sharpnessCanvas.getContext("2d")
            sharpnessCtx?.drawImage(frame, 0, 0, sharpnessCanvas.width, sharpnessCanvas.height)
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            const filter = `blur(4px) invert(1) contrast(75%)`
            ctx.filter = filter 
            ctx.globalAlpha = sharpenOpacity
            ctx.globalCompositeOperation = "overlay"
            ctx.drawImage(sharpnessCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (lightness !== 100) {
            const lightnessCanvas = document.createElement("canvas")
            lightnessCanvas.width = naturalWidth
            lightnessCanvas.height = naturalHeight
            const lightnessCtx = lightnessCanvas.getContext("2d")
            lightnessCtx?.drawImage(frame, 0, 0, lightnessCanvas.width, lightnessCanvas.height)
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            ctx.filter = filter
            ctx.globalAlpha = Math.abs((lightness - 100) / 100)
            ctx.drawImage(lightnessCanvas, 0, 0, canvas.width, canvas.height)
        }
        if (buffer) {
            const img = ctx.getImageData(0, 0, canvas.width, canvas.height)
            return img.data.buffer as T extends true ? ArrayBuffer : string
        }
        return canvas.toDataURL("image/png") as T extends true ? ArrayBuffer : string
    }

    const filtersOn = () => {
        if ((brightness !== 100) ||
            (contrast !== 100) ||
            (hue !== 180) ||
            (saturation !== 100) ||
            (lightness !== 100) ||
            (blur !== 0) ||
            (sharpen !== 0) ||
            (pixelate !== 1)) {
                return true 
            } else {
                return false
            }
    }

    const renderImage = async (image?: string) => {
        if (filtersOn()) {
            if (image) {
                const decrypted = await functions.crypto.decryptItem(image, session)
                const img = await functions.image.createImage(decrypted)
                return render(img, false)
            } else {
                return render(imageRef.current!, false)
            }
        } else {
            if (image) {
                return functions.crypto.decryptItem(image, session)
            } else {
                return functions.crypto.decryptItem(props.original, session)
            }
        }
    }

    const download = async () => {
        let filename = path.basename(props.original).replace(/\?.*$/, "")
        if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
            filename = props.post.source.match(/\d+/g)?.[0] + path.extname(props.original).replace(/\?.*$/, "")
        }
        if (props.comicPages && props.comicPages.length > 1) {
            const zip = new JSZip()
            for (let i = 0; i < props.comicPages.length; i++) {
                const page = props.comicPages[i]
                let pageName = path.basename(page).replace(/\?.*$/, "")
                if (session.downloadPixivID && props.post?.source?.includes("pixiv.net")) {
                    pageName = `${props.post.source.match(/\d+/g)?.[0]}_p${i}${path.extname(page)}`
                }
                const decryptedPage = await functions.crypto.decryptItem(page, session)
                let image = await renderImage(decryptedPage)
                if (filtersOn() || path.extname(pageName) !== `.${format}`) {
                    image = await functions.image.convertToFormat(image, format)
                }
                pageName = path.basename(pageName, path.extname(pageName)) + `.${format}`
                let data = new ArrayBuffer(0)
                if (functions.byte.isBase64(image)) {
                    data = await fetch(image).then((r) => r.arrayBuffer())
                } else {
                    data = await functions.http.getBuffer(functions.util.appendURLParams(image, {upscaled: session.upscaledImages}), {"x-force-upscale": String(session.upscaledImages)})
                }
                zip.file(decodeURIComponent(pageName), data, {binary: true})
            }
            const decoded = decodeURIComponent(filename)
            const id = decoded.split("-")[0]
            const basename = path.basename(decoded.split("-")[2] ?? "", path.extname(decoded.split("-")[2] ?? ""))
            const downloadName = basename ? `${id}-${basename}.zip` : `${path.basename(filename, path.extname(filename))}.zip`
            const blob = await zip.generateAsync({type: "blob"})
            const url = window.URL.createObjectURL(blob)
            functions.dom.download(downloadName , url)
            window.URL.revokeObjectURL(url)
        } else {
            let image = await renderImage()
            if (filtersOn() || path.extname(filename) !== `.${format}`) {
                image = await functions.image.convertToFormat(image, format)
            }
            filename = path.basename(filename, path.extname(filename)) + `.${format}`
            functions.dom.download(filename, image)
            window.URL.revokeObjectURL(image)
        }
    }

    const onLoad = (event: React.SyntheticEvent) => {
        let element = event.target as HTMLImageElement
        setImageWidth(element.width)
        setImageHeight(element.height)
        setNaturalWidth(element.naturalWidth)
        setNaturalHeight(element.naturalHeight)
        setImageLoaded(true)
        props.onLoad?.()
    }

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={img}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={img}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        <img draggable={false} className="image" ref={imageRef} src={img} 
        onLoad={(event) => onLoad(event)} style={{opacity: "1"}}/>
        </>
    )
})

export default withGridWrapper(GridImage)