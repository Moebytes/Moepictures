import path from "path"
import functions from "./Functions"

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"]
const videoExtensions = [".mp4", ".webm", ".mov", ".mkv"]
const audioExtensions = [".mp3", ".wav", ".ogg", ".flac", ".aac"]
const modelExtensions = [".glb", ".gltf", ".fbx", ".vrm", ".obj"]
const live2dExtensions = [".zip"]

export default class FileFunctions {
    public static isImage = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, imageExtensions)
        }
        if (file.startsWith("data:image")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, imageExtensions)
    }

    public static isAudio = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, audioExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, audioExtensions)
    }

    public static isModel = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, modelExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, modelExtensions)
    }

    public static isLive2D = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, live2dExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, live2dExtensions)
    }

    public static isGIF = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".gif"
        }
        if (file?.startsWith("data:image/gif")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".gif"
    }

    public static isWebP = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webp"
        }
        if (file?.startsWith("data:image/webp")) {
            return true
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".webp"
    }

    public static isGLTF = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".glb"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".glb"
    }

    public static isOBJ = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".obj"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".obj"
    }

    public static isFBX = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".fbx"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".fbx"
    }

    public static isVRM = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".vrm"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".vrm"
    }

    public static isAnimatedWebp = (buffer: ArrayBuffer) => {
        let str = ""
        const byteArray = new Uint8Array(buffer)
        for (let i = 0; i < byteArray.length; i++) {
            str += String.fromCharCode(byteArray[i])
        }
        return str.indexOf("ANMF") !== -1
    }

    public static isVideo = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return functions.util.arrayIncludes(ext, videoExtensions)
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return functions.util.arrayIncludes(ext, videoExtensions)
    }

    public static isMP4 = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".mp4"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".mp4"
    }

    public static isWebM = (file?: string) => {
        if (!file) return false
        file = file.replace(/\?.*$/, "")
        if (file?.startsWith("blob:")) {
            const ext = file.split("#")?.[1] || ""
            return ext === ".webm"
        }
        const ext = file.startsWith(".") ? file : path.extname(file)
        return ext === ".webm"
    }
}