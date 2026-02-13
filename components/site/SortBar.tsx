import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, 
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, useFlagActions, useMiscDialogActions, 
useInteractionSelector, useSessionActions, usePostDialogActions, useGroupDialogActions, useActiveSelector,
usePageSelector, useCacheSelector, useActiveActions, useLayoutActions, useMiscDialogSelector, usePostDialogSelector, 
useGroupDialogSelector, useCacheActions} from "../../store"

import leftArrow from "../../assets/svg/left-arrow.svg"
import rightArrow from "../../assets/svg/right-arrow.svg"
import upArrow from "../../assets/svg/up-arrow.svg"
import downArrow from "../../assets/svg/down-arrow.svg"
import upload from "../../assets/svg/upload.svg"
import download from "../../assets/svg/download.svg"
import bulk from "../../assets/svg/bulk.svg"
import all from "../../assets/svg/all.svg"
import checkbox from "../../assets/svg/checkbox2.svg"
import checkboxChecked from "../../assets/svg/checkbox2-checked.svg"
import autoscrollSVG from "../../assets/svg/autoscroll.svg"
import scrollSVG from "../../assets/svg/scroll.svg"
import pagesSVG from "../../assets/svg/pages.svg"
import squareSVG from "../../assets/svg/square.svg"
import reverseSVG from "../../assets/svg/reverse-thin.svg"
import speedSVG from "../../assets/svg/speed-thin.svg"
import filters from "../../assets/svg/filters.svg"
import size from "../../assets/svg/size.svg"
import sort from "../../assets/svg/sort.svg"
import sortRev from "../../assets/svg/sort-reverse.svg"
import select from "../../assets/svg/select.svg"
import selectOn from "../../assets/svg/select-on.svg"
import star from "../../assets/svg/star.svg"
import starGroup from "../../assets/svg/stargroup.svg"
import tag from "../../assets/svg/tag.svg"
import group from "../../assets/svg/group.svg"
import deleteSVG from "../../assets/svg/delete.svg"
import left from "../../assets/svg/left.svg"
import right from "../../assets/svg/right.svg"
import reset from "../../assets/svg/reset.svg"

import image from "../../assets/svg/image.svg"
import animation from "../../assets/svg/animation.svg"
import video from "../../assets/svg/video.svg"
import comic from "../../assets/svg/comic.svg"
import live2d from "../../assets/svg/live2d.svg"
import model from "../../assets/svg/model.svg"
import audio from "../../assets/svg/music.svg"

import cute from "../../assets/svg/cute.svg"
import sexy from "../../assets/svg/sexy.svg"
import erotic from "../../assets/svg/erotic.svg"
import lewd from "../../assets/svg/lewd.svg"

import $2d from "../../assets/svg/2d.svg"
import $3d from "../../assets/svg/3d.svg"
import pixel from "../../assets/svg/pixel.svg"
import chibi from "../../assets/svg/chibi.svg"
import daki from "../../assets/svg/daki.svg"
import sketch from "../../assets/svg/sketch.svg"
import lineart from "../../assets/svg/lineart.svg"
import promo from "../../assets/svg/promo.svg"

import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import Filters from "../../ui/Filters"
import {PostSort} from "../../types/Types"
import "./styles/sortbar.less"

let interval = null as any

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
    const {scroll, square, imageType, ratingType, styleType, sizeType, sortType, sortReverse, selectionMode, 
    pageMultiplier, selectionItems, showChildren, autoScroll} = useSearchSelector()
    const {setScroll, setImageType, setRatingType, setStyleType, setSizeType, setSortType, setSortReverse, 
    setSelectionMode, setPageMultiplier, setSquare, setSearchFlag, setShowChildren, setAutoScroll} = useSearchActions()
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

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    const getIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sortbarIcons")
    }

    const getPinkIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "#ff47d4")
    }

    const getRedIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--r18Color")
    }

    const getBlueIcon = (icon: string) => {
        return functions.color.colorizeSVG(icon, "--sketchColor")
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
                    <img className="sortbar-img" src={getIcon(image)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.image}</span>
                </div>
            )
        } else if (imageType === "animation") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(animation)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.animation}</span>
                </div>
            )
        } else if (imageType === "video") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(video)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.video}</span>
                </div>
            )
        } else if (imageType === "comic") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(comic)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.comic}</span>
                </div>
            )
        } else if (imageType === "model") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={getIcon(model)} style={{filter}}/>
                        <span className="sortbar-text">{i18n.sortbar.type.model}</span>
                    </div>
                )
        } else if (imageType === "live2d") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(live2d)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.type.live2d}</span>
                </div>
            )
        } else if (imageType === "audio") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={getIcon(audio)} style={{filter}}/>
                        <span className="sortbar-text">{i18n.sortbar.type.audio}</span>
                    </div>
                )
        } else {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getIcon(all)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
                </div>
            )
        }
    }

    const getMobileImageJSX = () => {
        if (imageType === "image") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(image)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "animation") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(animation)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "video") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(video)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "comic") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(comic)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "model") {
                return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(model)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "live2d") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(live2d)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else if (imageType === "audio") {
                    return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(audio)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter}} className="sortbar-img rotate" src={getIcon(all)} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}/>
        }
    }

    const getImageMargin = () => {
        if (mobile) return "40px"
        const rect = imageRef.current?.getBoundingClientRect()
        if (!rect) return "290px"
        const raw = rect.x
        let offset = 0
        if (imageType === "all") offset = -40
        if (imageType === "image") offset = -30
        if (imageType === "animation") offset = -10
        if (imageType === "video") offset = -25
        if (imageType === "comic") offset = -25
        if (imageType === "audio") offset = -25
        if (imageType === "model") offset = -25
        if (imageType === "live2d") offset = -25
        return `${raw + offset}px`
    }

    const getRatingJSX = () => {
        if (ratingType === "cute") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(cute)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.rating.cute}</span>
                </div>
            )
        } else if (ratingType === "sexy") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(sexy)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.rating.sexy}</span>
                </div>
            )
        } else if (ratingType === "erotic") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(erotic)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.rating.erotic}</span>
                </div>
            )
        } else if (ratingType === "lewd") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getRedIcon(lewd)}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-text">{i18n.sortbar.rating.lewd}</span>
                </div>
            )
        } else if (ratingType === "all+l") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getRedIcon(all)}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-text">{i18n.sortbar.rating.allL}</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getIcon(all)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
                </div>
            )
        }
    }

    const getMobileRatingJSX = () => {
        if (ratingType === "cute") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(cute)} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "sexy") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(sexy)} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "erotic") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(erotic)} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "lewd") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getRedIcon(lewd)} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else if (ratingType === "all+l") {
            return <img style={{height: "30px"}} className="sortbar-img rotate" src={getRedIcon(all)} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter}} className="sortbar-img rotate" src={getIcon(all)} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}/>
        }
    }

    const getRatingMargin = () => {
        if (mobile) return "90px"
        const rect = ratingRef.current?.getBoundingClientRect()
        if (!rect) return "325px"
        const raw = rect.x
        let offset = 0
        if (ratingType === "all") offset = -25
        if (ratingType === "all+l") offset = -10
        if (ratingType === "cute") offset = -10
        if (ratingType === "sexy") offset = -10
        if (ratingType === "erotic") offset = -5
        if (ratingType === "lewd") offset = -10
        if (!session.username) offset += 0
        return `${raw + offset}px`
    }

    const getStyleJSX = () => {
        if (styleType === "2d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon($2d)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.style["2d"]}</span>
                </div>
            )
        } else if (styleType === "3d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon($3d)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.style["3d"]}</span>
                </div>
            )
        } else if (styleType === "pixel") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(pixel)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.style.pixel}</span>
                </div>
            )
        } else if (styleType === "chibi") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getIcon(chibi)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.sortbar.style.chibi}</span>
                </div>
            )
        } else if (styleType === "daki") {
                return (
                    <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                        <img className="sortbar-img" src={getIcon(daki)} style={{filter}}/>
                        <span className="sortbar-text">{i18n.sortbar.style.daki}</span>
                    </div>
                )
        } else if (styleType === "promo") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getBlueIcon(promo)}/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.promo}</span>
                </div>
            )
        } else if (styleType === "sketch") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getBlueIcon(sketch)}/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.sketch}</span>
                </div>
            )
        } else if (styleType === "lineart") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img" src={getBlueIcon(lineart)}/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.lineart}</span>
                </div>
            )
        } else if (styleType === "all+s") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getBlueIcon(all)}/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.allS}</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <img className="sortbar-img rotate" src={getIcon(all)} style={{filter}}/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
                </div>
            )
        }
    }

    const getMobileStyleJSX = () => {
        if (styleType === "2d") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon($2d)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "3d") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon($3d)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "pixel") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(pixel)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "chibi") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(chibi)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "daki") {
            return <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(daki)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "sketch") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getBlueIcon(sketch)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "lineart") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getBlueIcon(lineart)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "promo") {
            return <img style={{height: "30px"}} className="sortbar-img" src={getBlueIcon(promo)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else if (styleType === "all+s") {
            return <img style={{height: "30px"}} className="sortbar-img rotate" src={getBlueIcon(all)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        } else {
            return <img style={{height: "30px", filter}} className="sortbar-img rotate" src={getIcon(all)} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}/>
        }
    }

    const getStyleMargin = () => {
        if (mobile) return "115px"
        const rect = styleRef.current?.getBoundingClientRect()
        if (!rect) return "395px"
        const raw = rect.x
        let offset = 0
        if (styleType === "all") offset = -25
        if (styleType === "all+s") offset = -15
        if (styleType === "2d") offset = -25
        if (styleType === "3d") offset = -25
        if (styleType === "pixel") offset = -15
        if (styleType === "chibi") offset = -15
        if (styleType === "daki") offset = -15
        if (styleType === "sketch") offset = -10
        if (styleType === "lineart") offset = -5
        if (styleType === "promo") offset = -10
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
                <img className="sortbar-img" src={getIcon(size)} style={{filter}}/>
                <span className="sortbar-text">{i18n.sortbar.size[sizeType]}</span>
            </div>
        )
    }

    const getSizeMargin = () => {
        const rect = sizeRef.current?.getBoundingClientRect()
        if (!rect || mobile) return "25px"
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
        if (!rect || mobile) return "185px"
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
                <img className="sortbar-img" src={sortIcon()} style={{filter}} onClick={() => setSortReverse(!sortReverse)}/>
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
                        <img className="sortbar-dropdown-img rotate" src={getIcon(all)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={getIcon($3d)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["3d"]}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={getIcon(chibi)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.chibi}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={getIcon(pixel)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                </>
            )
            
        } else if (imageType === "audio") {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={getIcon(all)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all+s")}>
                        <img className="sortbar-dropdown-img rotate" src={getBlueIcon(all)} style={{filter}}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.allS}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={getIcon($2d)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["2d"]}</span>
                    </div> 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={getIcon(pixel)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("sketch")}>
                        <img className="sortbar-dropdown-img" src={getBlueIcon(sketch)}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.sketch}</span>
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <img className="sortbar-dropdown-img rotate" src={getIcon(all)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all+s")}>
                        <img className="sortbar-dropdown-img rotate" src={getBlueIcon(all)} style={{filter}}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.allS}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <img className="sortbar-dropdown-img" src={getIcon($2d)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["2d"]}</span>
                    </div>
                    {imageType !== "live2d" ? <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <img className="sortbar-dropdown-img" src={getIcon($3d)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["3d"]}</span>
                    </div> : null}
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <img className="sortbar-dropdown-img" src={getIcon(chibi)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.chibi}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <img className="sortbar-dropdown-img" src={getIcon(pixel)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                    {imageType !== "comic" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("daki")}>
                        <img className="sortbar-dropdown-img" src={getIcon(daki)} style={{filter}}/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.daki}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("promo")}>
                        <img className="sortbar-dropdown-img" src={getBlueIcon(promo)}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.promo}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("sketch")}>
                        <img className="sortbar-dropdown-img" src={getBlueIcon(sketch)}/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.sketch}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("lineart")}>
                        <img className="sortbar-dropdown-img" src={getBlueIcon(lineart)}/>
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

    useEffect(() => {
        window.clearInterval(interval)
        const scrollLoop = async () => {
            window.scrollBy(0, 10)
        }
        const stopScroll = () => {
            setAutoScroll(false)
        }
        if (autoScroll) {
            interval = window.setInterval(scrollLoop, 10)
            setTimeout(() => window.addEventListener("click", stopScroll), 0)
        }
        return () => {
            window.clearInterval(interval)
            window.removeEventListener("click", stopScroll)
        }
    }, [autoScroll])

    const sidebarArrowIcon = () => {
        return hideSidebar ? getIcon(rightArrow) : getIcon(leftArrow)
    }

    const titlebarArrowIcon = () => {
        return hideTitlebar ? getIcon(downArrow) : getIcon(upArrow)
    }

    const childIcon = () => {
        return showChildren ? getIcon(checkboxChecked) : getIcon(checkbox)
    }

    const pageModeIcon = () => {
        return scroll ? getIcon(scrollSVG) : getIcon(pagesSVG)
    }

    const sortIcon = () => {
        return sortReverse ? getIcon(sortRev) : getIcon(sort)
    }

    const selectIcon = () => {
        return selectionMode ? getIcon(selectOn) : getIcon(select)
    }
 
    let sortBarJSX = () => {
        if (mobile) return (
            <div className={`mobile-sortbar ${relative ? "mobile-sortbar-relative" : ""} ${mobileScrolling ? "hide-mobile-sortbar" : ""}`}>
                <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(upload)} onClick={() => navigate("/upload")}/>
                <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(download)} onClick={bulkDownload}/>
                {getMobileImageJSX()}
                {getMobileRatingJSX()}
                {getMobileStyleJSX()}
                <span className="sortbar-text-alt" style={{filter}} onClick={() => togglePageMultiplierDrop()}>{pageMultiplier}x</span>
                <img style={{height: "30px", filter}} className="sortbar-img" src={pageModeIcon()} onClick={() => toggleScroll()}/>
                <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(squareSVG)} onClick={() => toggleSquare()}/>
                <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(filters)} onClick={() => toggleFilterDrop()}/>
                <img style={{height: "30px", filter}} className="sortbar-img" src={getIcon(size)} onClick={() => {setActiveDropdown(activeDropdown === "size" ? "none" : "size"); setFilterDropActive(false)}}/>
                <img style={{height: "30px", filter}} className="sortbar-img" src={sortIcon()} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}/>
            </div>
        )
        
        return (
            <div className={`sortbar ${hideSortbar ? "hide-sortbar" : ""} ${hideTitlebar ? "sortbar-top" : ""} 
            ${hideSortbar && hideTitlebar && hideSidebar ? "translate-sortbar" : ""}`}
            onMouseEnter={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)}>
                <div className="sortbar-left">
                    <div className="sortbar-item">
                        <img className="sortbar-img" src={sidebarArrowIcon()} style={{filter}} onClick={() => hideTheSidebar()}/>
                    </div>
                    <div className="sortbar-item">
                        <img className="sortbar-img" src={titlebarArrowIcon()} style={{filter}} onClick={() => hideTheTitlebar()}/>
                    </div>
                    <Link to="/upload" className="sortbar-item">
                        <img className="sortbar-img" src={getIcon(upload)} style={{filter}}/>
                        <span className="sortbar-text">{i18n.buttons.upload}</span>
                    </Link>
                    <div className="sortbar-item" onClick={bulkDownload}>
                        <img className="sortbar-img" src={getIcon(download)} style={{filter}}/>
                        <span className="sortbar-text">{i18n.buttons.download}</span>
                    </div>
                    {!tablet && permissions.isAdmin(session) ?
                    <Link to="/bulk-upload" className="sortbar-item">
                        <img className="sortbar-img" src={getIcon(bulk)} style={{filter}}/>
                        <span className="sortbar-text">{i18n.sortbar.bulk}</span>
                    </Link> : null}
                    {imageType !== "all" || styleType !== "all" || ratingType !== "all" ?
                    <div className="sortbar-item" onClick={() => resetAll()}>
                        <img className="sortbar-img-small" src={getIcon(reset)} style={{filter}}/>
                    </div> : null}
                    {getImageJSX()}
                    {getRatingJSX()}
                    {getStyleJSX()}
                    <div className="sortbar-item" onClick={() => toggleShowChildren()}>
                        <img className="sortbar-img" src={childIcon()} style={{filter}}/>
                        <span className="sortbar-text">{i18n.sort.child}</span> 
                    </div>
                </div>
                <div className="sortbar-right">
                    {permissions.isAdmin(session) && selectionMode ? 
                    <div className="sortbar-item" style={{filter: "hue-rotate(-5deg)"}} onClick={bulkDelete}>
                        <img className="sortbar-img" src={getIcon(deleteSVG)} style={{filter}}/>
                    </div> : null}
                    {permissions.isAdmin(session) && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkTagEdit}>
                        <img className="sortbar-img" src={getIcon(tag)} style={{filter}}/>
                    </div> : null}
                    {permissions.isContributor(session) && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkGroup}>
                        <img className="sortbar-img" src={getIcon(group)} style={{filter}}/>
                    </div> : null}
                    {session.username && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkFavgroup}>
                        <img className="sortbar-img" src={getIcon(starGroup)} style={{filter}}/>
                    </div> : null}
                    {session.username && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkFavorite}>
                        <img className="sortbar-img" src={getIcon(star)} style={{filter}}/>
                    </div> : null}
                    {session.username ? 
                    <div className="sortbar-item" onClick={() => setSelectionMode(!selectionMode)}>
                        <img className="sortbar-img" src={selectIcon()} style={{filter}}/>
                    </div> : null}
                    {!scroll ? <>
                    <div className="sortbar-item" style={{marginRight: "5px"}} onClick={previousPage}>
                        <img className="sortbar-img" src={getIcon(left)} style={{filter}}/>
                    </div>
                    <div className="sortbar-item" onClick={nextPage}>
                        <img className="sortbar-img" src={getIcon(right)} style={{filter}}/>
                    </div>
                    <div className="sortbar-item" ref={pageMultiplierRef} onClick={() => togglePageMultiplierDrop()}>
                        <span className="sortbar-text-alt" style={{filter}}>{pageMultiplier}x</span>
                    </div>
                    </> : null}
                    {scroll ? <>
                    <div className="sortbar-item" onClick={() => setAutoScroll(!autoScroll)}>
                        <img className="sortbar-img" src={autoScroll ? getPinkIcon(autoscrollSVG) : getIcon(autoscrollSVG)} style={{filter}}/>
                    </div>
                    </> : null}
                    <div className="sortbar-item" onClick={() => toggleScroll()}>
                        <img className="sortbar-img" src={pageModeIcon()} style={{filter}}/>
                        {!tablet ? <span className="sortbar-text-alt" style={{filter}}>{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span> : null}
                    </div>
                    <div className="sortbar-item" onClick={() => toggleSquare()}>
                        <img className="sortbar-img" src={getIcon(squareSVG)} style={{filter}}/>
                    </div>
                    <div className="sortbar-item" onClick={() => setReverse(!reverse)}>
                        {reverse ? <>
                        <img className="sortbar-img" src={getIcon(reverseSVG)} style={{transform: "scaleX(-1)", filter}}/>
                        </> : <>
                        <img className="sortbar-img" src={getIcon(reverseSVG)} style={{filter}}/>
                        </>}
                    </div>
                    <div className="sortbar-item" ref={speedRef} onClick={() => toggleSpeedDrop()}>
                        <img className="sortbar-img" src={getIcon(speedSVG)} style={{filter}}/>
                    </div>
                    <div className="sortbar-item" ref={filterRef} onClick={() => toggleFilterDrop()}>
                        <img className="sortbar-img" src={getIcon(filters)} style={{filter}}/>
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
                    <img className="sortbar-dropdown-img rotate" src={getIcon(all)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("image")}>
                    <img className="sortbar-dropdown-img" src={getIcon(image)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.image}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("animation")}>
                    <img className="sortbar-dropdown-img" src={getIcon(animation)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.animation}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("video")}>
                    <img className="sortbar-dropdown-img" src={getIcon(video)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.video}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("comic")}>
                    <img className="sortbar-dropdown-img" src={getIcon(comic)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.comic}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("audio")}>
                    <img className="sortbar-dropdown-img" src={getIcon(audio)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.audio}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("live2d")}>
                    <img className="sortbar-dropdown-img" src={getIcon(live2d)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.live2d}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("model")}>
                    <img className="sortbar-dropdown-img" src={getIcon(model)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.model}</span>
                </div>
            </div>
            <div className={`dropdown ${activeDropdown === "rating" ? "" : "hide-dropdown"}`} 
            style={{marginLeft: getRatingMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("all")}>
                    <img className="sortbar-dropdown-img rotate" src={getIcon(all)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                </div>
                {session.showR18 ?
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("all+l")}>
                    <img className="sortbar-dropdown-img rotate" src={getRedIcon(all)}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-dropdown-text">{i18n.sortbar.rating.allL}</span>
                </div> : null}
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("cute")}>
                    <img className="sortbar-dropdown-img" src={getIcon(cute)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.cute}</span>
                </div>
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => setRatingType("sexy")}>
                    <img className="sortbar-dropdown-img" src={getIcon(sexy)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.sexy}</span>
                </div> : null}
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => setRatingType("erotic")}>
                    <img className="sortbar-dropdown-img" src={getIcon(erotic)} style={{filter}}/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.erotic}</span>
                </div> : null}
                {session.showR18 ?
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("lewd")}>
                    <img className="sortbar-dropdown-img" src={getRedIcon(lewd)}/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-dropdown-text">{i18n.sortbar.rating.lewd}</span>
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