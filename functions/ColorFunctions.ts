import {hexToRgb} from "../structures/Color"

export default class ColorFunctions {
    public static parseTransparentColor = (color: string) => {
        return Number(`0x${color.replace(/^#/, "")}`)
    }

    public static rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255
        g /= 255
        b /= 255
        let cmin = Math.min(r,g,b),
            cmax = Math.max(r,g,b),
            delta = cmax - cmin,
            h = 0,
            s = 0,
            l = 0
        if (delta == 0) 
            h = 0
        // Red is max
        else if (cmax == r)
            h = ((g - b) / delta) % 6
        // Green is max
        else if (cmax == g)
            h = (b - r) / delta + 2
        // Blue is max
        else
            h = (r - g) / delta + 4
        h = Math.round(h * 60)
        // Make negative hues positive behind 360°
        if (h < 0)
            h += 360
        l = (cmax + cmin) / 2
        // Calculate saturation
        s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))
        // Multiply l and s by 100
        s = +(s * 100).toFixed(1)
        l = +(l * 100).toFixed(1)
        return [h, s, l]
    }

    public static hslToRgb(h: number, s: number, l: number) {
        // Must be fractions of 1
        s /= 100.0
        l /= 100.0
        let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60.0) % 2 - 1)),
        m = l - c/2.0,
        r = 0,
        g = 0,
        b = 0
        if (0 <= h && h < 60) {
            r = c; g = x; b = 0;  
        } else if (60 <= h && h < 120) {
            r = x; g = c; b = 0;
        } else if (120 <= h && h < 180) {
            r = 0; g = c; b = x;
        } else if (180 <= h && h < 240) {
            r = 0; g = x; b = c;
        } else if (240 <= h && h < 300) {
            r = x; g = 0; b = c;
        } else if (300 <= h && h < 360) {
            r = c; g = 0; b = x;
        }
        r = Math.round((r + m) * 255)
        g = Math.round((g + m) * 255)
        b = Math.round((b + m) * 255)
        return [r, g, b]
    } 

    public static rgbToHex(r: number, g: number, b: number) {
        let hexR = r.toString(16)
        let hexG = g.toString(16)
        let hexB = b.toString(16)
        if (hexR.length == 1)
            hexR = "0" + hexR
        if (hexG.length == 1)
            hexG = "0" + hexG
        if (hexB.length == 1)
            hexB = "0" + hexB
        return "#" + hexR + hexG + hexB
    }

    public static wrap = (num: number, min: number, max: number) => {
        let newNum = num 
        if (newNum < min) newNum += max 
        if (newNum > max) newNum -= min
        return newNum
    }

    public static mod = (num: number, mod: number) => {
        if (num === mod) return num 
        return num % mod
    }

    public static rotateColor = (color: string, hue: number, saturation: number, lightness: number) => {
        let hsl = [] as number[]
        let a = 1
        if (color.trim().startsWith("#")) {
            const rgb = hexToRgb(color) as number[]
            hsl = this.rgbToHsl(rgb[0], rgb[1], rgb[2])
        } else {
            const matches = color.match(/\d+(\.\d+)?/g)!
            hsl = this.rgbToHsl(Number(matches[0]), Number(matches[1]), Number(matches[2]))
            if (matches[3]) a = Number(matches[3])
        }
        const newH = this.mod(this.wrap(hsl[0] - 180 + hue, 0, 360), 360)
        const newS = this.mod(this.wrap(hsl[1] - 100 + saturation, 0 , 100), 100)
        const newL = this.mod(this.wrap(hsl[2] - 50 + lightness, 0, 100), 100)
        const newRGB = this.hslToRgb(newH, newS, newL)
        if (a < 1) {
            return `rgba(${newRGB[0]}, ${newRGB[1]}, ${newRGB[2]}, ${a})`
        } else {
            return this.rgbToHex(newRGB[0], newRGB[1], newRGB[2])
        }
    }
}