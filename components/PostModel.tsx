import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {ThemeContext, EnableDragContext, BrightnessContext, ContrastContext, HueContext, SaturationContext, LightnessContext,
BlurContext, SharpenContext, PixelateContext, DownloadFlagContext, DownloadIDsContext, DisableZoomContext, SpeedContext,
ReverseContext, MobileContext, TranslationModeContext, TranslationDrawingEnabledContext, SessionContext, SiteHueContext,
SiteLightnessContext, SiteSaturationContext, ImageExpandContext} from "../Context"
import {HashLink as Link} from "react-router-hash-link"
import functions from "../structures/Functions"
import cryptoFunctions from "../structures/CryptoFunctions"
import Slider from "react-slider"
import modelReverseIcon from "../assets/icons/model-reverse.png"
import modelSpeedIcon from "../assets/icons/model-speed.png"
import modelClearIcon from "../assets/icons/model-clear.png"
import modelPlayIcon from "../assets/icons/model-play.png"
import modelPauseIcon from "../assets/icons/model-pause.png"
import modelRewindIcon from "../assets/icons/model-rewind.png"
import modelFastforwardIcon from "../assets/icons/model-fastforward.png"
import modelFullscreenIcon from "../assets/icons/model-fullscreen.png"
import modelWireframeIcon from "../assets/icons/model-wireframe.png"
import modelRenderedIcon from "../assets/icons/model-rendered.png"
import modelMatcapIcon from "../assets/icons/model-matcap.png"
import modelTexturedIcon from "../assets/icons/model-textured.png"
import modelShapeKeysIcon from "../assets/icons/model-shapekeys.png"
import modelLightIcon from "../assets/icons/model-light.png"
import ambientLightIcon from "../assets/icons/ambient.png"
import directionalLightIcon from "../assets/icons/directional.png"
import translationToggleOn from "../assets/icons/translation-toggle-on.png"
import expand from "../assets/icons/expand.png"
import contract from "../assets/icons/contract.png"
import TranslationEditor from "./TranslationEditor"
import path from "path"
import nextIcon from "../assets/icons/go-right.png"
import prevIcon from "../assets/icons/go-left.png"
import "./styles/postmodel.less"
import mime from "mime-types"
import * as THREE from "three"
import {OrbitControls, GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"

let imageTimer = null as any
let id = null as any

interface Props {
    post?: any
    model: string
    width?: number
    height?: number
    scale?: number
    noKeydown?: boolean
    comicPages?: any
    order?: number
    noTranslations?: boolean
    unverified?: boolean
    previous?: () => void
    next?: () => void
    translationID?: string
}

const PostModel: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {siteHue, setSiteHue} = useContext(SiteHueContext)
    const {siteSaturation, setSiteSaturation} = useContext(SiteSaturationContext)
    const {siteLightness, setSiteLightness} = useContext(SiteLightnessContext)
    const {session, setSessions} = useContext(SessionContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {brightness, setBrightness} = useContext(BrightnessContext)
    const {contrast, setContrast} = useContext(ContrastContext)
    const {hue, setHue} = useContext(HueContext)
    const {saturation, setSaturation} = useContext(SaturationContext)
    const {lightness, setLightness} = useContext(LightnessContext)
    const {pixelate, setPixelate} = useContext(PixelateContext)
    const {blur, setBlur} = useContext(BlurContext)
    const {sharpen, setSharpen} = useContext(SharpenContext)
    const {downloadFlag, setDownloadFlag} = useContext(DownloadFlagContext)
    const {downloadIDs, setDownloadIDs} = useContext(DownloadIDsContext)
    const {disableZoom, setDisableZoom} = useContext(DisableZoomContext)
    const {translationMode, setTranslationMode} = useContext(TranslationModeContext)
    const {translationDrawingEnabled, setTranslationDrawingEnabled} = useContext(TranslationDrawingEnabledContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {imageExpand, setImageExpand} = useContext(ImageExpandContext)
    const [showSpeedDropdown, setShowSpeedDropdown] = useState(false)
    const [showLightDropdown, setShowLightDropdown] = useState(false)
    const [showMorphDropdown, setShowMorphDropdown] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const fullscreenRef = useRef<HTMLDivElement>(null)
    const rendererRef = useRef<HTMLDivElement>(null)
    const pixelateRef = useRef<HTMLCanvasElement>(null)
    const overlayRef = useRef<HTMLCanvasElement>(null)
    const lightnessRef = useRef<HTMLCanvasElement>(null)
    const modelSliderRef = useRef<any>(null)
    const modelControls = useRef<HTMLDivElement>(null)
    const modelSpeedRef = useRef(null) as any
    const modelLightRef = useRef(null) as any
    const modelMorphRef = useRef(null) as any
    const [secondsProgress, setSecondsProgress] = useState(0)
    const [progress, setProgress] = useState(0)
    const [dragProgress, setDragProgress] = useState(0) as any
    const {reverse, setReverse} = useContext(ReverseContext)
    const {speed, setSpeed} = useContext(SpeedContext)
    const [paused, setPaused] = useState(false)
    const [duration, setDuration] = useState(0)
    const [dragging, setDragging] = useState(false)
    const [seekTo, setSeekTo] = useState(null) as any
    const [image, setImage] = useState(null) as any
    const [mixer, setMixer] = useState(null as unknown as THREE.AnimationMixer | null)
    const [animations, setAnimations] = useState(null as unknown as THREE.AnimationClip[] | null)
    const [ref, setRef] = useState(null as unknown as HTMLCanvasElement)
    const [wireframe, setWireframe] = useState(false)
    const [matcap, setMatcap] = useState(false)
    const [ambient, setAmbient] = useState(0.5)
    const [directionalFront, setDirectionalFront] = useState(0.2)
    const [directionalBack, setDirectionalBack] = useState(0.2)
    const [lights, setLights] = useState([]) as any
    const [morphMesh, setMorphMesh] = useState(null) as any
    const [initMorphTargets, setInitMorphTargets] = useState([]) as any
    const [morphTargets, setMorphTargets] = useState([]) as any
    const [model, setModel] = useState(null) as any
    const [scene, setScene] = useState(null) as any
    const [previousButtonHover, setPreviousButtonHover] = useState(false)
    const [nextButtonHover, setNextButtonHover] = useState(false)
    const [objMaterials, setObjMaterials] = useState([]) as any
    const [buttonHover, setButtonHover] = useState(false)

    const getFilter = () => {
        return `hue-rotate(${siteHue - 180}deg) saturate(${siteSaturation}%) brightness(${siteLightness + 70}%)`
    }

    const loadModel = async () => {
        if (!props.model) return
        const element = rendererRef.current
        window.cancelAnimationFrame(id)
        while (element?.lastChild) element?.removeChild(element.lastChild)
        let width = window.innerWidth - functions.sidebarWidth() - 400
        if (mobile) width = window.innerWidth - 10
        let height = window.innerHeight - functions.titlebarHeight() - functions.navbarHeight() - 150
        if (imageExpand) {
            width = window.innerWidth - functions.sidebarWidth() - 200
            height = window.innerHeight
        }
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const light = new THREE.AmbientLight(0xffffff, ambient)
        scene.add(light)
        const light2 = new THREE.DirectionalLight(0xffffff, directionalFront)
        light2.position.set(30, 100, 100)
        scene.add(light2)
        const light3 = new THREE.DirectionalLight(0xffffff, directionalBack)
        light3.position.set(-30, 100, -100)
        scene.add(light3)
        setLights([light, light2, light3])
        
        const renderer = new THREE.WebGLRenderer({alpha: true, antialias: true, preserveDrawingBuffer: true})
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        element?.appendChild(renderer.domElement)

        let model = null as unknown as THREE.Object3D
        if (functions.isGLTF(props.model)) {
            const loader = new GLTFLoader()
            const gltf = await loader.loadAsync(props.model)
            model = gltf.scene
            model.animations = gltf.animations
        } else if (functions.isOBJ(props.model)) {
            const loader = new OBJLoader()
            model = await loader.loadAsync(props.model)
        } else if (functions.isFBX(props.model)) {
            const loader = new FBXLoader()
            model = await loader.loadAsync(props.model)
        }

        let objMaterials = [] as any
        if (wireframe) {
            await new Promise<void>((resolve) => {
                model.traverse((obj: any) => {
                    if (obj.isMesh) {
                        const geometry = new THREE.WireframeGeometry(obj.geometry)
                        const material = new THREE.LineBasicMaterial({color: 0xf64dff})
                        const wireframe = new THREE.LineSegments(geometry, material)
                        wireframe.name = "wireframe"
                        model.add(wireframe)
                    }
                    resolve()
                })
            })
        }
        const matcapMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.5, metalness: 1.0, envMap: scene.environment})
        await new Promise<void>((resolve) => {
            model.traverse((obj: any) => {
                if (obj.isMesh) {
                    objMaterials.push(obj.material)
                    if (matcap) obj.material = matcapMaterial
                }
                resolve()
            })
        })

        setModel(model)
        setScene(scene)
        setObjMaterials(objMaterials)

        let morphTargets  = [] as any
        let morphMesh = null as any
        model.traverse((mesh) => {
            // @ts-ignore
            if (mesh.isMesh && mesh.morphTargetInfluences?.length) {
                // @ts-ignore
                for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                    // @ts-ignore
                    Object.keys(mesh.morphTargetDictionary).forEach((key) => {
                        // @ts-ignore
                        if (key && mesh.morphTargetDictionary[key] === i) morphTargets.push({name: key, value: mesh.morphTargetInfluences[i]})
                    })
                }
                morphMesh = mesh
            }
        })
        setMorphMesh(morphMesh)
        setInitMorphTargets(JSON.parse(JSON.stringify(morphTargets)))
        setMorphTargets(morphTargets)

        scene.add(model)

        const controlElement = fullscreenRef.current || undefined

        const controls = new OrbitControls(camera, controlElement)

        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3()).length()
        const center = box.getCenter(new THREE.Vector3())

        model.position.x += (model.position.x - center.x)
        model.position.y += (model.position.y - center.y)
        model.position.z += (model.position.z - center.z)

        camera.near = size / 100
        camera.far = size * 100
        camera.updateProjectionMatrix()

        camera.position.copy(center)
        camera.position.x += size / 2.0
        camera.position.y += size / 5.0
        camera.position.z += size / 2.0
        camera.lookAt(center)

        controls.maxDistance = size * 10
        controls.addEventListener("change", () => {
            if (imageTimer) return 
            imageTimer = setTimeout(() => {
                renderer.setClearColor(0x000000, 1)
                setImage(renderer.domElement.toDataURL())
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
        if (model.animations.length && !wireframe) {
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
            if (!image) {
                renderer.setClearColor(0x000000, 1)
                setImage(renderer.domElement.toDataURL())
                renderer.setClearColor(0x000000, 0)
            }
        }

        animate()
        setRef(renderer.domElement)

        window.addEventListener("resize", () => {
            let width = window.innerWidth - functions.sidebarWidth() - 400
            let height = window.innerHeight - functions.titlebarHeight() - functions.navbarHeight() - 150
            if (imageExpand) {
                width = window.innerWidth - functions.sidebarWidth() - 200
                height = window.innerHeight
            }
            // @ts-ignore
            if (document.fullscreenElement || document.webkitIsFullScreen) {
                width = window.innerWidth
                height = window.innerHeight
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            } else {
                if (width < 1000) return
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            }
        })
    }

    const updateMaterials = async () => {
        if (!scene || !model) return
        if (matcap) {
            const matcapMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.5, metalness: 1.0, envMap: scene.environment})
            await new Promise<void>((resolve) => {
                model.traverse((obj: any) => {
                    if (obj.isMesh) {
                        obj.material = matcapMaterial
                    }
                    resolve()
                })
            })
        } else {
            let i = 0
            await new Promise<void>((resolve) => {
                model.traverse((obj: any) => {
                    if (obj.isMesh) {
                        obj.material = objMaterials[i]
                        i++
                    }
                    resolve()
                })
            })
        }
    }

    useEffect(() => {
        setReverse(false)
        setSecondsProgress(0)
        setProgress(0)
        setDragProgress(0)
        setDuration(0)
        setDragging(false)
        setSeekTo(null)
        if (ref) ref.style.opacity = "1"
        loadModel()
    }, [props.model])

    useEffect(() => {
        loadModel()
    }, [wireframe, imageExpand, mobile])

    useEffect(() => {
        updateMaterials()
    }, [scene, model, objMaterials, matcap])

    useEffect(() => {
        if (lights.length === 3) {
            lights[0].intensity = ambient
            lights[1].intensity = directionalFront
            lights[2].intensity = directionalBack
        }
    }, [ambient, directionalBack, directionalFront])

    useEffect(() => {
        if (mixer) {
            if (paused) {
                mixer.timeScale = 0
                return
            }
            if (reverse) {
                if (mixer.time <= 0) mixer.setTime(duration)
                mixer.timeScale = -speed
            } else {
                if (mixer.time >= duration) mixer.setTime(0)
                mixer.timeScale = speed
            }
        }
    }, [mixer, speed, reverse, paused, duration])

    useEffect(() => {
        if (mixer && seekTo) mixer.setTime(seekTo)
    }, [seekTo])

    useEffect(() => {
        if (modelSliderRef.current) modelSliderRef.current.resize()
    })

    const resizeImageCanvas = () => {
        if (!pixelateRef.current || !ref) return
        pixelateRef.current.width = ref.clientWidth
        pixelateRef.current.height = ref.clientHeight
    }

    const exitFullScreen = async () => {
        // @ts-ignore
        if (!document.fullscreenElement && !document.webkitIsFullScreen) {
            await fullscreen(true)
            resizeImageCanvas()
            forceUpdate()
        }
    }

    const handleKeydown = (event: any) => {
        const key = event.keyCode
        const value = String.fromCharCode((96 <= key && key <= 105) ? key - 48 : key).toLowerCase()
        if (!(event.target instanceof HTMLTextAreaElement) && !(event.target instanceof HTMLInputElement) && !(event.target.classList.contains("dialog-textarea"))) {
            if (value === "f") {
                if (!props.noKeydown) fullscreen()
            }
            if (value === "t") {
                setTranslationMode((prev: boolean) => !prev)
                setTranslationDrawingEnabled(true)
            }
        }
    }

    useEffect(() => {
        if (!ref) return
        let observer = null as any
        observer = new ResizeObserver(resizeImageCanvas)
        observer.observe(ref)
        window.addEventListener("keydown", handleKeydown)
        window.addEventListener("fullscreenchange", exitFullScreen)
        window.addEventListener("webkitfullscreenchange", exitFullScreen)
        return () => {
            observer?.disconnect()
            window.removeEventListener("keydown", handleKeydown)
            window.removeEventListener("fullscreenchange", exitFullScreen)
            window.removeEventListener("webkitfullscreenchange", exitFullScreen)
        }
    }, [ref])

    useEffect(() => {
        if (!dragging && dragProgress !== null) {
            setSecondsProgress(dragProgress)
            setProgress((dragProgress / duration) * 100)
            setDragProgress(null)
        }
    }, [dragging, dragProgress])

    const getModelSpeedMarginRight = () => {
        const controlRect = modelControls.current?.getBoundingClientRect()
        const rect = modelSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -5
        return `${raw + offset}px`
    }

    const getModelLightMarginRight = () => {
        const controlRect = modelControls.current?.getBoundingClientRect()
        const rect = modelLightRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -150
        return `${raw + offset}px`
    }

    const getModelMorphMarginRight = () => {
        const controlRect = modelControls.current?.getBoundingClientRect()
        const rect = modelMorphRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -150
        return `${raw + offset}px`
    }

    const updateProgressText = (value: number) => {
        let percent = value / 100
        if (reverse === true) {
            const secondsProgress = (1-percent) * duration
            setDragProgress(duration - secondsProgress)
        } else {
            const secondsProgress = percent * duration
            setDragProgress(secondsProgress)
        }
    }

    const seek = (position: number) => {
        let secondsProgress = (position / 100) * duration
        let progress = (duration / 100) * position
        setProgress(progress)
        setDragging(false)
        setSeekTo(secondsProgress)
    }

    const changeReverse = (value?: boolean) => {
        const val = value !== undefined ? value : !reverse 
        let secondsProgress = val === true ? (duration / 100) * (100 - progress) : (duration / 100) * progress
        // if (gifData) secondsProgress = (duration / 100) * progress
        setReverse(val)
        setSeekTo(secondsProgress)
    }

    useEffect(() => {
        if (!fullscreenRef.current) return
        const element = fullscreenRef.current
        let newContrast = contrast
        const sharpenOverlay = overlayRef.current
        const lightnessOverlay = lightnessRef.current
        if (!image || !sharpenOverlay || !lightnessOverlay) return
        if (sharpen !== 0) {
            const sharpenOpacity = sharpen / 5
            newContrast += 25 * sharpenOpacity
            sharpenOverlay.style.backgroundImage = `url(${image})`
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
    }, [brightness, contrast, hue, saturation, lightness, blur, sharpen, image])

    const imagePixelate = () => {
        if (!pixelateRef.current || !containerRef.current || !ref) return
        const pixelateCanvas = pixelateRef.current
        const ctx = pixelateCanvas.getContext("2d") as any
        const imageWidth = ref.clientWidth 
        const imageHeight = ref.clientHeight
        const landscape = imageWidth >= imageHeight
        ctx.clearRect(0, 0, pixelateCanvas.width, pixelateCanvas.height)
        pixelateCanvas.width = imageWidth
        pixelateCanvas.height = imageHeight
        const pixelWidth = imageWidth / pixelate 
        const pixelHeight = imageHeight / pixelate
        if (pixelate !== 1) {
            ctx.drawImage(ref, 0, 0, pixelWidth, pixelHeight)
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
    }, [pixelate, image, ref])

    useEffect(() => {
        if (downloadFlag) {
            if (downloadIDs.includes(props.post.postID)) {
                functions.download(path.basename(props.model), props.model)
                setDownloadIDs(downloadIDs.filter((s: string) => s !== props.post.postID))
                setDownloadFlag(false)
            }
        }
    }, [downloadFlag])

    const controlMouseEnter = () => {
        if (modelControls.current) modelControls.current.style.opacity = "1"
    }

    const controlMouseLeave = () => {
        setShowSpeedDropdown(false)
        setShowLightDropdown(false)
        setShowMorphDropdown(false)
        if (modelControls.current) modelControls.current.style.opacity = "0"
    }

    const getModelPlayIcon = () => {
        if (paused) return modelPlayIcon
        return modelPauseIcon
    }

    const getModelWireframeIcon = () => {
        if (wireframe) return modelRenderedIcon
        return modelWireframeIcon
    }

    const getModelMatcapIcon = () => {
        if (matcap) return modelTexturedIcon
        return modelMatcapIcon
    }

    const reset = () => {
        changeReverse(false)
        setSpeed(1)
        setPaused(false)
        setShowSpeedDropdown(false)
        setShowLightDropdown(false)
        setShowMorphDropdown(false)
        resetLights()
        resetMorphTargets()
        setTimeout(() => {
            seek(0)
        }, 300)
    }

    const resetLights = () => {
        setAmbient(0.5)
        setDirectionalBack(0.2)
        setDirectionalFront(0.2)
    }

    const fullscreen = async (exit?: boolean) => {
        // @ts-ignore
        if (document.fullscreenElement || document.webkitIsFullScreen || exit) {
            try {
                await document.exitFullscreen?.()
                // @ts-ignore
                await document.webkitExitFullscreen?.()
            } catch {
                // ignore
            }
            if (ref) {
                ref.style.maxWidth = ""
                ref.style.maxHeight = ""
            }
            setTimeout(() => {
                resizeImageCanvas()
            }, 100)
        } else {
            try {
                await fullscreenRef.current?.requestFullscreen?.()
                // @ts-ignore
                await fullscreenRef.current?.webkitRequestFullscreen?.()
            } catch {
                // ignore
            }
            if (ref) {
                ref.style.maxWidth = "100vw"
                ref.style.maxHeight = "100vh"
            }
            setTimeout(() => {
                resizeImageCanvas()
            }, 100)
        }
    }

    const loadImage = async () => {
        if (!image || !overlayRef.current || !lightnessRef.current) return
        const img = document.createElement("img")
        img.src = image
        img.onload = () => {
            if (!overlayRef.current || !lightnessRef.current) return
            const overlayCtx = overlayRef.current.getContext("2d")
            overlayRef.current.width = img.width
            overlayRef.current.height = img.height
            overlayCtx?.drawImage(img, 0, 0, img.width, img.height)
            const lightnessCtx = lightnessRef.current.getContext("2d")
            lightnessRef.current.width = img.width
            lightnessRef.current.height = img.height
            lightnessCtx?.drawImage(img, 0, 0, img.width, img.height)
        }
    }

    useEffect(() => {
        loadImage()
    }, [image])

    const updateMorphTargets = (value?: number, index?: number) => {
        if (!morphMesh?.morphTargetInfluences?.length || !morphTargets?.length) return 
        if (value && index) {
            morphMesh.morphTargetInfluences[index] = value
            morphTargets[index].value = value
        } else {
            for (let i = 0; i < morphTargets.length; i++) {
                morphMesh.morphTargetInfluences[i] = morphTargets[i].value
            }
        }
        setMorphTargets(morphTargets)
    }

    useEffect(() => {
        updateMorphTargets()
    }, [morphMesh, morphTargets])

    const resetMorphTargets = () => {
        if (!morphMesh?.morphTargetInfluences?.length || !initMorphTargets?.length) return 
        for (let i = 0; i < initMorphTargets.length; i++) {
            morphMesh.morphTargetInfluences[i] = initMorphTargets[i].value
        }
        setMorphTargets(JSON.parse(JSON.stringify(initMorphTargets)))
    }

    const shapeKeysDropdownJSX = () => {
        let jsx = [] as any

        for (let i = 0; i < morphTargets.length; i++) {
            jsx.push(
                <div className="model-morph-dropdown-row morph-row">
                    {/* <img className="morph-dropdown-img" src={getAmbientIcon()}/> */}
                    <span className="morph-dropdown-text">{morphTargets[i].name}</span>
                    <Slider className="morph-slider" trackClassName="morph-slider-track" thumbClassName="morph-slider-thumb" onChange={(value) => updateMorphTargets(value, i)} min={0} max={1} step={0.05} value={morphTargets[i].value}/>
                </div>
            )
        }

        return (
            <div className={`model-morph-dropdown ${showMorphDropdown ? "" : "hide-morph-dropdown"}`}
            style={{marginRight: getModelMorphMarginRight(), top: `-300px`}}>
                <div className="model-morph-dropdown-container">
                    {jsx}
                    <div className="model-morph-dropdown-row morph-row">
                        <button className="morph-button" onClick={() => resetMorphTargets()}>Reset</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="post-model-container" style={{zoom: props.scale ? props.scale : 1}}>
            {!props.noTranslations ? <TranslationEditor post={props.post} img={props.model} order={props.order} unverified={props.unverified} translationID={props.translationID}/> : null}
            <div className="post-model-box" ref={containerRef} style={{display: translationMode ? "none" : "flex"}}>
                <div className="post-model-filters" ref={fullscreenRef} onMouseOver={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                    <div className={`post-image-top-buttons ${buttonHover ? "show-post-image-top-buttons" : ""}`} onMouseEnter={() => setButtonHover(true)} onMouseLeave={() => setButtonHover(false)}>
                        {!props.noTranslations ? <img draggable={false} className="post-image-top-button" src={translationToggleOn} style={{filter: getFilter()}} onClick={() => {setTranslationMode(true); setTranslationDrawingEnabled(true)}}/> : null}
                        <img draggable={false} className="post-image-top-button" src={imageExpand ? contract : expand} style={{filter: getFilter()}} onClick={() => setImageExpand((prev: boolean) => !prev)}/>
                    </div>
                    <div className={`post-image-previous-button ${previousButtonHover ? "show-post-image-mid-buttons" : ""}`} onMouseEnter={() => setPreviousButtonHover(true)} onMouseLeave={() => setPreviousButtonHover(false)}>
                        <img draggable={false} className="post-image-mid-button" src={prevIcon} style={{filter: getFilter()}} onClick={() => props.previous?.()}/>
                    </div>
                    <div className={`post-image-next-button ${nextButtonHover ? "show-post-image-mid-buttons" : ""}`} onMouseEnter={() => setNextButtonHover(true)} onMouseLeave={() => setNextButtonHover(false)}>
                        <img draggable={false} className="post-image-mid-button" src={nextIcon} style={{filter: getFilter()}} onClick={() => props.next?.()}/>
                    </div>
                    <div className="relative-ref" style={{alignItems: "center", justifyContent: "center"}}>
                        <div className="model-controls" ref={modelControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
                            {animations ? <div className="model-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                <p className="model-control-text">{dragging ? functions.formatSeconds(dragProgress) : functions.formatSeconds(secondsProgress)}</p>
                                <Slider ref={modelSliderRef} className="model-slider" trackClassName="model-slider-track" thumbClassName="model-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(reverse ? 100 - value : value)}/>
                                <p className="model-control-text">{functions.formatSeconds(duration)}</p>
                            </div> : null}
                            <div className="model-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                {animations ? <>
                                <div className="model-control-row-container">
                                    <img draggable={false} className="model-control-img" onClick={() => changeReverse()} src={modelReverseIcon}/>
                                    <img draggable={false} className="model-control-img" ref={modelSpeedRef} src={modelSpeedIcon} onClick={() => setShowSpeedDropdown((prev) => !prev)}/>
                                </div> 
                                <div className="model-control-row-container">
                                    <img draggable={false} className="model-control-img" src={modelClearIcon} onClick={reset}/>
                                    {/* <img className="control-img" src={modelRewindIcon}/> */}
                                    <img draggable={false} className="model-control-img" onClick={() => setPaused((prev) => !prev)} src={getModelPlayIcon()}/>
                                    {/* <img className="control-img" src={modelFastforwardIcon}/> */}
                                </div></> : null}
                                <div className="model-control-row-container">
                                    <img draggable={false} className="model-control-img" onClick={() => setWireframe((prev) => !prev)} src={getModelWireframeIcon()}/>
                                    <img draggable={false} className="model-control-img" onClick={() => setMatcap((prev) => !prev)} src={getModelMatcapIcon()}/>
                                    <img draggable={false} className="model-control-img" ref={modelMorphRef} src={modelShapeKeysIcon} onClick={() => setShowMorphDropdown((prev) => !prev)}/>
                                    <img draggable={false} className="model-control-img" ref={modelLightRef}  src={modelLightIcon} onClick={() => setShowLightDropdown((prev) => !prev)}/>
                                </div> 
                                <div className="model-control-row-container">
                                    <img draggable={false} className="model-control-img" src={modelFullscreenIcon} onClick={() => fullscreen()}/>
                                </div> 
                            </div>
                            <div className={`model-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getModelSpeedMarginRight(), marginTop: "-240px"}}
                            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                                {/* <Slider ref={gifSpeedSliderRef} invert orientation="vertical" className="model-speed-slider" trackClassName="model-speed-slider-track" thumbClassName="model-speed-slider-thumb"
                                value={speed} min={0.5} max={4} step={0.5} onChange={(value) => setSpeed(value)}/> */}
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(4); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">4x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(2); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">2x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(1.75); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">1.75x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(1.5); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">1.5x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(1.25); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">1.25x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(1); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">1x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(0.75); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">0.75x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(0.5); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">0.5x</span>
                                </div>
                                <div className="model-speed-dropdown-item" onClick={() => {setSpeed(0.25); setShowSpeedDropdown(false)}}>
                                    <span className="model-speed-dropdown-text">0.25x</span>
                                </div>
                            </div>
                            {shapeKeysDropdownJSX()}
                            <div className={`model-light-dropdown ${showLightDropdown ? "" : "hide-light-dropdown"}`}
                            style={{marginRight: getModelLightMarginRight(), top: `-120px`}}>
                                <div className="model-light-dropdown-row lights-row">
                                    <img draggable={false} className="light-dropdown-img" src={ambientLightIcon} style={{filter: getFilter()}}/>
                                    <span className="light-dropdown-text">Ambient</span>
                                    <Slider className="lights-slider" trackClassName="lights-slider-track" thumbClassName="lights-slider-thumb" onChange={(value) => setAmbient(value)} min={0.05} max={1} step={0.05} value={ambient}/>
                                </div>
                                <div className="model-light-dropdown-row lights-row">
                                    <img draggable={false} className="light-dropdown-img" src={directionalLightIcon} style={{filter: getFilter()}}/>
                                    <span className="light-dropdown-text">Directional Front</span>
                                    <Slider className="lights-slider" trackClassName="lights-slider-track" thumbClassName="lights-slider-thumb" onChange={(value) => setDirectionalFront(value)} min={0.05} max={1} step={0.05} value={directionalFront}/>
                                </div>
                                <div className="model-light-dropdown-row lights-row">
                                    <img draggable={false} className="light-dropdown-img" src={directionalLightIcon} style={{filter: getFilter()}}/>
                                    <span className="light-dropdown-text">Directional Back</span>
                                    <Slider className="lights-slider" trackClassName="lights-slider-track" thumbClassName="lights-slider-thumb" onChange={(value) => setDirectionalBack(value)} min={0.05} max={1} step={0.05} value={directionalBack}/>
                                </div>
                                <div className="model-light-dropdown-row lights-row">
                                    <button className="lights-button" onClick={() => resetLights()}>Reset</button>
                                </div>
                            </div>
                        </div>
                        <canvas draggable={false} className="post-lightness-overlay" ref={lightnessRef}></canvas>
                        <canvas draggable={false} className="post-sharpen-overlay" ref={overlayRef}></canvas>
                        <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
                        <div className="post-model-renderer" ref={rendererRef}></div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PostModel