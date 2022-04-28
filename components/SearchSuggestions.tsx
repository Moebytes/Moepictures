import React, {useContext, useEffect, useRef, useState} from "react"
import {useHistory} from "react-router-dom"
import {ThemeContext, EnableDragContext, SessionContext, MobileContext, SearchContext, SearchFlagContext} from "../Context"
import "./styles/searchsuggestions.less"
import axios from "axios"

interface Props {
    active: boolean
    text?: string
    x?: number 
    y?: number
    width?: number
    click?: (tag: string) => void
    type?: string
}

const SearchSuggestions: React.FunctionComponent<Props> = (props) => {
    const {theme, setTheme} = useContext(ThemeContext)
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {session, setSession} = useContext(SessionContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {search, setSearch} = useContext(SearchContext)
    const {searchFlag, setSearchFlag} = useContext(SearchFlagContext)
    const [suggestions, setSuggestions] = useState([]) as any
    const [active, setActive] = useState(props.active)
    const history = useHistory()

    useEffect(() => {
        if (props.active) {
            setActive(true)
        } else {
            setTimeout(() => {
                setActive(false)
            }, 200)
        }
    }, [props.active])

    const updateSearchSuggestions = async () => {
        const query = props.text ? props.text : search
        if (!query) return setSuggestions([])
        let suggestions = await axios.get("/api/search/suggestions", {params: {query, type: props.type}, withCredentials: true}).then((r) => r.data)
        if (!suggestions?.length) {
            const newQuery = query.split(/ +/g).slice(-1).join("")
            if (!newQuery) return setSuggestions([])
            suggestions = await axios.get("/api/search/suggestions", {params: {query: newQuery, type: props.type}, withCredentials: true}).then((r) => r.data)
        }
        setSuggestions(suggestions)
    }

    useEffect(() => {
        updateSearchSuggestions()
    }, [])

    useEffect(() => {
        updateSearchSuggestions()
    }, [props.text, search])

    const generateSuggestionsJSX = () => {
        let jsx = [] as any
        for (let i = 0; i < suggestions.length; i++) {
            const tagClick = () => {
                if (props.click) return props.click(suggestions[i].tag)
                setSearch((prev: string) => {
                    const parts = prev.split(/ +/g)
                    parts[parts.length - 1] = suggestions[i].tag
                    return parts.join(" ")
                })
                setSearchFlag(true)
                history.push(`/posts`)
            }
            jsx.push(
                <div className="search-suggestions-row" onClick={() => tagClick()}>
                    <span className="search-suggestions-tag">{suggestions[i].tag.replaceAll("-", " ")}</span>
                    <span className="search-suggestions-count">{suggestions[i].count}</span>
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
            return "132px"
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
        <div className="search-suggestions" style={{width: getWidth(), top: getY(), left: getX()}}>
            {generateSuggestionsJSX()}
        </div>
    )
    return null
}

export default SearchSuggestions