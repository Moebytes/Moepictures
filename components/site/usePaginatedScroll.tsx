import {useEffect, useState, useRef} from "react"
import {useNavigate} from "react-router-dom"
import {useSearchSelector, useSearchActions} from "../../store"
import functions from "../../functions/Functions"

interface Params<T> {
    loadInitial: (query?: string) => Promise<T[]>
    updateOffset?: (offset: number) => Promise<T[] | null>
    pageAmount: number
    countKey?: string
}

const usePaginatedScroll = <T,>(params: Params<T>) => {
    const {scroll} = useSearchSelector()
    const {setScroll} = useSearchActions()
    const {loadInitial, updateOffset, pageAmount, countKey} = params
    const [items, setItems] = useState([] as T[])
    const [visible, setVisible] = useState([] as T[])
    const [offset, setOffset] = useState(0)
    const [ended, setEnded] = useState(false)
    const [managedItems, setManagedItems] = useState<T[] | null>(null)
    const [managedPage, setManagedPage] = useState<number | null>(null)
    const queryRef = useRef("")
    const loadedRef = useRef(false)
    const updatingRef = useRef(false)
    const replaceRef = useRef(true)
    const navigate = useNavigate()

    const getQueryPage = () => {
        if (typeof window === "undefined") return 1
        const pageParam = new URLSearchParams(window.location.search).get("page")
        return pageParam ? Number(pageParam) : 1
    }
    const [page, setPage] = useState(getQueryPage())

    const getTotalCount = (item: T) => Number(item[countKey ?? "tagCount"] ?? 0)

    const totalCount = items.length ? (getTotalCount?.(items[0]) || items.length) : 0
    const maxPage = Math.max(1, Math.ceil(totalCount / pageAmount))

    useEffect(() => {
        if (typeof window === "undefined") return
        const onDOMLoaded = () => {
            const queryParam = new URLSearchParams(window.location.search).get("query")
            if (queryParam) queryRef.current = queryParam
        }
        const updateStateChange = () => {
            replaceRef.current = true
        }
        window.addEventListener("load", onDOMLoaded)
        window.addEventListener("popstate", updateStateChange)
        window.addEventListener("pushstate", updateStateChange)
        return () => {
            window.removeEventListener("load", onDOMLoaded)
            window.removeEventListener("popstate", updateStateChange)
            window.removeEventListener("pushstate", updateStateChange)
        }
    }, [])

    useEffect(() => {
        if (scroll || !loadedRef.current) return
        const searchParams = new URLSearchParams(window.location.search)
        searchParams.set("page", String(page || ""))
        let pathString = `${location.pathname}?${searchParams.toString()}`
        if (replaceRef.current) {
            navigate(pathString, {replace: true})
            replaceRef.current = false
        } else {
            navigate(pathString)
        }
    }, [scroll, page])

    const initItemLoader = async (searchQuery?: string) => {
        setEnded(false)
        setOffset(0)
        const data = await loadInitial(searchQuery ?? queryRef.current)
        loadedRef.current = true
        queryRef.current = ""
        setItems(data)
        setPage(getQueryPage())
        if (scroll) setVisible(data.slice(0, pageAmount))
    }

    useEffect(() => {
        initItemLoader()
    }, [scroll])

    useEffect(() => {
        if (loadedRef.current) return

        if (managedItems?.length) {
            setItems(managedItems)
            if (managedPage) setPage(managedPage)
            if (scroll) setVisible(managedItems.slice(0, pageAmount))
            loadedRef.current = true
        }
    }, [managedItems, managedPage])

    const updateItemLoader = async (forceOffset?: number) => {
        if (ended || updatingRef.current) return
        updatingRef.current = true

        const newOffset = forceOffset ?? offset + pageAmount
        let result = await updateOffset?.(newOffset) ?? null
        if (!result) result = items.slice(newOffset, newOffset + pageAmount)

        let padded = false
        if (!scroll) {
            // In pages mode, we pad fake entries to the start to reach the
            // current offset if all the earlier posts aren't loaded
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
            setItems(functions.util.removeDuplicates([...items, ...result]))
            setVisible((prev) => [...prev, ...result])
        }

        if (result.length < pageAmount) setEnded(true)
        updatingRef.current = false
    }

    useEffect(() => {
        if (scroll) return
        const start = (page - 1) * pageAmount
        const end = start + pageAmount
        const pageSlice = items.slice(start, end)

        if (pageSlice.length < pageAmount || pageSlice.some((i: any) => i?.fake)) {
            updateItemLoader(start)
        }
    }, [page, scroll])

    useEffect(() => {
        if (!scroll) return

        const scrollListener = () => {
            if (functions.dom.scrolledToBottom()) updateItemLoader()
        }
        window.addEventListener("scroll", scrollListener)
        return () => window.removeEventListener("scroll", scrollListener)
    }, [scroll, offset, ended])

    useEffect(() => {
        if (!loadedRef.current) return
        setManagedItems(items)
    }, [items])

    useEffect(() => {
        setManagedPage(page)
    }, [page])

    const toggleScroll = () => setScroll(!scroll)

    const visibleItems = scroll ? visible : items.slice((page - 1) * pageAmount, pageAmount * page)

    return {
        visibleItems,
        items,
        setItems,
        setVisible,
        initItemLoader,
        updateItemLoader,
        page,
        setPage,
        maxPage,
        ended,
        toggleScroll,
        setManagedItems,
        setManagedPage
    }
}

export default usePaginatedScroll