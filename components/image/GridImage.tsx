/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, useFilterSelector} from "../../store"
import {Image} from "../../types/Types"
import functions from "../../functions/Functions"

const GridImage = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate, splatter} = useFilterSelector()
    const {sizeType, format} = useSearchSelector()
    const [img, setImg] = useState(props.cached ? props.img : "")
    const [upscaled, setUpscaled] = useState("")
    const [imgIndex, setImgIndex] = useState(0)
    const {imageLoaded, setImageLoaded} = props
    const {imageRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props

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
        download: async () => {
            return functions.image.download(props.img, imageRef.current!, props.post!, format, session, 
            {brightness, contrast, hue, blur, lightness, pixelate, saturation, sharpen, splatter}, 
            props.comicPages)
        },
        nextImage: nextImage
    }))

    const loadImage = async () => {
        const decryptedImg = await functions.crypto.decryptThumb(props.img, session, `${props.img}-${sizeType}`)
        const bufferTest = await functions.http.getBuffer(decryptedImg)
        const result = functions.byte.bufferFileType(bufferTest)
        if (result[0]?.mime !== "application/json") {
            setImg(decryptedImg)
        } else {
            const liveImg = await functions.crypto.decryptThumb(props.live!, session, `${props.live}-${sizeType}`)
            setImg(liveImg)
        }
        setImgIndex(0)
    }

    const nextImage = async () => {
        if (props.post.images.length === 1) return
        let nextIndex = imgIndex + 1
        if (nextIndex >= props.post.images.length) nextIndex = 0
        let image = functions.link.getThumbnailLink(props.post.images[nextIndex], sizeType, session)
        let img = functions.util.appendURLParams(image, {upscaled: false})
        const decryptedImg = await functions.crypto.decryptThumb(img, session, `${img}-${sizeType}`)
        setImg(decryptedImg)
        setImgIndex(nextIndex)
    }
        
    useEffect(() => {
        setImageLoaded(false)
        if (props.autoLoad) loadImage()
    }, [props.img])

    useEffect(() => {
        if (img) loadImage()
    }, [img, sizeType])

    const getImg = () => {
        return upscaled ? upscaled : img
    }

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={getImg()}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={getImg()}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        <img draggable={false} className="image" ref={imageRef} src={getImg()} fetchPriority="high"
        onLoad={(event) => onLoaded(event)} style={{opacity: "1"}}/>
        </>
    )
})

export default withGridWrapper(GridImage)