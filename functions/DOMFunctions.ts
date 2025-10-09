import functions from "./Functions"

export default class DOMFunctions {
    public static download = (filename: string, url: string) => {
            const a = document.createElement("a")
            a.setAttribute("href", url)
            a.setAttribute("download", decodeURIComponent(filename))
            a.style.display = "none"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
    }

    public static updateHeight = () => {
        const imageContainer = document.querySelector(".imagegrid") as HTMLElement
        if (imageContainer) {
            const height = imageContainer.clientHeight
            imageContainer.style.height = `${height}px`
        }
    }

    public static scrolledToTop = () => {
        return window.scrollY <= 140
    }

    public static scrolledToBottom = () => {
        const scrollHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight,
            document.body.offsetHeight
        )
        return window.innerHeight + window.scrollY >= scrollHeight - 30
    }

    public static getScrollPercent = () => {
            return (document.documentElement.scrollTop) / 
            (document.documentElement.scrollHeight - document.documentElement.clientHeight)
    }

    public static getScrollPercentAdjusted = (sizeType: string) => {
        if (sizeType === "tiny") return this.getScrollPercent() - 0.55
        if (sizeType === "small") return this.getScrollPercent() - 0.4
        if (sizeType === "medium") return this.getScrollPercent() - 0.2
        if (sizeType === "large") return this.getScrollPercent() - 0.15
        if (sizeType === "massive") return this.getScrollPercent() - 0.07
        return this.getScrollPercent()
    }

    public static preventDragging = () => {
        document.querySelectorAll("img").forEach((img) => {
          img.draggable = false
        })
    }

    public static clearSelection() {
        window.getSelection()?.removeAllRanges()
    }

    public static calcDistance(elementOne: HTMLElement, elementTwo: HTMLElement) {
        let distance = 0
        
        const x1 = elementOne.offsetTop
        const y1 = elementOne.offsetLeft
        const x2 = elementTwo.offsetTop
        const y2 = elementTwo.offsetLeft
        const xDistance = x1 - x2
        const yDistance = y1 - y2
        
        distance = Math.sqrt(
            (xDistance * xDistance) + (yDistance * yDistance)
        )
        return distance
    }

    public static titlebarHeight = () => {
        const titlebar = document.querySelector(".titlebar")
        if (!titlebar) return 70
        return titlebar.clientHeight
    }

    public static navbarHeight = () => {
        const navbar = document.querySelector(".navbar")
        if (!navbar) {
            const mobileNavbar = document.querySelector(".mobile-navbar") as HTMLElement
            return mobileNavbar ? mobileNavbar.clientHeight : 32
        }
        return navbar.clientHeight
    }

    public static sortbarHeight = () => {
        const sortbar = document.querySelector(".sortbar")
        if (!sortbar) return 40
        return sortbar.clientHeight
    }

    public static sidebarWidth = () => {
        const sidebar = document.querySelector(".sidebar")
        if (!sidebar) {
            const mobileSidebar = document.querySelector(".mobile-sidebar") as HTMLElement
            return mobileSidebar ? 0 : 230
        }
        return sidebar.clientWidth
    }

    public static tagbannerHeight = () => {
        const tagbanner = document.querySelector(".tagbanner")
        return tagbanner ? tagbanner.clientHeight : 40
    }

    public static jumpToTop = () => {
        setTimeout(() => {
            window.scrollTo(0, 0)
        }, 300)
    }

    public static replaceLocation = (location: string) => {
        window.location = `${functions.config.getDomain()}${location}` as (string & Location)
    }

    public static changeFavicon = (url: string) => {
        if (typeof window === "undefined") return
        let link = document.querySelector(`link[rel~="icon"]`) as HTMLLinkElement
        if (!link) {
            link = document.createElement("link")
            link.type = "image/x-icon"
            link.rel = "icon"
            document.getElementsByTagName("head")[0].appendChild(link)
        }
        if (link.href !== url) link.href = url
    }
}