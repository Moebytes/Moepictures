import React, {useEffect, useState, useRef} from "react"
import {useHistory, useLocation} from "react-router-dom"
import {useThemeSelector, useThemeActions, useInteractionActions, useLayoutSelector, 
useSessionSelector, useSessionActions, usePageSelector, usePageActions, useSearchSelector,
useSearchActions, useActiveActions, useFlagActions, useMiscDialogActions} from "../../store"
import Slider from "react-slider"
import hamburger from "../../assets/icons/reader-hamburger.png"
import back from "../../assets/icons/reader-back.png"
import zoomIn from "../../assets/icons/reader-zoomIn.png"
import zoomOut from "../../assets/icons/reader-zoomOut.png"
import rightToLeft from "../../assets/icons/reader-rightToLeft.png"
import topToBottom from "../../assets/icons/reader-topToBottom.png"
import reset from "../../assets/icons/reader-reset.png"
import prevPage from "../../assets/icons/reader-prevPage.png"
import nextPage from "../../assets/icons/reader-nextPage.png"
import invertOnIcon from "../../assets/icons/reader-invert-on.png"
import invertIcon from "../../assets/icons/reader-invert.png"
import englishToJapanese from "../../assets/icons/reader-englishToJapanese.png"
import japaneseToEnglish from "../../assets/icons/reader-japaneseToEnglish.png"
import color from "../../assets/icons/reader-color.png"
import waifu2x from "../../assets/icons/reader-waifu2x.png"
import fx from "../../assets/icons/reader-fx.png"
import functions from "../../structures/Functions"
import permissions from "../../structures/Permissions"
import DragScroll from "../../components/site/DragScroll"
import LocalStorage from "../../LocalStorage"
import PostImage from "../../components/image/PostImage"
import EffectImage from "../../components/image/EffectImage"
import {PostFull} from "../../types/PostTypes"
import {useInView} from "react-intersection-observer"
import Filters from "../../components/post/Filters"
import "./styles/readerpage.less"

interface Props {
    match: {params: {id: string, slug: string}}
}

const ReaderImage = ({pageNumber, img, post, order, loaded}) => {
    const {readerPage} = usePageSelector()
    const {setReaderPage} = usePageActions()
    const {readerHorizontal, readerThumbnails, readerInvert} = useSearchSelector()
    const {ref, inView} = useInView()

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
        <div ref={ref} className="reader-image" style={{marginLeft: readerThumbnails && !readerHorizontal ? "100px" : "0px",
        filter: readerInvert ? "invert(1) grayscale(1) brightness(1.5)" : ""}}>
            <PostImage img={img} noEncryption={true} post={post} order={order}/>
        </div>
    )
}

const ReaderPage: React.FunctionComponent<Props> = (props) => {
    const {i18n, siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {setSiteHue, setSiteSaturation, setSiteLightness} = useThemeActions()
    const {setEnableDrag} = useInteractionActions()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {setSessionFlag} = useSessionActions()
    const {setRedirect} = useFlagActions()
    const {setPremiumRequired} = useMiscDialogActions()
    const {setSidebarText} = useActiveActions()
    const {readerPage} = usePageSelector()
    const {setReaderPage} = usePageActions()
    const {readerHorizontal, readerThumbnails, readerInvert, readerZoom, showTranscript} = useSearchSelector()
    const {setReaderHorizontal, setReaderThumbnails, setReaderInvert, setReaderZoom, setShowTranscript} = useSearchActions()
    const [lastPage, setLastPage] = useState(1)
    const [lastZoom, setLastZoom] = useState(100)
    const [colorDropdown, setColorDropdown] = useState(false)
    const [images, setImages] = useState([] as string[])
    const [thumbnails, setThumbnails] = useState([] as string[])
    const [post, setPost] = useState(null as PostFull | null)
    const [loaded, setLoaded] = useState(false)
    const [showFilterDropdown, setShowFilterDropdown] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const filterRef = useRef<HTMLImageElement>(null)
    const postID = props.match.params.id
    const slug = props.match.params.slug
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadImages = async () => {
        if (!postID) return
        const post = await functions.get("/api/post", {postID}, session, setSessionFlag)
        if (!post) return
        let images = [] as string[]
        let thumbnails = [] as string[]
        for (let i = 0; i < post.images.length; i++) {
            const imageLink = functions.getImageLink(post.images[i], session.upscaledImages)
            const thumbLink = functions.getThumbnailLink(post.images[i], "tiny", session, mobile)
            const decrypted = await functions.decryptItem(imageLink, session)
            const decryptedThumb = await functions.decryptThumb(thumbLink, session)
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
        functions.processRedirects(post, postID, slug, history, session, setSessionFlag)
    }, [post, session])

    useEffect(() => {
        setLoaded(false)
        loadImages()
    }, [postID, session])

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

    const resetFilters = () => {
        setSiteHue(180)
        setSiteSaturation(100)
        setSiteLightness(50)
    }

    const toggleUpscale = async () => {
        if (!session.username) {
            setRedirect(`/post/${postID}/${slug}`)
            history.push("/login")
            return setSidebarText(i18n.sidebar.loginRequired)
        }
        if (permissions.isPremium(session)) {
            functions.clearResponseCacheKey("/api/user/session")
            await functions.post("/api/user/upscaledimages", null, session, setSessionFlag)
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
        history.push(`/post/${postID}/${slug}`)
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
            const thumbnailHeight = Array.from(document.querySelectorAll(".reader-thumbnail-container")).reduce((p, c) => p.clientHeight > c.clientHeight ? p : c)?.clientHeight
            if (!thumbnailHeight) return 
            document.querySelectorAll(".reader-image-container").forEach((e: any) => {
                e.style.marginTop = `${thumbnailHeight}px`
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
                    <EffectImage height={150} image={thumbnails[i]} onClick={() => navigateToPage(i + 1)}/>
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
            jsx.push(<ReaderImage key={i} pageNumber={i + 1} img={images[i]} post={post} order={i + 1} loaded={loaded}/>)
        }
        return (
            <div className={`reader-image-container ${readerHorizontal ? "reader-image-container-horizontal" : ""}`}
            style={{transform: `scale(${readerZoom / 100})`, height: `${100 / readerZoom * 100}%`, width: `${100 / readerZoom * 100}%`}}>{jsx}</div>
        )
    }

    return (
        <>
        <LocalStorage/>
        <DragScroll>
        <div className="reader-page">
            <div className="reader-controls" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <div className="reader-controls-box">
                    {!mobile ? <img className="reader-controls-icon-small" src={hamburger} onClick={() => setReaderThumbnails(!readerThumbnails)} style={{filter: getFilter()}}/> : null}
                    <div className="reader-controls-page-container">
                        <span className="reader-controls-page-text" style={{filter: getFilter()}}>{i18n.labels.page}:</span>
                        <input className="reader-controls-page-input" type="number" spellCheck={false} value={readerPage} onChange={(event) => setReaderPage(Number(event.target.value))} onBlur={() => updatePage()} onMouseEnter={() => setEnableDrag(false)} style={{filter: getFilter()}}/>
                        <span className="reader-controls-page-text" style={{filter: getFilter()}}>/ {images.length}</span>
                    </div>
                    <img className="reader-controls-icon-mid" src={rightToLeft} onClick={() => changeHorizontal(true)} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon-mid" src={topToBottom} onClick={() => changeHorizontal(false)} style={{filter: getFilter()}}/>
                </div>
                {!mobile ?
                <div className="reader-controls-box">
                    <img className="reader-controls-icon-small-alt" src={zoomOut} onClick={triggerZoomOut} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon-small" src={zoomIn} onClick={triggerZoomIn} style={{filter: getFilter()}}/>
                    <input className="reader-controls-zoom-input" type="number" spellCheck={false} value={readerZoom} onChange={(event) => setReaderZoom(Number(event.target.value))} onBlur={() => updateZoom()} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon-small" src={reset} onClick={() => setReaderZoom(100)} style={{height: "13px", filter: getFilter()}}/>
                    <img className="reader-controls-icon-small" src={prevPage} onClick={triggerPrev} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon-small" src={nextPage} onClick={triggerNext} style={{filter: getFilter()}}/>
                </div> : null}
                <div className="reader-controls-box">
                    <img className="reader-controls-icon" src={back} onClick={triggerBack} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon" src={readerInvert ? invertOnIcon : invertIcon} onClick={() => setReaderInvert(!readerInvert)} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon" src={waifu2x} onClick={() => toggleUpscale()} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon" src={fx} ref={filterRef} onClick={() => setShowFilterDropdown((prev) => !prev)} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon" src={!showTranscript ? englishToJapanese : japaneseToEnglish} onClick={() => setShowTranscript(!showTranscript)} style={{filter: getFilter()}}/>
                    <img className="reader-controls-icon" src={color} onClick={() => setColorDropdown((prev) => !prev)} style={{filter: getFilter()}}/>
                </div>
                <div className={`reader-dropdown ${colorDropdown ? "" : "hide-reader-dropdown"}`} style={{top: "40px"}}>
                    <div className="reader-dropdown-row" style={{filter: getFilter()}}>
                        <span className="reader-dropdown-text">{i18n.filters.hue}</span>
                        <Slider className="reader-dropdown-slider" trackClassName="reader-dropdown-slider-track" thumbClassName="reader-dropdown-slider-thumb" onChange={(value) => setSiteHue(value)} min={60} max={300} step={1} value={siteHue}/>
                    </div>
                    <div className="reader-dropdown-row" style={{filter: getFilter()}}>
                        <span className="reader-dropdown-text">{i18n.filters.saturation}</span>
                        <Slider className="reader-dropdown-slider" trackClassName="reader-dropdown-slider-track" thumbClassName="reader-dropdown-slider-thumb" onChange={(value) => setSiteSaturation(value)} min={50} max={100} step={1} value={siteSaturation}/>
                    </div>
                    <div className="reader-dropdown-row" style={{filter: getFilter()}}>
                        <span className="reader-dropdown-text">{i18n.filters.lightness}</span>
                        <Slider className="reader-dropdown-slider" trackClassName="reader-dropdown-slider-track" thumbClassName="reader-dropdown-slider-thumb" onChange={(value) => setSiteLightness(value)} min={45} max={55} step={1} value={siteLightness}/>
                    </div>
                    <div className="reader-dropdown-row" style={{filter: getFilter()}}>
                        <button className="reader-dropdown-button" onClick={() => resetFilters()}>{i18n.filters.reset}</button>
                    </div>
                </div>
            </div>
            <div className={`reader-renderer ${readerHorizontal ? "reader-renderer-horizontal" : ""}`} ref={rootRef} style={{maxHeight: readerHorizontal ? 773 : 1400}} onClick={((e) => e.currentTarget.focus())}>
                {generateThumbnails()}
                {generateImages()}
            </div>
            <Filters active={showFilterDropdown} right={getFiltersMargin()} top={40}/>
        </div>
        </DragScroll>
        </>
    )
}

export default ReaderPage