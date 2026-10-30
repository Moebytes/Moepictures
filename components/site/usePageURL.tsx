/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {useLayoutEffect, useRef} from "react"
import {useLocation, useNavigate} from "react-router-dom"

export const getPageNumber = (search: string) => {
    const page = Number(new URLSearchParams(search).get("page"))
    return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export const usePageURL = (page: number, setPage: (page: number) => void,
    query: string, setQuery: (query: string) => void, enabled = true) => {
    const location = useLocation()
    const navigate = useNavigate()
    const searchRef = useRef(location.search)
    const pathRef = useRef(location.pathname)

    useLayoutEffect(() => {
        if (!enabled) return
        if (location.pathname !== pathRef.current) {
            pathRef.current = location.pathname
            searchRef.current = location.search
            setPage(getPageNumber(location.search))
            setQuery(new URLSearchParams(location.search).get("query") ?? "")
            return
        }
        if (location.search !== searchRef.current) {
            searchRef.current = location.search
            setPage(getPageNumber(location.search))
            setQuery(new URLSearchParams(location.search).get("query") ?? "")
            return
        }
        const params = new URLSearchParams(location.search)

        if (page > 1) {
            params.set("page", String(page))
        } else {
            params.delete("page")
        }
        
        if (query.trim()) {
            params.set("query", query)
        } else {
            params.delete("query")
        }

        const search = params.toString() ? `?${params}` : ""
        if (search === location.search) return

        searchRef.current = search
        navigate(`${location.pathname}${search}`, {state: location.state})
    }, [page, query, location.search, location.pathname, enabled])
}