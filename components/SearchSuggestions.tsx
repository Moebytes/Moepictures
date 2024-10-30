import React, {useContext, useEffect, useRef, useState, useReducer} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, EnableDragContext, SessionContext, SessionFlagContext, MobileContext, SearchContext, SearchFlagContext,
RestrictTypeContext, HideMobileNavbarContext} from "../Context"
import "./styles/searchsuggestions.less"
import functions from "../structures/Functions"
import permissions from "../structures/Permissions"

interface Props {
    active: boolean
    text?: string
    x?: number 
    y?: number
    width?: number
    click?: (tag: string) => void
    type?: string
    sticky?: boolean
    fontSize?: number
}

const SearchSuggestions: React.FunctionComponent<Props> = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {sessionFlag, setSessionFlag} = useContext(SessionFlagContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {hideMobileNavbar, setHideMobileNavbar} = useContext(HideMobileNavbarContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const {restrictType, setRestrictType} = useContext(RestrictTypeContext)
    const [suggestions, setSuggestions] = useState([]) as any
    const [activeIndex, setActiveIndex] = useState(-1)
    const [active, setActive] = useState(props.active)
    const history = useHistory()

    const handleKeydown = (event: any) => {
        if (event.key === "Enter") {
            if (!active || !suggestions.length || !suggestions[activeIndex]) return
            event.preventDefault()
            if (props.click) {
                props.click(suggestions[activeIndex]?.tag)
                return setActiveIndex(-1)
            }
            setSearch((prev: string) => {
                const parts = prev.split(/ +/g)
                parts[parts.length - 1] = suggestions[activeIndex]?.tag
                return parts.join(" ") + " "
            })
            setSearchFlag(true)
            setActiveIndex(-1)
        }
        let newActiveIndex = activeIndex
        if (event.key === "ArrowUp") {
            event.preventDefault()
            newActiveIndex-- 
        } else if (event.key === "ArrowDown") {
            event.preventDefault()
            newActiveIndex++
        }
        if (activeIndex < -1) newActiveIndex = suggestions.length - 1
        if (activeIndex > suggestions.length - 1) newActiveIndex = 0
        setActiveIndex(newActiveIndex)
    }

    useEffect(() => {
        window.addEventListener("keydown", handleKeydown)
        return () => {
            window.removeEventListener("keydown", handleKeydown)
        }
    }, [suggestions, activeIndex])

    useEffect(() => {
        if (props.active) {
            setActive(true)
        } else {
            setTimeout(() => {
                setActive(false)
                setActiveIndex(-1)
            }, 200)
        }
    }, [props.active])

    const updateSearchSuggestions = async () => {
        const query = props.text ? props.text : search
        if (!query) return setSuggestions([])
        let suggestions = await functions.get("/api/search/suggestions", {query, type: props.type}, session, setSessionFlag)
        if (!suggestions?.length) {
            const newQuery = query.split(/ +/g).slice(-1).join("")
            if (!newQuery) return setSuggestions([])
            suggestions = await functions.get("/api/search/suggestions", {query: newQuery, type: props.type}, session, setSessionFlag)
        }
        setSuggestions(suggestions)
    }

    useEffect(() => {
        updateSearchSuggestions()
    }, [])

    useEffect(() => {
        updateSearchSuggestions()
    }, [props.text, search, session])

    const generateSuggestionsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < suggestions.length; i++) {
            if (!session.username) if (suggestions[i].r18) continue
            if (restrictType !== "explicit") if (suggestions[i].r18) continue
            if (!suggestions[i]) break
            const tagClick = () => {
                if (props.click) return props.click(suggestions[i].tag)
                history.push(`/posts`)
                setSearch((prev: string) => {
                    const parts = prev.split(/ +/g)
                    parts[parts.length - 1] = suggestions[i].tag
                    return parts.join(" ")
                })
                setSearchFlag(true)
            }
            jsx.push(
                <div className={`search-suggestions-row ${activeIndex === i ? "search-suggestions-active" : ""}`} onClick={() => tagClick()} onMouseEnter={() => setActiveIndex(i)}>
                    <span className="search-suggestions-tag" style={props.fontSize ? {fontSize: `${props.fontSize}px`} : {}}>{suggestions[i].tag.replaceAll("-", " ")}</span>
                    <span className="search-suggestions-count" style={props.fontSize ? {fontSize: `${props.fontSize - 3}px`} : {}}>{suggestions[i].count}</span>
                </div>
            )
        }
        return jsx
    }

    const getX = () => {
        if (props.x) return `${props.x}px`
        if (mobile) {
            return "14px"
        } else {
            if (typeof document === "undefined") return "15px"
            const element = document.querySelector(".search")
            if (!element) return "15px"
            const rect = element.getBoundingClientRect()
            return `${rect.left}px`
        }
    }

    const getY = () => {
        if (props.y) return `${props.y}px`
        if (mobile) {
            return hideMobileNavbar ? "132px" : `${document.querySelector(".mobile-navbar")?.clientHeight || 500 + 432}px`
        } else {
            if (typeof document === "undefined") return "177px"
            const element = document.querySelector(".search")
            if (!element) return "177px"
            const rect = element.getBoundingClientRect()
            return `${rect.bottom + window.scrollY}px`
        }
    }

    const getWidth = () => {
        if (props.width) return `${props.width}px`
        if (mobile) {
            return "380px"
        } else {
            return "195px"
        }
    }

    if (props.x !== undefined && props.y !== undefined) {
        if (!props.x && !props.y) return null
    }

    if (active && suggestions.length) return (
        <div className="search-suggestions" style={{width: getWidth(), top: getY(), left: getX(), position: props.sticky ? "sticky" : "absolute"}}>
            {generateSuggestionsJSX()}
        </div>
    )
    return null
}

export default SearchSuggestions