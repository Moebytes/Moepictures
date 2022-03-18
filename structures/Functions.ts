import commonPasswords from "../json/common-passwords.json"

let newScrollY = 0
let dragged = [] as any
let direction = ""
let lastPageY = 0

export default class Functions {
    public static alphaNumeric(str: string) {
        for (let i = 0; i < str.length; i++) {
          const code = str.charCodeAt(i)
          if (!(code > 47 && code < 58) && // 0-9
              !(code > 64 && code < 91) && // A-Z
              !(code > 96 && code < 123)) { // a-z
            return false
          }
        }
        return true
    }

    public static passwordStrength = (password: string) => {
        let counter = 0
        if (/[a-z]/.test(password)) counter++
        if (/[A-Z]/.test(password)) counter++
        if (/[0-9]/.test(password)) counter++
        if (!/^[a-zA-Z0-9]+$/.test(password)) counter++
        if (password.length < 10 || counter < 4) return "weak"
        if (password.length < 15) return "decent"
        return "strong"
    }

    public static validatePassword = (username: string, password: string) => {
        if (password.toLowerCase().includes(username.toLowerCase())) return "Password should not contain username"
        if (commonPasswords.includes(password)) return "Password is too common"
        if (/ +/.test(password)) return "Password should not contain spaces"
        if (password.length < 10) return "Password must be at least 10 characters"
        const strength = Functions.passwordStrength(password)
        if (strength === "weak") {
            return "Password should satisfy at least 3 of these rules:\n" +
            "-Should contain lowercase letters\n" +
            "-Should contain uppercase letters\n" +
            "-Should contain numbers\n" +
            "-Should contain special characters"
        }
        return null
    }

    public static validateEmail = (email: string) => {
        const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
        return regex.test(email)
    }

    public static changeFavicon = (theme: string) => {
        let link = document.querySelector(`link[rel~="icon"]`) as any
        if (!link) {
            link = document.createElement("link")
            link.rel = "icon";
            document.getElementsByTagName("head")[0].appendChild(link)
        }
        if (theme.includes("magenta")) {
            link.href = "/assets/magenta/favicon.png"
        } else {
            link.href = "/assets/purple/favicon.png"
        }
    }

    public static dragScroll = (enabled?: boolean) => {
        let element: any
        for (let i = 0; i < dragged.length; i++) {
            element = dragged[i]
            element = element.container || element
            element.removeEventListener("mousedown", element.md, false)
            window.removeEventListener("mouseup", element.mu, false)
            window.removeEventListener("mousemove", element.mm, false)
        }
        if (!enabled) return
        dragged = [].slice.call(document.getElementsByClassName("dragscroll"))
        for (let i = 0; i < dragged.length; i++) {
            const element = dragged[i]
            let lastClientY = 0
            let mouseDown = false
            let momentum = false
            let time: any
            let container = element.container || element

            container.addEventListener("mousedown", container.md = function(event) {
                if (!element.hasAttribute("nochilddrag") || document.elementFromPoint(event.pageX, event.pageY) == container) {
                    mouseDown = true
                    time = new Date()
                    lastClientY = event.clientY
                    event.preventDefault()
                }
            }, false)

            window.addEventListener("mouseup", container.mu = function(event) {
                mouseDown = false
                /*
                const timeDiff = (new Date() as any - time)
                let scroller = element.scroller || element
                if (element == document.body) scroller = document.documentElement
                let speedY = (-newScrollY + scroller.scrollTop) / timeDiff * 10
                const draw = () => {
                    if (speedY > 0) {
                        let scroller = element.scroller || element
                        if (element == document.body) scroller = document.documentElement
                        newScrollY = (-lastClientY + (lastClientY = event.clientY))
                        let value = scroller.scrollTop
                        if (direction === "up") {
                            value += newScrollY - speedY--
                        } else {
                            value -= newScrollY - speedY--
                        }
                        if (value < 0) value = 0
                        if (value > scroller.scrollHeight) value = scroller.scrollHeight
                        scroller.scrollTop = value
                        
                        console.log(scroller.screenHeight)
                        console.log(scroller.scrollTop)
                    } else {
                        momentum = false
                    }
                    requestAnimationFrame(draw)
                }
                momentum = true
                draw()*/
            }, false)

            window.addEventListener("mousemove", container.mm = function(event) {
                if (!mouseDown) return
                let scroller = element.scroller || element
                if (element == document.body) scroller = document.documentElement
                newScrollY = (-lastClientY + (lastClientY = event.clientY))
                scroller.scrollTop -= newScrollY
            }, false)
            /*
            window.addEventListener("scroll", () => {
                if (!mouseDown) return
                var offset = window.pageYOffset || document.documentElement.scrollTop
                if (offset > lastPageY) {
                    direction = "down"
                } else {
                    direction = "up"
                }
                lastPageY = offset <= 0 ? 0 : offset
            })*/
        }
    }

    public static updateHeight = () => {
        const imageContainer = document.querySelector(".imagegrid") as HTMLElement
        if (imageContainer) {
            const height = imageContainer.clientHeight
            imageContainer.style.height = `${height}px`
        }
    }
}