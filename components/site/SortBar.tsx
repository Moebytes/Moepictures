/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, 
useThemeSelector, useSearchSelector, useSessionSelector, useSearchActions, useFlagActions, useMiscDialogActions, 
useInteractionSelector, useSessionActions, usePostDialogActions, useGroupDialogActions, useActiveSelector,
usePageSelector, useCacheSelector, useActiveActions, useLayoutActions, useMiscDialogSelector, usePostDialogSelector, 
useGroupDialogSelector, useCacheActions} from "../../store"

import LeftArrowIcon from "../../assets/svg/left-arrow.svg"
import RightArrowIcon from "../../assets/svg/right-arrow.svg"
import UpArrowIcon from "../../assets/svg/up-arrow.svg"
import DownArrowIcon from "../../assets/svg/down-arrow.svg"
import UploadIcon from "../../assets/svg/upload.svg"
import DownloadIcon from "../../assets/svg/download.svg"
import BulkIcon from "../../assets/svg/bulk.svg"
import AllIcon from "../../assets/svg/all.svg"
import CheckboxIcon from "../../assets/svg/checkbox2.svg"
import CheckboxCheckedIcon from "../../assets/svg/checkbox2-checked.svg"
import AutoscrollIcon from "../../assets/svg/autoscroll.svg"
import ScrollIcon from "../../assets/svg/scroll.svg"
import PagesIcon from "../../assets/svg/pages.svg"
import SquareIcon from "../../assets/svg/square.svg"
import ReverseIcon from "../../assets/svg/reverse-thin.svg"
import SpeedIcon from "../../assets/svg/speed-thin.svg"
import FiltersIcon from "../../assets/svg/filters.svg"
import SizeIcon from "../../assets/svg/size.svg"
import SortIcon from "../../assets/svg/sort.svg"
import SortReverseIcon from "../../assets/svg/sort-reverse.svg"
import SelectIcon from "../../assets/svg/select.svg"
import SelectOnIcon from "../../assets/svg/select-on.svg"
import StarIcon from "../../assets/svg/star.svg"
import StarGroupIcon from "../../assets/svg/stargroup.svg"
import TagIcon from "../../assets/svg/tag.svg"
import GroupIcon from "../../assets/svg/group.svg"
import DeleteIcon from "../../assets/svg/delete.svg"
import LeftIcon from "../../assets/svg/left.svg"
import RightIcon from "../../assets/svg/right.svg"
import ResetIcon from "../../assets/svg/reset.svg"

import ImageIcon from "../../assets/svg/image.svg"
import AnimationIcon from "../../assets/svg/animation.svg"
import VideoIcon from "../../assets/svg/video.svg"
import ComicIcon from "../../assets/svg/comic.svg"
import Live2dIcon from "../../assets/svg/live2d.svg"
import ModelIcon from "../../assets/svg/model.svg"
import AudioIcon from "../../assets/svg/music.svg"

import CuteIcon from "../../assets/svg/cute.svg"
import SexyIcon from "../../assets/svg/sexy.svg"
import EroticIcon from "../../assets/svg/erotic.svg"
import LewdIcon from "../../assets/svg/lewd.svg"

import $2dIcon from "../../assets/svg/2d.svg"
import $3dIcon from "../../assets/svg/3d.svg"
import PixelIcon from "../../assets/svg/pixel.svg"
import ChibiIcon from "../../assets/svg/chibi.svg"
import DakiIcon from "../../assets/svg/daki.svg"
import SketchIcon from "../../assets/svg/sketch.svg"
import LineartIcon from "../../assets/svg/lineart.svg"
import PromoIcon from "../../assets/svg/promo.svg"

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
    const {setActiveDropdown, setFilterDropActive, setActionBanner} = useActiveActions()
    const {reverse} = usePlaybackSelector()
    const {setReverse, setSpeed} = usePlaybackActions()
    const {scroll, square, imageType, ratingType, styleType, sizeType, sortType, sortReverse, selectionMode, 
    pageMultiplier, selectionItems, selectionPosts, showChildren, autoScroll} = useSearchSelector()
    const {setScroll, setImageType, setRatingType, setStyleType, setSizeType, setSortType, setSortReverse, 
    setSelectionMode, setPageMultiplier, setSquare, setSearchFlag, setShowChildren, setAutoScroll,
    setSelectionItems, setSelectionPosts} = useSearchActions()
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
                    <ImageIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.type.image}</span>
                </div>
            )
        } else if (imageType === "animation") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <AnimationIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.type.animation}</span>
                </div>
            )
        } else if (imageType === "video") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <VideoIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.type.video}</span>
                </div>
            )
        } else if (imageType === "comic") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <ComicIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.type.comic}</span>
                </div>
            )
        } else if (imageType === "model") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <ModelIcon className="sortbar-img"/>
                        <span className="sortbar-text">{i18n.sortbar.type.model}</span>
                    </div>
                )
        } else if (imageType === "live2d") {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <Live2dIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.type.live2d}</span>
                </div>
            )
        } else if (imageType === "audio") {
                return (
                    <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                        <AudioIcon className="sortbar-img"/>
                        <span className="sortbar-text">{i18n.sortbar.type.audio}</span>
                    </div>
                )
        } else {
            return (
                <div className="sortbar-item" ref={imageRef} onClick={() => {setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)}}>
                    <AllIcon className="sortbar-img rotate"/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
                </div>
            )
        }
    }

    const getMobileImageJSX = () => {
        const onClick = () => {
            setActiveDropdown(activeDropdown === "image" ? "none" : "image"); setFilterDropActive(false)
        }
        if (imageType === "image") {
            return <ImageIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (imageType === "animation") {
            return <AnimationIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (imageType === "video") {
            return <VideoIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (imageType === "comic") {
            return <ComicIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (imageType === "model") {
            return <ModelIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (imageType === "live2d") {
            return <Live2dIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (imageType === "audio") {
            return <AudioIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else {
            return <AllIcon className="sortbar-img rotate" style={{height: "30px"}} onClick={onClick}/>
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
        if (!session.username) offset += 20
        return `${raw + offset}px`
    }

    const getRatingJSX = () => {
        if (ratingType === "cute") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <CuteIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.rating.cute}</span>
                </div>
            )
        } else if (ratingType === "sexy") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <SexyIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.rating.sexy}</span>
                </div>
            )
        } else if (ratingType === "erotic") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <EroticIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.rating.erotic}</span>
                </div>
            )
        } else if (ratingType === "lewd") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <LewdIcon className="sortbar-img-red"/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-text">{i18n.sortbar.rating.lewd}</span>
                </div>
            )
        } else if (ratingType === "all+l") {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <AllIcon className="sortbar-img-red rotate"/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-text">{i18n.sortbar.rating.allL}</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={ratingRef} onClick={() => {setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)}}>
                    <AllIcon className="sortbar-img rotate"/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
                </div>
            )
        }
    }

    const getMobileRatingJSX = () => {
        const onClick = () => {
            setActiveDropdown(activeDropdown === "rating" ? "none" : "rating"); setFilterDropActive(false)
        }
        if (ratingType === "cute") {
            return <CuteIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (ratingType === "sexy") {
            return <SexyIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (ratingType === "erotic") {
            return <EroticIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (ratingType === "lewd") {
            return <LewdIcon className="sortbar-img-red" style={{height: "30px"}} onClick={onClick}/>
        } else if (ratingType === "all+l") {
            return <AllIcon className="sortbar-img-red rotate" style={{height: "30px"}} onClick={onClick}/>
        } else {
            return <AllIcon className="sortbar-img rotate" style={{height: "30px"}} onClick={onClick}/>
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
        if (!session.username) offset += 10
        return `${raw + offset}px`
    }

    const getStyleJSX = () => {
        if (styleType === "2d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <$2dIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.style["2d"]}</span>
                </div>
            )
        } else if (styleType === "3d") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <$3dIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.style["3d"]}</span>
                </div>
            )
        } else if (styleType === "pixel") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <PixelIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.style.pixel}</span>
                </div>
            )
        } else if (styleType === "chibi") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <ChibiIcon className="sortbar-img"/>
                    <span className="sortbar-text">{i18n.sortbar.style.chibi}</span>
                </div>
            )
        } else if (styleType === "daki") {
                return (
                    <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                        <DakiIcon className="sortbar-img"/>
                        <span className="sortbar-text">{i18n.sortbar.style.daki}</span>
                    </div>
                )
        } else if (styleType === "promo") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <PromoIcon className="sortbar-img-blue"/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.promo}</span>
                </div>
            )
        } else if (styleType === "sketch") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <SketchIcon className="sortbar-img-blue"/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.sketch}</span>
                </div>
            )
        } else if (styleType === "lineart") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <LineartIcon className="sortbar-img-blue"/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.lineart}</span>
                </div>
            )
        } else if (styleType === "all+s") {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <AllIcon className="sortbar-img-blue rotate"/>
                    <span style={{color: "var(--sketchColor)"}} className="sortbar-text">{i18n.sortbar.style.allS}</span>
                </div>
            )
        } else {
            return (
                <div className="sortbar-item" ref={styleRef} onClick={() => {setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)}}>
                    <AllIcon className="sortbar-img rotate"/>
                    <span className="sortbar-text">{i18n.tag.all}</span>
                </div>
            )
        }
    }

    const getMobileStyleJSX = () => {
        const onClick = () => {
            setActiveDropdown(activeDropdown === "style" ? "none" : "style"); setFilterDropActive(false)
        }
        if (styleType === "2d") {
            return <$2dIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "3d") {
            return <$3dIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "pixel") {
            return <PixelIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "chibi") {
            return <ChibiIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "daki") {
            return <DakiIcon className="sortbar-img" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "sketch") {
            return <SketchIcon className="sortbar-img-blue" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "lineart") {
            return <LineartIcon className="sortbar-img-blue" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "promo") {
            return <PromoIcon className="sortbar-img-blue" style={{height: "30px"}} onClick={onClick}/>
        } else if (styleType === "all+s") {
            return <AllIcon className="sortbar-img-blue rotate" style={{height: "30px"}} onClick={onClick}/>
        } else {
            return <AllIcon className="sortbar-img rotate" style={{height: "30px"}} onClick={onClick}/>
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
                <SizeIcon className="sortbar-img"/>
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
            if (sortType === "bookmarks") return `${i18n.sort.bookmarks}`
            if (sortType === "favorites") return `${i18n.sort.favorites}`
            return i18n.sort[sortType]
        }
        return (
            <div className="sortbar-item" ref={sortRef}>
                {sortReverse ? 
                <SortReverseIcon className="sortbar-img" onClick={() => setSortReverse(!sortReverse)}/> :
                <SortIcon className="sortbar-img" onClick={() => setSortReverse(!sortReverse)}/>}
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
        if (!session.username) {
            return setActionBanner("login-required")
        }
        if (permissions.isPremium(session)) {
            const newValue = activeDropdown === "filters" ? "none" : "filters"
            setActiveDropdown(newValue)
            setFilterDropActive(newValue === "filters")
        } else {
            setPremiumRequired(true)
        }
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
                        <AllIcon className="sortbar-dropdown-img rotate"/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <$3dIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["3d"]}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <ChibiIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.chibi}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <PixelIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                </>
            )
            
        } else if (imageType === "audio") {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <AllIcon className="sortbar-dropdown-img rotate"/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all+s")}>
                        <AllIcon className="sortbar-dropdown-img-blue rotate"/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.allS}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <$2dIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["2d"]}</span>
                    </div> 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <PixelIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("sketch")}>
                        <SketchIcon className="sortbar-dropdown-img-blue"/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.sketch}</span>
                    </div>
                </>
            )
        } else {
            return (
                <>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all")}>
                        <AllIcon className="sortbar-dropdown-img rotate"/>
                        <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("all+s")}>
                        <AllIcon className="sortbar-dropdown-img-blue rotate"/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.allS}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("2d")}>
                        <$2dIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["2d"]}</span>
                    </div>
                    {imageType !== "live2d" ? <div className="sortbar-dropdown-row" onClick={() => setStyleType("3d")}>
                        <$3dIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style["3d"]}</span>
                    </div> : null}
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("chibi")}>
                        <ChibiIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.chibi}</span>
                    </div>
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("pixel")}>
                        <PixelIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.pixel}</span>
                    </div>
                    {imageType !== "comic" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("daki")}>
                        <DakiIcon className="sortbar-dropdown-img"/>
                        <span className="sortbar-dropdown-text">{i18n.sortbar.style.daki}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("promo")}>
                        <PromoIcon className="sortbar-dropdown-img-blue"/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.promo}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("sketch")}>
                        <SketchIcon className="sortbar-dropdown-img-blue"/>
                        <span style={{color: "var(--sketchColor)"}} className="sortbar-dropdown-text">{i18n.sortbar.style.sketch}</span>
                    </div> : null}
                    {imageType !== "live2d" ? 
                    <div className="sortbar-dropdown-row" onClick={() => setStyleType("lineart")}>
                        <LineartIcon className="sortbar-dropdown-img-blue"/>
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
        selectionItems.clear()
        selectionPosts.clear()
        setSelectionItems(selectionItems)
        setSelectionPosts(selectionPosts)
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
            selectionItems.clear()
            selectionPosts.clear()
            setSelectionItems(selectionItems)
            setSelectionPosts(selectionPosts)
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
        if (permissions.isPremium(session)) {
            setBulkFavGroupDialog(!bulkFavGroupDialog)
        } else {
            setPremiumRequired(true)
        }
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

    const toggleAutoScroll = () => {
        if (!session.username) {
            return setActionBanner("login-required")
        }
        if (permissions.isPremium(session)) {
            setAutoScroll(!autoScroll)
        } else {
            setPremiumRequired(true)
        }
    }
 
    let sortBarJSX = () => {
        if (mobile) return (
            <div className={`mobile-sortbar ${relative ? "mobile-sortbar-relative" : ""} ${mobileScrolling ? "hide-mobile-sortbar" : ""}`}>
                <UploadIcon className="sortbar-img" style={{height: "30px"}} onClick={() => navigate("/upload")}/>
                <DownloadIcon className="sortbar-img" style={{height: "30px"}} onClick={bulkDownload}/>
                {getMobileImageJSX()}
                {getMobileRatingJSX()}
                {getMobileStyleJSX()}
                <span className="sortbar-text-alt" onClick={() => togglePageMultiplierDrop()}>{pageMultiplier}x</span>
                {scroll ? 
                <ScrollIcon className="sortbar-img" style={{height: "30px"}} onClick={() => toggleScroll()}/> :
                <PagesIcon className="sortbar-img" style={{height: "30px"}} onClick={() => toggleScroll()}/>}
                <SquareIcon className="sortbar-img" style={{height: "30px"}} onClick={() => toggleSquare()}/>
                <FiltersIcon className="sortbar-img" style={{height: "30px"}} onClick={() => toggleFilterDrop()}/>
                <SizeIcon className="sortbar-img" style={{height: "30px"}} onClick={() => {setActiveDropdown(activeDropdown === "size" ? "none" : "size"); setFilterDropActive(false)}}/>
                {sortReverse ? 
                <SortReverseIcon className="sortbar-img" style={{height: "30px"}} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}/> :
                <SortIcon className="sortbar-img" style={{height: "30px"}} onClick={() => {setActiveDropdown(activeDropdown === "sort" ? "none" : "sort"); setFilterDropActive(false)}}/>}
            </div>
        )
        
        return (
            <div className={`sortbar ${hideSortbar ? "hide-sortbar" : ""} ${hideTitlebar ? "sortbar-top" : ""} 
            ${hideSortbar && hideTitlebar && hideSidebar ? "translate-sortbar" : ""}`}
            onMouseEnter={() => setMouseOver(true)} onMouseLeave={() => setMouseOver(false)}>
                <div className="sortbar-left">
                    <div className="sortbar-item">
                        {hideSidebar ? 
                        <RightArrowIcon className="sortbar-img" onClick={() => hideTheSidebar()}/> :
                        <LeftArrowIcon className="sortbar-img" onClick={() => hideTheSidebar()}/>}
                    </div>
                    <div className="sortbar-item">
                        {hideTitlebar ?
                        <DownArrowIcon className="sortbar-img" onClick={() => hideTheTitlebar()}/> :
                        <UpArrowIcon className="sortbar-img" onClick={() => hideTheTitlebar()}/>}
                    </div>
                    <Link to="/upload" className="sortbar-item">
                        <UploadIcon className="sortbar-img"/>
                        <span className="sortbar-text">{i18n.buttons.upload}</span>
                    </Link>
                    <div className="sortbar-item" onClick={bulkDownload}>
                        <DownloadIcon className="sortbar-img"/>
                        <span className="sortbar-text">{i18n.buttons.download}</span>
                    </div>
                    {!tablet && permissions.isAdmin(session) ?
                    <Link to="/bulk-upload" className="sortbar-item">
                        <BulkIcon className="sortbar-img"/>
                        <span className="sortbar-text">{i18n.sortbar.bulk}</span>
                    </Link> : null}
                    {imageType !== "all" || styleType !== "all" || ratingType !== "all" ?
                    <div className="sortbar-item" onClick={() => resetAll()}>
                        <ResetIcon className="sortbar-img-small"/>
                    </div> : null}
                    {getImageJSX()}
                    {getRatingJSX()}
                    {getStyleJSX()}
                    <div className="sortbar-item" onClick={() => toggleShowChildren()}>
                        {showChildren ?
                        <CheckboxCheckedIcon className="sortbar-img"/> :
                        <CheckboxIcon className="sortbar-img"/>}
                        <span className="sortbar-text">{i18n.sort.child}</span> 
                    </div>
                </div>
                <div className="sortbar-right">
                    {permissions.isAdmin(session) && selectionMode ? 
                    <div className="sortbar-item" style={{filter: "hue-rotate(-5deg)"}} onClick={bulkDelete}>
                        <DeleteIcon className="sortbar-img"/>
                    </div> : null}
                    {permissions.isAdmin(session) && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkTagEdit}>
                        <TagIcon className="sortbar-img"/>
                    </div> : null}
                    {permissions.isContributor(session) && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkGroup}>
                        <GroupIcon className="sortbar-img"/>
                    </div> : null}
                    {session.username && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkFavgroup}>
                        <StarGroupIcon className="sortbar-img"/>
                    </div> : null}
                    {session.username && selectionMode ? 
                    <div className="sortbar-item" onClick={bulkFavorite}>
                        <StarIcon className="sortbar-img"/>
                    </div> : null}
                    {session.username ? 
                    <div className="sortbar-item" onClick={() => setSelectionMode(!selectionMode)}>
                        {selectionMode ?
                        <SelectOnIcon className="sortbar-img"/> :
                        <SelectIcon className="sortbar-img"/>}
                    </div> : null}
                    {!scroll ? <>
                    <div className="sortbar-item" style={{marginRight: "5px"}} onClick={previousPage}>
                        <LeftIcon className="sortbar-img"/>
                    </div>
                    <div className="sortbar-item" onClick={nextPage}>
                        <RightIcon className="sortbar-img"/>
                    </div>
                    <div className="sortbar-item" ref={pageMultiplierRef} onClick={() => togglePageMultiplierDrop()}>
                        <span className="sortbar-text-alt">{pageMultiplier}x</span>
                    </div>
                    </> : null}
                    {scroll ? <>
                    <div className="sortbar-item" onClick={() => toggleAutoScroll()}>
                        {autoScroll ?
                        <AutoscrollIcon className="sortbar-img-pink"/> :
                        <AutoscrollIcon className="sortbar-img"/>}
                    </div>
                    </> : null}
                    <div className="sortbar-item" onClick={() => toggleScroll()}>
                        {scroll ? 
                        <ScrollIcon className="sortbar-img"/> :
                        <PagesIcon className="sortbar-img"/>}
                        {!tablet ? <span className="sortbar-text-alt">{scroll ? i18n.sortbar.scrolling : i18n.sortbar.pages}</span> : null}
                    </div>
                    <div className="sortbar-item" onClick={() => toggleSquare()}>
                        <SquareIcon className="sortbar-img"/>
                    </div>
                    <div className="sortbar-item" onClick={() => setReverse(!reverse)}>
                        {reverse ? <>
                        <ReverseIcon className="sortbar-img" style={{transform: "scaleX(-1)"}}/>
                        </> : <>
                        <ReverseIcon className="sortbar-img"/>
                        </>}
                    </div>
                    <div className="sortbar-item" ref={speedRef} onClick={() => toggleSpeedDrop()}>
                        <SpeedIcon className="sortbar-img"/>
                    </div>
                    <div className="sortbar-item" ref={filterRef} onClick={() => toggleFilterDrop()}>
                        <FiltersIcon className="sortbar-img"/>
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
                    <AllIcon className="sortbar-dropdown-img rotate"/>
                    <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("image")}>
                    <ImageIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.image}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("comic")}>
                    <ComicIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.comic}</span>
                </div>
                {session.username ? <>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("animation")}>
                    <AnimationIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.animation}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("video")}>
                    <VideoIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.video}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("audio")}>
                    <AudioIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.audio}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("live2d")}>
                    <Live2dIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.live2d}</span>
                </div>
                <div className="sortbar-dropdown-row" onClick={() => setImageType("model")}>
                    <ModelIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.type.model}</span>
                </div>
                </> : null}
            </div>
            <div className={`dropdown ${activeDropdown === "rating" ? "" : "hide-dropdown"}`} 
            style={{marginLeft: getRatingMargin(), left: `${dropLeft}px`, top: `${dropTop}px`}} onClick={() => setActiveDropdown("none")}>
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("all")}>
                    <AllIcon className="sortbar-dropdown-img rotate"/>
                    <span className="sortbar-dropdown-text">{i18n.tag.all}</span>
                </div>
                {session.showR18 ?
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("all+l")}>
                    <AllIcon className="sortbar-dropdown-img-red rotate"/>
                    <span style={{color: "var(--r18Color)"}} className="sortbar-dropdown-text">{i18n.sortbar.rating.allL}</span>
                </div> : null}
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("cute")}>
                    <CuteIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.cute}</span>
                </div>
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => setRatingType("sexy")}>
                    <SexyIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.sexy}</span>
                </div> : null}
                {session.username ? <div className="sortbar-dropdown-row" onClick={() => setRatingType("erotic")}>
                    <EroticIcon className="sortbar-dropdown-img"/>
                    <span className="sortbar-dropdown-text">{i18n.sortbar.rating.erotic}</span>
                </div> : null}
                {session.showR18 ?
                <div className="sortbar-dropdown-row" onClick={() => setRatingType("lewd")}>
                    <LewdIcon className="sortbar-dropdown-img-red"/>
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
                    <span className="sortbar-dropdown-text">{i18n.sort.bookmarks}</span>
                </div> : null}
                {session.username ? <>
                <div className="sortbar-dropdown-row" onClick={() => changeSortType("favorites")}>
                    <span className="sortbar-dropdown-text">{i18n.sort.favorites}</span>
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