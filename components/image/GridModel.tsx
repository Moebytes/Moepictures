import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle} from "react"
import {useHistory} from "react-router-dom"
import loading from "../../assets/icons/loading.gif"
import {useFilterSelector, useInteractionActions, useLayoutSelector, usePlaybackSelector, usePlaybackActions, useCacheActions,
useThemeSelector, useSearchSelector, useSessionSelector, useFlagSelector, useFlagActions, useSearchActions} from "../../store"
import path from "path"
import functions from "../../structures/Functions"
import "./styles/gridimage.less"
import * as THREE from "three"
import privateIcon from "../../assets/icons/lock-opt.png"
import {OrbitControls, GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"
import {VRMLoaderPlugin} from "@pixiv/three-vrm"
import {GIFFrame, PostSearch} from "../../types/Types"

let tooltipTimer = null as any
let imageTimer = null as any
let id = null as any

interface Props {
    id: string
    img: string
    model: string
    post: PostSearch
    square?: boolean
    marginBottom?: number
    marginLeft?: number
    height?: number
    borderRadius?: number
    autoLoad?: boolean
    reupdate?: () => void
}

interface Ref {
    shouldWait: () => Promise<boolean>
    load: () => Promise<void>
    update: () => Promise<void>
}

const GridModel = forwardRef<Ref, Props>((props, componentRef) => {
    const {siteHue, siteSaturation, siteLightness} = useThemeSelector()
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {brightness, contrast, hue, saturation, lightness, blur, sharpen, pixelate} = useFilterSelector()
    const {reverse, speed, duration} = usePlaybackSelector()
    const {setSecondsProgress, setReverse, setSeekTo, setProgress, setDuration} = usePlaybackActions()
    const {sizeType, square, scroll, selectionMode, selectionItems, selectionPosts} = useSearchSelector()
    const {setSelectionItems, setSelectionPosts} = useSearchActions()
    const {downloadFlag, downloadIDs} = useFlagSelector()
    const {setDownloadFlag, setDownloadIDs} = useFlagActions()
    const {setScrollY, setToolTipX, setToolTipY, setToolTipEnabled, setToolTipPost, setToolTipImg} = useInteractionActions()
    const {setPost} = useCacheActions()
    const [imageSize, setImageSize] = useState(240)
    const containerRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const lightnessRef = useRef<HTMLCanvasElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const imageFiltersRef = useRef<HTMLDivElement>(null)
    const videoOverlayRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<HTMLDivElement>(null)
    const privateIconRef = useRef<HTMLImageElement>(null)
    const [imageWidth, setImageWidth] = useState(0)
    const [imageHeight, setImageHeight] = useState(0)
    const [naturalWidth, setNaturalWidth] = useState(0)
    const [naturalHeight, setNaturalHeight] = useState(0)
    const [imageLoaded, setImageLoaded] = useState(false)
    const [backFrame, setBackFrame] = useState("")
    const [drag, setDrag] = useState(false)
    const [gifData, setGIFData] = useState(null as GIFFrame[] | null)
    const [videoData, setVideoData] = useState(null as ImageBitmap | null)
    const [visible, setVisible] = useState(true)
    const [pageBuffering, setPageBuffering] = useState(true)
    const [screenshot, setScreenshot] = useState(null as string | null)
    const [mixer, setMixer] = useState(null as unknown as THREE.AnimationMixer | null)
    const [animations, setAnimations] = useState(null as unknown as THREE.AnimationClip[] | null)
    const [ref, setRef] = useState(null as unknown as HTMLCanvasElement)
    const [selected, setSelected] = useState(false)
    const [hover, setHover] = useState(false)
    const [decrypted, setDecrypted] = useState("")
    const imageRef = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    useImperativeHandle(componentRef, () => ({
        shouldWait: async () => {
            return true
        },
        load: async () => {
            load()
        },
        update: async () => {
            return session.liveModelPreview && !mobile ? loadModel() : loadImage()
        }
    }))

    const load = async () => {
        if (ref) return
        return session.liveModelPreview && !mobile ? loadModel() : loadImage()
    }

    useEffect(() => {
        props.reupdate?.()
    }, [imageSize])

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
        const entry = entries[0]
        if (entry.intersectionRatio > 0) {
          setVisible(true)
        } else {
          if (scroll) setVisible(false)
        }
    }

    useEffect(() => {
        if (!scroll) if (!visible) setVisible(true)
    }, [scroll])

    useEffect(() => {
        if (typeof window === "undefined") return
        const observer = new IntersectionObserver(handleIntersection, {root: null, rootMargin: "0px 0px 100px 100px", threshold: 0.01})
        const element = containerRef.current
        if (element) observer.observe(element)
        return () => {
            observer.disconnect()
        }
    }, [])

    const loadImage = async () => {
        const img = await functions.decryptThumb(props.img, session)
        setScreenshot(img)
    }

    const loadModel = async () => {
        const decrypted = await functions.decryptItem(props.model, session)
        setDecrypted(decrypted)

        const element = rendererRef.current
        window.cancelAnimationFrame(id)
        while (element?.lastChild) element?.removeChild(element.lastChild)
        const width = imageSize
        const height = imageSize
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const light = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(light)
        const light2 = new THREE.DirectionalLight(0xffffff, 0.2)
        light2.position.set(30, 100, 100)
        scene.add(light2)
        const light3 = new THREE.DirectionalLight(0xffffff, 0.2)
        light3.position.set(-30, 100, -100)
        scene.add(light3)
        
        const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, preserveDrawingBuffer: true, powerPreference: "low-power"})
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        element?.appendChild(renderer.domElement)

        let model = null as unknown as THREE.Object3D
        if (functions.isGLTF(props.model)) {
            const loader = new GLTFLoader()
            const gltf = await loader.loadAsync(decrypted)
            model = gltf.scene
            model.animations = gltf.animations
        } else if (functions.isOBJ(props.model)) {
            const loader = new OBJLoader()
            model = await loader.loadAsync(decrypted)
        } else if (functions.isFBX(props.model)) {
            const loader = new FBXLoader()
            model = await loader.loadAsync(decrypted)
        } else if (functions.isVRM(props.model)) {
            const loader = new GLTFLoader()
            loader.register((parser: any) => {
                return new VRMLoaderPlugin(parser) as any
            })
            const vrm = await loader.loadAsync(decrypted).then((l) => l.userData.vrm)
            if (vrm.meta?.metaVersion === "0") {
                scene.rotation.y = Math.PI
            }
            model = vrm.scene
        }
        scene.add(model)

        const controlElement = imageFiltersRef.current || undefined

        const controls = new OrbitControls(camera, controlElement)
        controlElement?.addEventListener("doubleclick", () => {
            controls.reset()
        })

        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        model.position.sub(center)
        const euler = new THREE.Euler(0, 0, 0, "XYZ")
        model.rotation.copy(euler)

        const maxDim = Math.max(size.x, size.y, size.z)
        const fovRad = (camera.fov * Math.PI) / 180
        const distance = maxDim / (2 * Math.tan(fovRad / 2))
        camera.position.set(0, 0, distance)
        camera.lookAt(0, 0, 0)

        camera.near = distance / 10
        camera.far = distance * 10
        camera.updateProjectionMatrix()

        controls.maxDistance = size.length() * 10
        controls.addEventListener("change", () => {
            if (imageTimer) return 
            imageTimer = setTimeout(() => {
                renderer.setClearColor(0x000000, 1)
                setScreenshot(renderer.domElement.toDataURL())
                renderer.setClearColor(0x000000, 0)
                imageTimer = null
            }, 100)
        })
        controls.update()

        if (mixer) {
            mixer.stopAllAction()
            mixer.uncacheRoot(mixer.getRoot())
            setMixer(null)
            setAnimations(null)
        }

        let animationMixer = null as unknown as THREE.AnimationMixer
        if (model.animations.length) {
            animationMixer = new THREE.AnimationMixer(model)
            const clip = model.animations[0]
            setDuration(clip.duration)
            animationMixer.clipAction(clip).reset().play()
            setMixer(animationMixer)
            setAnimations(model.animations)
        }

        const clock = new THREE.Clock()

        const animate = () => {
            id = window.requestAnimationFrame(animate)
            const delta = clock.getDelta()
            controls.update()
            if (animationMixer) {
                animationMixer.update(delta)
                const secondsProgress = animationMixer.time
                setSecondsProgress(secondsProgress)
                setProgress((secondsProgress / duration) * 100)
            }
            renderer.render(scene, camera)
            if (!screenshot) {
                renderer.setClearColor(0x000000, 1)
                setScreenshot(renderer.domElement.toDataURL())
                renderer.setClearColor(0x000000, 0)
            }
        }

        animate()
        setRef(renderer.domElement)
    }

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setGIFData(null)
        setVideoData(null)
        setBackFrame("")
        setSecondsProgress(0)
        setProgress(0)
        setSeekTo(null)
        if (props.autoLoad) load()
    }, [props.model])

    useEffect(() => {
        if (mixer) {
            if (reverse) {
                if (mixer.time <= 0) mixer.setTime(duration)
                mixer.timeScale = -speed
            } else {
                if (mixer.time >= duration) mixer.setTime(0)
                mixer.timeScale = speed
            }
        }
    }, [mixer, speed, reverse, duration])

    const resizePixelateCanvas = () => {
        const currentRef = ref ? ref : imageRef.current
        if (!pixelateRef.current || !currentRef) return
        pixelateRef.current.width = currentRef.clientWidth
        pixelateRef.current.height = currentRef.clientHeight
    }

    useEffect(() => {
        const currentRef = ref ? ref : imageRef.current
        if (!currentRef) return
        let observer = null as ResizeObserver | null
        observer = new ResizeObserver(resizePixelateCanvas)
        observer.observe(currentRef)
        return () => {
            observer?.disconnect()
        }
    }, [ref])

    const resizeOverlay = () => {
        if (!rendererRef.current || !pixelateRef.current) return 
        pixelateRef.current.width = rendererRef.current.clientWidth
        pixelateRef.current.height = rendererRef.current.clientHeight
    }

    useEffect(() => {
        const element = rendererRef.current!
        new ResizeObserver(resizeOverlay).observe(element)
        setTimeout(() => {
            setPageBuffering(false)
        }, 500)
    }, [])

    const getSquareOffset = () => {
        if (mobile) {
            if (sizeType === "tiny") return 20
            if (sizeType === "small") return 20
            if (sizeType === "medium") return 25
            if (sizeType === "large") return 30
            if (sizeType === "massive") return 30
        }
        if (sizeType === "tiny") return 10
        if (sizeType === "small") return 12
        if (sizeType === "medium") return 15
        if (sizeType === "large") return 20
        if (sizeType === "massive") return 30
        return 5
    }

    const updateSquare = () => {
        const currentRef = ref ? ref : imageRef.current
        if (!containerRef.current || !currentRef) return
        const refWidth = currentRef.clientWidth
        const refHeight = currentRef.clientHeight
        if (square || props.square) {
            const sidebarWidth = functions.sidebarWidth()
            const width = window.innerWidth - sidebarWidth
            const containerWidth = Math.floor(width / (mobile ? functions.getImagesPerRowMobile(sizeType) : functions.getImagesPerRow(sizeType))) - getSquareOffset()
            containerRef.current.style.width = props.height ? `${props.height}px` : `${containerWidth}px`
            containerRef.current.style.height = props.height ? `${props.height}px` : `${containerWidth}px`
            containerRef.current.style.marginBottom = props.marginBottom ? `${props.marginBottom}px` : "3px"
            containerRef.current.style.marginLeft = props.marginLeft ? `${props.marginLeft}px` : "0px"
            const landscape = refWidth <=refHeight
            if (landscape) {
                currentRef.style.width = props.height ? `${props.height}px` : `${containerWidth}px`
                currentRef.style.height = "auto"
            } else {
                currentRef.style.width = "auto"
                currentRef.style.height = props.height ? `${props.height}px` : `${containerWidth}px`
            }
        } else {
            containerRef.current.style.width = "max-content"
            containerRef.current.style.height = "max-content"
            currentRef.style.width = "auto"
            currentRef.style.height = props.height ? `${props.height}px` : `${imageSize}px`
            containerRef.current.style.marginBottom = props.marginBottom ? `${props.marginBottom}px` : "10px"
            containerRef.current.style.marginLeft = props.marginLeft ? `${props.marginLeft}px` : "0px"
        }
    }

    useEffect(() => {
        updateSquare()
    }, [square, sizeType, imageSize, imageWidth, imageHeight])

    useEffect(() => {
        if (!containerRef.current) return
        containerRef.current.style.boxShadow = getBorder()
    }, [imageLoaded, sizeType, selected, session, props.post])

    useEffect(() => {
        if (mobile) {
            if (sizeType === "tiny") {
                setImageSize(80)
            } else if (sizeType === "small") {
                setImageSize(100)
            } else if (sizeType === "medium") {
                setImageSize(150)
            } else if (sizeType === "large") {
                setImageSize(230)
            } else if (sizeType === "massive") {
                setImageSize(400)
            }
        } else {
            if (sizeType === "tiny") {
                setImageSize(160)
            } else if (sizeType === "small") {
                setImageSize(200)
            } else if (sizeType === "medium") {
                setImageSize(240)
            } else if (sizeType === "large") {
                setImageSize(300)
            } else if (sizeType === "massive") {
                setImageSize(400)
            }
        }
    }, [sizeType])

    useEffect(() => {
        if (!imageFiltersRef.current) return
        const element = imageFiltersRef.current
        let newContrast = contrast
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!screenshot || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${screenshot})`
            sharpenOverlay.style.filter = `blur(4px) invert(1) contrast(75%)`
            sharpenOverlay.style.mixBlendMode = "overlay"
            sharpenOverlay.style.opacity = `${sharpenOpacity}`
        } else {
            sharpenOverlay.style.backgroundImage = "none"
            sharpenOverlay.style.filter = "none"
            sharpenOverlay.style.mixBlendMode = "normal"
            sharpenOverlay.style.opacity = "0"
        }
        if (lightness !== 100) {
            const filter = lightness < 100 ? "brightness(0)" : "brightness(0) invert(1)"
            lightnessOverlay.style.filter = filter
            lightnessOverlay.style.opacity = `${Math.abs((lightness - 100) / 100)}`
        } else {
            lightnessOverlay.style.filter = "none"
            lightnessOverlay.style.opacity = "0"
        }
        element.style.filter = `brightness(${brightness}%) contrast(${newContrast}%) hue-rotate(${hue - 180}deg) saturate(${saturation}%) blur(${blur}px)`
    }, [screenshot, brightness, contrast, hue, saturation, lightness, blur, sharpen])

    const imagePixelate = () => {
        const currentRef = ref ? ref : imageRef.current
        if (!pixelateRef.current || !currentRef) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d")!
        const imageWidth = currentRef.clientWidth 
        const imageHeight = currentRef.clientHeight
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imageWidth
        pixelateCanvas.height = imageHeight
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(currentRef, 0, 0, pixelWidth, pixelHeight)
            if (landscape) {
                pixelateCanvas.style.width = `${imageWidth * pixelate}px`
                pixelateCanvas.style.height = "auto"
            } else {
                pixelateCanvas.style.width = "auto"
                pixelateCanvas.style.height = `${imageHeight * pixelate}px`
            }
            pixelateCanvas.style.opacity = "1"
        } else {
            pixelateCanvas.style.width = "none"
            pixelateCanvas.style.height = "none"
            pixelateCanvas.style.opacity = "0"
        }
    }

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [])

    useEffect(() => {
        setTimeout(() => {
            imagePixelate()
        }, 50)
    }, [pixelate, square, imageSize, screenshot, ref])

    const imageAnimation = (event: React.MouseEvent<HTMLDivElement>) => {
        const currentRef = ref ? ref : imageRef.current
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !currentRef) return
        const rect = currentRef.getBoundingClientRect()
        const width = rect?.width
        const height = rect?.height
        const x = event.clientX - rect.x
        const y = event.clientY - rect.y
        const translateX = ((x / width) - 0.5) * 3
        const translateY = ((y / height) - 0.5) * 3
        currentRef.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        overlayRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        lightnessRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
        pixelateRef.current.style.transformOrigin = "top left"
        pixelateRef.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) scale(1.02)`
    }

    const cancelImageAnimation = () => {
        const currentRef = ref ? ref : imageRef.current
        if (!overlayRef.current || !pixelateRef.current || !lightnessRef.current || !currentRef) return
        currentRef.style.transform = "scale(1)"
        overlayRef.current.style.transform = "scale(1)"
        lightnessRef.current.style.transform = "scale(1)"
        pixelateRef.current.style.transformOrigin = "none"
        pixelateRef.current.style.transform = "scale(1)"
    }

    useEffect(() => {
        if (downloadFlag) {
            if (downloadIDs.includes(props.post.postID)) {
                functions.download(path.basename(props.model), decrypted)
                setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post.postID))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag, decrypted])

    const onClick = (event: React.MouseEvent<HTMLElement>) => {
        //if (activeDropdown !== "none") return
        if (event.metaKey || event.ctrlKey || event.button === 1) {
            if (!history.location.pathname.includes("/post/")) setPost(null)
            event.preventDefault()
            const newWindow = window.open(`/post/${props.id}/${props.post.slug}`, "_blank")
            newWindow?.blur()
            window.focus()
        }
    }

    const mouseDown = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(false)
    }

    const mouseMove = (event: React.MouseEvent<HTMLElement>) => {
        setDrag(true)
    }

    const mouseUp = async (event: React.MouseEvent<HTMLElement>) => {
        //if (activeDropdown !== "none") return
        setScrollY(window.scrollY)
        if (selectionMode) {
            if (event.metaKey || event.ctrlKey || event.button == 1 || event.button == 2) {
                return
            } else {
                const isSelected = !selected
                if (isSelected) {
                    selectionItems.add(props.post.postID)
                    selectionPosts.set(props.post.postID, props.post)
                } else {
                    selectionItems.delete(props.post.postID)
                    selectionPosts.delete(props.post.postID)
                }
                setSelected(isSelected)
                setSelectionItems(selectionItems)
                setSelectionPosts(selectionPosts)
            }
        } else {
            if (!drag) {
                if (event.metaKey || event.ctrlKey || event.button == 1 || event.button == 2) {
                    return
                } else {
                    if (!history.location.pathname.includes("/post/")) setPost(null)
                    history.push(`/post/${props.id}/${props.post.slug}`)
                    window.scrollTo(0, 0)
                }
            }
        }
    }

    const mouseEnter = () => {
        setHover(true)
        if (pageBuffering) return
        tooltipTimer = setTimeout(() => {
            if (!containerRef.current) return
            const rect = containerRef.current.getBoundingClientRect()
            const toolTipWidth = 325
            const toolTipHeight = 175
            const midpoint = (rect.left + rect.right) / 2
            setToolTipX(Math.floor(midpoint - (toolTipWidth / 2)))
            setToolTipY(Math.floor(rect.y - (toolTipHeight / 1.05)))
            setToolTipPost(props.post)
            setToolTipImg(props.model)
            setToolTipEnabled(true)
        }, 200)
    }

    const mouseLeave = () => {
        setHover(false)
        if (pageBuffering) return
        if (tooltipTimer) clearTimeout(tooltipTimer)
        setToolTipEnabled(false)
    }

    const getBorder = () => {
        if (sizeType === "tiny" || sizeType === "small" || session.captchaNeeded) {
            if (selected) {
                return "0px 0px 0px 2px var(--selectBorder)"
            } else {
                return `0px 0px 0px 1px ${functions.borderColor(props.post)}`
            }
        } else {
            if (selected) {
                return "0px 0px 0px 4px var(--selectBorder)"
            } else {
                return `0px 0px 0px 2px ${functions.borderColor(props.post)}`
            }
        }
    }

    useEffect(() => {
        if (!selectionMode) {
            setSelected(false)
            selectionItems.delete(props.post.postID)
            selectionPosts.delete(props.post.postID)
        }
    }, [selectionMode])

    const drawImage = async () => {
        if (!screenshot) return
        const currentRef = ref ? ref : imageRef.current
        if (!currentRef || !overlayRef.current || !lightnessRef.current) return
        const img = document.createElement("img")
        img.src = screenshot
        img.onload = () => {
            if (!currentRef || !overlayRef.current || !lightnessRef.current) return
            setImageWidth(img.width)
            setImageHeight(img.height)
            setNaturalWidth(img.naturalWidth)
            setNaturalHeight(img.naturalHeight)
            const refCtx = currentRef.getContext("2d")
            currentRef.width = img.width
            currentRef.height = img.height
            refCtx?.drawImage(img, 0, 0, img.width, img.height)
            const overlayCtx = overlayRef.current.getContext("2d")
            overlayRef.current.width = img.width
            overlayRef.current.height = img.height
            overlayCtx?.drawImage(img, 0, 0, img.width, img.height)
            const lightnessCtx = lightnessRef.current.getContext("2d")
            lightnessRef.current.width = img.width
            lightnessRef.current.height = img.height
            lightnessCtx?.drawImage(img, 0, 0, img.width, img.height)
            setImageLoaded(true)
            currentRef.style.opacity = "1"
        }
    }

    useEffect(() => {
        drawImage()
    }, [screenshot])

    const currentRef = ref ? ref : imageRef.current

    return (
        <div style={{opacity: visible && currentRef?.width ? "1" : "0", transition: "opacity 0.1s", width: "max-content", height: "max-content", 
        borderRadius: `${props.borderRadius || 0}px`}} className="image-box" id={String(props.id)} ref={containerRef} onClick={onClick} 
        onAuxClick={onClick} onMouseDown={mouseDown} onMouseUp={mouseUp} onMouseMove={mouseMove} onMouseEnter={mouseEnter} onMouseLeave={mouseLeave}>
            <div className="image-filters" ref={imageFiltersRef} onMouseMove={(event) => imageAnimation(event)} onMouseLeave={() => cancelImageAnimation()}>
                {props.post.private ? <img style={{opacity: hover ? "1" : "0", transition: "opacity 0.3s", filter: getFilter()}} className="song-icon" src={privateIcon} 
                ref={privateIconRef} onMouseDown={(event) => {event.stopPropagation()}} onMouseUp={(event) => {event.stopPropagation()}}/> : null}
                <canvas draggable={false} className="lightness-overlay" ref={lightnessRef}></canvas>
                <canvas draggable={false} className="sharpen-overlay" ref={overlayRef}></canvas>
                <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>
                {session.liveModelPreview && !mobile ? null : <canvas className="image" ref={imageRef}></canvas>}
                <div className="grid-model-renderer" ref={rendererRef} style={mobile || !session.liveModelPreview ? {display: "none"} : {}}></div>
            </div>
        </div>
    )
})

export default GridModel