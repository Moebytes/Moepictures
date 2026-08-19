/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import React, {useEffect, useState, useRef} from "react"
import {useNavigate, useParams} from "react-router-dom"
import {useThemeSelector, useInteractionActions, useLayoutSelector, 
useSessionSelector, useSessionActions, usePageSelector, usePageActions, useSearchSelector,
useSearchActions, useActiveActions, useMiscDialogActions} from "../../store"
import HamburgerIcon from "../../assets/svg/hamburger.svg"
import RightToLeftIcon from "../../assets/svg/reader-left.svg"
import TopToBottomIcon from "../../assets/svg/reader-bottom.svg"
import ZoomOutIcon from "../../assets/svg/reader-zoom-out.svg"
import ZoomInIcon from "../../assets/svg/reader-zoom-in.svg"
import ResetIcon from "../../assets/svg/reader-reset.svg"
import PrevPageIcon from "../../assets/svg/reader-prev.svg"
import NextPageIcon from "../../assets/svg/reader-next.svg"
import BackIcon from "../../assets/svg/reader-back.svg"
import InvertOnIcon from "../../assets/svg/invert-on.svg"
import InvertIcon from "../../assets/svg/invert.svg"
import Waifu2xIcon from "../../assets/svg/waifu2x.svg"
import FXIcon from "../../assets/svg/filters.svg"
import EnglishToJapaneseIcon from "../../assets/svg/reader-en-to-ja.svg"
import JapaneseToEnglishIcon from "../../assets/svg/reader-ja-to-en.svg"
import ColorIcon from "../../assets/svg/color.svg"
import functions from "../../functions/Functions"
import permissions from "../../structures/Permissions"
import DragScroll from "../../components/site/DragScroll"
import LocalStorage from "../../LocalStorage"
import PostImage from "../../components/image/PostImage"
import TinyImage from "../../components/image/TinyImage"
import {useInView} from "react-intersection-observer"
import Filters from "../../ui/Filters"
import HSLDropdown from "../../ui/HSLDropdown"
import LoadingSpinner from "../../components/search/LoadingSpinner"
import {PostFull} from "../../types/Types"
import "./styles/readerpage.less"

const ReaderImage = ({rootRef, pageNumber, img, post, order, loaded}) => {
    const {mobile} = useLayoutSelector()
    const {readerPage} = usePageSelector()
    const {setReaderPage} = usePageActions()
    const {readerHorizontal, readerThumbnails, readerInvert} = useSearchSelector()
    const {ref, inView} = useInView({
        root: rootRef?.current || null,
        threshold: 0.2
    })

    useEffect(() => {
        if (!loaded) return
        if (inView) {
            if (readerHorizontal) {
                if (readerPage !== pageNumber - 1) {
                    setReaderPage(pageNumber - 1)
                }
            } else {
                if (readerPage !== pageNumber) {
                    setReaderPage(pageNumber)
                }
            }
        }
    }, [inView, loaded])

    return (
        <div ref={ref} className="reader-image" style={{marginLeft: !mobile && readerThumbnails && !readerHorizontal ? "100px" : "0px",
        filter: readerInvert ? "invert(1) grayscale(1) brightness(1.5)" : ""}}>
            <PostImage img={img} post={post} order={order} reader={true}/>
        </div>
    )
}

const ReaderPage: React.FunctionComponent = () => {
    const {language, i18n, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const {setActionBanner} = useActiveActions()
    const {readerPage} = usePageSelector()
    const {setReaderPage} = usePageActions()
    const {readerHorizontal, readerThumbnails, readerInvert, readerZoom, showTranscript} = useSearchSelector()
    const {setReaderHorizontal, setReaderThumbnails, setReaderInvert, setReaderZoom, setShowTranscript} = useSearchActions()
    const [lastPage, setLastPage] = useState(1)
    const [lastZoom, setLastZoom] = useState(100)
    const [images, setImages] = useState([] as string[])
    const [thumbnails, setThumbnails] = useState([] as string[])
    const [post, setPost] = useState(null as PostFull | null)
    const [loaded, setLoaded] = useState(false)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const [showColorDropdown, setShowColorDropdown] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const filterRef = useRef<HTMLImageElement>(null)
    const navigate = useNavigate()
    const {id: postID, slug} = useParams() as {id: string, slug: string}

    const filter = functions.color.filter({siteHue, siteSaturation, siteLightness})

    useEffect(() => {
        functions.dom.changeTitle("Post", i18n)
    }, [])

    const loadImages = async () => {
        if (!postID) return
        const post = await functions.http.get("/api/post", {postID}, session, setSessionFlag)
        if (!post) return
        let images = [] as string[]
        let thumbnails = [] as string[]
        for (let i = 0; i < post.images.length; i++) {
            let imageLink = functions.link.getImageLink(post.images[i], session.upscaledImages)
            imageLink = functions.util.appendURLParams(imageLink, {upscaled: session.upscaledImages})
            let thumbLink = functions.link.getThumbnailLink(post.images[i], "tiny", session, mobile)
            thumbLink = functions.util.appendURLParams(thumbLink, {upscaled: false})
            const decrypted = await functions.crypto.decryptItem(imageLink, session)
            const decryptedThumb = await functions.crypto.decryptThumb(thumbLink, session)
            images.push(decrypted)
            thumbnails.push(decryptedThumb)
        }
        setImages(images)
        setThumbnails(thumbnails)
        setPost(post)
        const savedPage = localStorage.getItem("readerPage")
        setTimeout(() => {
            if (savedPage) navigateToPage(Number(savedPage))
            setLoaded(true)
        }, 1000)
    }

    useEffect(() => {
        if (!session.cookie) return
        functions.post.processRedirects(post, postID, slug, navigate, session, setSessionFlag)
    }, [post, session])

    useEffect(() => {
        setLoaded(false)
        setTimeout(() => {
            loadImages()  
        }, 200)
    }, [postID, session, session.upscaledImages])

    useEffect(() => {
        const updateTitle = async () => {
            if (!post) return
            let title = ""
            if (language === "ja") {
                title = post.title ? post.title : "Post"
            } else {
                title = post.englishTitle ? functions.util.toProperCase(post.englishTitle) : 
                post.title ? post.title : "Post"
            }
            functions.dom.changeTitle(title, i18n)
        }
        updateTitle()
    }, [post, language])

    useEffect(() => {
        const keyDown = (event: KeyboardEvent) => {
            if (event.code === "Space") {
                event.preventDefault()
                setShowTranscript(!showTranscript)
            }
        }
        document.addEventListener("keydown", keyDown)
        return () => {
            document.removeEventListener("keydown", keyDown)
        }
    }, [showTranscript])

    const updatePage = () => {
        if (!readerPage) return setReaderPage(lastPage)
        setReaderPage(readerPage)
        navigateToPage(readerPage)
    }

    const updateZoom = () => {
        if (!readerZoom) return setReaderZoom(lastZoom)
        setReaderZoom(readerZoom)
    }

    const triggerZoomIn = () => {
        if (!readerZoom) return
        setReaderZoom(Math.round(readerZoom * 1.1))
    }

    const triggerZoomOut = () => {
        if (!readerZoom) return
        setReaderZoom(Math.round(readerZoom * 0.9))
    }

    const navigateToPage = (page: number, sideways?: boolean) => {
        const element = document.querySelector(".reader-renderer")
        const pdfPage = document.querySelector(".reader-image")
        let horizontalVal = sideways !== undefined ? sideways : readerHorizontal
        const value = horizontalVal ? pdfPage?.clientWidth : pdfPage?.clientHeight
        if (!value || !element) return
        if (horizontalVal) {
            element.scrollLeft = -Math.round(((page - 1) * value))
        } else {
            element.scrollTop = Math.round(((page - 1) * value))
        }
    }

    const triggerPrev = () => {
        const element = document.querySelector(".reader-renderer")
        const pdfPage = document.querySelector(".reader-image")
        const value = readerHorizontal ? pdfPage?.clientWidth : pdfPage?.clientHeight
        if (!value || !element) return
        const current = readerHorizontal ? Math.abs(Math.round((element.scrollLeft) / (value))) + 1 : Math.round(element.scrollTop / (value)) + 1
        if (readerHorizontal) {
            const newPage = current + 1
            navigateToPage(newPage > images.length ? images.length : newPage)
        } else {
            const newPage = current - 1
            navigateToPage(newPage < 1 ? 1 : newPage)
        }
    }

    const triggerNext = () => {
        const element = document.querySelector(".reader-renderer")
        const pdfPage = document.querySelector(".reader-image")
        const value = readerHorizontal ? pdfPage?.clientWidth : pdfPage?.clientHeight
        if (!value || !element) return
        const current = readerHorizontal ? Math.abs(Math.round((element.scrollLeft) / (value))) + 1 : Math.round(element.scrollTop / (value)) + 1
        if (readerHorizontal) {
            const newPage = current - 1
            navigateToPage(newPage < 1 ? 1 : newPage)
        } else {
            const newPage = current + 1
            navigateToPage(newPage > images.length ? images.length : newPage)
        }
    }

    const changeHorizontal = (value: boolean) => {
        const element = document.querySelector(".reader-renderer")
        const pdfPage = document.querySelector(".reader-image")
        const val = readerHorizontal ? pdfPage?.clientWidth : pdfPage?.clientHeight
        if (!val || !element) return
        const current = readerHorizontal ? Math.abs(Math.round((element.scrollLeft) / (val))) + 1 : Math.round(element.scrollTop / (val)) + 1
        setReaderHorizontal(value)
        setTimeout(() => {
            navigateToPage(current, value)
        }, 500)
    }

    const toggleUpscale = async () => {
        if (!session.username) {
            return setActionBanner("login-required")
        }
        if (!session.emailVerified) {
            return setActionBanner("verification-required")
        }
        if (permissions.isPremium(session)) {
            functions.cache.clearResponseCacheKey("/api/user/session")
            await functions.http.post("/api/user/upscaledimages", null, session, setSessionFlag)
            setSessionFlag(true)
        } else {
            setPremiumRequired(true)
        }
    }

    const getFiltersMargin = () => {
        const rect = filterRef.current?.getBoundingClientRect()
        if (!rect) return 30
        const raw = window.innerWidth - rect.right
        let offset = -110
        return raw + offset
    }

    const triggerBack = () => {
        navigate(`/post/${postID}/${slug}`)
    }

    useEffect(() => {
        const scrollElement = document.querySelector(".reader-renderer")
        const scrollHandler = () => {
            if (readerThumbnails && readerHorizontal) {
                document.querySelectorAll(".reader-thumbnail-container").forEach((e: any) => {
                    e.style.left = `${scrollElement?.scrollLeft || 0}px`
                })
            } else {
                document.querySelectorAll(".reader-thumbnail-container").forEach((e: any) => {
                    e.style.left = `0px`
                })
            }
        }
        if (readerThumbnails && readerHorizontal) {
            document.querySelectorAll(".reader-image-container").forEach((e: any) => {
                e.style.marginTop = `300px`
            })
        } else if (readerHorizontal) {
            document.querySelectorAll(".reader-image-container").forEach((e: any) => {
                e.style.marginTop = `150px`
            })
        } else {
            document.querySelectorAll(".reader-image-container").forEach((e: any) => {
                e.style.marginTop = `0px`
            })
        }
        scrollHandler()
        scrollElement?.addEventListener("scroll", scrollHandler)
        return () => {
            scrollElement?.removeEventListener("scroll", scrollHandler)
        }
    }, [readerThumbnails, readerHorizontal])

    useEffect(() => {
        const value = readerHorizontal ? document.querySelector(".reader-thumbnail")?.clientWidth : document.querySelector(".reader-thumbnail")?.clientHeight 
        if (!value) return
        document.querySelectorAll(".reader-thumbnail-container").forEach((e: any) => {
            if (readerHorizontal) {
                if (readerPage > 6 && readerPage < images.length - 6) {
                    e.scrollLeft = -(Math.round(((readerPage - 1) * (value + 13))) - ((value + 13) * 5))
                }
            } else {
                if (readerPage > 2 && readerPage < images.length - 2) {
                    e.scrollTop = (Math.round(((readerPage - 1) * (value + 13)))) - ((value + 13) * 2)
                }
            }
        })
    }, [readerPage, readerHorizontal])
    
    const generateThumbnails = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < thumbnails.length; i++) {
            jsx.push(
                <div key={i} className={`reader-thumbnail ${readerPage === i + 1 ? "selected" : ""}`} 
                style={{filter: readerInvert ? "invert(1) grayscale(1) brightness(1.5)" : ""}}>
                    <TinyImage className="reader-thumb-img" image={thumbnails[i]} onClick={() => navigateToPage(i + 1)}/>
                </div>
            )
        }
        return (
            <div className={`reader-thumbnail-container ${!readerThumbnails ? readerHorizontal ? 
            "reader-thumbnail-hidden-horizontal" : "reader-thumbnail-hidden" : ""} ${readerHorizontal ? 
            "reader-thumbnail-horizontal" : ""}`}>{jsx}</div>
        )
    }

    const generateImages = () => {
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < images.length; i++) {
            jsx.push(<ReaderImage rootRef={rootRef} key={i} pageNumber={i + 1} img={images[i]} post={post} order={i + 1} loaded={loaded}/>)
        }
        if (!jsx.length) {
            jsx.push(<LoadingSpinner/>)
        }
        return (
            <div className={`reader-image-container ${readerHorizontal ? "reader-image-container-horizontal" : ""}`}
            style={{transform: `scale(${readerZoom / 100})`, height: `${100 / readerZoom * 100}%`, width: `${100 / readerZoom * 100}%`}}>{jsx}</div>
        )
    }

    return (
        <>
        <LocalStorage/>
        <div className="reader-page">
            <div className="reader-controls" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="reader-controls-box">
                    {!mobile ? <HamburgerIcon className="reader-controls-icon-small" onClick={() => setReaderThumbnails(!readerThumbnails)}/> : null}
                    <div className="reader-controls-page-container">
                        {!mobile ? <span className="reader-controls-page-text" style={{filter}}>{i18n.labels.page}:</span> : null}
                        <input className="reader-controls-page-input" type="number" spellCheck={false} value={readerPage} onChange={(event) => setReaderPage(Number(event.target.value))} onBlur={() => updatePage()}
                        onMouseEnter={() => setEnableDrag(false)} style={{filter, marginLeft: mobile ? "0px" : ""}}/>
                        <span className="reader-controls-page-text" style={{filter}}>/ {images.length}</span>
                    </div>
                    
                    {!mobile ? <RightToLeftIcon className="reader-controls-icon-mid" onClick={() => changeHorizontal(true)}/> : null}
                    {!mobile ? <TopToBottomIcon className="reader-controls-icon-mid" onClick={() => changeHorizontal(false)}/> : null}
                </div>
                {!mobile ?
                <div className="reader-controls-box">
                    <ZoomOutIcon className="reader-controls-icon-small-alt" onClick={triggerZoomOut}/>
                    <ZoomInIcon className="reader-controls-icon-small" onClick={triggerZoomIn}/>
                    <input className="reader-controls-zoom-input" type="number" spellCheck={false} value={readerZoom} onChange={(event) => setReaderZoom(Number(event.target.value))} onBlur={() => updateZoom()} style={{filter}}/>
                    <ResetIcon className="reader-controls-icon-small" onClick={() => setReaderZoom(100)} style={{height: "13px"}}/>
                    <PrevPageIcon className="reader-controls-icon-small" onClick={triggerPrev}/>
                    <NextPageIcon className="reader-controls-icon-small" onClick={triggerNext}/>
                </div> : null}
                <div className="reader-controls-box">
                    <BackIcon className="reader-controls-icon" onClick={triggerBack}/>
                    {readerInvert ?
                    <InvertOnIcon className="reader-controls-icon" onClick={() => setReaderInvert(!readerInvert)}/> :
                    <InvertIcon className="reader-controls-icon" onClick={() => setReaderInvert(!readerInvert)}/>}
                    
                    <Waifu2xIcon className="reader-controls-icon" onClick={() => toggleUpscale()}/>
                    <FXIcon className="reader-controls-icon" ref={filterRef} onClick={() => setShowFilterDropdown((prev) => !prev)}/>
                    
                    {!showTranscript ? 
                    <EnglishToJapaneseIcon className="reader-controls-icon" onClick={() => setShowTranscript(!showTranscript)}/> :
                    <JapaneseToEnglishIcon className="reader-controls-icon" onClick={() => setShowTranscript(!showTranscript)}/>}

                    <ColorIcon className="reader-controls-icon" onClick={() => setShowColorDropdown((prev) => !prev)}/>
                </div>
            </div>
            <div className={`reader-renderer ${readerHorizontal ? "reader-renderer-horizontal" : ""}`} ref={rootRef} style={{maxHeight: readerHorizontal ? 773 : 1400}} onClick={((e) => e.currentTarget.focus())}>
                {!mobile && generateThumbnails()}
                {generateImages()}
            </div>
            <Filters active={showFilterDropdown} right={getFiltersMargin()} top={40}/>
            <HSLDropdown active={showColorDropdown} top={40}/>
        </div>
        </>
    )
}

export default ReaderPage