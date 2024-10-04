import {createCanvas, loadImage} from "@napi-rs/canvas"

const radians = (angle: number) => {
    return angle * (Math.PI / 180)
}
const random = (seed: number) => {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

let defaultOptions = {
    seed: 0,
    rgbSplitSize: 10,
    rgbSplitAngle: -45,
    rgbSplitVariance: 1,
    rgbSplitOpacity: 100,
    rgbSplitBlendMode: "overlay",
    rgbSplitHue: -180,
    rgbSplitSaturation: 100,
    rgbSplitBrightness: 100
}

const rgbsplit = async (image: Buffer, resize = true, options = defaultOptions as any) => {
    const img = await loadImage(image)
    let greaterValue = img.width > img.height ? img.width : img.height
    const maxDimension = resize ? 500 : greaterValue
    let width = img.width
    let height = img.height

    if (width > height) {
        if (width > maxDimension) {
            height = Math.floor((maxDimension / width) * height)
            width = maxDimension
        }
    } else {
        if (height > maxDimension) {
            width = Math.floor((maxDimension / height) * width)
            height = maxDimension
        }
    }
    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0, width, height)
    
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const pixels = imgData.data
    let greaterRatio = canvas.width > canvas.height ? canvas.width : canvas.height

    const blocks = pixels.length / 4
    const blockSize = Math.ceil(greaterRatio / (1000 / options.rgbSplitSize))
    const variance = Math.floor(greaterRatio / (1000 / options.rgbSplitVariance))
    let angle = radians(options.rgbSplitAngle)

    let length = imgData.width + imgData.height
    let startX = Math.floor(imgData.width / 2)
    let colorArray = ["r", "g"]
    let rgbIndex = 0
    for (let startY = -imgData.height; startY < imgData.height * 2; startY += blockSize + (random(options.seed + startY) * variance)) {
        if (rgbIndex > colorArray.length - 1) rgbIndex = 0
        for (let blockIndex = 0; blockIndex < blockSize + (random(options.seed + startY) * variance); blockIndex++) {
            for (let m = 0; m < length; m++) {
                const x = m * Math.cos(angle) + startX
                const y = m * Math.sin(angle) + startY + blockIndex
                const row = Math.floor(y)
                const col = Math.floor(x)
                if (row >= 0 && row < imgData.height && col >= 0 && col < imgData.width) {
                    const i = (row * imgData.width + col) * 4
                    if (colorArray[rgbIndex] === "r") {
                        pixels[i + 1] = 0
                        pixels[i + 2] = 0
                    } else if (colorArray[rgbIndex] === "g") {
                        pixels[i] = 0
                        pixels[i + 2] = 0
                    } else if (colorArray[rgbIndex] === "b") {
                        pixels[i] = 0
                        pixels[i + 1] = 0
                    }
                }
                const x2 = -m * Math.cos(angle) + startX
                const y2 = -m * Math.sin(angle) + startY + blockIndex
                const row2 = Math.floor(y2)
                const col2 = Math.floor(x2)
                if (row2 >= 0 && row2 < imgData.height && col2 >= 0 && col2 < imgData.width) {
                    const i = (row2 * imgData.width + col2) * 4
                    if (colorArray[rgbIndex] === "r") {
                        pixels[i + 1] = 0
                        pixels[i + 2] = 0
                    } else if (colorArray[rgbIndex] === "g") {
                        pixels[i] = 0
                        pixels[i + 2] = 0
                    } else if (colorArray[rgbIndex] === "b") {
                        pixels[i] = 0
                        pixels[i + 1] = 0
                    }
                }
            }
        }
        rgbIndex++
    }

    const tempCanvas = createCanvas(canvas.width, canvas.height)
    const tempCtx = tempCanvas.getContext("2d")
    tempCtx.putImageData(imgData, 0, 0)

    ctx.globalAlpha = options.rgbSplitOpacity / 100
    ctx.globalCompositeOperation = options.rgbSplitBlendMode as any
    ctx.filter = `hue-rotate(${options.rgbSplitHue}deg) saturate(${100 + options.rgbSplitSaturation}%) brightness(${100 + options.rgbSplitBrightness}%)`
    ctx.drawImage(tempCanvas, 0, 0)

    return canvas.toBuffer("image/png")
}

export default rgbsplit