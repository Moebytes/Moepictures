import React, {useContext, useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import Slider from "react-slider"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideSortbarContext, ActiveDropdownContext, ScrollContext,
SizeTypeContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, EnableDragContext, FilterDropActiveContext, SquareContext, PixelateContext,
ShowDownloadDialogContext, HideTitlebarContext, ImageTypeContext, RestrictTypeContext, SortTypeContext,
StyleTypeContext, SpeedContext, ReverseContext, MobileContext, RelativeContext, SessionContext, MobileScrollingContext} from "../Context"
import leftArrow from "../assets/purple/leftArrow.png"
import leftArrowMagenta from "../assets/magenta/leftArrow.png"
import rightArrow from "../assets/purple/rightArrow.png"
import rightArrowMagenta from "../assets/magenta/rightArrow.png"
import upArrow from "../assets/purple/upArrow.png"
import upArrowMagenta from "../assets/magenta/upArrow.png"
import downArrow from "../assets/purple/downArrow.png"
import downArrowMagenta from "../assets/magenta/downArrow.png"
import upload from "../assets/purple/upload.png"
import uploadMagenta from "../assets/magenta/upload.png"
import download from "../assets/purple/download.png"
import downloadMagenta from "../assets/magenta/download.png"
import reset from "../assets/purple/reset.png"
import resetMagenta from "../assets/magenta/reset.png"
import all from "../assets/purple/all.png"
import allMagenta from "../assets/magenta/all.png"
import image from "../assets/purple/image.png"
import imageMagenta from "../assets/magenta/image.png"
import animation from "../assets/purple/animation.png"
import animationMagenta from "../assets/magenta/animation.png"
import video from "../assets/purple/video.png"
import videoMagenta from "../assets/magenta/video.png"
import comic from "../assets/purple/comic.png"
import comicMagenta from "../assets/magenta/comic.png"
import model from "../assets/purple/model.png"
import modelMagenta from "../assets/magenta/model.png"
import audio from "../assets/purple/audio.png"
import audioMagenta from "../assets/magenta/audio.png"
import explicit from "../assets/purple/explicit.png"
import explicitMagenta from "../assets/magenta/explicit.png"
import questionable from "../assets/purple/questionable.png"
import questionableMagenta from "../assets/magenta/questionable.png"
import safe from "../assets/purple/safe.png"
import safeMagenta from "../assets/magenta/safe.png"
import $2d from "../assets/purple/2d.png"
import $2dMagenta from "../assets/magenta/2d.png"
import $3d from "../assets/purple/3d.png"
import $3dMagenta from "../assets/magenta/3d.png"
import pixel from "../assets/purple/pixel.png"
import pixelMagenta from "../assets/magenta/pixel.png"
import chibi from "../assets/purple/chibi.png"
import chibiMagenta from "../assets/magenta/chibi.png"
import filters from "../assets/purple/filters.png"
import filtersMagenta from "../assets/magenta/filters.png"
import size from "../assets/purple/size.png"
import sizeMagenta from "../assets/magenta/size.png"
import sort from "../assets/purple/sort.png"
import sortMagenta from "../assets/magenta/sort.png"
import brightnessIcon from "../assets/purple/brightness.png"
import brightnessMagentaIcon from "../assets/magenta/brightness.png"
import contrastIcon from "../assets/purple/contrast.png"
import contrastMagentaIcon from "../assets/magenta/contrast.png"
import hueIcon from "../assets/purple/hue.png"
import hueMagentaIcon from "../assets/magenta/hue.png"
import saturationIcon from "../assets/purple/saturation.png"
import saturationMagentaIcon from "../assets/magenta/saturation.png"
import lightnessIcon from "../assets/purple/lightness.png"
import lightnessMagentaIcon from "../assets/magenta/lightness.png"
import blurIcon from "../assets/purple/blur.png"
import blurMagentaIcon from "../assets/magenta/blur.png"
import sharpenIcon from "../assets/purple/sharpen.png"
import sharpenMagentaIcon from "../assets/magenta/sharpen.png"
import squareIcon from "../assets/purple/square.png"
import squareMagentaIcon from "../assets/magenta/square.png"
import pixelateIcon from "../assets/purple/pixelate.png"
import pixelateMagentaIcon from "../assets/magenta/pixelate.png"
import speedIcon from "../assets/purple/speed.png"
import speedIconMagenta from "../assets/magenta/speed.png"
import reverseIcon from "../assets/purple/reverse.png"
import reverseIconMagenta from "../assets/magenta/reverse.png"
import scrollIcon from "../assets/purple/scroll.png"
import scrollMagentaIcon from "../assets/magenta/scroll.png"
import pageIcon from "../assets/purple/page.png"
import pageMagentaIcon from "../assets/magenta/page.png"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/sortbar.less"

const SortBar: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {filterDropActive, setFilterDropActive} = useContext(FilterDropActiveContext)
    const {square, setSquare} = useContext(SquareContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {showDownloadDialog, setShowDownloadDialog} = useContext(ShowDownloadDialogContext)
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const [mouseOver, setMouseOver] = useState(false)
    const {imageType, setImageType} = useContext(ImageTypeContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {styleType, setStyleType} = useContext(StyleTypeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {sortType, setSortType} = useContext(SortTypeContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {mobileScrolling, setMobileScrolling} = useContext(MobileScrollingContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {session, setSession} = useContext(SessionContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const [dropLeft, setDropLeft] = useState(0)
    const [dropTop, setDropTop] = useState(0)
    const [lastImageType, setLastImageType] = useState(null) as any
    const [lastRestrictType, setLastRestrictType] = useState(null) as any
    const [lastStyleType, setLastStyleType] = useState(null) as any
    const imageRef = useRef(null) as any
    const restrictRef = useRef(null) as any
    const styleRef = useRef(null) as any
    const sizeRef = useRef(null) as any 
    const sortRef = useRef(null) as any
    const filterRef = useRef(null) as any
    const speedRef = useRef(null) as any
    const history = useHistory()

    useEffect(() => {
        const savedType = localStorage.getItem("type")
        const savedRestrict = localStorage.getItem("restrict")
        const savedStyle = localStorage.getItem("style")
        const savedSize = localStorage.getItem("size")
        const savedSort = localStorage.getItem("sort")
        const savedSquare = localStorage.getItem("square")
        const savedScroll = localStorage.getItem("scroll")
        if (savedType) setImageType(savedType)
        if (savedRestrict) setRestrictType(savedRestrict)
        if (savedStyle) setStyleType(savedStyle)
        if (savedSize) setSizeType(savedSize)
        if (savedSort) setSortType(savedSort)
        if (savedSquare) setSquare(savedSquare === "true")
        if (savedScroll) setScroll(savedScroll === "true")

        const savedBrightness = localStorage.getItem("brightness")
        const savedContrast = localStorage.getItem("contrast")
        const savedHue = localStorage.getItem("hue")
        const savedSaturation = localStorage.getItem("saturation")
        const savedLightness = localStorage.getItem("lightness")
        const savedBlur = localStorage.getItem("blur")
        const savedSharpen = localStorage.getItem("sharpen")
        const savedPixelate = localStorage.getItem("pixelate")
        if (savedBrightness) setBrightness(Number(savedBrightness))
        if (savedContrast) setContrast(Number(savedContrast))
        if (savedHue) setHue(Number(savedHue))
        if (savedSaturation) setSaturation(Number(savedSaturation))
        if (savedLightness) setLightness(Number(savedLightness))
        if (savedBlur) setBlur(Number(savedBlur))
        if (savedSharpen) setSharpen(Number(savedSharpen))
        if (savedPixelate) setPixelate(Number(savedPixelate))
    }, [])

    useEffect(() => {
        const clickHandler = () => {
            if (activeDropdown !== "filters") {
                if (filterDropActive) setFilterDropActive(false)
            }
            if (window.scrollY === 0) setDropTop(0)
            if (activeDropdown === "none") return
        }
        const scrollHandler = () => {
            if (window.scrollY === 0) return setDropTop(0)
            let newDropTop = hideTitlebar ? -Number(document.querySelector(".titlebar")?.clientHeight) - 2 : 0
            if (mobile) newDropTop = 32
            if (dropTop === newDropTop) return
            setDropTop(newDropTop)
        }
        window.addEventListener("click", clickHandler)
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("click", clickHandler)
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    useEffect(() => {
        setActiveDropdown("none")
        if (hideSidebar || mobile) {
            setDropLeft(0)
        } else {
            setDropLeft(-Number(document.querySelector(".sidebar")?.clientWidth || 0))
        }
    }, [hideSidebar, mobile])

    useEffect(() => {
        setActiveDropdown("none")
        if (hideTitlebar) {
            setDropTop(-Number(document.querySelector(".titlebar")?.clientHeight) - 2)
        } else {
            setDropTop(0)
        }
    }, [hideTitlebar])

    useEffect(() => {
        localStorage.setItem("type", imageType)
        localStorage.setItem("restrict", restrictType)
        localStorage.setItem("style", styleType)
        localStorage.setItem("size", sizeType)
        localStorage.setItem("sort", sortType)
    }, [imageType, restrictType, styleType, sizeType, sortType])

    const getLeftArrow = () => {
        if (theme.includes("magenta")) return hideSidebar ? rightArrowMagenta : leftArrowMagenta
        return hideSidebar ? rightArrow : leftArrow
    }

    const getUpArrow = () => {
        if (theme.includes("magenta")) return hideTitlebar ? downArrowMagenta : upArrowMagenta
        return hideTitlebar ? downArrow : upArrow
    }

    const getUpload = () => {
        if (theme.includes("magenta")) return uploadMagenta
        return upload
    }

    const getDownload = () => {
        if (theme.includes("magenta")) return downloadMagenta
        return download
    }

    const getReset = () => {
        if (theme.includes("magenta")) return resetMagenta
        return reset
    }

    const getAll = () => {
        if (theme.includes("magenta")) return allMagenta
        return all
    }

    const getImage = () => {
        if (theme.includes("magenta")) return imageMagenta
        return image
    }

    const getAnimation = () => {
        if (theme.includes("magenta")) return animationMagenta
        return animation
    }

    const getVideo = () => {
        if (theme.includes("magenta")) return videoMagenta
        return video
    }

    const getComic = () => {
        if (theme.includes("magenta")) return comicMagenta
        return comic
    }

    const getModel = () => {
        if (theme.includes("magenta")) return modelMagenta
        return model
    }

    const getAudio = () => {
        if (theme.includes("magenta")) return audioMagenta
        return audio
    }

    const getSafe = () => {
        if (theme.includes("magenta")) return safeMagenta
        return safe
    }

    const getQuestionable = () => {
        if (theme.includes("magenta")) return questionableMagenta
        return questionable
    }

    const getExplicit = () => {
        if (theme.includes("magenta")) return explicitMagenta
        return explicit
    }

    const get2D = () => {
        if (theme.includes("magenta")) return $2dMagenta
        return $2d
    }

    const get3D = () => {
        if (theme.includes("magenta")) return $3dMagenta
        return $3d
    }

    const getPixel = () => {
        if (theme.includes("magenta")) return pixelMagenta
        return pixel
    }

    const getChibi = () => {
        if (theme.includes("magenta")) return chibiMagenta
        return chibi
    }

    const getFilters = () => {
        if (theme.includes("magenta")) return filtersMagenta
        return filters
    }

    const getSize = () => {
        if (theme.includes("magenta")) return sizeMagenta
        return size
    }

    const getSort = () => {
        if (theme.includes("magenta")) return sortMagenta
        return sort
    }

    const getBrightness = () => {
        if (theme.includes("magenta")) return brightnessMagentaIcon
        return brightnessIcon
    }

    const getContrast = () => {
        if (theme.includes("magenta")) return contrastMagentaIcon
        return contrastIcon
    }

    const getHue = () => {
        if (theme.includes("magenta")) return hueMagentaIcon
        return hueIcon
    }

    const getSaturation = () => {
        if (theme.includes("magenta")) return saturationMagentaIcon
        return saturationIcon
    }

    const getLightness = () => {
        if (theme.includes("magenta")) return lightnessMagentaIcon
        return lightnessIcon
    }

    const getBlur = () => {
        if (theme.includes("magenta")) return blurMagentaIcon
        return blurIcon
    }

    const getSharpen = () => {
        if (theme.includes("magenta")) return sharpenMagentaIcon
        return sharpenIcon
    }

    const getSquare = () => {
        if (theme.includes("magenta")) return squareMagentaIcon
        return squareIcon
    }

    const getScroll = () => {
        if (theme.includes("magenta")) return scrollMagentaIcon
        return scrollIcon
    }

    const getPage = () => {
        if (theme.includes("magenta")) return pageMagentaIcon
        return pageIcon
    }

    const getPixelate = () => {
        if (theme.includes("magenta")) return pixelateMagentaIcon
        return pixelateIcon
    }

    const getSpeed = () => {
        if (theme.includes("magenta")) return speedIconMagenta
        return speedIcon
    }

    const getReverse = () => {
        if (theme.includes("magenta")) return reverseIconMagenta
        return reverseIcon
    }

    const hideTheSidebar = () => {
        setHideSidebar((prev: boolean) => {
            localStorage.setItem("sidebar", `${prev}`)
            return !prev
        })
    }

    const hideTheTitlebar = () => {
        setHideTitlebar((prev: boolean) => {
            let val = !prev
            setHideNavbar(val)
            localStorage.setItem("titlebar", `${!val}`)
            return val
        })
    }

    const getImageJSX = () => {
        if (imageType === "image") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getImage()}/>
                    <span className="sortbar-text">Image</span>
                </div>
            )
        } else if (imageType === "animation") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getAnimation()}/>
                    <span className="sortbar-text">Animation</span>
                </div>
            )
        } else if (imageType === "video") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getVideo()}/>
                    <span className="sortbar-text">Video</span>
                </div>
            )
        } else if (imageType === "comic") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getComic()}/>
                    <span className="sortbar-text">Comic</span>
                </div>
            )
        } else if (imageType === "model") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={getModel()}/>
                        <span className="sortbar-text">Model</span>
                    </div>
                )
        } else if (imageType === "audio") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={getAudio()}/>
                        <span className="sortbar-text">Audio</span>
                    </div>
                )
        } else {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getAll()}/>
                    <span className="sortbar-text">All</span>
                </div>
            )
        }
    }

    const getMobileImageJSX = () => {
        if (imageType === "image") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getImage()} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "animation") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getAnimation()} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "video") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getVideo()} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "comic") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getComic()} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "model") {
                return <img style={{height: "30px"}} className="sortbar-img" src={getModel()} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "audio") {
                    return <img style={{height: "30px"}} className="sortbar-img" src={getAudio()} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px"}} className="sortbar-img rotate" src={getAll()} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        }
    }

    const getImageMargin = () => {
        if (mobile) return "62px"
        const rect = imageRef.current?.getBoundingClientRect()
        if (!rect) return "290px"
        const raw = rect.x
        let offset = 0
        if (imageType === "all") offset = -30
        if (imageType === "image") offset = -10
        if (imageType === "animation") offset = -5
        if (imageType === "video") offset = -15
        if (imageType === "comic") offset = -15
        if (imageType === "audio") offset = -15
        if (imageType === "model") offset = -15
        return `${raw + offset}px`
    }

    const getRestrictJSX = () => {
        if (restrictType === "safe") {
            return (
                <div className="sortbar-item" ref={restrictRef} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getSafe()}/>
                    <span className="sortbar-text">Safe</span>
                </div>
            )
        } else if (restrictType === "questionable") {
            return (
                <div className="sortbar-item" ref={restrictRef} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getQuestionable()}/>
                    <span className="sortbar-text">Questionable</span>
                </div>
            )
        } else if (restrictType === "explicit") {
            return (
                <div className="sortbar-item" ref={restrictRef} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getExplicit()}/>
                    <span className="sortbar-text">Explicit</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={restrictRef} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getAll()}/>
                    <span className="sortbar-text">All</span>
                </div>
            )
        }
    }

    const getMobileRestrictJSX = () => {
        if (restrictType === "safe") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getSafe()} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
        } else if (restrictType === "questionable") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getQuestionable()} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
        } else if (restrictType === "explicit") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getExplicit()} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px"}} className="sortbar-img rotate" src={getAll()} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
        }
    }

    const getRestrictMargin = () => {
        if (mobile) return "95px"
        const rect = restrictRef.current?.getBoundingClientRect()
        if (!rect) return "325px"
        const raw = rect.x
        let offset = 0
        if (restrictType === "all") offset = -35
        if (restrictType === "safe") offset = -30
        if (restrictType === "questionable") offset = 0
        if (restrictType === "explicit") offset = -20
        return `${raw + offset}px`
    }

    const getStyleJSX = () => {
        if (styleType === "2d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={get2D()}/>
                    <span className="sortbar-text">2D</span>
                </div>
            )
        } else if (styleType === "3d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={get3D()}/>
                    <span className="sortbar-text">3D</span>
                </div>
            )
        } else if (styleType === "pixel") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getPixel()}/>
                    <span className="sortbar-text">Pixel</span>
                </div>
            )
        } else if (styleType === "chibi") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getChibi()}/>
                    <span className="sortbar-text">Chibi</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getAll()}/>
                    <span className="sortbar-text">All</span>
                </div>
            )
        }
    }

    const getMobileStyleJSX = () => {
        if (styleType === "2d") {
            return <img style={{height: "30px"}} className="sortbar-img" src={get2D()} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "3d") {
            return <img style={{height: "30px"}} className="sortbar-img" src={get3D()} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "pixel") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getPixel()} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "chibi") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getChibi()} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px"}} className="sortbar-img rotate" src={getAll()} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        }
    }

    const getStyleMargin = () => {
        if (mobile) return "165px"
        const rect = styleRef.current?.getBoundingClientRect()
        if (!rect) return "395px"
        const raw = rect.x
        let offset = 0
        if (styleType === "all") offset = -15
        if (styleType === "2d") offset = -15
        if (styleType === "3d") offset = -15
        if (styleType === "pixel") offset = -5
        if (styleType === "chibi") offset = -5
        return `${raw + offset}px`
    }

    const resetAll = () => {
        setImageType("all")
        setRestrictType("all")
        setStyleType("all")
        setActiveDropdown("none")
    }

    const getSizeJSX = () => {
        return (
            <div className="sortbar-item" ref={sizeRef} onClick={() => {setActiveDropdown(activeDropdown === "size" ? "none" : "size"); setFilterDropActive(false)}}>
                <img className="sortbar-img" src={getSize()}/>
                <span className="sortbar-text">{functions.toProperCase(sizeType)}</span>
            </div>
        )
    }

    const getSizeMargin = () => {
        const rect = sizeRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "45px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sizeType === "tiny") offset = -23
        if (sizeType === "small") offset = -18
        if (sizeType === "medium") offset = -13
        if (sizeType === "large") offset = -18
        if (sizeType === "massive") offset = -13
        return `${raw + offset}px`
    }

    const getSpeedMargin = () => {
        const rect = speedRef.current?.getBoundingClientRect()
        if (!rect) return "250px"
        const raw = window.innerWidth - rect.right
        let offset = -8
        return `${raw + offset}px`
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "date") offset = -50
        if (sortType === "reverse date") offset = -20
        if (sortType === "drawn") offset = -50
        if (sortType === "reverse drawn") offset = -20
        if (sortType === "cuteness") offset = -45
        if (sortType === "reverse cuteness") offset = -10
        if (sortType === "favorites") offset = -45
        if (sortType === "reverse favorites") offset = -10
        if (sortType === "tagcount") offset = -45
        if (sortType === "reverse tagcount") offset = -10
        if (sortType === "filesize") offset = -45
        if (sortType === "reverse filesize") offset = -10
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        return (
            <div className="sortbar-item" ref={sortRef} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}>
                <img className="sortbar-img" src={getSort()}/>
                <span className="sortbar-text">{functions.toProperCase(sortType)}</span>
            </div>
        )
    }

    const getFiltersMargin = () => {
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect) return "30px"
        const raw = window.innerWidth - rect.right
        let offset = -120
        return `${raw + offset}px`
    }

    const toggleFilterDrop = () => {
        const newValue = activeDropdown === "filters" ? "none" : "filters"
        setActiveDropdown(newValue)
        setFilterDropActive(newValue === "filters")
    }

    const toggleSpeedDrop = () => {
        const newValue = activeDropdown === "speed" ? "none" : "speed"
        setActiveDropdown(newValue)
        setFilterDropActive(newValue === "speed")
    }

    useEffect(() => {
        localStorage.setItem("brightness", brightness)
        localStorage.setItem("contrast", contrast)
        localStorage.setItem("hue", hue)
        localStorage.setItem("saturation", saturation)
        localStorage.setItem("lightness", lightness)
        localStorage.setItem("blur", blur)
        localStorage.setItem("sharpen", sharpen)
        localStorage.setItem("pixelate", pixelate)
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate])

    const resetFilters = () => {
        setBrightness(100)
        setContrast(100)
        setHue(180)
        setSaturation(100)
        setLightness(100)
        setBlur(0)
        setSharpen(0)
        setPixelate(1)
    }

    const toggleSquare = () => {
        setSquare((prev: boolean) => {
            const newValue = !prev
            localStorage.setItem("square", `${newValue}`)
            return newValue
        })
    }

    const toggleScroll = () => {
        setScroll((prev: boolean) => {
            const newValue = !prev
            localStorage.setItem("scroll", `${newValue}`)
            return newValue
        })
    }

    const styleDropdownJSX = () => {
        if (imageType === "model") {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={getAll()}/>
                        <span className="sortbar-dropdown-text">All</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={get3D()}/>
                        <span className="sortbar-dropdown-text">3D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={getChibi()}/>
                        <span className="sortbar-dropdown-text">Chibi</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={getPixel()}/>
                        <span className="sortbar-dropdown-text">Pixel</span>
                    </div>
                </>
            )

        } else if (imageType === "audio") {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={getAll()}/>
                        <span className="sortbar-dropdown-text">All</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={get2D()}/>
                        <span className="sortbar-dropdown-text">2D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={getPixel()}/>
                        <span className="sortbar-dropdown-text">Pixel</span>
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={getAll()}/>
                        <span className="sortbar-dropdown-text">All</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={get2D()}/>
                        <span className="sortbar-dropdown-text">2D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={get3D()}/>
                        <span className="sortbar-dropdown-text">3D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={getChibi()}/>
                        <span className="sortbar-dropdown-text">Chibi</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={getPixel()}/>
                        <span className="sortbar-dropdown-text">Pixel</span>
                    </div>
                </>
            )
        }
    }

    useEffect(() => {
        if (imageType === "model") {
            if (styleType === "2d") {
                setStyleType("3d")
            }
        } else if (imageType === "audio") {
            if (styleType === "3d" || styleType === "chibi") {
                setStyleType("2d")
            }
        }
    }, [imageType, styleType])

    let sortBarJSX = () => {
        if (mobile) return (
            <div className={`mobile-sortbar ${relative ? "mobile-sortbar-relative" : ""} ${mobileScrolling ? "hide-mobile-sortbar" : ""}`}>
                <img style={{height: "30px"}} className="sortbar-img" src={getUpload()} onClick={() => history.push("/upload")}/>
                <img style={{height: "30px"}} className="sortbar-img" src={getDownload()} onClick={() => setShowDownloadDialog((prev: boolean) => !prev)}/>
                {getMobileImageJSX()}
                {getMobileRestrictJSX()}
                {getMobileStyleJSX()}
                <img style={{height: "30px"}} className="sortbar-img" src={getSquare()} onClick={() => toggleSquare()}/>
                {/* {reverse ? <img className="sortbar-img" src={getReverse()} style={{transform: "scaleX(-1)"}}/> :
                <img className="sortbar-img" src={getReverse()}/>}
                <img className="sortbar-img" src={getSpeed()}/> */}
                <img style={{height: "30px"}} className="sortbar-img" src={getFilters()} onClick={() => toggleFilterDrop()}/>
                <img style={{height: "30px"}} className="sortbar-img" src={getSize()} onClick={() => {setActiveDropdown(activeDropdown === "size" ? "none" : "size"); setFilterDropActive(false)}}/>
                <img style={{height: "30px"}} className="sortbar-img" src={getSort()} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}/>
            </div>
        )
        return (
            <div className={`sortbar ${hideSortbar ? "hide-sortbar" : ""} ${hideTitlebar ? "sortbar-top" : ""} 
            ${hideSortbar && hideTitlebar && hideSidebar ? "translate-sortbar" : ""}`}
            onMouseEnter={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)}>
                <div className="sortbar-left">
                    <div className="sortbar-item">
                        <img className="sortbar-img" src={getLeftArrow()} onClick={() => hideTheSidebar()}/>
                    </div>
                    <div className="sortbar-item">
                        <img className="sortbar-img" src={getUpArrow()} onClick={() => hideTheTitlebar()}/>
                    </div>
                    <Link to="/upload" className="sortbar-item">
                        <img className="sortbar-img" src={getUpload()}/>
                        <span className="sortbar-text">Upload</span>
                    </Link>
                    <div className="sortbar-item" onClick={() => setShowDownloadDialog((prev: boolean) => !prev)}>
                        <img className="sortbar-img" src={getDownload()}/>
                        <span className="sortbar-text">Download</span>
                    </div>
                    {imageType !== "all" || styleType !== "all" || restrictType !== "all" ?
                    <div className="sortbar-item" onClick={() => resetAll()}>
                        <img className="sortbar-img-small" src={getReset()}/>
                    </div> : null}
                    {getImageJSX()}
                    {getRestrictJSX()}
                    {getStyleJSX()}
                </div>
                <div className="sortbar-right">
                    <div className="sortbar-item" onClick={() => toggleScroll()}>
                        <img className="sortbar-img" src={scroll ? getScroll() : getPage()}/>
                        <span className="sortbar-text">{scroll ? "Scrolling" : "Pages"}</span>
                    </div>
                    <div className="sortbar-item" onClick={() => toggleSquare()}>
                        <img className="sortbar-img" src={getSquare()}/>
                    </div>
                    <div className="sortbar-item" onClick={() => setReverse((prev: boolean) => !prev)}>
                        {reverse ? <>
                        <img className="sortbar-img" src={getReverse()} style={{transform: "scaleX(-1)"}}/>
                        <span className="sortbar-text">Forward</span>
                        </> : <>
                        <img className="sortbar-img" src={getReverse()}/>
                        <span className="sortbar-text">Reverse</span>
                        </>}
                    </div>
                    <div className="sortbar-item" ref={speedRef} onClick={() => toggleSpeedDrop()}>
                        <img className="sortbar-img" src={getSpeed()}/>
                        <span className="sortbar-text">Speed</span>
                    </div>
                    <div className="sortbar-item" ref={filterRef} onClick={() => toggleFilterDrop()}>
                        <img className="sortbar-img" src={getFilters()}/>
                        <span className="sortbar-text">Filters</span>
                    </div>
                    {getSizeJSX()}
                    {getSortJSX()}
                </div>
            </div>
        )
    }

    return (
        <>
        {sortBarJSX()}
        <div className="sortbar-dropdowns"
        onMouseEnter={() => setEnableDrag(false)}>
            <div className={`dropdown ${activeDropdown === "image" ? "" : "hide-dropdown"}`}
            style={{marginLeft: getImageMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("all")} >
                    <img className="sortbar-dropdown-img rotate" src={getAll()}/>
                    <span className="sortbar-dropdown-text">All</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("image")}>
                    <img className="sortbar-dropdown-img" src={getImage()}/>
                    <span className="sortbar-dropdown-text">Image</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("animation")}>
                    <img className="sortbar-dropdown-img" src={getAnimation()}/>
                    <span className="sortbar-dropdown-text">Animation</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("video")}>
                    <img className="sortbar-dropdown-img" src={getVideo()}/>
                    <span className="sortbar-dropdown-text">Video</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("comic")}>
                    <img className="sortbar-dropdown-img" src={getComic()}/>
                    <span className="sortbar-dropdown-text">Comic</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("audio")}>
                    <img className="sortbar-dropdown-img" src={getAudio()}/>
                    <span className="sortbar-dropdown-text">Audio</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("model")}>
                    <img className="sortbar-dropdown-img" src={getModel()}/>
                    <span className="sortbar-dropdown-text">Model</span>
                </div>
            </div>
            <div className={`dropdown ${activeDropdown === "restrict" ? "" : "hide-dropdown"}`} 
            style={{marginLeft: getRestrictMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setRestrictType("all")}>
                    <img className="sortbar-dropdown-img rotate" src={getAll()}/>
                    <span className="sortbar-dropdown-text">All</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setRestrictType("safe")}>
                    <img className="sortbar-dropdown-img" src={getSafe()}/>
                    <span className="sortbar-dropdown-text">Safe</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setRestrictType("questionable")}>
                    <img className="sortbar-dropdown-img" src={getQuestionable()}/>
                    <span className="sortbar-dropdown-text">Questionable</span>
                </div>
                {permissions.isStaff(session) ?
                <div className="sortbar-dropdown-row" onClick={() => setRestrictType("explicit")}>
                    <img className="sortbar-dropdown-img" src={getExplicit()}/>
                    <span className="sortbar-dropdown-text">Explicit</span>
                </div> : null}
            </div>
            <div className={`dropdown ${activeDropdown === "style" ? "" : "hide-dropdown"}`} 
            style={{marginLeft: getStyleMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                {styleDropdownJSX()}
            </div>
            <div className={`dropdown-right ${activeDropdown === "speed" ? "" : "hide-dropdown"}`} 
            style={{marginRight: getSpeedMargin(), top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(4)}>
                    <span className="sortbar-dropdown-text">4x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(2)}>
                    <span className="sortbar-dropdown-text">2x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(1.75)}>
                    <span className="sortbar-dropdown-text">1.75x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(1.5)}>
                    <span className="sortbar-dropdown-text">1.5x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(1.25)}>
                    <span className="sortbar-dropdown-text">1.25x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(1)}>
                    <span className="sortbar-dropdown-text">1x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(0.75)}>
                    <span className="sortbar-dropdown-text">0.75x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(0.5)}>
                    <span className="sortbar-dropdown-text">0.5x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSpeed(0.25)}>
                    <span className="sortbar-dropdown-text">0.25x</span>
                </div>
            </div>
            <div className={`dropdown-right ${activeDropdown === "size" ? "" : "hide-dropdown"}`} 
            style={{marginRight: getSizeMargin(), top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("tiny")}>
                    <span className="sortbar-dropdown-text">Tiny</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("small")}>
                    <span className="sortbar-dropdown-text">Small</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("medium")}>
                    <span className="sortbar-dropdown-text">Medium</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("large")}>
                    <span className="sortbar-dropdown-text">Large</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("massive")}>
                    <span className="sortbar-dropdown-text">Massive</span>
                </div>
            </div>
            <div className={`dropdown-right ${activeDropdown === "sort" ? "" : "hide-dropdown"}`} 
            style={{marginRight: getSortMargin(), top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("date")}>
                    <span className="sortbar-dropdown-text">Date</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("reverse date")}>
                    <span className="sortbar-dropdown-text">Reverse Date</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("drawn")}>
                    <span className="sortbar-dropdown-text">Drawn</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("reverse drawn")}>
                    <span className="sortbar-dropdown-text">Reverse Drawn</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("cuteness")}>
                    <span className="sortbar-dropdown-text">Cuteness</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("reverse cuteness")}>
                    <span className="sortbar-dropdown-text">Reverse Cuteness</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("tagcount")}>
                    <span className="sortbar-dropdown-text">Tagcount</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("reverse tagcount")}>
                    <span className="sortbar-dropdown-text">Reverse Tagcount</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("filesize")}>
                    <span className="sortbar-dropdown-text">Filesize</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("reverse filesize")}>
                    <span className="sortbar-dropdown-text">Reverse Filesize</span>
                </div>
                {session.username ? <>
                <div className="sortbar-dropdown-row" onClick={() => setSortType("favorites")}>
                    <span className="sortbar-dropdown-text">Favorites</span>
                </div> 
                <div className="sortbar-dropdown-row" onClick={() => setSortType("reverse favorites")}>
                    <span className="sortbar-dropdown-text">Reverse Favorites</span>
                </div> 
                </> : null}
            </div>
            <div className={`dropdown-right ${activeDropdown === "filters" ? "" : "hide-dropdown"}`} 
            style={{marginRight: getFiltersMargin(), top: `${dropTop}px`}}>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getBrightness()}/>
                    <span className="sortbar-dropdown-text">Brightness</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBrightness(value)} min={60} max={140} step={1} value={brightness}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getContrast()} style={{marginLeft: "7px", marginRight: "-7px"}}/>
                    <span className="sortbar-dropdown-text">Contrast</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setContrast(value)} min={60} max={140} step={1} value={contrast}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getHue()} style={{marginLeft: "20px", marginRight: "-20px"}}/>
                    <span className="sortbar-dropdown-text">Hue</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setHue(value)} min={150} max={210} step={1} value={hue}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getSaturation()}/>
                    <span className="sortbar-dropdown-text">Saturation</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSaturation(value)} min={60} max={140} step={1} value={saturation}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getLightness()}/>
                    <span className="sortbar-dropdown-text">Lightness</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setLightness(value)} min={60} max={140} step={1} value={lightness}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getBlur()} style={{marginLeft: "20px", marginRight: "-20px"}}/>
                    <span className="sortbar-dropdown-text">Blur</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBlur(value)} min={0} max={2} step={0.1} value={blur}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getSharpen()} style={{marginLeft: "8px", marginRight: "-8px"}}/>
                    <span className="sortbar-dropdown-text">Sharpen</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSharpen(value)} min={0} max={5} step={0.1} value={sharpen}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={getPixelate()}/>
                    <span className="sortbar-dropdown-text">Pixelate</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setPixelate(value)} min={1} max={10} step={0.1} value={pixelate}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <button className="filters-button" onClick={() => resetFilters()}>Reset</button>
                </div>
            </div>
        </div>
        </>
    )
}

export default SortBar