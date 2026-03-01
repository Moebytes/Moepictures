/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {useEffect, useState, useRef, useMemo, useCallback} from "react"
import {useNavigate, useLocation} from "react-router-dom"
import {useSearchSelector, useSearchActions, useInteractionActions} from "../../store"
import functions from "../../functions/Functions"

interface Params<T> {
    loadInitial: (query?: string) => Promise<T[]>
    updateOffset?: (offset: number, query?: string) => Promise<T[] | null>
    pageAmount: number
    limit?: number
    countKey?: string
    locationState?: any
}

const usePaginatedScroll = <T,>(params: Params<T>) => {
    const {scroll} = useSearchSelector()
    const {setScroll} = useSearchActions()
    const {setMobileScrolling} = useInteractionActions()
    let {loadInitial, updateOffset, pageAmount, limit, countKey, locationState} = params
    const [items, setItems] = useState([] as T[])
    const [visible, setVisible] = useState([] as T[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [managedItems, setManagedItems] = useState<T[] | null>(null)
    const [managedPage, setManagedPage] = useState<number | null>(null)
    const [managedQuery, setManagedQuery] = useState<string | null>(null)
    const loadedRef = useRef(false)
    const updatingRef = useRef(false)
    const replaceRef = useRef(true)
    const navigate = useNavigate()
    const location = useLocation()

    if (!limit) limit = pageAmount

    const getQueryPage = () => {
        if (typeof window === "undefined") return 1
        const pageParam = new URLSearchParams(location.search).get("page")
        return pageParam ? Number(pageParam) : 1
    }
    const [page, setPage] = useState(getQueryPage())

    const getSearchQuery = () => {
        if (typeof window === "undefined") return ""
        const queryParam = new URLSearchParams(location.search).get("query")
        return queryParam ?? ""
    }
    const [searchQuery, setSearchQuery] = useState(getSearchQuery())

    const getTotalCount = (item: T) => Number(item[countKey ?? "tagCount"] ?? 0)

    const totalCount = items.length ? (getTotalCount?.(items[0]) || items.length) : 0
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    useEffect(() => {
        if (typeof window === "undefined") return
        const updateStateChange = () => {
            replaceRef.current = true
            setPage(getQueryPage())
            setSearchQuery(getSearchQuery())
            initItems()
        }
        window.addEventListener("popstate", updateStateChange)
        window.addEventListener("pushstate", updateStateChange)
        return () => {
            window.removeEventListener("popstate", updateStateChange)
            window.removeEventListener("pushstate", updateStateChange)
        }
    }, [])

    useEffect(() => {
        if (!loadedRef.current) return
        const searchParams = new URLSearchParams(location.search)
        if (page !== 1) {
            searchParams.set("page", String(page))
        } else {
            searchParams.delete("page")
        }
        if (searchQuery?.trim()) {
            searchParams.set("query", String(searchQuery))
        } else {
            searchParams.delete("query")
        }
        let pathString = `${location.pathname}?${searchParams.toString()}`
        if (replaceRef.current) {
            navigate(pathString, {replace: true})
            replaceRef.current = false
        } else {
            navigate(pathString)
        }
    }, [page, searchQuery])

    const initItems = async (queryOverride?: string, reset?: boolean) => {
        setEnded(false)
        setOffset(0)
        setSearchQuery(queryOverride ?? searchQuery)
        const data = await loadInitial(queryOverride ?? searchQuery)
        setItems(data)
        if (scroll) setVisible(data.slice(0, pageAmount))
        if (reset) {
            setPage(1)
        } else {
            if (page !== 1) updateItems()
        }
        loadedRef.current = true
    }

    const restructureItems = async (items: T[]) => {
        setEnded(false)
        setOffset(0)
        loadedRef.current = true
        setItems(items)
        setPage(1)
        if (scroll) setVisible(items.slice(0, pageAmount))
    }

    useEffect(() => {
        functions.util.defer(setMobileScrolling, 100, false)
        if (scroll && loadedRef.current) initItems()
    }, [scroll])

    useEffect(() => {
        if (loadedRef.current) return

        if (managedItems !== null) {
            setItems(managedItems) 
            if (scroll) setVisible(managedItems.slice(0, pageAmount))
            loadedRef.current = true
        }
    }, [managedItems])

    useEffect(() => {
        if (managedPage !== null) setPage(managedPage)
        if (managedQuery !== null) setSearchQuery(managedQuery)
    }, [managedPage, managedQuery])

    const updateItems = async (forceOffset?: number, queryOverride?: string) => {
        if (ended || updatingRef.current) return

        updatingRef.current = true

        let currentOffset = scroll ? offset + pageAmount : (page - 1) * pageAmount
        const newOffset = forceOffset ?? currentOffset
        let result = await updateOffset?.(newOffset, queryOverride ?? searchQuery) ?? null
        if (!result) result = items.slice(newOffset, newOffset + pageAmount)

        const totalCount = result.length ? (getTotalCount?.(result[0]) || result.length) : 0

        let padded = false
        if (!scroll) {
            if (newOffset === 0 && (items[newOffset] as any)?.fake) {
                padded = true
            }
            const cleanItems = items.filter((i: any) => !i?.fake)
            if (cleanItems.length <= newOffset) {
                const fake = {fake: true} as any
                fake[countKey ?? "tagCount"] = totalCount
                const fakePadding = Array.from({length: newOffset}, () => fake)
                result = [...fakePadding, ...result]
                padded = true
            }
        }

        if (!result.length) {
            updatingRef.current = false
            return setEnded(true)
        }

        setOffset(newOffset)
        if (padded) {
            setItems(result)
        } else {
            setItems((prev) => functions.util.removeDuplicates([...prev, ...result]))
            setVisible((prev) => [...prev, ...result])
        }

        if (result.length < limit) setEnded(true)
        updatingRef.current = false
    }

    useEffect(() => {
        if (scroll) return
        if (locationState?.restorePosts) return

        const start = (page - 1) * pageAmount
        const end = start + pageAmount
        const pageSlice = items.slice(start, end)

        if (pageSlice.length < pageAmount || pageSlice.some((i: any) => i?.fake)) {
            updateItems(start)
        }
    }, [page, scroll, pageAmount])

    useEffect(() => {
        if (!scroll) return

        const scrollListener = () => {
            if (functions.dom.scrolledToBottom()) updateItems()
        }
        window.addEventListener("scroll", scrollListener)
        return () => window.removeEventListener("scroll", scrollListener)
    }, [scroll, offset, ended])

    useEffect(() => {
        if (!loadedRef.current) return
        setManagedItems(items)
    }, [items])

    useEffect(() => {
        if (!loadedRef.current) return
        setManagedPage(page)
    }, [page])

    useEffect(() => {
        if (!loadedRef.current) return
        setManagedQuery(searchQuery)
    }, [searchQuery])

    const toggleScroll = () => setScroll(!scroll)

    const startIndex = scroll ? 0 : (page - 1) * pageAmount
    const visibleItems = useMemo(() => {
        return scroll ? visible : items.slice(startIndex, startIndex + pageAmount)
    }, [scroll, visible, items, startIndex, pageAmount])

    return {
        visibleItems,
        items,
        setItems,
        setVisible,
        initItems,
        updateItems,
        restructureItems,
        page,
        setPage,
        maxPage,
        ended,
        offset,
        searchQuery,
        setSearchQuery,
        toggleScroll,
        setManagedItems,
        setManagedPage,
        setManagedQuery,
        totalCount,
        startIndex
    }
}

export default usePaginatedScroll