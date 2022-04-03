import React, {useContext, useEffect, useRef, useState} from "react"
import {ThemeContext, SizeTypeContext, ImageAmountContext, ImagesContext} from "../Context"
import GridImage from "./GridImage"
import img1 from "../assets/images/img1.png"
import img2 from "../assets/images/img2.jpg"
import img3 from "../assets/images/img3.png"
import img4 from "../assets/images/img4.jpg"
import img5 from "../assets/images/img5.jpg"
import img6 from "../assets/images/img6.jpg"
import img7 from "../assets/images/img7.jpg"
import img8 from "../assets/images/img8.jpg"
import img9 from "../assets/images/img9.png"
import img10 from "../assets/images/img10.png"
import img11 from "../assets/images/img11.png"
import img12 from "../assets/images/img12.png"
import img13 from "../assets/images/img13.png"
import img14 from "../assets/images/img14.jpg"
import gif from "../assets/images/gif3.gif"
import vid from "../assets/images/vid1.mp4"
import functions from "../structures/Functions"
import path from "path"
import "./styles/imagegrid.less"

const ImageGrid: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {imageAmount, setImageAmount} = useContext(ImageAmountContext)
    const {images, setImages} = useContext(ImagesContext) as any
    const [index, setIndex] = useState(0)
    const [visibleImages, setVisibleImages] = useState([]) as any
    const [delayLoad, setDelayLoad] = useState(false) as any

    const getInitLoadAmount = () => {
        if (sizeType === "tiny") return 45
        if (sizeType === "small") return 28
        if (sizeType === "medium") return 15
        if (sizeType === "large") return 12
        if (sizeType === "massive") return 6
        return 45
    }

    const getLoadAmount = () => {
        return functions.getImagesPerRow(sizeType) * 2
    }

    useEffect(() => {
        const newImages = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, vid, gif,
            img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, vid, gif,
            img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, vid, gif,
            img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, vid, gif,
            img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, vid, gif,
            img1, img2, img3, img4, img5, img6, img7, img8, img9, img10, img11, img12, img13, img14, vid, gif]
        setImages(newImages)
    }, [])

    useEffect(() => {
        setImageAmount(index)
    }, [index])

    useEffect(() => {
        let currentIndex = index
        const newVisibleImages = visibleImages as any
        for (let i = 0; i < getInitLoadAmount(); i++) {
            if (!images[currentIndex]) break
            newVisibleImages.push(images[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleImages(newVisibleImages)
    }, [images])

    useEffect(() => {
        if (visibleImages.length < getInitLoadAmount()) {
            let currentIndex = index
            const newVisibleImages = visibleImages as any
            const max = getInitLoadAmount() - visibleImages.length 
            for (let i = 0; i < max; i++) {
                if (!images[currentIndex]) break
                newVisibleImages.push(images[currentIndex])
                currentIndex++
            }
            setIndex(currentIndex)
            setVisibleImages(newVisibleImages)
        }
    }, [sizeType])

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!images[currentIndex]) return
                const newImages = visibleImages as any
                for (let i = 0; i < getLoadAmount(); i++) {
                    if (!images[currentIndex]) break
                    newImages.push(images[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleImages(newImages)
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })


    const generateImagesJSX = () => {
        const jsx = [] as any
        for (let i = 0; i < visibleImages.length; i++) {
            const base = path.basename(visibleImages[i])
            jsx.push(<GridImage key={i + 1} id={base} img={visibleImages[i]}/>)
        }
        return jsx
    }

    return (
        <div className="imagegrid">
            <div className="image-container" style={{justifyContent: `${sizeType === "massive" || sizeType === "large" ? "space-around" : "space-between"}`}}>
                {generateImagesJSX()}
            </div>
        </div>
    )
}

export default ImageGrid