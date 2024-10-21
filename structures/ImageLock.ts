import {createCanvas, loadImage} from "@napi-rs/canvas"
import locked from "../assets/misc/locked.png"
import noImage from "../assets/misc/noimage.png"

const imageLock = async (image: Buffer, resize = true) => {
    const img = await loadImage(image)
    const lockImg = await loadImage(locked)
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
    ctx.fillStyle = "#0d0229"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const lockX = (canvas.width - lockImg.width) / 2
    const lockY = (canvas.height - lockImg.height) / 2
    ctx.drawImage(lockImg, lockX, lockY)

    return canvas.toBuffer("image/png")
}

const imageMissing = async () => {
    const noImageImg = await loadImage(noImage)
    let width = 500
    let height = 500

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#0d0229"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const lockX = (canvas.width - noImageImg.width) / 2
    const lockY = (canvas.height - noImageImg.height) / 2
    ctx.drawImage(noImageImg, lockX, lockY)

    return canvas.toBuffer("image/png")
}

export {imageLock, imageMissing}