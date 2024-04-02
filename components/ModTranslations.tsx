import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, SearchContext, SearchFlagContext, SiteHueContext, SiteLightnessContext, SiteSaturationContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import approve from "../assets/purple/approve.png"
import reject from "../assets/purple/reject.png"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import "./styles/modposts.less"
import axios from "axios"

const ModTranslations: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const [hover, setHover] = useState(false)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [unverifiedTranslations, setUnverifiedTranslations] = useState([]) as any
    const [index, setIndex] = useState(0)
    const [visibleTranslations, setVisibleTranslations] = useState([]) as any
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [imagesRef, setImagesRef] = useState([]) as any
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const updateTranslations = async () => {
        const translations = await axios.get("/api/translation/list/unverified", {withCredentials: true}).then((r) => r.data)
        setEnded(false)
        setUnverifiedTranslations(translations)
    }

    useEffect(() => {
        updateTranslations()
    }, [])

    const approveTranslation = async (translationID: number) => {
        await axios.post("/api/translation/approve", {translationID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        await updateTranslations()
        forceUpdate()
    }

    const rejectTranslation = async (translationID: number) => {
        await axios.post("/api/translation/reject", {translationID}, {headers: {"x-csrf-token": functions.getCSRFToken()}, withCredentials: true})
        await updateTranslations()
        forceUpdate()
    }

    useEffect(() => {
        let currentIndex = index
        const newVisibleTranslations = visibleTranslations as any
        for (let i = 0; i < 10; i++) {
            if (!unverifiedTranslations[currentIndex]) break
            newVisibleTranslations.push(unverifiedTranslations[currentIndex])
            currentIndex++
        }
        setIndex(currentIndex)
        setVisibleTranslations(functions.removeDuplicates(newVisibleTranslations))
        const newImagesRef = newVisibleTranslations.map(() => React.createRef()) as any
        setImagesRef(newImagesRef) as any
    }, [unverifiedTranslations])

    const updateOffset = async () => {
        if (ended) return
        const newOffset = offset + 100
        const result = await axios.get("/api/translation/list/unverified", {params: {offset: newOffset}, withCredentials: true}).then((r) => r.data)
        if (result?.length >= 100) {
            setOffset(newOffset)
            setUnverifiedTranslations((prev: any) => functions.removeDuplicates([...prev, ...result]))
        } else {
            if (result?.length) setUnverifiedTranslations((prev: any) => functions.removeDuplicates([...prev, ...result]))
            setEnded(true)
        }
    }

    useEffect(() => {
        const scrollHandler = async () => {
            if (functions.scrolledToBottom()) {
                let currentIndex = index
                if (!unverifiedTranslations[currentIndex]) return updateOffset()
                const newTranslations = visibleTranslations as any
                for (let i = 0; i < 10; i++) {
                    if (!unverifiedTranslations[currentIndex]) return updateOffset()
                    newTranslations.push(unverifiedTranslations[currentIndex])
                    currentIndex++
                }
                setIndex(currentIndex)
                setVisibleTranslations(functions.removeDuplicates(newTranslations))
            }
        }
        window.addEventListener("scroll", scrollHandler)
        return () => {
            window.removeEventListener("scroll", scrollHandler)
        }
    })

    const loadImages = async () => {
        for (let i = 0; i < visibleTranslations.length; i++) {
            const translation = visibleTranslations[i]
            const ref = imagesRef[i]
            const img = functions.getThumbnailLink(translation.post.images[0].type, translation.postID, translation.post.images[0].order, translation.post.images[0].filename, "tiny")
            if (functions.isGIF(img)) continue
            if (!ref.current) continue
            let src = img
            const type = translation.post.images[0].type
            if (type === "image" || type === "comic") {
                src = await cryptoFunctions.decryptedLink(img)
            } else if (functions.isModel(img)) {
                src = await functions.modelImage(img)
            } else if (functions.isAudio(img)) {
                src = await functions.songCover(img)
            }
            const imgElement = document.createElement("img")
            imgElement.src = src 
            imgElement.onload = () => {
                if (!ref.current) return
                const refCtx = ref.current.getContext("2d")
                ref.current.width = imgElement.width
                ref.current.height = imgElement.height
                refCtx?.drawImage(imgElement, 0, 0, imgElement.width, imgElement.height)
            }
        }
    }

    useEffect(() => {
        loadImages()
    }, [visibleTranslations])

    const translationDataJSX = (translation: any) => {
        let jsx = [] as any
        for (let i = 0; i < translation.data.length; i++) {
            const item = translation.data[i]
            jsx.push(<span className="mod-post-text">{`${item.transcript} -> ${item.translation}`}</span>)
        }
        return jsx
    }

    const generateTranslationsJSX = () => {
        let jsx = [] as any
        const translations = functions.removeDuplicates(visibleTranslations)
        for (let i = 0; i < translations.length; i++) {
            const translation = translations[i] as any
            if (!translation) break
            const imgClick = (event?: any, middle?: boolean) => {
                if (middle) return window.open(`/post/${translation.postID}`, "_blank")
                history.push(`/post/${translation.postID}`)
            }
            const img = functions.getThumbnailLink(translation.post.images[0].type, translation.postID, translation.post.images[0].order, translation.post.images[0].filename, "tiny")
            jsx.push(
                <div className="mod-post" onMouseEnter={() =>setHover(true)} onMouseLeave={() => setHover(false)}>
                    <div className="mod-post-img-container">
                        {functions.isVideo(img) ? 
                        <video className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></video> :
                        functions.isGIF(img) ? <img className="mod-post-img" src={img} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}/> :
                        <canvas className="mod-post-img" ref={imagesRef[i]} onClick={imgClick} onAuxClick={(event) => imgClick(event, true)}></canvas>}
                    </div>
                    <div className="mod-post-text-column">
                        <span className="mod-post-link" onClick={() => history.push(`/user/${translation.updater}`)}>Updater: {functions.toProperCase(translation.updater || "Deleted")}</span>
                        {translationDataJSX(translation)}
                    </div>
                    <div className="mod-post-options">
                        <div className="mod-post-options-container" onClick={() => rejectTranslation(translation.translationID)}>
                            <img className="mod-post-options-img" src={reject} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Reject</span>
                        </div>
                        <div className="mod-post-options-container" onClick={() => approveTranslation(translation.translationID)}>
                            <img className="mod-post-options-img" src={approve} style={{filter: getFilter()}}/>
                            <span className="mod-post-options-text">Approve</span>
                        </div>
                    </div>
                </div>
            )
        }
        return jsx
    }

    return (
        <div className="mod-posts">
            {generateTranslationsJSX()}
        </div>
    )
}

export default ModTranslations