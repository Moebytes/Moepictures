import React, {useEffect, useState, useRef, forwardRef, useImperativeHandle} from "react"
import {useNavigate} from "react-router-dom"
import withPostWrapper, {PostWrapperProps, PostWrapperRef} from "./withPostWrapper"
import {useSessionSelector, useLayoutSelector, usePlaybackSelector, usePlaybackActions, useSearchSelector, 
useInteractionActions} from "../../store"
import Slider from "react-slider"
import modelReverseIcon from "../../assets/icons/model-reverse.png"
import modelSpeedIcon from "../../assets/icons/model-speed.png"
import modelClearIcon from "../../assets/icons/model-clear.png"
import modelPlayIcon from "../../assets/icons/model-play.png"
import modelPauseIcon from "../../assets/icons/model-pause.png"
import modelFullscreenIcon from "../../assets/icons/model-fullscreen.png"
import modelWireframeIcon from "../../assets/icons/model-wireframe.png"
import modelRenderedIcon from "../../assets/icons/model-rendered.png"
import modelMatcapIcon from "../../assets/icons/model-matcap.png"
import modelTexturedIcon from "../../assets/icons/model-textured.png"
import modelShapeKeysIcon from "../../assets/icons/model-shapekeys.png"
import modelLightIcon from "../../assets/icons/model-light.png"
import ambientLightIcon from "../../assets/icons/ambient.png"
import directionalLightIcon from "../../assets/icons/directional.png"
import * as THREE from "three"
import {OrbitControls, GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"
import {VRMLoaderPlugin} from "@pixiv/three-vrm"
import path from "path"
import functions from "../../functions/Functions"
import "./styles/postmodel.less"

let imageTimer = null as any
let id = 0

const PostModel = forwardRef<PostWrapperRef, PostWrapperProps>((props, parentRef) => {
    const {mobile} = useLayoutSelector()
    const {session} = useSessionSelector()
    const {secondsProgress, progress, dragProgress, reverse, speed, 
    paused, duration, dragging, seekTo} = usePlaybackSelector()
    const {setSecondsProgress, setProgress, setDragProgress, setReverse, setSpeed,
    setPaused, setDuration, setDragging, setSeekTo} = usePlaybackActions()
    const {setEnableDrag} = useInteractionActions()
    const {imageExpand, format} = useSearchSelector()
    const [showLightDropdown, setShowLightDropdown] = useState(false)
    const [showMorphDropdown, setShowMorphDropdown] = useState(false)
    const modelSliderRef = useRef<Slider>(null)
    const modelControls = useRef<HTMLDivElement>(null)
    const modelSpeedRef = useRef<HTMLImageElement>(null)
    const modelLightRef = useRef<HTMLImageElement>(null)
    const modelMorphRef = useRef<HTMLImageElement>(null)
    const [image, setImage] = useState(null as string | null)
    const [mixer, setMixer] = useState(null as unknown as THREE.AnimationMixer | null)
    const [animations, setAnimations] = useState(null as unknown as THREE.AnimationClip[] | null)
    const [wireframe, setWireframe] = useState(false)
    const [matcap, setMatcap] = useState(false)
    const [ambient, setAmbient] = useState(0.5)
    const [directionalFront, setDirectionalFront] = useState(0.2)
    const [directionalBack, setDirectionalBack] = useState(0.2)
    const [lights, setLights] = useState([] as (THREE.DirectionalLight | THREE.AmbientLight)[])
    const [morphMesh, setMorphMesh] = useState(null as THREE.Mesh | null)
    const [initMorphTargets, setInitMorphTargets] = useState([] as {name: string, value: number}[])
    const [morphTargets, setMorphTargets] = useState([] as {name: string, value: number}[])
    const [model, setModel] = useState(null as THREE.Object3D | null)
    const [controls, setControls] = useState(null as OrbitControls | null)
    const [modelWidth, setModelWidth] = useState(0)
    const [modelHeight, setModelHeight] = useState(0)
    const [scene, setScene] = useState(null as THREE.Scene | null)
    const [objMaterials, setObjMaterials] = useState([] as THREE.Material[])
    const [modelLink, setModelLink] = useState("")
    const {toggleFullscreen, changeReverse, seek, updateProgressText, updateEffects} = props
    const {showSpeedDropdown, setShowSpeedDropdown} = props
    const {modelRef, rendererRef, fullscreenRef, lightnessRef, overlayRef, effectRef, pixelateRef, onLoaded} = props
    const navigate = useNavigate()

    useImperativeHandle(parentRef, () => ({
        download: download
    }))

    const decryptModel = async () => {
        if (!props.model) return
        const decryptedModel = await functions.crypto.decryptItem(props.model, session)
        if (decryptedModel) setModelLink(decryptedModel)
    }

    useEffect(() => {
        setReverse(false)
        setSecondsProgress(0)
        setProgress(0)
        setDragProgress(0)
        setDragging(false)
        setSeekTo(null)
        if (rendererRef.current) rendererRef.current.style.opacity = "1"
    }, [props.model])

    useEffect(() => {
        decryptModel()
    }, [props.model, session])

    useEffect(() => {
        if (modelLink) loadModel()
    }, [modelLink])

    const loadModel = async () => {
        if (!props.model || !modelLink) return
        const element = modelRef.current
        window.cancelAnimationFrame(id)
        while (element?.lastChild) element?.removeChild(element.lastChild)
        let width = window.innerWidth - functions.dom.sidebarWidth() - 400
        if (mobile) width = window.innerWidth - 10
        let height = window.innerHeight - functions.dom.titlebarHeight() - functions.dom.navbarHeight() - 150
        if (imageExpand) {
            width = window.innerWidth - functions.dom.sidebarWidth() - 200
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
        if (functions.file.isGLTF(props.model)) {
            const loader = new GLTFLoader()
            const gltf = await loader.loadAsync(modelLink)
            model = gltf.scene
            model.animations = gltf.animations
        } else if (functions.file.isOBJ(props.model)) {
            const loader = new OBJLoader()
            model = await loader.loadAsync(modelLink)
        } else if (functions.file.isFBX(props.model)) {
            const loader = new FBXLoader()
            model = await loader.loadAsync(modelLink)
        } else if (functions.file.isVRM(props.model)) {
            const loader = new GLTFLoader()
            loader.register((parser: any) => {
                return new VRMLoaderPlugin(parser) as any
            })
            const vrm = await loader.loadAsync(modelLink).then((l) => l.userData.vrm)
            if (vrm.meta?.metaVersion === "0") {
                scene.rotation.y = Math.PI
            }
            model = vrm.scene
        }

        let objMaterials = [] as THREE.Material[]
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
        setModelWidth(width)
        setModelHeight(height)

        let morphTargets  = [] as {name: string, value: number}[]
        let morphMesh = null as THREE.Mesh | null
        model.traverse((mesh: any) => {
            if (mesh.isMesh && mesh.morphTargetInfluences?.length) {
                for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
                    Object.keys(mesh.morphTargetDictionary).forEach((key) => {
                        if (key && mesh.morphTargetDictionary[key] === i) {
                            morphTargets.push({name: key, value: mesh.morphTargetInfluences[i]})
                        }
                    })
                }
                morphMesh = mesh as THREE.Mesh
            }
        })
        setMorphMesh(morphMesh)
        setInitMorphTargets(JSON.parse(JSON.stringify(morphTargets)))
        setMorphTargets(morphTargets)

        scene.add(model)

        const controlElement = fullscreenRef.current || undefined
        const controls = new OrbitControls(camera, controlElement)

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
        controls.addEventListener("change", async () => {
            if (imageTimer) return 
            imageTimer = setTimeout(() => {
                renderer.setClearColor(0x000000, 1)
                setImage(renderer.domElement.toDataURL())
                renderer.setClearColor(0x000000, 0)
                imageTimer = null
                updateEffects()
            }, 50)
        })
        controls.update()
        setControls(controls)

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
        rendererRef.current = renderer.domElement

        window.addEventListener("resize", () => {
            let width = window.innerWidth - functions.dom.sidebarWidth() - 400
            let height = window.innerHeight - functions.dom.titlebarHeight() - functions.dom.navbarHeight() - 150
            if (imageExpand) {
                width = window.innerWidth - functions.dom.sidebarWidth() - 200
                height = window.innerHeight
            }
            if (document.fullscreenElement) {
                width = window.innerWidth
                height = window.innerHeight
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            } else {
                camera.aspect = width / height
                camera.updateProjectionMatrix()
                renderer.setSize(width, height)
            }
            setModelWidth(width)
            setModelHeight(height)
        })
    }

    const updateMaterials = async () => {
        if (!scene || !model) return
        if (matcap) {
            const matcapMaterial = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.5, 
                metalness: 1.0, envMap: scene.environment})
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
        if (!controls) return
        controls.enabled = !showSpeedDropdown &&
        !showLightDropdown && !showMorphDropdown
    }, [controls, showSpeedDropdown, showLightDropdown, showMorphDropdown])

    useEffect(() => {
        if (modelSliderRef.current) modelSliderRef.current.resize()
    })

    const getSpeedMarginRight = () => {
        const controlRect = modelControls.current?.getBoundingClientRect()
        const rect = modelSpeedRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -5
        return `${raw + offset}px`
    }

    const getLightMarginRight = () => {
        const controlRect = modelControls.current?.getBoundingClientRect()
        const rect = modelLightRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -150
        return `${raw + offset}px`
    }

    const getMorphMarginRight = () => {
        const controlRect = modelControls.current?.getBoundingClientRect()
        const rect = modelMorphRef.current?.getBoundingClientRect()
        if (!rect || !controlRect) return "400px"
        const raw = controlRect.right - rect.right
        let offset = -150
        return `${raw + offset}px`
    }

    const download = async () => {
        let filename = path.basename(props.model!).replace(/\?.*$/, "")
        functions.dom.download(filename, modelLink)
    }

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
        let jsx = [] as React.ReactElement[]
        for (let i = 0; i < morphTargets.length; i++) {
            jsx.push(
                <div className="model-dropdown-row model-row">
                    <span className="model-dropdown-text">{morphTargets[i].name}</span>
                    <Slider className="model-slider" trackClassName="model-slider-track" thumbClassName="model-slider-thumb" 
                    onChange={(value) => updateMorphTargets(value, i)} min={0} max={1} step={0.05} value={morphTargets[i].value}/>
                </div>
            )
        }

        return (
            <div className={`model-dropdown ${showMorphDropdown ? "" : "hide-model-dropdown"}`}
            style={{marginRight: getMorphMarginRight(), top: `-300px`}}>
                <div className="model-dropdown-container">
                    {jsx}
                    <div className="model-dropdown-row model-row">
                        <button className="model-button" onClick={() => resetMorphTargets()}>Reset</button>
                    </div>
                </div>
            </div>
        )
    }

    const toggleDropdown = (type: string) => {
        if (type === "morph") {
            setShowLightDropdown(false)
            setShowSpeedDropdown(false)
            setShowMorphDropdown((prev) => !prev)
        } else if (type === "light") {
            setShowMorphDropdown(false)
            setShowSpeedDropdown(false)
            setShowLightDropdown((prev) => !prev)
        } else if (type === "speed") {
            setShowMorphDropdown(false)
            setShowLightDropdown(false)
            setShowSpeedDropdown((prev) => !prev)
        }
    }


    return (
        <>
        <div className="model-controls" ref={modelControls} onMouseUp={() => setDragging(false)} onMouseOver={controlMouseEnter} onMouseLeave={controlMouseLeave}>
            {animations ? <div className="model-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                <p className="model-control-text">{dragging ? functions.date.formatSeconds(dragProgress || 0) : functions.date.formatSeconds(secondsProgress)}</p>
                <Slider ref={modelSliderRef} className="model-slider" trackClassName="model-slider-track" thumbClassName="model-slider-thumb" min={0} max={100} value={progress} onBeforeChange={() => setDragging(true)} onChange={(value) => updateProgressText(value)} onAfterChange={(value) => seek(reverse ? 100 - value : value)}/>
                <p className="model-control-text">{functions.date.formatSeconds(duration)}</p>
            </div> : null}
            <div className="model-control-row" onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
                {animations ? <>
                <div className="model-control-row-container">
                    <img draggable={false} className="image-control-img" onClick={() => changeReverse()} src={modelReverseIcon}/>
                    <img draggable={false} className="image-control-img" ref={modelSpeedRef} src={modelSpeedIcon} onClick={() => toggleDropdown("speed")}/>
                </div> 
                <div className="model-control-row-container">
                    <img draggable={false} className="image-control-img" src={modelClearIcon} onClick={reset}/>
                    {/* <img className="control-img" src={modelRewindIcon}/> */}
                    <img draggable={false} className="image-control-img" onClick={() => setPaused(!paused)} src={getModelPlayIcon()}/>
                    {/* <img className="control-img" src={modelFastforwardIcon}/> */}
                </div></> : null}
                <div className="model-control-row-container">
                    <img draggable={false} className="image-control-img" onClick={() => setWireframe((prev) => !prev)} src={getModelWireframeIcon()}/>
                    <img draggable={false} className="image-control-img" onClick={() => setMatcap((prev) => !prev)} src={getModelMatcapIcon()}/>
                    <img draggable={false} className="image-control-img" ref={modelMorphRef} src={modelShapeKeysIcon} onClick={() => toggleDropdown("morph")}/>
                    <img draggable={false} className="image-control-img" ref={modelLightRef}  src={modelLightIcon} onClick={() => toggleDropdown("light")}/>
                </div> 
                <div className="model-control-row-container">
                    <img draggable={false} className="image-control-img" src={modelFullscreenIcon} onClick={() => toggleFullscreen()}/>
                </div> 
            </div>
            <div className={`model-speed-dropdown ${showSpeedDropdown ? "" : "hide-speed-dropdown"}`} style={{marginRight: getSpeedMarginRight(), marginTop: "-240px"}}
            onMouseEnter={() => setEnableDrag(false)} onMouseLeave={() => setEnableDrag(true)}>
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
            <div className={`model-dropdown ${showLightDropdown ? "" : "hide-model-dropdown"}`}
            style={{marginRight: getLightMarginRight(), top: `-140px`}}>
                <div className="model-dropdown-row model-row">
                    <img draggable={false} className="model-dropdown-img" src={ambientLightIcon}/>
                    <span className="model-dropdown-text">Ambient</span>
                    <Slider className="model-slider" trackClassName="model-slider-track" thumbClassName="model-slider-thumb" onChange={(value) => setAmbient(value)} min={0.05} max={1} step={0.05} value={ambient}/>
                </div>
                <div className="model-dropdown-row model-row">
                    <img draggable={false} className="model-dropdown-img" src={directionalLightIcon}/>
                    <span className="model-dropdown-text">Directional Front</span>
                    <Slider className="model-slider" trackClassName="model-slider-track" thumbClassName="model-slider-thumb" onChange={(value) => setDirectionalFront(value)} min={0.05} max={1} step={0.05} value={directionalFront}/>
                </div>
                <div className="model-dropdown-row model-row">
                    <img draggable={false} className="model-dropdown-img" src={directionalLightIcon}/>
                    <span className="model-dropdown-text">Directional Back</span>
                    <Slider className="model-slider" trackClassName="model-slider-track" thumbClassName="model-slider-thumb" onChange={(value) => setDirectionalBack(value)} min={0.05} max={1} step={0.05} value={directionalBack}/>
                </div>
                <div className="model-dropdown-row model-row">
                    <button className="model-button" onClick={() => resetLights()}>Reset</button>
                </div>
            </div>
        </div>
        <img draggable={false} className="post-lightness-overlay" ref={lightnessRef}/>
        <img draggable={false} className="post-sharpen-overlay" ref={overlayRef}/>
        <canvas draggable={false} className="post-effect-canvas" ref={effectRef}></canvas>
        <canvas draggable={false} className="post-pixelate-canvas" ref={pixelateRef}></canvas>
        <div className="post-model-renderer" ref={modelRef}></div>
        </>
    )
})

export default withPostWrapper(PostModel)