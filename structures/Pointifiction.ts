import {createCanvas, loadImage} from "@napi-rs/canvas"

const hexToRgb = (hex: string) => {
    const bigint = parseInt(hex.replace("#", ""), 16)
    return { 
        r: (bigint >> 16) & 255, 
        g: (bigint >> 8) & 255, 
        b: bigint & 255 
    }
}

const random = (seed: number) => {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
}

const randomColor = (seed: number = 0) => {
    return Math.floor(random(seed)*16777215).toString(16)
}

let defaultOptions = {
    seed: 0,
    pointSize: 2,
    pointSpacing: 70,
    pointVariance: 0,
    pointAlpha: true,
    pointInvert: false,
    pointOpacity: 100,
    pointFill: "#000000",
    pointNoise: false,
    pointBrightness: 0,
    pointContrast: 0
}

const pointifiction = async (image: Buffer, resize = true, options = defaultOptions as any) => {
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
    const blockSize = Math.ceil(greaterRatio / (1000 / options.pointSize))
    let spacing = Math.ceil(greaterRatio / (1000 / (options.pointSpacing / 10)))
    const variance = Math.floor(greaterRatio / (1000 / options.pointVariance))

    const pointMask = createCanvas(canvas.width, canvas.height)
    const pointCtx = pointMask.getContext("2d")
    pointCtx.fillStyle = "#000000"
    pointCtx.fillRect(0, 0, pointMask.width, pointMask.height)

    for (let x = spacing; x < pointMask.width; x += blockSize + spacing + (random(options.seed+x) * variance)) {
        for (let y = spacing; y < pointMask.height; y += blockSize + spacing + (random(options.seed+y) * variance)) {
            let x2 = x + blockSize
            const length = x2 - x
            pointCtx.beginPath()
            pointCtx.moveTo(x, y)
            pointCtx.lineTo(x2, y)
            pointCtx.lineTo(x2, y - length)
            pointCtx.lineTo(x, y - length)
            pointCtx.closePath()
            pointCtx.fillStyle = "#ffffff"
            pointCtx.fill()
        }
    }

    const pointData = pointCtx.getImageData(0, 0, pointMask.width, pointMask.height)
    const pointPixels = pointData.data

    // Apply the mask
    for (let i = 0; i < pixels.length; i += 4) {
        const fillColor = options.pointNoise ? randomColor(options.seed) : options.pointFill
        const {r: fillRBase, g: fillGBase, b: fillBBase} = hexToRgb(fillColor)

        let r = pixels[i]
        let g = pixels[i + 1]
        let b = pixels[i + 2]
        let a = pixels[i + 3]
        let fillR = options.pointAlpha ? 0 : fillRBase
        let fillG = options.pointAlpha ? 0 : fillGBase
        let fillB = options.pointAlpha ? 0 : fillBBase
        let fillA = options.pointAlpha ? 0 : a

        fillR = r + (fillR - r) * (options.pointOpacity / 100)
        fillG = g + (fillG - g) * (options.pointOpacity / 100)
        fillB = b + (fillB - b) * (options.pointOpacity / 100)

        if (pointPixels[i] === 255 && pointPixels[i + 1] === 255 && pointPixels[i + 2] === 255) {
            pixels[i] = options.pointInvert ? fillR : r
            pixels[i + 1] = options.pointInvert ? fillG : g
            pixels[i + 2] = options.pointInvert ? fillB : b
            pixels[i + 3] = options.pointInvert ? fillA : a
        } else {
            pixels[i] = options.pointInvert ? r : fillR
            pixels[i + 1] = options.pointInvert ? g : fillG
            pixels[i + 2] = options.pointInvert ? b : fillB
            pixels[i + 3] = options.pointInvert ? a : fillA
        }
    }

    const tempCanvas = createCanvas(canvas.width, canvas.height)
    const tempCtx = tempCanvas.getContext("2d")
    tempCtx.putImageData(imgData, 0, 0)

    ctx.filter = `brightness(${100 + options.pointBrightness}%) contrast(${100 + options.pointContrast}%)`
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(tempCanvas, 0, 0)

    return canvas.toBuffer("image/png")
}

export default pointifiction