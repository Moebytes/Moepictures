import React, {useContext, useEffect, useState, useRef, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import Slider from "react-slider"
import {ThemeContext, HideSidebarContext, HideNavbarContext, HideSortbarContext, ActiveDropdownContext, ScrollContext,
SizeTypeContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext, SiteHueContext, PremiumRequiredContext,
BlurContext, SharpenContext, EnableDragContext, FilterDropActiveContext, SquareContext, PixelateContext, SiteLightnessContext, PostsContext,
ShowDownloadDialogContext, HideTitlebarContext, ImageTypeContext, RestrictTypeContext, SortTypeContext, SortReverseContext, SiteSaturationContext,
StyleTypeContext, SpeedContext, ReverseContext, MobileContext, RelativeContext, SessionContext, MobileScrollingContext, SessionFlagContext,
SelectionModeContext, SelectionItemsContext, SearchFlagContext, DownloadIDsContext, DownloadFlagContext, ShowBulkQuickEditDialogContext,
ShowBulkDeleteDialogContext} from "../Context"
import leftArrow from "../assets/icons/leftArrow.png"
import rightArrow from "../assets/icons/rightArrow.png"
import upArrow from "../assets/icons/upArrow.png"
import downArrow from "../assets/icons/downArrow.png"
import upload from "../assets/icons/upload.png"
import download from "../assets/icons/download.png"
import reset from "../assets/icons/reset.png"
import all from "../assets/icons/all.png"
import image from "../assets/icons/image.png"
import animation from "../assets/icons/animation.png"
import video from "../assets/icons/video.png"
import comic from "../assets/icons/comic.png"
import model from "../assets/icons/model.png"
import audio from "../assets/icons/audio.png"
import explicit from "../assets/icons/explicit.png"
import questionable from "../assets/icons/questionable.png"
import safe from "../assets/icons/safe.png"
import $2d from "../assets/icons/2d.png"
import $3d from "../assets/icons/3d.png"
import pixel from "../assets/icons/pixel.png"
import chibi from "../assets/icons/chibi.png"
import filters from "../assets/icons/filters.png"
import size from "../assets/icons/size.png"
import sort from "../assets/icons/sort.png"
import sortRev from "../assets/icons/sort-reverse.png"
import brightnessIcon from "../assets/icons/brightness.png"
import contrastIcon from "../assets/icons/contrast.png"
import hueIcon from "../assets/icons/hue.png"
import saturationIcon from "../assets/icons/saturation.png"
import lightnessIcon from "../assets/icons/lightness.png"
import blurIcon from "../assets/icons/blur.png"
import sharpenIcon from "../assets/icons/sharpen.png"
import squareIcon from "../assets/icons/square.png"
import pixelateIcon from "../assets/icons/pixelate.png"
import speedIcon from "../assets/icons/speed.png"
import reverseIcon from "../assets/icons/reverse.png"
import scrollIcon from "../assets/icons/scroll.png"
import pageIcon from "../assets/icons/page.png"
import bulk from "../assets/icons/bulk.png"
import select from "../assets/icons/select.png"
import selectOn from "../assets/icons/select-on.png"
import star from "../assets/icons/star.png"
import quickEdit from "../assets/icons/quickedit.png"
import deleteIcon from "../assets/icons/tag-delete.png"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"
import "./styles/sortbar.less"

const SortBar: React.FunctionComponent = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {hideSortbar, setHideSortbar} = useContext(HideSortbarContext)
    const {hideSidebar, setHideSidebar} = useContext(HideSidebarContext)
    const {hideNavbar, setHideNavbar} = useContext(HideNavbarContext)
    const {hideTitlebar, setHideTitlebar} = useContext(HideTitlebarContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {activeDropdown, setActiveDropdown} = useContext(ActiveDropdownContext)
    const {filterDropActive, setFilterDropActive} = useContext(FilterDropActiveContext)
    const {premiumRequired, setPremiumRequired} = useContext(PremiumRequiredContext)
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
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadIDs, setDownloadIDs} = useContext(DownloadIDsContext)
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const [mouseOver, setMouseOver] = useState(false)
    const {imageType, setImageType} = useContext(ImageTypeContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const {styleType, setStyleType} = useContext(StyleTypeContext)
    const {sizeType, setSizeType} = useContext(SizeTypeContext)
    const {sortType, setSortType} = useContext(SortTypeContext)
    const {sortReverse, setSortReverse} = useContext(SortReverseContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const {reverse, setReverse} = useContext(ReverseContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {mobileScrolling, setMobileScrolling} = useContext(MobileScrollingContext)
    const {selectionMode, setSelectionMode} = useContext(SelectionModeContext)
    const {selectionItems, setSelectionItems} = useContext(SelectionItemsContext) as {selectionItems: Set<string>, setSelectionItems: any}
    const {showBulkQuickEditDialog, setShowBulkQuickEditDialog} = useContext(ShowBulkQuickEditDialogContext)
    const {showBulkDeleteDialog, setShowBulkDeleteDialog} = useContext(ShowBulkDeleteDialogContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {relative, setRelative} = useContext(RelativeContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {scroll, setScroll} = useContext(ScrollContext)
    const {posts, setPosts} = useContext(PostsContext)
    const [dropLeft, setDropLeft] = useState(0)
    const [dropTop, setDropTop] = useState(-2)
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

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const savedType = localStorage.getItem("type")
        const savedRestrict = localStorage.getItem("restrict")
        const savedStyle = localStorage.getItem("style")
        const savedSize = localStorage.getItem("size")
        const savedSort = localStorage.getItem("sort")
        const savedSortReverse = localStorage.getItem("sortReverse")
        const savedSquare = localStorage.getItem("square")
        const savedScroll = localStorage.getItem("scroll")
        if (savedType) setImageType(savedType)
        if (savedRestrict) setRestrictType(savedRestrict)
        if (savedStyle) setStyleType(savedStyle)
        if (savedSize) setSizeType(savedSize)
        if (savedSort) setSortType(savedSort)
        if (savedSortReverse) setSortReverse(savedSortReverse === "true")
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
            if (functions.scrolledToTop()) setDropTop(-2)
            if (activeDropdown === "none") return
        }
        const scrollHandler = () => {
            if (functions.scrolledToTop()) return setDropTop(-2)
            let newDropTop = hideTitlebar ? -Number(document.querySelector(".titlebar")?.clientHeight) - 2 : 0
            if (mobile) newDropTop = 32
            if (dropTop === newDropTop) return
            setDropTop(newDropTop - 2)
        }
        window.addEventListener("mousedown", clickHandler)
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("mousedown", clickHandler)
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
            if (functions.scrolledToTop()) return setDropTop(-2)
            setDropTop(-Number(document.querySelector(".titlebar")?.clientHeight) - 4)
        } else {
            setDropTop(-2)
        }
    }, [hideTitlebar])

    useEffect(() => {
        localStorage.setItem("type", imageType)
        localStorage.setItem("restrict", restrictType)
        localStorage.setItem("style", styleType)
        localStorage.setItem("size", sizeType)
        localStorage.setItem("sort", sortType)
        localStorage.setItem("sortReverse", sortReverse)
    }, [imageType, restrictType, styleType, sizeType, sortType, sortReverse])

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
                    <img className="sortbar-img" src={image} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Image</span>
                </div>
            )
        } else if (imageType === "animation") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={animation} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Animation</span>
                </div>
            )
        } else if (imageType === "video") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={video} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Video</span>
                </div>
            )
        } else if (imageType === "comic") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={comic} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Comic</span>
                </div>
            )
        } else if (imageType === "model") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={model} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">Model</span>
                    </div>
                )
        } else if (imageType === "audio") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={audio} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">Audio</span>
                    </div>
                )
        } else {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">All</span>
                </div>
            )
        }
    }

    const getMobileImageJSX = () => {
        if (imageType === "image") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={image} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "animation") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={animation} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "video") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={video} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "comic") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={comic} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "model") {
                return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={model} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "audio") {
                    return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={audio} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img rotate" src={all} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
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
                    <img className="sortbar-img" src={safe} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Safe</span>
                </div>
            )
        } else if (restrictType === "questionable") {
            return (
                <div className="sortbar-item" ref={restrictRef} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={questionable} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Questionable</span>
                </div>
            )
        } else if (restrictType === "explicit") {
            return (
                <div className="sortbar-item" ref={restrictRef} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={explicit}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-text">Explicit</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={restrictRef} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">All</span>
                </div>
            )
        }
    }

    const getMobileRestrictJSX = () => {
        if (restrictType === "safe") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={safe} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
        } else if (restrictType === "questionable") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={questionable} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
        } else if (restrictType === "explicit") {
            return <img style={{height: "30px"}} className="sortbar-img" src={explicit} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img rotate" src={all} onClick={() => {setActiveDropdown(activeDropdown === "restrict" ? "none" : "restrict"); setFilterDropActive(false)}}/>
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
        if (!session.username) offset += 23
        return `${raw + offset}px`
    }

    const getStyleJSX = () => {
        if (styleType === "2d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={$2d} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">2D</span>
                </div>
            )
        } else if (styleType === "3d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={$3d} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">3D</span>
                </div>
            )
        } else if (styleType === "pixel") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={pixel} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Pixel</span>
                </div>
            )
        } else if (styleType === "chibi") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={chibi} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">Chibi</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">All</span>
                </div>
            )
        }
    }

    const getMobileStyleJSX = () => {
        if (styleType === "2d") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={$2d} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "3d") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={$3d} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "pixel") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={pixel} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "chibi") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={chibi} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img rotate" src={all} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
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
                <img className="sortbar-img" src={size} style={{filter: getFilter()}}/>
                <span className="sortbar-text">{functions.toProperCase(sizeType)}</span>
            </div>
        )
    }

    const getSizeMargin = () => {
        const rect = sizeRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "45px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sizeType === "tiny") offset = -15
        if (sizeType === "small") offset = -10
        if (sizeType === "medium") offset = -5
        if (sizeType === "large") offset = -10
        if (sizeType === "massive") offset = -5
        return `${raw + offset}px`
    }

    const getSpeedMargin = () => {
        const rect = speedRef.current?.getBoundingClientRect()
        if (!rect) return "250px"
        const raw = window.innerWidth - rect.right
        let offset = 2
        return `${raw + offset}px`
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -30
        if (sortType === "date") offset = -30
        if (sortType === "drawn") offset = -30
        if (sortType === "cuteness") offset = -25
        if (sortType === "favorites") offset = -20
        if (sortType === "variations") offset = -20
        if (sortType === "thirdparty") offset = -20
        if (sortType === "popularity") offset = -20
        if (sortType === "bookmarks") offset = -10
        if (sortType === "tagcount") offset = -30
        if (sortType === "filesize") offset = -30
        if (sortType === "width") offset = -30
        if (sortType === "height") offset = -30
        if (!session.username) offset += 10
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        const getSort = () => {
            if (sortType === "bookmarks") return "Bookmarks ★"
            if (sortType === "favorites") return "Favorites ✧"
            if (sortType === "thirdparty") return "Third Party"
            return functions.toProperCase(sortType)
        }
        return (
            <div className="sortbar-item" ref={sortRef}>
                <img className="sortbar-img" src={sortReverse ? sortRev : sort} style={{filter: getFilter()}} onClick={() => setSortReverse((prev: boolean) => !prev)}/>
                <span className="sortbar-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}>{getSort()}</span>
            </div>
        )
    }

    const getFiltersMargin = () => {
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect) return "30px"
        const raw = window.innerWidth - rect.right
        let offset = -110
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
                        <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">All</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={$3d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">3D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={chibi} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">Chibi</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={pixel} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">Pixel</span>
                    </div>
                </>
            )

        } else if (imageType === "audio") {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">All</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={$2d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">2D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={pixel} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">Pixel</span>
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">All</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={$2d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">2D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={$3d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">3D</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={chibi} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">Chibi</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={pixel} style={{filter: getFilter()}}/>
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

    const bulkFavorite = async () => {
        if (!selectionItems.size) return
        console.log(selectionItems.keys())
        console.log(selectionItems.values())
        for (const postID of selectionItems.values()) {
            await functions.post("/api/favorite/toggle", {postID}, session, setSessionFlag)
            functions.get("/api/favorite", {postID}, session, setSessionFlag).then((favorite) => {
                functions.updateLocalFavorite(postID, favorite ? true : false, posts)
            })
        }
        setSelectionMode(false)
        if (sortType === "favorites") setSearchFlag(true)
        setTimeout(() => {
            setSelectionMode(true)
        }, 200)
    }

    const bulkDownload = async () => {
        if (selectionMode) {
            if (!selectionItems.size) return
            let newDownloadIDs = [] as any
            for (const postID of selectionItems.values()) {
                newDownloadIDs.push(postID)
            }
            setDownloadIDs(newDownloadIDs)
            setDownloadFlag(true)
            setSelectionMode(false)
            setTimeout(() => {
                setSelectionMode(true)
            }, 200)
        } else {
            setShowDownloadDialog((prev: boolean) => !prev)
        }
    }

    const bulkQuickEdit = () => {
        setShowBulkQuickEditDialog((prev: boolean) => !prev)
    }

    const bulkDelete = () => {
        setShowBulkDeleteDialog((prev: boolean) => !prev)
    }

    const changeSortType = (sortType: string) => {
        if (sortType === "bookmarks") {
            if (!permissions.isPremium(session)) return setPremiumRequired(true)
        }
        setSortType(sortType)
    }
 
    let sortBarJSX = () => {
        if (mobile) return (
            <div className={`mobile-sortbar ${relative ? "mobile-sortbar-relative" : ""} ${mobileScrolling ? "hide-mobile-sortbar" : ""}`}>
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={upload} onClick={() => history.push("/upload")}/>
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={download} onClick={bulkDownload}/>
                {getMobileImageJSX()}
                {getMobileRestrictJSX()}
                {getMobileStyleJSX()}
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={squareIcon} onClick={() => toggleSquare()}/>
                {/* {reverse ? <img className="sortbar-img" src={getReverse()} style={{transform: "scaleX(-1)"}}/> :
                <img className="sortbar-img" src={getReverse()}/>}
                <img className="sortbar-img" src={getSpeed()}/> */}
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={filters} onClick={() => toggleFilterDrop()}/>
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={size} onClick={() => {setActiveDropdown(activeDropdown === "size" ? "none" : "size"); setFilterDropActive(false)}}/>
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={sortReverse ? sortRev : sort} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}/>
            </div>
        )
        return (
            <div className={`sortbar ${hideSortbar ? "hide-sortbar" : ""} ${hideTitlebar ? "sortbar-top" : ""} 
            ${hideSortbar && hideTitlebar && hideSidebar ? "translate-sortbar" : ""}`}
            onMouseEnter={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)}>
                <div className="sortbar-left">
                    <div className="sortbar-item">
                        <img className="sortbar-img" src={hideSidebar ? rightArrow : leftArrow} style={{filter: getFilter()}} onClick={() => hideTheSidebar()}/>
                    </div>
                    <div className="sortbar-item">
                        <img className="sortbar-img" src={hideTitlebar ? downArrow : upArrow} style={{filter: getFilter()}} onClick={() => hideTheTitlebar()}/>
                    </div>
                    <Link to="/upload" className="sortbar-item">
                        <img className="sortbar-img" src={upload} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">Upload</span>
                    </Link>
                    <div className="sortbar-item" onClick={bulkDownload}>
                        <img className="sortbar-img" src={download} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">Download</span>
                    </div>
                    {session.role === "admin" || session.role === "mod" ?
                    <Link to="/bulk-upload" className="sortbar-item">
                        <img className="sortbar-img" src={bulk} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">Bulk</span>
                    </Link> : null}
                    {imageType !== "all" || styleType !== "all" || restrictType !== "all" ?
                    <div className="sortbar-item" onClick={() => resetAll()}>
                        <img className="sortbar-img-small" src={reset} style={{filter: getFilter()}}/>
                    </div> : null}
                    {getImageJSX()}
                    {getRestrictJSX()}
                    {getStyleJSX()}
                </div>
                <div className="sortbar-right">
                    {permissions.isAdmin(session) && selectionMode ? 
                    <div className="sortbar-item" style={{filter: "hue-rotate(-5deg)"}} onClick={bulkDelete}>
                        <img className="sortbar-img" src={deleteIcon} style={{filter: getFilter()}}/>
                    </div> : null}
                    {permissions.isElevated(session) && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkQuickEdit}>
                        <img className="sortbar-img" src={quickEdit} style={{filter: getFilter()}}/>
                    </div> : null}
                    {session.username && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkFavorite}>
                        <img className="sortbar-img" src={star} style={{filter: getFilter()}}/>
                    </div> : null}
                    {session.username ? 
                    <div className="sortbar-item" onClick={() => setSelectionMode((prev: boolean) => !prev)}>
                        <img className="sortbar-img" src={selectionMode ? selectOn : select} style={{filter: getFilter()}}/>
                    </div> : null}
                    <div className="sortbar-item" onClick={() => toggleScroll()}>
                        <img className="sortbar-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{scroll ? "Scrolling" : "Pages"}</span>
                    </div>
                    <div className="sortbar-item" onClick={() => toggleSquare()}>
                        <img className="sortbar-img" src={squareIcon} style={{filter: getFilter()}}/>
                    </div>
                    <div className="sortbar-item" onClick={() => setReverse((prev: boolean) => !prev)}>
                        {reverse ? <>
                        <img className="sortbar-img" src={reverseIcon} style={{transform: "scaleX(-1)", filter: getFilter()}}/>
                        <span className="sortbar-text">Forward</span>
                        </> : <>
                        <img className="sortbar-img" src={reverseIcon} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">Reverse</span>
                        </>}
                    </div>
                    <div className="sortbar-item" ref={speedRef} onClick={() => toggleSpeedDrop()}>
                        <img className="sortbar-img" src={speedIcon} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">Speed</span>
                    </div>
                    <div className="sortbar-item" ref={filterRef} onClick={() => toggleFilterDrop()}>
                        <img className="sortbar-img" src={filters} style={{filter: getFilter()}}/>
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
                    <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">All</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("image")}>
                    <img className="sortbar-dropdown-img" src={image} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Image</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("animation")}>
                    <img className="sortbar-dropdown-img" src={animation} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Animation</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("video")}>
                    <img className="sortbar-dropdown-img" src={video} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Video</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("comic")}>
                    <img className="sortbar-dropdown-img" src={comic} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Comic</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("audio")}>
                    <img className="sortbar-dropdown-img" src={audio} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Audio</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("model")}>
                    <img className="sortbar-dropdown-img" src={model} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Model</span>
                </div>
            </div>
            <div className={`dropdown ${activeDropdown === "restrict" ? "" : "hide-dropdown"}`} 
            style={{marginLeft: getRestrictMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setRestrictType("all")}>
                    <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">All</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setRestrictType("safe")}>
                    <img className="sortbar-dropdown-img" src={safe} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Safe</span>
                </div>
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => setRestrictType("questionable")}>
                    <img className="sortbar-dropdown-img" src={questionable} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Questionable</span>
                </div> : null}
                {session.showR18 ?
                <div className="sortbar-dropdown-row" onClick={() => setRestrictType("explicit")}>
                    <img className="sortbar-dropdown-img" src={explicit}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-dropdown-text">Explicit</span>
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
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("random")}>
                    <span className="sortbar-dropdown-text">Random</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("date")}>
                    <span className="sortbar-dropdown-text">Date</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("drawn")}>
                    <span className="sortbar-dropdown-text">Drawn</span>
                </div>
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => changeSortType("bookmarks")}>
                    <span className="sortbar-dropdown-text">Bookmarks ★</span>
                </div> : null}
                {session.username ? <>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("favorites")}>
                    <span className="sortbar-dropdown-text">Favorites ✧</span>
                </div>
                </> : null}
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("popularity")}>
                    <span className="sortbar-dropdown-text">Popularity</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("cuteness")}>
                    <span className="sortbar-dropdown-text">Cuteness</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("variations")}>
                    <span className="sortbar-dropdown-text">Variations</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("thirdparty")}>
                    <span className="sortbar-dropdown-text">Third Party</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("tagcount")}>
                    <span className="sortbar-dropdown-text">Tagcount</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("filesize")}>
                    <span className="sortbar-dropdown-text">Filesize</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("width")}>
                    <span className="sortbar-dropdown-text">Width</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("height")}>
                    <span className="sortbar-dropdown-text">Height</span>
                </div>
            </div>
            <div className={`dropdown-right ${activeDropdown === "filters" ? "" : "hide-dropdown"}`} 
            style={{marginRight: getFiltersMargin(), top: `${dropTop}px`}}>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={brightnessIcon} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Brightness</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBrightness(value)} min={60} max={140} step={1} value={brightness}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={contrastIcon} style={{marginLeft: "7px", marginRight: "-7px", filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Contrast</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setContrast(value)} min={60} max={140} step={1} value={contrast}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={hueIcon} style={{marginLeft: "20px", marginRight: "-20px", filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Hue</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setHue(value)} min={150} max={210} step={1} value={hue}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={saturationIcon} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Saturation</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSaturation(value)} min={60} max={140} step={1} value={saturation}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={lightnessIcon} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Lightness</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setLightness(value)} min={60} max={140} step={1} value={lightness}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={blurIcon} style={{marginLeft: "20px", marginRight: "-20px", filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Blur</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setBlur(value)} min={0} max={2} step={0.1} value={blur}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={sharpenIcon} style={{marginLeft: "8px", marginRight: "-8px", filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">Sharpen</span>
                    <Slider className="filters-slider" trackClassName="filters-slider-track" thumbClassName="filters-slider-thumb" onChange={(value) => setSharpen(value)} min={0} max={5} step={0.1} value={sharpen}/>
                </div>
                <div className="sortbar-dropdown-row filters-row">
                    <img className="sortbar-dropdown-img" src={pixelateIcon} style={{filter: getFilter()}}/>
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