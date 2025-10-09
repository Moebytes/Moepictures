import functions from "./Functions"
import * as THREE from "three"
import {Live2DCubismModel} from "live2d-renderer"
import {GLTFLoader, OBJLoader, FBXLoader} from "three-stdlib"
import {VRMLoaderPlugin} from "@pixiv/three-vrm"

export default class ModelFunctions {
    public static readablePolycount = (polycount: number) => {
        const i = polycount === 0 ? 0 : Math.floor(Math.log(polycount) / Math.log(1000))
        return `${Number((polycount / Math.pow(1000, i)).toFixed(2))} ${["P", "KP", "MP", "GP", "TP"][i]}`
    }

    public static modelDimensions = async (model: string) => {
        const scene = new THREE.Scene()
        const renderer = new THREE.WebGLRenderer()

        let object = null as unknown as THREE.Object3D
        if (functions.file.isGLTF(model)) {
            const loader = new GLTFLoader()
            object = await loader.loadAsync(model).then((l) => l.scene)
        } else if (functions.file.isOBJ(model)) {
            const loader = new OBJLoader()
            object = await loader.loadAsync(model)
        } else if (functions.file.isFBX(model)) {
            const loader = new FBXLoader()
            object = await loader.loadAsync(model)
        } else if (functions.file.isVRM(model)) {
            const loader = new GLTFLoader()
            loader.register((parser: any) => {
                return new VRMLoaderPlugin(parser) as any
            })
            const vrm = await loader.loadAsync(model).then((l) => l.userData.vrm)
            object = vrm.scene
        }
        scene.add(object)
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
        renderer.render(scene, camera)

        const box = new THREE.Box3().setFromObject(object)
        const convertToPixels = (vec: THREE.Vector3) => {
            const projected = vec.clone().project(camera)
            return {
                x: (projected.x * 0.5 + 0.5) * window.innerWidth,
                y: (1 - (projected.y * 0.5 + 0.5)) * window.innerHeight
            }
        }
        const minScreen = convertToPixels(box.min)
        const maxScreen = convertToPixels(box.max)
        const width = Math.round(Math.abs(maxScreen.x - minScreen.x))
        const height = Math.round(Math.abs(maxScreen.y - minScreen.y))
        const polycount = renderer.info.render.triangles
        const r = await fetch(model).then((r) => r.arrayBuffer())
        const size = r.byteLength
        return {width, height, size, polycount}
    }

    public static modelImage = async (model: string, ext: string, imageSize?: number) => {
        if (!imageSize) imageSize = 500
        const width = imageSize
        const height = imageSize
        const scene = new THREE.Scene()
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
        const light = new THREE.AmbientLight(0xffffff, 0.5)
        const light2 = new THREE.DirectionalLight(0xffffff, 0.2)
        light2.position.set(30, 100, 100)
        const light3 = new THREE.DirectionalLight(0xffffff, 0.2)
        light3.position.set(-30, 100, -100)
        scene.add(light, light2, light3)
        
        const renderer = new THREE.WebGLRenderer({alpha: true, preserveDrawingBuffer: true, powerPreference: "low-power"})
        renderer.outputEncoding = THREE.sRGBEncoding
        renderer.setClearColor(0x000000, 0)
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)

        let object = null as unknown as THREE.Object3D
        if (functions.file.isGLTF(ext)) {
            const loader = new GLTFLoader()
            object = await loader.loadAsync(model).then((l) => l.scene)
        } else if (functions.file.isOBJ(ext)) {
            const loader = new OBJLoader()
            object = await loader.loadAsync(model)
        } else if (functions.file.isFBX(ext)) {
            const loader = new FBXLoader()
            object = await loader.loadAsync(model)
        } else if (functions.file.isVRM(model)) {
            const loader = new GLTFLoader()
            loader.register((parser: any) => {
                return new VRMLoaderPlugin(parser) as any
            })
            const vrm = await loader.loadAsync(model).then((l) => l.userData.vrm)
            if (vrm.meta?.metaVersion === "0") {
                scene.rotation.y = Math.PI
            }
            object = vrm.scene
        }
        scene.add(object)

        const box = new THREE.Box3().setFromObject(object)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())

        object.position.sub(center)
        const euler = new THREE.Euler(0, 0, 0, "XYZ")
        object.rotation.copy(euler)

        const maxDim = Math.max(size.x, size.y, size.z)
        const fovRad = (camera.fov * Math.PI) / 180
        const distance = maxDim / (2 * Math.tan(fovRad / 2))
        camera.position.set(0, 0, distance)
        camera.lookAt(0, 0, 0)

        camera.near = distance / 10
        camera.far = distance * 10
        camera.updateProjectionMatrix()

        let loopCount = 0
        let id: number

        return new Promise<string>((resolve) => {
            const animate = () => {
                loopCount++
                renderer.render(scene, camera)
                if (loopCount >= 10) {
                    window.cancelAnimationFrame(id)
                    resolve(renderer.domElement.toDataURL())
                } else {
                    id = window.requestAnimationFrame(animate)
                }
            }
            id = window.requestAnimationFrame(animate)
        })
    }

    public static live2dDimensions = async (live2d: string) => {
        const canvas = document.createElement("canvas")
        canvas.width = 1000
        canvas.height = 1000
        const model = new Live2DCubismModel(canvas, {autoAnimate: false})
        await model.load(live2d)
        const width = model.width
        const height = model.height
        const size = model.size
        return {width, height, size}
    }

    public static live2dScreenshot = async (live2d: string, imageSize?: number) => {
        if (!imageSize) imageSize = 1000
        const canvas = document.createElement("canvas")
        canvas.width = imageSize
        canvas.height = imageSize
        const model = new Live2DCubismModel(canvas, {autoAnimate: false})
        await model.load(live2d)
        const screenshot = await model.takeScreenshot()
        return screenshot
    }
}