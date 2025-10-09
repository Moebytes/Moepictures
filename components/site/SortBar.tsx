import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, 
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, useFlagActions, useMiscDialogActions, 
useInteractionSelector, useSessionActions, usePostDialogActions, useGroupDialogActions, useActiveSelector,
usePageSelector, useCacheSelector, useActiveActions, useLayoutActions, useMiscDialogSelector, usePostDialogSelector, 
useGroupDialogSelector, useCacheActions} from "../../store"
import leftArrow from "../../assets/icons/leftArrow.png"
import rightArrow from "../../assets/icons/rightArrow.png"
import upArrow from "../../assets/icons/upArrow.png"
import downArrow from "../../assets/icons/downArrow.png"
import upload from "../../assets/icons/upload.png"
import download from "../../assets/icons/download.png"
import reset from "../../assets/icons/reset.png"
import all from "../../assets/icons/all.png"
import allS from "../../assets/icons/all+s.png"
import allH from "../../assets/icons/all+h.png"
import image from "../../assets/icons/image.png"
import animation from "../../assets/icons/animation.png"
import video from "../../assets/icons/video.png"
import comic from "../../assets/icons/comic.png"
import live2d from "../../assets/icons/live2d.png"
import model from "../../assets/icons/model.png"
import audio from "../../assets/icons/audio.png"
import cute from "../../assets/icons/cute.png"
import hot from "../../assets/icons/hot.png"
import erotic from "../../assets/icons/erotic.png"
import hentai from "../../assets/icons/hentai.png"
import $2d from "../../assets/icons/2d.png"
import $3d from "../../assets/icons/3d.png"
import pixel from "../../assets/icons/pixel.png"
import chibi from "../../assets/icons/chibi.png"
import daki from "../../assets/icons/daki.png"
import sketch from "../../assets/icons/sketch.png"
import lineart from "../../assets/icons/lineart.png"
import promo from "../../assets/icons/promo.png"
import filters from "../../assets/icons/filters.png"
import size from "../../assets/icons/size.png"
import sort from "../../assets/icons/sort.png"
import sortRev from "../../assets/icons/sort-reverse.png"
import squareIcon from "../../assets/icons/square.png"
import speedIcon from "../../assets/icons/speed.png"
import reverseIcon from "../../assets/icons/reverse.png"
import scrollIcon from "../../assets/icons/scroll.png"
import pageIcon from "../../assets/icons/page.png"
import bulk from "../../assets/icons/bulk.png"
import select from "../../assets/icons/select.png"
import selectOn from "../../assets/icons/select-on.png"
import star from "../../assets/icons/star.png"
import starGroup from "../../assets/icons/stargroup.png"
import tagEdit from "../../assets/icons/tag-outline.png"
import group from "../../assets/icons/group-thin.png"
import deleteIcon from "../../assets/icons/tag-delete.png"
import leftIcon from "../../assets/icons/go-left.png"
import rightIcon from "../../assets/icons/go-right.png"
import multiplier1xIcon from "../../assets/icons/1x.png"
import multiplier2xIcon from "../../assets/icons/2x.png"
import multiplier3xIcon from "../../assets/icons/3x.png"
import multiplier4xIcon from "../../assets/icons/4x.png"
import multiplier5xIcon from "../../assets/icons/5x.png"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import checkbox from "../../assets/icons/checkbox2.png"
import checkboxChecked from "../../assets/icons/checkbox2-checked.png"
import Filters from "../post/Filters"
import {PostSort} from "../../types/Types"
import "./styles/sortbar.less"

const SortBar: React.FunctionComponent = (props) => {
    const {siteHue, siteSaturation, siteLightness, i18n} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile, tablet, relative, hideSortbar, hideSidebar, hideTitlebar} = useLayoutSelector()
    const {setHideSortbar, setHideSidebar, setHideTitlebar, setHideNavbar} = useLayoutActions()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {activeDropdown, filterDropActive} = useActiveSelector()
    const {setActiveDropdown, setFilterDropActive} = useActiveActions()
    const {reverse} = usePlaybackSelector()
    const {setReverse, setSpeed} = usePlaybackActions()
    const {scroll, square, imageType, ratingType, styleType, sizeType, sortType, sortReverse, selectionMode, pageMultiplier, selectionItems, showChildren} = useSearchSelector()
    const {setScroll, setImageType, setRatingType, setStyleType, setSizeType, setSortType, setSortReverse, setSelectionMode, setPageMultiplier, setSquare, setSearchFlag, setShowChildren} = useSearchActions()
    const {setDownloadFlag, setDownloadIDs, setPageFlag} = useFlagActions()
    const {showDownloadDialog} = useMiscDialogSelector()
    const {setPremiumRequired, setShowDownloadDialog} = useMiscDialogActions()
    const {mobileScrolling} = useInteractionSelector()
    const {showBulkTagEditDialog, showBulkDeleteDialog} = usePostDialogSelector()
    const {setShowBulkTagEditDialog, setShowBulkDeleteDialog} = usePostDialogActions()
    const {bulkFavGroupDialog, bulkGroupDialog} = useGroupDialogSelector()
    const {setBulkFavGroupDialog, setBulkGroupDialog} = useGroupDialogActions()
    const {page} = usePageSelector()
    const {posts} = useCacheSelector()
    const {setPosts} = useCacheActions()
    const [mouseOver, setMouseOver] = useState(false)
    const [dropLeft, setDropLeft] = useState(0)
    const [dropTop, setDropTop] = useState(-2)
    const imageRef = useRef<HTMLDivElement>(null)
    const ratingRef = useRef<HTMLDivElement>(null)
    const styleRef = useRef<HTMLDivElement>(null)
    const sizeRef = useRef<HTMLDivElement>(null)
    const sortRef = useRef<HTMLDivElement>(null)
    const filterRef = useRef<HTMLDivElement>(null)
    const speedRef = useRef<HTMLDivElement>(null)
    const pageMultiplierRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useEffect(() => {
        const clickHandler = () => {
            if (activeDropdown !== "filters") {
                if (filterDropActive) setFilterDropActive(false)
            }
            if (mobile) setDropTop(21)
            if (functions.dom.scrolledToTop()) setDropTop(-2)
            if (activeDropdown === "none") return
        }
        const scrollHandler = () => {
            if (functions.dom.scrolledToTop()) return setDropTop(-2)
            let newDropTop = hideTitlebar ? -Number(document.querySelector(".titlebar")?.clientHeight) - 2 : 0
            if (mobile) newDropTop = 23
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
            if (functions.dom.scrolledToTop()) return setDropTop(-2)
            setDropTop(-Number(document.querySelector(".titlebar")?.clientHeight) - 4)
        } else {
            setDropTop(-2)
        }
    }, [hideTitlebar])

    const hideTheSidebar = () => {
        const newValue = !hideSidebar
        setHideSidebar(newValue)
    }

    const hideTheTitlebar = () => {
        let newValue = !hideTitlebar
        setHideNavbar(newValue)
        setHideTitlebar(newValue)
    }

    const getImageJSX = () => {
        if (imageType === "image") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={image} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.image}</span>
                </div>
            )
        } else if (imageType === "animation") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={animation} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.animation}</span>
                </div>
            )
        } else if (imageType === "video") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={video} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.video}</span>
                </div>
            )
        } else if (imageType === "comic") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={comic} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.comic}</span>
                </div>
            )
        } else if (imageType === "model") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={model} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{i18n.sortbar.type.model}</span>
                    </div>
                )
        } else if (imageType === "live2d") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={live2d} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.live2d}</span>
                </div>
            )
        } else if (imageType === "audio") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={audio} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{i18n.sortbar.type.audio}</span>
                    </div>
                )
        } else {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
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
        } else if (imageType === "live2d") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={live2d} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
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
        if (imageType === "live2d") offset = -15
        return `${raw + offset}px`
    }

    const getRatingJSX = () => {
        if (ratingType === "cute") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={cute} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.rating.cute}</span>
                </div>
            )
        } else if (ratingType === "hot") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={hot} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.rating.hot}</span>
                </div>
            )
        } else if (ratingType === "erotic") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={erotic} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.rating.erotic}</span>
                </div>
            )
        } else if (ratingType === "hentai") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={hentai}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-text">{i18n.sortbar.rating.hentai}</span>
                </div>
            )
        } else if (ratingType === "all+h") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={allH}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-text">{i18n.sortbar.rating.allH}</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
                </div>
            )
        }
    }

    const getMobileRatingJSX = () => {
        if (ratingType === "cute") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={cute} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "hot") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={hot} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "erotic") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={erotic} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "hentai") {
            return <img style={{height: "30px"}} className="sortbar-img" src={hentai} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "all+h") {
            return <img style={{height: "30px"}} className="sortbar-img rotate" src={allH} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img rotate" src={all} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        }
    }

    const getRatingMargin = () => {
        if (mobile) return "115px"
        const rect = ratingRef.current?.getBoundingClientRect()
        if (!rect) return "325px"
        const raw = rect.x
        let offset = 0
        if (ratingType === "all") offset = -15
        if (ratingType === "all+h") offset = -15
        if (ratingType === "cute") offset = -10
        if (ratingType === "hot") offset = -10
        if (ratingType === "erotic") offset = -5
        if (ratingType === "hentai") offset = -5
        if (!session.username) offset += 0
        return `${raw + offset}px`
    }

    const getStyleJSX = () => {
        if (styleType === "2d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={$2d} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.style["2d"]}</span>
                </div>
            )
        } else if (styleType === "3d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={$3d} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.style["3d"]}</span>
                </div>
            )
        } else if (styleType === "pixel") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={pixel} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.style.chibi}</span>
                </div>
            )
        } else if (styleType === "chibi") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={chibi} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.sortbar.style.chibi}</span>
                </div>
            )
        } else if (styleType === "daki") {
                return (
                    <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={daki} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{i18n.sortbar.style.daki}</span>
                    </div>
                )
        } else if (styleType === "promo") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={promo}/>
                    <span className="sortbar-text">{i18n.sortbar.style.promo}</span>
                </div>
            )
        } else if (styleType === "sketch") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={sketch}/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.sketch}</span>
                </div>
            )
        } else if (styleType === "lineart") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={lineart}/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.lineart}</span>
                </div>
            )
        } else if (styleType === "all+s") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={allS}/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.allS}</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
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
        } else if (styleType === "daki") {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={daki} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "sketch") {
            return <img style={{height: "30px"}} className="sortbar-img" src={sketch} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "lineart") {
            return <img style={{height: "30px"}} className="sortbar-img" src={lineart} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "promo") {
            return <img style={{height: "30px"}} className="sortbar-img" src={promo} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "all+s") {
            return <img style={{height: "30px"}} className="sortbar-img rotate" src={allS} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter: getFilter()}} className="sortbar-img rotate" src={all} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        }
    }

    const getStyleMargin = () => {
        if (mobile) return "150px"
        const rect = styleRef.current?.getBoundingClientRect()
        if (!rect) return "395px"
        const raw = rect.x
        let offset = 0
        if (styleType === "all") offset = -15
        if (styleType === "all+s") offset = -15
        if (styleType === "2d") offset = -15
        if (styleType === "3d") offset = -15
        if (styleType === "pixel") offset = -5
        if (styleType === "chibi") offset = -5
        if (styleType === "daki") offset = -5
        if (styleType === "sketch") offset = -5
        if (styleType === "lineart") offset = -3
        if (styleType === "promo") offset = -5
        return `${raw + offset}px`
    }

    const resetAll = () => {
        setImageType("all")
        setRatingType("all")
        setStyleType("all")
        setActiveDropdown("none")
    }

    const getSizeJSX = () => {
        return (
            <div className="sortbar-item" ref={sizeRef} onClick={() => {setActiveDropdown(activeDropdown === "size" ? "none" : "size"); setFilterDropActive(false)}}>
                <img className="sortbar-img" src={size} style={{filter: getFilter()}}/>
                <span className="sortbar-text">{i18n.sortbar.size[sizeType]}</span>
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

    const getPageMultiplierMargin = () => {
        const rect = pageMultiplierRef.current?.getBoundingClientRect()
        if (!rect) return "250px"
        const raw = window.innerWidth - rect.right
        let offset = -8
        if (tablet) offset -= 0
        return `${raw + offset}px`
    }

    const getSpeedMargin = () => {
        const rect = speedRef.current?.getBoundingClientRect()
        if (!rect) return "250px"
        const raw = window.innerWidth - rect.right
        let offset = -22
        if (tablet) offset -= 0
        return `${raw + offset}px`
    }

    const getSortMargin = () => {
        const rect = sortRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "0px"
        const raw = window.innerWidth - rect.right
        let offset = 0
        if (sortType === "random") offset = -30
        if (sortType === "date") offset = -30
        if (sortType === "posted") offset = -30
        if (sortType === "cuteness") offset = -25
        if (sortType === "favorites") offset = -20
        if (sortType === "variations") offset = -20
        if (sortType === "parent") offset = -25
        if (sortType === "child") offset = -30
        if (sortType === "groups") offset = -30
        if (sortType === "popularity") offset = -20
        if (sortType === "bookmarks") offset = -10
        if (sortType === "tagcount") offset = -30
        if (sortType === "filesize") offset = -30
        if (sortType === "aspectRatio") offset = -10
        if (sortType === "hidden") offset = -30
        if (sortType === "locked") offset = -30
        if (sortType === "private") offset = -30
        if (!session.username) offset += 10
        return `${raw + offset}px`
    }

    const getSortJSX = () => {
        const getSort = () => {
            if (sortType === "bookmarks") return `${i18n.sort.bookmarks} ★`
            if (sortType === "favorites") return `${i18n.sort.favorites} ✧`
            return i18n.sort[sortType]
        }
        return (
            <div className="sortbar-item" ref={sortRef}>
                <img className="sortbar-img" src={sortReverse ? sortRev : sort} style={{filter: getFilter()}} onClick={() => setSortReverse(!sortReverse)}/>
                <span className="sortbar-text" onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}>{getSort()}</span>
            </div>
        )
    }

    const getFiltersMargin = () => {
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect) return 30
        const raw = window.innerWidth - rect.right
        let offset = -110
        return raw + offset
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

    const togglePageMultiplierDrop = () => {
        const newValue = activeDropdown === "page-multiplier" ? "none" : "page-multiplier"
        setActiveDropdown(newValue)
        setFilterDropActive(newValue === "page-multiplier")
    }

    const toggleSquare = () => {
        const newValue = !square
        setSquare(newValue)
    }

    const toggleShowChildren = () => {
        const newValue = !showChildren
        setShowChildren(newValue)
    }

    const toggleScroll = () => {
        const newValue = !scroll
        setScroll(newValue)
    }

    const styleDropdownJSX = () => {
        if (imageType === "model") {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={$3d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["3d"]}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={chibi} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.chibi}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={pixel} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                </>
            )
            
        } else if (imageType === "audio") {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all+s")}>
                        <img className="sortbar-dropdown-img rotate" src={allS} style={{filter: getFilter()}}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.allS}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={$2d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["2d"]}</span>
                    </div> 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={pixel} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("sketch")}>
                        <img className="sortbar-dropdown-img" src={sketch}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.sketch}</span>
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all+s")}>
                        <img className="sortbar-dropdown-img rotate" src={allS} style={{filter: getFilter()}}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.allS}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={$2d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["2d"]}</span>
                    </div>
                    {imageType !== "live2d" ? <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={$3d} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["3d"]}</span>
                    </div> : null}
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={chibi} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.chibi}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={pixel} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                    {imageType !== "comic" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("daki")}>
                        <img className="sortbar-dropdown-img" src={daki} style={{filter: getFilter()}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.daki}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("promo")}>
                        <img className="sortbar-dropdown-img" src={promo}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.promo}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("sketch")}>
                        <img className="sortbar-dropdown-img" src={sketch}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.sketch}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("lineart")}>
                        <img className="sortbar-dropdown-img" src={lineart}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.lineart}</span>
                    </div> : null}
                </>
            )
        }
    }

    useEffect(() => {
        if (imageType === "comic") {
            if (styleType === "daki") {
                setStyleType("2d")
            }
        } else if (imageType === "model") {
            if (styleType === "2d" || styleType === "daki" || styleType === "sketch" || styleType === "lineart" || styleType === "promo") {
                setStyleType("3d")
            }
        } else if (imageType === "live2d") {
            if (styleType === "3d" || styleType === "sketch" || styleType === "lineart" || styleType === "promo") {
                setStyleType("2d")
            }
        } else if (imageType === "audio") {
            if (styleType === "3d" || styleType === "chibi" || styleType === "daki" || styleType === "lineart" || styleType === "promo") {
                setStyleType("2d")
            }
        }
    }, [imageType, styleType])

    const bulkFavorite = async () => {
        if (!selectionItems.size) return
        for (const postID of selectionItems.values()) {
            await functions.http.post("/api/favorite/toggle", {postID}, session, setSessionFlag)
            functions.http.get("/api/favorite", {postID}, session, setSessionFlag).then((favorite) => {
                functions.post.updateLocalFavorite(postID, favorite ? true : false, posts, setPosts)
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
            let newDownloadIDs = [] as string[]
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
            setShowDownloadDialog(!showDownloadDialog)
        }
    }

    const bulkGroup = () => {
        setBulkGroupDialog(!bulkGroupDialog)
    }

    const bulkFavgroup = () => {
        setBulkFavGroupDialog(!bulkFavGroupDialog)
    }

    const bulkTagEdit = () => {
        setShowBulkTagEditDialog(!showBulkTagEditDialog)
    }

    const bulkDelete = () => {
        setShowBulkDeleteDialog(!showBulkDeleteDialog)
    }

    const changeSortType = (sortType: PostSort) => {
        if (sortType === "bookmarks") {
            if (!permissions.isPremium(session)) return setPremiumRequired(true)
        }
        setSortType(sortType)
    }

    const getPageMultiplierIcon = () => {
        if (pageMultiplier === 1) return multiplier1xIcon
        if (pageMultiplier === 2) return multiplier2xIcon
        if (pageMultiplier === 3) return multiplier3xIcon
        if (pageMultiplier === 4) return multiplier4xIcon
        if (pageMultiplier === 5) return multiplier5xIcon
        return multiplier1xIcon
    }

    const previousPage = () => {
        setPageFlag(page - 1)
        setTimeout(() => {
            setHideSortbar(false)
        }, 100)
    }

    const nextPage = () => {
        setPageFlag(page + 1)
        setTimeout(() => {
            setHideSortbar(false)
        }, 100)
    }
 
    let sortBarJSX = () => {
        if (mobile) return (
            <div className={`mobile-sortbar ${relative ? "mobile-sortbar-relative" : ""} ${mobileScrolling ? "hide-mobile-sortbar" : ""}`}>
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={upload} onClick={() => navigate("/upload")}/>
                <img style={{height: "30px", filter: getFilter()}} className="sortbar-img" src={download} onClick={bulkDownload}/>
                {getMobileImageJSX()}
                {getMobileRatingJSX()}
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
                        <span className="sortbar-text">{i18n.buttons.upload}</span>
                    </Link>
                    <div className="sortbar-item" onClick={bulkDownload}>
                        <img className="sortbar-img" src={download} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{i18n.buttons.download}</span>
                    </div>
                    {!tablet && permissions.isAdmin(session) ?
                    <Link to="/bulk-upload" className="sortbar-item">
                        <img className="sortbar-img" src={bulk} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{i18n.sortbar.bulk}</span>
                    </Link> : null}
                    {imageType !== "all" || styleType !== "all" || ratingType !== "all" ?
                    <div className="sortbar-item" onClick={() => resetAll()}>
                        <img className="sortbar-img-small" src={reset} style={{filter: getFilter()}}/>
                    </div> : null}
                    {getImageJSX()}
                    {getRatingJSX()}
                    {getStyleJSX()}
                    <div className="sortbar-item" onClick={() => toggleShowChildren()}>
                        <img className="sortbar-img" src={showChildren ? checkboxChecked : checkbox} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{i18n.sort.child}</span> 
                    </div>
                </div>
                <div className="sortbar-right">
                    {permissions.isAdmin(session) && selectionMode ? 
                    <div className="sortbar-item" style={{filter: "hue-rotate(-5deg)"}} onClick={bulkDelete}>
                        <img className="sortbar-img" src={deleteIcon} style={{filter: getFilter()}}/>
                    </div> : null}
                    {permissions.isAdmin(session) && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkTagEdit}>
                        <img className="sortbar-img" src={tagEdit} style={{filter: getFilter()}}/>
                    </div> : null}
                    {permissions.isContributor(session) && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkGroup}>
                        <img className="sortbar-img" src={group} style={{filter: getFilter()}}/>
                    </div> : null}
                    {session.username && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkFavgroup}>
                        <img className="sortbar-img" src={starGroup} style={{filter: getFilter()}}/>
                    </div> : null}
                    {session.username && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkFavorite}>
                        <img className="sortbar-img" src={star} style={{filter: getFilter()}}/>
                    </div> : null}
                    {session.username ? 
                    <div className="sortbar-item" onClick={() => setSelectionMode(!selectionMode)}>
                        <img className="sortbar-img" src={selectionMode ? selectOn : select} style={{filter: getFilter()}}/>
                    </div> : null}
                    {!scroll ? <>
                    <div className="sortbar-item" style={{marginRight: "5px"}} onClick={previousPage}>
                        <img className="sortbar-img" src={leftIcon} style={{filter: getFilter()}}/>
                    </div>
                    <div className="sortbar-item" onClick={nextPage}>
                        <img className="sortbar-img" src={rightIcon} style={{filter: getFilter()}}/>
                    </div>
                    <div className="sortbar-item" ref={pageMultiplierRef} onClick={() => togglePageMultiplierDrop()}>
                        <img className="sortbar-img" src={getPageMultiplierIcon()} style={{filter: getFilter()}}/>
                    </div>
                    </> : null}
                    <div className="sortbar-item" onClick={() => toggleScroll()}>
                        <img className="sortbar-img" src={scroll ? scrollIcon : pageIcon} style={{filter: getFilter()}}/>
                        {!tablet ? <span className="sortbar-text">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span> : null}
                    </div>
                    <div className="sortbar-item" onClick={() => toggleSquare()}>
                        <img className="sortbar-img" src={squareIcon} style={{filter: getFilter()}}/>
                    </div>
                    <div className="sortbar-item" onClick={() => setReverse(!reverse)}>
                        {reverse ? <>
                        <img className="sortbar-img" src={reverseIcon} style={{transform: "scaleX(-1)", filter: getFilter()}}/>
                        </> : <>
                        <img className="sortbar-img" src={reverseIcon} style={{filter: getFilter()}}/>
                        </>}
                    </div>
                    <div className="sortbar-item" ref={speedRef} onClick={() => toggleSpeedDrop()}>
                        <img className="sortbar-img" src={speedIcon} style={{filter: getFilter()}}/>
                    </div>
                    <div className="sortbar-item" ref={filterRef} onClick={() => toggleFilterDrop()}>
                        <img className="sortbar-img" src={filters} style={{filter: getFilter()}}/>
                        <span className="sortbar-text">{i18n.filters.filters}</span>
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
                    <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("image")}>
                    <img className="sortbar-dropdown-img" src={image} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.image}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("animation")}>
                    <img className="sortbar-dropdown-img" src={animation} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.animation}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("video")}>
                    <img className="sortbar-dropdown-img" src={video} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.video}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("comic")}>
                    <img className="sortbar-dropdown-img" src={comic} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.comic}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("audio")}>
                    <img className="sortbar-dropdown-img" src={audio} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.audio}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("live2d")}>
                    <img className="sortbar-dropdown-img" src={live2d} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.live2d}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("model")}>
                    <img className="sortbar-dropdown-img" src={model} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.model}</span>
                </div>
            </div>
            <div className={`dropdown ${activeDropdown === "rating" ? "" : "hide-dropdown"}`} 
            style={{marginLeft: getRatingMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("all")}>
                    <img className="sortbar-dropdown-img rotate" src={all} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                </div>
                {session.showR18 ?
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("all+h")}>
                    <img className="sortbar-dropdown-img rotate" src={allH}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-dropdown-text">{i18n.sortbar.rating.allH}</span>
                </div> : null}
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("cute")}>
                    <img className="sortbar-dropdown-img" src={cute} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.cute}</span>
                </div>
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => setRatingType("hot")}>
                    <img className="sortbar-dropdown-img" src={hot} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.hot}</span>
                </div> : null}
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => setRatingType("erotic")}>
                    <img className="sortbar-dropdown-img" src={erotic} style={{filter: getFilter()}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.erotic}</span>
                </div> : null}
                {session.showR18 ?
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("hentai")}>
                    <img className="sortbar-dropdown-img" src={hentai}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-dropdown-text">{i18n.sortbar.rating.hentai}</span>
                </div> : null}
            </div>
            <div className={`dropdown ${activeDropdown === "style" ? "" : "hide-dropdown"}`} 
            style={{marginLeft: getStyleMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                {styleDropdownJSX()}
            </div>
            <div className={`dropdown-right ${activeDropdown === "page-multiplier" ? "" : "hide-dropdown"}`} 
            style={{marginRight: getPageMultiplierMargin(), top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setPageMultiplier(1)}>
                    <span className="sortbar-dropdown-text">1x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setPageMultiplier(2)}>
                    <span className="sortbar-dropdown-text">2x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setPageMultiplier(3)}>
                    <span className="sortbar-dropdown-text">3x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setPageMultiplier(4)}>
                    <span className="sortbar-dropdown-text">4x</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setPageMultiplier(5)}>
                    <span className="sortbar-dropdown-text">5x</span>
                </div>
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
                    <span className="sortbar-dropdown-text">{i18n.sortbar.size.tiny}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("small")}>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.size.small}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("medium")}>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.size.medium}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("large")}>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.size.large}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setSizeType("massive")}>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.size.massive}</span>
                </div>
            </div>
            <div className={`dropdown-right ${activeDropdown === "sort" ? "" : "hide-dropdown"}`} 
            style={{marginRight: getSortMargin(), top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                {mobile ? 
                <div className="sortbar-dropdown-row" onClick={() => setSortReverse(!sortReverse)}>
                    <span className="sortbar-dropdown-text">{i18n.sort.reverse}</span>
                </div> : null}
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("random")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.random}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("date")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.date}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("posted")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.posted}</span>
                </div>
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => changeSortType("bookmarks")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.bookmarks} ★</span>
                </div> : null}
                {session.username ? <>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("favorites")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.favorites} ✧</span>
                </div>
                </> : null}
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("popularity")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.popularity}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("cuteness")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.cuteness}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("variations")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.variations}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("parent")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.parent}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("child")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.child}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("groups")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.groups}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("tagcount")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.tagcount}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("filesize")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.filesize}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("aspectRatio")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.aspectRatio}</span>
                </div>
                {permissions.isMod(session) ? <>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("hidden")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.hidden}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("locked")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.locked}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("private")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.private}</span>
                </div>
                </> : null}
            </div>
            <Filters active={activeDropdown === "filters"} right={getFiltersMargin()} top={dropTop}/>
        </div>
        </>
    )
}

export default SortBar