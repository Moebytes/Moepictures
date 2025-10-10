import React, {useEffect, useState, forwardRef, useImperativeHandle} from "react"
import withGridWrapper, {GridWrapperProps, GridWrapperRef} from "./withGridWrapper"
import {useSessionSelector, useSearchSelector, usePlaybackSelector, usePlaybackActions, useLayoutSelector,
useInteractionActions} from "../../store"
import path from "path"
import * as THREE from "three"
import {OrbitControls, GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"
import {VRMLoaderPlugin} from "@pixiv/three-vrm"
import functions from "../../functions/Functions"

let imageTimer = null as any
let id = null as any

const GridModel = forwardRef<GridWrapperRef, GridWrapperProps>((props, parentRef) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {reverse, speed, duration} = usePlaybackSelector()
    const {setSecondsProgress, setReverse, setSeekTo, setProgress, setDuration} = usePlaybackActions()
    const {setEnableDrag} = useInteractionActions()
    const {sizeType, format} = useSearchSelector()
    const {imageLoaded, setImageLoaded} = props
    const {imageWidth, setImageWidth} = props
    const {imageHeight, setImageHeight} = props
    const {naturalWidth, setNaturalWidth} = props
    const {naturalHeight, setNaturalHeight} = props
    const {imageSize, setImageSize} = props
    const [screenshot, setScreenshot] = useState(props.cached ? props.img : "")
    const [mixer, setMixer] = useState(null as unknown as THREE.AnimationMixer | null)
    const [animations, setAnimations] = useState(null as unknown as THREE.AnimationClip[] | null)
    const {modelRef, imageRef, rendererRef, imageFiltersRef, lightnessRef, overlayRef, effectRef, pixelateRef} = props

    useImperativeHandle(props.componentRef, () => ({
        shouldWait: async () => {
            return true
        },
        load: async () => {
            load()
        },
        update: async () => {
            await loadImage()
            if (session.liveModelPreview && !mobile) loadModel()
        }
    }))

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const load = async () => {
        if (imageLoaded) return
        await loadImage()
        if (session.liveModelPreview && !mobile) loadModel()
    }
    
    useEffect(() => {
        props.reupdate?.()
    }, [imageSize])

    useEffect(() => {
        setImageLoaded(false)
        setReverse(false)
        setSecondsProgress(0)
        setProgress(0)
        setSeekTo(null)
        if (props.autoLoad) load()
    }, [props.original])

    const loadImage = async () => {
        const img = await functions.crypto.decryptThumb(props.img, session)
        setScreenshot(img)
    }

    const loadModel = async () => {
        const decrypted = await functions.crypto.decryptItem(props.original, session)

        const element = modelRef.current
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
        if (functions.file.isGLTF(props.original)) {
            const loader = new GLTFLoader()
            const gltf = await loader.loadAsync(decrypted)
            model = gltf.scene
            model.animations = gltf.animations
        } else if (functions.file.isOBJ(props.original)) {
            const loader = new OBJLoader()
            model = await loader.loadAsync(decrypted)
        } else if (functions.file.isFBX(props.original)) {
            const loader = new FBXLoader()
            model = await loader.loadAsync(decrypted)
        } else if (functions.file.isVRM(props.original)) {
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
        rendererRef.current = renderer.domElement
        setImageLoaded(true)
        props.onLoad?.()
    }

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

    const download = async () => {
        const decrypted = await functions.crypto.decryptItem(props.original, session)
        let filename = path.basename(props.original).replace(/\?.*$/, "")
        functions.dom.download(filename, decrypted)
    }

    const onLoad = (event: React.SyntheticEvent) => {
        let element = event.target as HTMLImageElement
        setImageWidth(element.width)
        setImageHeight(element.height)
        setNaturalWidth(element.naturalWidth)
        setNaturalHeight(element.naturalHeight)
        setImageLoaded(true)
        element.style.opacity = "1"
        props.onLoad?.()
    }

    return (
        <>
        <img draggable={false} className="lightness-overlay" ref={lightnessRef} src={screenshot}/>
        <img draggable={false} className="sharpen-overlay" ref={overlayRef} src={screenshot}/>

        <canvas draggable={false} className="effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="pixelate-canvas" ref={pixelateRef}></canvas>

        {session.liveModelPreview && !mobile ? null : 
        <img draggable={false} className="image" ref={imageRef} src={screenshot} onLoad={(event) => onLoad(event)}/>}
        <div className="grid-model-renderer" ref={modelRef} onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}
        style={mobile || !session.liveModelPreview ? {display: "none"} : {opacity: "1"}}></div>
        </>
    )
})

export default withGridWrapper(GridModel)