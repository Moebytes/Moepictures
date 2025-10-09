export default class RenderFunctions {
    public static getImagesPerRow = (sizeType: string) => {
        if (sizeType === "tiny") return 9
        if (sizeType === "small") return 7
        if (sizeType === "medium") return 5
        if (sizeType === "large") return 4
        if (sizeType === "massive") return 3
        return 9
    }

    public static getImagesPerRowMobile = (sizeType: string) => {
        if (sizeType === "tiny") return 4
        if (sizeType === "small") return 3
        if (sizeType === "medium") return 2
        if (sizeType === "large") return 1
        if (sizeType === "massive") return 1
        return 5
    }
    
    public static parsePieces = (text: string) => {
        let segments = [] as string[]
        const pieces = text.split(/\n/gm)
        let intermediate = [] as string[]
        let codeBlock = false
        for (let i = 0; i < pieces.length; i++) {
            let piece = pieces[i] + "\n"
            if (piece.includes("```")) {
                codeBlock = !codeBlock
                if (!codeBlock) {
                    intermediate.push(piece)
                    piece = ""
                }
            }
            if (codeBlock || piece.startsWith(">>>") || piece.startsWith(">")) {
                if (codeBlock && !piece.includes("```")) piece += "\n"
                intermediate.push(piece)
            } else {
                if (intermediate.length) {
                    segments.push(intermediate.join(""))
                    intermediate = []
                }
                segments.push(piece)
            }
        }
        if (intermediate.length) {
            segments.push(intermediate.join(""))
        }
        return segments.filter(Boolean)
    }

    public static insertNodeAtCaret(node: Node) {
        var selection = window.getSelection()!
        if (selection.rangeCount) {
            var range = selection.getRangeAt(0)
            range.collapse(false)
            range.insertNode(node)
            range = range.cloneRange()
            range.selectNodeContents(node)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
        }
    }

    public static rangeRect = (range: Range) => {
        let rect = range.getBoundingClientRect()
        if (range.collapsed && rect.top === 0 && rect.left === 0) {
          let node = document.createTextNode("\ufeff")
          range.insertNode(node)
          rect = range.getBoundingClientRect()
          node.remove()
        }
        return rect
    }

    public static triggerTextboxButton = (textarea: HTMLTextAreaElement | null, setText: (text: string) => void, type: string) => {
        if (!textarea) return
        const insert = {
            highlight: "====",
            bold: "****",
            italic: "////",
            underline: "____",
            strikethrough: "~~~~",
            spoiler: "||||",
            link: "[]()",
            details: "<<|>>",
            color: "#ff17c1{}",
            code: "``````"
        }[type]
        if (!insert) return

        const current = textarea.value
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const isSelected = start !== end
        let updated = ""

        if (isSelected) {
            let before = current.slice(0, start)
            let selected = current.slice(start, end)
            let after = current.slice(end)
            let half = Math.floor(insert.length / 2)
            let first = insert.slice(0, half)
            let second = insert.slice(half)

            if (type === "link") {
                if (selected.startsWith("http")) {
                    first = "[]"
                    second = `(${selected})`
                } else {
                    first = `[${selected}]`
                    second = "()"
                }
                selected = ""
            }

            if (type === "color") {
                first = "#ff17c1{"
                second = "}"
            }
    
            updated = before + first + selected + second + after
            const cursor = start + first.length + selected.length + second.length
    
            setTimeout(() => textarea.setSelectionRange(cursor, cursor), 0)
        } else {
            const before = current.slice(0, start)
            const after = current.slice(start)
            updated = before + insert + after
            let shift = -2
            if (type === "link") shift = -3
            if (type === "details") shift = -3
            if (type === "color") shift = -1
            if (type === "code") shift = -3
            const cursor = start + insert.length + shift
    
            setTimeout(() => textarea.setSelectionRange(cursor, cursor), 0)
        }
        setText(updated)
        textarea.focus()
    }

    public static getTypingWord = (element: HTMLTextAreaElement | HTMLInputElement | HTMLDivElement | null) => {
        if (!element) return ""
        let text = ""
        let cursorPosition = 0
      
        if (element.isContentEditable) {
          const selection = window.getSelection()!
          if (!selection.rangeCount) return ""
          const range = selection.getRangeAt(0)
          const preCaretRange = range.cloneRange()
          preCaretRange.selectNodeContents(element)
          preCaretRange.setEnd(range.endContainer, range.endOffset)
          text = preCaretRange.toString()
          cursorPosition = text.length
          text = element.innerText
        } else {
          text = (element as HTMLTextAreaElement).value
          cursorPosition = (element as HTMLTextAreaElement).selectionStart
        }
      
        const words = text.split(" ")
        let charCount = 0
      
        for (const word of words) {
          charCount += word.length
          if (cursorPosition <= charCount) {
            return word.slice(0, cursorPosition - (charCount - word.length))
          }
          charCount++
        }
      
        return ""
    }

    public static getCaretPosition = (ref: HTMLInputElement | HTMLTextAreaElement | HTMLDivElement | null) => {
        if (!ref) return 0
        let caretPosition = 0
        if (ref instanceof HTMLInputElement || ref instanceof HTMLTextAreaElement) {
            caretPosition = ref.selectionStart || 0
        } else {
            const selection = window.getSelection()!
            if (!selection.rangeCount) return 0
            var range = selection.getRangeAt(0)
            var preCaretRange = range.cloneRange()
            preCaretRange.selectNodeContents(ref)
            preCaretRange.setEnd(range.endContainer, range.endOffset)
            caretPosition = preCaretRange.toString().length
        }
        return caretPosition
    }

    public static getTagX = () => {
        if (typeof window === "undefined") return 0
        const activeElement = document.activeElement
        
        if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
            const rect = activeElement.getBoundingClientRect()
            const caretPosition = activeElement.selectionStart || 0
            const approxCharWidth = parseFloat(getComputedStyle(activeElement).fontSize) * 0.5
            return rect.left + caretPosition * approxCharWidth - 10
        }

        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            return rect.left - 10
        }
        return 0
    }

    public static getTagY = () => {
        if (typeof window === "undefined") return 0
        const activeElement = document.activeElement

        if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
            const rect = activeElement.getBoundingClientRect()
            return rect.bottom + window.scrollY + 10
        }

        const selection = window.getSelection()
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            return rect.bottom + window.scrollY + 10
        }
        return 0
    }

    public static insertAtCaret = (text: string, caretPosition: number, tag: string) => {
        const words = text.split(" ")
        let charCount = 0
        let updatedText = ""

        for (const word of words) {
            charCount += word.length
            if (caretPosition <= charCount) {
                const startOfWord = charCount - word.length
                updatedText = text.slice(0, startOfWord) + tag + text.slice(charCount)
                break
            }
            charCount++
        }
      
        return updatedText
    }
}