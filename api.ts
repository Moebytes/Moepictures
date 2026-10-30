/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Moepictures - A cute and moe anime image board ❤          *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {createApi, BaseQueryFn} from "@reduxjs/toolkit/query/react"
import {useDispatch} from "react-redux"
import functions from "./functions/Functions"
import {StoreState} from "./store"
import {GetEndpoint, History, PostSearch, PostSearchParams} from "./types/Types"

type QueryArgs = {
    url: string
    params?: any
}

export type PageParams = {
  offset: number
  limit: number
}

type RelatedPostsArgs = PostSearchParams & {
    postID?: string
    fallback?: string[]
}

type RelatedPageParams = PageParams & {
    query?: string
    totalCount?: number
}

type RelatedPostsPage = {
    posts: PostSearch[]
    totalCount: number
    query: string
    nextOffset: number | null
}

const customFetch: BaseQueryFn<QueryArgs, unknown, {message: string}> = async (args, api) => {
    try {
        const state = api.getState() as StoreState
        let data = await functions.http.get(args.url as any, args.params as any, state.session.session)
        return {data: data ?? null}
    } catch (error: any) {
        return {error: {message: error.message}}
    }
}

const getNextPageParam = (lastPage: any, allPages: any[], 
    lastPageParam: PageParams, allPageParams: PageParams[]) => {
    if (!lastPage?.length) return undefined
    const nextOffset = lastPageParam.offset + lastPage.length
    
    let countKeys = ["tagCount", "groupCount", "commentCount", 
        "noteCount", "historyCount", "requestCount", "threadCount",
        "messageCount", "replyCount", "reportCount","postCount"]
    const countKey = countKeys.find((key) => lastPage[0]?.[key] !== undefined)

    const total = Number(countKey ? lastPage[0][countKey] : lastPage.length)

    if (countKey ? nextOffset >= total : lastPage.length < lastPageParam.limit) {
        return undefined
    }

    return {...lastPageParam, offset: nextOffset}
}

const getPreviousPageParam = (firstPage: any, allPages: any[], 
    firstPageParam: PageParams, allPageParams: PageParams[]) => {
    const prevOffset = firstPageParam.offset - firstPageParam.limit

    if (firstPageParam.offset <= 0) {
        return undefined
    }

    return {...firstPageParam, offset: prevOffset}
}

export const api = createApi({
    reducerPath: "api",
    baseQuery: customFetch,
    tagTypes: ["Posts", "Post", "Comments", "Notes", "Threads", "Messages", "History", 
        "Mod", "Users",  "Tags", "Tag", "Groups", "Group", "Favgroups", "Favgroup"],
    endpoints: (builder) => ({
        relatedPosts: builder.infiniteQuery<RelatedPostsPage, RelatedPostsArgs, RelatedPageParams>({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam: (lastPage, allPages, lastPageParam) => {
                    if (lastPage.nextOffset === null) return undefined
                    return {...lastPageParam, offset: lastPage.nextOffset,
                        query: lastPage.query, totalCount: lastPage.totalCount}
                },
                getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
                    if (firstPageParam.offset <= 0) return undefined
                    return {...firstPageParam, offset: Math.max(0, firstPageParam.offset - firstPageParam.limit),
                        query: firstPage.query, totalCount: firstPage.totalCount}
                }
            },
            queryFn: async ({queryArg, pageParam}, queryApi, extraOptions, baseQuery) => {
                const {postID, fallback = [], ...params} = queryArg
                let query = pageParam.query ?? params.query ?? ""
                let posts = [] as PostSearch[]
                let totalCount = pageParam.totalCount ?? 0
                let nextOffset = null as number | null
                const queries = pageParam.query !== undefined ? [query] :
                    [...new Set([query, ...fallback].filter(Boolean))]

                for (const tag of queries) {
                    query = tag
                    const offset = pageParam.query !== undefined || tag === params.query ? pageParam.offset : 0

                    const result = await baseQuery({url: "/api/search/posts",
                        params: {...params, query, offset, limit: pageParam.limit}})
                    if (result.error) return {error: result.error}
                    
                    const rows = result.data as PostSearch[]
                    const count = Number(rows[0]?.postCount ?? rows.length)
                    posts = rows.filter((post) => post.postID !== postID)
                    totalCount = pageParam.totalCount ?? Math.max(0, count - (rows.length - posts.length))
                    nextOffset = rows.length && offset + rows.length < count ? offset + rows.length : null
                    if (rows.length || pageParam.query !== undefined) break
                }
                return {data: {posts, totalCount, query, nextOffset}}
            },
            providesTags: (result, error, arg) => ["Posts", {type: "Post", id: arg.postID}]
        }),

        aliasHistory: builder.infiniteQuery<
            GetEndpoint<"/api/alias/history">["response"],
            GetEndpoint<"/api/alias/history">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/alias/history", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        aliasHistoryPage: builder.query<
            GetEndpoint<"/api/alias/history">["response"],
            GetEndpoint<"/api/alias/history">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/alias/history", params: params
            }),
            providesTags: () => [{type: "History"}]
        }),

        deletedHistory: builder.infiniteQuery<
            GetEndpoint<"/api/post/deleted">["response"],
            GetEndpoint<"/api/post/deleted">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/post/deleted", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        deletedHistoryPage: builder.query<
            GetEndpoint<"/api/post/deleted">["response"],
            GetEndpoint<"/api/post/deleted">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/post/deleted", params: params
            }),
            providesTags: () => [{type: "History"}]
        }),


        searchArtists: builder.infiniteQuery<
            GetEndpoint<"/api/search/artists">["response"],
            GetEndpoint<"/api/search/artists">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/artists", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchArtistsPage: builder.query<
            GetEndpoint<"/api/search/artists">["response"],
            GetEndpoint<"/api/search/artists">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/artists", params: params
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchCharacters: builder.infiniteQuery<
            GetEndpoint<"/api/search/characters">["response"],
            GetEndpoint<"/api/search/characters">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/characters", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchCharactersPage: builder.query<
            GetEndpoint<"/api/search/characters">["response"],
            GetEndpoint<"/api/search/characters">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/characters", params: params
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchSeries: builder.infiniteQuery<
            GetEndpoint<"/api/search/series">["response"],
            GetEndpoint<"/api/search/series">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/series", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchSeriesPage: builder.query<
            GetEndpoint<"/api/search/series">["response"],
            GetEndpoint<"/api/search/series">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/series", params: params
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchMessages: builder.infiniteQuery<
            GetEndpoint<"/api/search/messages">["response"],
            GetEndpoint<"/api/search/messages">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/messages", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Messages"}]
        }),

        searchMessagesPage: builder.query<
            GetEndpoint<"/api/search/messages">["response"],
            GetEndpoint<"/api/search/messages">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/messages", params: params
            }),
            providesTags: () => [{type: "Messages"}]
        }),

        searchThreads: builder.infiniteQuery<
            GetEndpoint<"/api/search/threads">["response"],
            GetEndpoint<"/api/search/threads">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/threads", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Threads"}]
        }),

        searchThreadsPage: builder.query<
            GetEndpoint<"/api/search/threads">["response"],
            GetEndpoint<"/api/search/threads">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/threads", params: params
            }),
            providesTags: () => [{type: "Threads"}]
        }),

        searchReports: builder.infiniteQuery<
            GetEndpoint<"/api/search/reports">["response"],
            GetEndpoint<"/api/search/reports">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/reports", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        searchReportsPage: builder.query<
            GetEndpoint<"/api/search/reports">["response"],
            GetEndpoint<"/api/search/reports">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/reports", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getForumPosts: builder.infiniteQuery<
            GetEndpoint<"/api/user/forumposts">["response"],
            GetEndpoint<"/api/user/forumposts">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/user/forumposts", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Threads"}]
        }),

        getForumPostsPage: builder.query<
            GetEndpoint<"/api/user/forumposts">["response"],
            GetEndpoint<"/api/user/forumposts">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/user/forumposts", params: params
            }),
            providesTags: () => [{type: "Threads"}]
        }),

        getLoginHistory: builder.infiniteQuery<
            GetEndpoint<"/api/user/login/history">["response"],
            GetEndpoint<"/api/user/login/history">["params"], PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/user/login/history", params: {...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        getLoginHistoryPage: builder.query<
            GetEndpoint<"/api/user/login/history">["response"],
            GetEndpoint<"/api/user/login/history">["params"]
        >({
            query: (params) => ({
                url: "/api/user/login/history", params: params
            }),
            providesTags: () => [{type: "History"}]
        }),

        getThreadReplies: builder.infiniteQuery<
            GetEndpoint<"/api/thread/replies">["response"],
            GetEndpoint<"/api/thread/replies">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/thread/replies", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Threads"}]
        }),

        getThreadRepliesPage: builder.query<
            GetEndpoint<"/api/thread/replies">["response"],
            GetEndpoint<"/api/thread/replies">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/thread/replies", params: params
            }),
            providesTags: () => [{type: "Threads"}]
        }),

        getMessageReplies: builder.infiniteQuery<
            GetEndpoint<"/api/message/replies">["response"],
            GetEndpoint<"/api/message/replies">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/message/replies", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Messages"}]
        }),

        getMessageRepliesPage: builder.query<
            GetEndpoint<"/api/message/replies">["response"],
            GetEndpoint<"/api/message/replies">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/message/replies", params: params
            }),
            providesTags: () => [{type: "Messages"}]
        }),

        noteHistory: builder.infiniteQuery<
            GetEndpoint<"/api/note/history">["response"],
            GetEndpoint<"/api/note/history">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/note/history", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        noteHistoryPage: builder.query<
            GetEndpoint<"/api/note/history">["response"],
            GetEndpoint<"/api/note/history">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/note/history", params: params
            }),
            providesTags: () => [{type: "History"}]
        }),

        getUnverifiedPosts: builder.infiniteQuery<
            GetEndpoint<"/api/post/list/unverified">["response"],
            GetEndpoint<"/api/post/list/unverified">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/post/list/unverified", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getUnverifiedPostsPage: builder.query<
            GetEndpoint<"/api/post/list/unverified">["response"],
            GetEndpoint<"/api/post/list/unverified">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/post/list/unverified", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getRejectedPosts: builder.infiniteQuery<
            GetEndpoint<"/api/post/deleted/unverified">["response"],
            GetEndpoint<"/api/post/deleted/unverified">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/post/deleted/unverified", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getRejectedPostsPage: builder.query<
            GetEndpoint<"/api/post/deleted/unverified">["response"],
            GetEndpoint<"/api/post/deleted/unverified">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/post/deleted/unverified", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getPostEdits: builder.infiniteQuery<
            GetEndpoint<"/api/post-edits/list/unverified">["response"],
            GetEndpoint<"/api/post-edits/list/unverified">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/post-edits/list/unverified", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getPostEditsPage: builder.query<
            GetEndpoint<"/api/post-edits/list/unverified">["response"],
            GetEndpoint<"/api/post-edits/list/unverified">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/post-edits/list/unverified", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getUnverifiedNotes: builder.infiniteQuery<
            GetEndpoint<"/api/note/list/unverified">["response"],
            GetEndpoint<"/api/note/list/unverified">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/note/list/unverified", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getUnverifiedNotesPage: builder.query<
            GetEndpoint<"/api/note/list/unverified">["response"],
            GetEndpoint<"/api/note/list/unverified">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/note/list/unverified", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getPostDeletions: builder.infiniteQuery<
            GetEndpoint<"/api/post/delete/request/list">["response"],
            GetEndpoint<"/api/post/delete/request/list">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/post/delete/request/list", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getPostDeletionsPage: builder.query<
            GetEndpoint<"/api/post/delete/request/list">["response"],
            GetEndpoint<"/api/post/delete/request/list">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/post/delete/request/list", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getTagDeletions: builder.infiniteQuery<
            GetEndpoint<"/api/tag/delete/request/list">["response"],
            GetEndpoint<"/api/tag/delete/request/list">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/tag/delete/request/list", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getTagDeletionsPage: builder.query<
            GetEndpoint<"/api/tag/delete/request/list">["response"],
            GetEndpoint<"/api/tag/delete/request/list">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/tag/delete/request/list", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getGroupDeletions: builder.infiniteQuery<
            GetEndpoint<"/api/group/delete/request/list">["response"],
            GetEndpoint<"/api/group/delete/request/list">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/group/delete/request/list", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getGroupDeletionsPage: builder.query<
            GetEndpoint<"/api/group/delete/request/list">["response"],
            GetEndpoint<"/api/group/delete/request/list">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/group/delete/request/list", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getTagEdits: builder.infiniteQuery<
            GetEndpoint<"/api/tag/edit/request/list">["response"],
            GetEndpoint<"/api/tag/edit/request/list">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/tag/edit/request/list", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getTagEditsPage: builder.query<
            GetEndpoint<"/api/tag/edit/request/list">["response"],
            GetEndpoint<"/api/tag/edit/request/list">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/tag/edit/request/list", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getGroupEdits: builder.infiniteQuery<
            GetEndpoint<"/api/group/edit/request/list">["response"],
            GetEndpoint<"/api/group/edit/request/list">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/group/edit/request/list", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getGroupEditsPage: builder.query<
            GetEndpoint<"/api/group/edit/request/list">["response"],
            GetEndpoint<"/api/group/edit/request/list">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/group/edit/request/list", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getGroupRequests: builder.infiniteQuery<
            GetEndpoint<"/api/group/request/list">["response"],
            GetEndpoint<"/api/group/request/list">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/group/request/list", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getGroupRequestsPage: builder.query<
            GetEndpoint<"/api/group/request/list">["response"],
            GetEndpoint<"/api/group/request/list">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/group/request/list", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getTagAliases: builder.infiniteQuery<
            GetEndpoint<"/api/tag/aliasto/request/list">["response"],
            GetEndpoint<"/api/tag/aliasto/request/list">["params"] & {refreshKey?: number}, PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {offset: 0, limit: 100},
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/tag/aliasto/request/list", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        getTagAliasesPage: builder.query<
            GetEndpoint<"/api/tag/aliasto/request/list">["response"],
            GetEndpoint<"/api/tag/aliasto/request/list">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/tag/aliasto/request/list", params: params
            }),
            providesTags: () => [{type: "Mod"}]
        }),

        searchPosts: builder.infiniteQuery<
            GetEndpoint<"/api/search/posts">["response"], 
            GetEndpoint<"/api/search/posts">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/posts", params: {...queryArg, ...pageParam}
            }),
            providesTags: (result, error, arg) => arg.query?.startsWith("history:") ?
                ["Posts", "History"] : ["Posts"]
        }),

        searchPostsPage: builder.query<
            GetEndpoint<"/api/search/posts">["response"], 
            GetEndpoint<"/api/search/posts">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/posts", params
            }),
            providesTags: (result, error, arg) => arg.query?.startsWith("history:") ?
                ["Posts", "History"] : ["Posts"]
        }),

        searchComments: builder.infiniteQuery<
            GetEndpoint<"/api/search/comments">["response"], 
            GetEndpoint<"/api/search/comments">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/comments", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Comments"}]
        }),

        searchCommentsPage: builder.query<
            GetEndpoint<"/api/search/comments">["response"], 
            GetEndpoint<"/api/search/comments">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/comments", params
            }),
            providesTags: () => [{type: "Comments"}]
        }),

        searchNotes: builder.infiniteQuery<
            GetEndpoint<"/api/search/notes">["response"], 
            GetEndpoint<"/api/search/notes">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/notes", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Notes"}]
        }),

        searchNotesPage: builder.query<
            GetEndpoint<"/api/search/notes">["response"], 
            GetEndpoint<"/api/search/notes">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/notes", params
            }),
            providesTags: () => [{type: "Notes"}]
        }),

        searchTags: builder.infiniteQuery<
            GetEndpoint<"/api/search/tags">["response"], 
            GetEndpoint<"/api/search/tags">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/tags", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchTagsPage: builder.query<
            GetEndpoint<"/api/search/tags">["response"], 
            GetEndpoint<"/api/search/tags">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/tags", params
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        searchGroups: builder.infiniteQuery<
            GetEndpoint<"/api/search/groups">["response"], 
            GetEndpoint<"/api/search/groups">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/search/groups", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Groups"}]
        }),

        searchGroupsPage: builder.query<
            GetEndpoint<"/api/search/groups">["response"], 
            GetEndpoint<"/api/search/groups">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/search/groups", params
            }),
            providesTags: () => [{type: "Groups"}]
        }),

        searchHistory: builder.infiniteQuery<
            GetEndpoint<"/api/user/history">["response"], 
            GetEndpoint<"/api/user/history">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/user/history", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        searchHistoryPage: builder.query<
            GetEndpoint<"/api/user/history">["response"], 
            GetEndpoint<"/api/user/history">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/user/history", params
            }),
            providesTags: () => [{type: "History"}]
        }),

        postHistory: builder.infiniteQuery<
            GetEndpoint<"/api/post/history">["response"], 
            GetEndpoint<"/api/post/history">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/post/history", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        postHistoryPage: builder.query<
            GetEndpoint<"/api/post/history">["response"], 
            GetEndpoint<"/api/post/history">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/post/history", params
            }),
            providesTags: () => [{type: "History"}]
        }),

        tagHistory: builder.infiniteQuery<
            GetEndpoint<"/api/tag/history">["response"], 
            GetEndpoint<"/api/tag/history">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/tag/history", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        tagHistoryPage: builder.query<
            GetEndpoint<"/api/tag/history">["response"], 
            GetEndpoint<"/api/tag/history">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/tag/history", params
            }),
            providesTags: () => [{type: "History"}]
        }),

        groupHistory: builder.infiniteQuery<
            GetEndpoint<"/api/group/history">["response"], 
            GetEndpoint<"/api/group/history">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/group/history", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "History"}]
        }),

        groupHistoryPage: builder.query<
            GetEndpoint<"/api/group/history">["response"], 
            GetEndpoint<"/api/group/history">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/group/history", params
            }),
            providesTags: () => [{type: "History"}]
        }),

        getPost: builder.query<
            GetEndpoint<"/api/post">["response"], 
            GetEndpoint<"/api/post">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/post", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Posts"},
                {type: "Post", id: arg.postID}
            ]
        }),

        getPostParent: builder.query<
            GetEndpoint<"/api/post/parent">["response"], 
            GetEndpoint<"/api/post/parent">["params"]
        >({
            query: (params) => ({
                url: "/api/post/parent", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Posts"},
                {type: "Post", id: arg.postID}
            ]
        }),

        getPostChildren: builder.query<
            GetEndpoint<"/api/post/children">["response"], 
            GetEndpoint<"/api/post/children">["params"]
        >({
            query: (params) => ({
                url: "/api/post/children", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Posts"},
                {type: "Post", id: arg.postID}
            ]
        }),

        getPostGroups: builder.query<
            GetEndpoint<"/api/groups">["response"], 
            GetEndpoint<"/api/groups">["params"]
        >({
            query: (params) => ({
                url: "/api/groups", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Groups"},
                {type: "Post", id: arg.postID}
            ]
        }),

        getPostHistory: builder.query<
            GetEndpoint<"/api/post/history">["response"], 
            GetEndpoint<"/api/post/history">["params"]
        >({
            query: (params) => ({
                url: "/api/post/history", params
            }),
            providesTags: (result, error, arg) => [
                {type: "History"},
                {type: "Post", id: arg?.postID}
            ]
        }),

        getComments: builder.query<
            GetEndpoint<"/api/post/comments">["response"], 
            GetEndpoint<"/api/post/comments">["params"]
        >({
            query: (params) => ({
                url: "/api/post/comments", params
            }),
            providesTags: () => [{type: "Comments"}],
            keepUnusedDataFor: 0
        }),

        getTag: builder.query<
            GetEndpoint<"/api/tag">["response"], 
            GetEndpoint<"/api/tag">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/tag", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Tags"},
                {type: "Tag", id: arg.tag}
            ]
        }),

        getTagHistory: builder.query<
            GetEndpoint<"/api/tag/history">["response"], 
            GetEndpoint<"/api/tag/history">["params"]
        >({
            query: (params) => ({
                url: "/api/tag/history", params
            }),
            providesTags: (result, error, arg) => [
                {type: "History"},
                {type: "Tag", id: arg?.tag}
            ]
        }),

        getGroup: builder.query<
            GetEndpoint<"/api/group">["response"], 
            GetEndpoint<"/api/group">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/group", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Groups"},
                {type: "Group", id: arg.name}
            ]
        }),

        getGroupHistory: builder.query<
            GetEndpoint<"/api/group/history">["response"], 
            GetEndpoint<"/api/group/history">["params"]
        >({
            query: (params) => ({
                url: "/api/group/history", params
            }),
            providesTags: (result, error, arg) => [
                {type: "History"},
                {type: "Group", id: arg?.slug}
            ]
        }),

        getFavgroups: builder.query<
            GetEndpoint<"/api/user/favgroups">["response"], 
            GetEndpoint<"/api/user/favgroups">["params"]
        >({
            query: (params) => ({
                url: "/api/user/favgroups", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Favgroups"}, 
                {type: "Favgroup"}
            ]
        }),

        getFavgroup: builder.query<
            GetEndpoint<"/api/favgroup">["response"], 
            GetEndpoint<"/api/favgroup">["params"]
        >({
            query: (params) => ({
                url: "/api/favgroup", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Favgroups"},
                {type: "Favgroup", id: arg.name}
            ]
        }),

        getUser: builder.query<
            GetEndpoint<"/api/user">["response"], 
            GetEndpoint<"/api/user">["params"]
        >({
            query: (params) => ({
                url: "/api/user", params
            }),
            providesTags: () => [{type: "Users"}]
        }),

        getUploads: builder.infiniteQuery<
            GetEndpoint<"/api/user/uploads">["response"], 
            GetEndpoint<"/api/user/uploads">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/user/uploads", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Posts"}]
        }),


        getFavorites: builder.infiniteQuery<
            GetEndpoint<"/api/user/favorites">["response"], 
            GetEndpoint<"/api/user/favorites">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/user/favorites", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Posts"}]
        }),

        getFavoriteTags: builder.query<
            GetEndpoint<"/api/tagfavorites">["response"], 
            GetEndpoint<"/api/tagfavorites">["params"]
        >({
            query: (params) => ({
                url: "/api/tagfavorites", params
            }),
            providesTags: () => [{type: "Tags"}]
        }),

        getFavoriteGroups: builder.query<
            GetEndpoint<"/api/user/favgroups">["response"], 
            GetEndpoint<"/api/user/favgroups">["params"]
        >({
            query: (params) => ({
                url: "/api/user/favgroups", params
            }),
            providesTags: (result, error, arg) => [
                {type: "Favgroups"}, 
                {type: "Favgroup"}
            ]
        }),

        getUserComments: builder.infiniteQuery<
            GetEndpoint<"/api/user/comments">["response"], 
            GetEndpoint<"/api/user/comments">["params"] & {refreshKey?: number},
            PageParams
        >({
            infiniteQueryOptions: {
                initialPageParam: {
                    offset: 0,
                    limit: 16
                },
                getNextPageParam,
                getPreviousPageParam
            },
            query: ({queryArg, pageParam}) => ({
                url: "/api/user/comments", params: {...queryArg, ...pageParam}
            }),
            providesTags: () => [{type: "Comments"}]
        }),

        getUserCommentsPage: builder.query<
            GetEndpoint<"/api/user/comments">["response"], 
            GetEndpoint<"/api/user/comments">["params"] & {refreshKey?: number}
        >({
            query: (params) => ({
                url: "/api/user/comments", params
            }),
            providesTags: () => [{type: "Comments"}]
        }),
    })
})

export const useInvalidatePost = () => {
    const dispatch = useDispatch()

    return (postID: string) => {
        dispatch(api.util.invalidateTags([{type: "Post", id: postID}, "Posts", "History", "Mod", "Tags", "Groups"]))
    }
}

export const useInvalidateTag = () => {
    const dispatch = useDispatch()

    return (tag: string) => {
        dispatch(api.util.invalidateTags([{type: "Tag", id: tag}, "Tags", "Posts", "History", "Mod"]))
    }
}

export const useInvalidateGroup = () => {
    const dispatch = useDispatch()

    return (slug: string) => {
        dispatch(api.util.invalidateTags([{type: "Group", id: slug}, "Groups", "Posts", "History", "Mod"]))
    }
}

export const useInvalidateFavgroup = () => {
    const dispatch = useDispatch()

    return (slug: string) => {
        dispatch(api.util.invalidateTags([{type: "Favgroup", id: slug}, "Favgroups", "Posts"]))
    }
}

export const useInvalidatePosts = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Post", "Posts", "History", "Mod", "Tags", "Groups"]))
    }
}

export const useInvalidateTags = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Tags", "Tag", "Posts", "History", "Mod"]))
    }
}

export const useInvalidateGroups = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Groups", "Group", "Posts", "History", "Mod"]))
    }
}

export const useInvalidateFavgroups = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Favgroups", "Favgroup", "Posts"]))
    }
}

export const useInvalidateComments = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Comments", "Post"]))
    }
}

export const useInvalidateNotes = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Notes", "Post", "History", "Mod"]))
    }
}

export const useInvalidateThreads = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Threads"]))
    }
}

export const useInvalidateMessages = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Messages"]))
    }
}

export const useInvalidateHistory = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["History"]))
    }
}

export const useInvalidateMod = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Mod"]))
    }
}

export const useInvalidateFavorites = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.invalidateTags(["Posts", "Favgroups", "Favgroup"]))
    }
}

export const useInvalidateSession = () => {
    const dispatch = useDispatch()

    return () => {
        dispatch(api.util.resetApiState())
    }
}

export const {
    useRelatedPostsInfiniteQuery,
    useDeletedHistoryPageQuery,
    useDeletedHistoryInfiniteQuery,
    useAliasHistoryPageQuery,
    useAliasHistoryInfiniteQuery,
    useGetTagAliasesPageQuery,
    useGetTagAliasesInfiniteQuery,
    useGetGroupRequestsPageQuery,
    useGetGroupRequestsInfiniteQuery,
    useGetGroupEditsPageQuery,
    useGetGroupEditsInfiniteQuery,
    useGetTagEditsPageQuery,
    useGetTagEditsInfiniteQuery,
    useGetGroupDeletionsPageQuery,
    useGetGroupDeletionsInfiniteQuery,
    useGetTagDeletionsPageQuery,
    useGetTagDeletionsInfiniteQuery,
    useGetPostDeletionsPageQuery,
    useGetPostDeletionsInfiniteQuery,
    useGetUnverifiedNotesPageQuery,
    useGetUnverifiedNotesInfiniteQuery,
    useGetPostEditsPageQuery,
    useGetPostEditsInfiniteQuery,
    useGetRejectedPostsPageQuery,
    useGetRejectedPostsInfiniteQuery,
    useGetUnverifiedPostsPageQuery,
    useGetUnverifiedPostsInfiniteQuery,
    useNoteHistoryPageQuery,
    useNoteHistoryInfiniteQuery,
    useGetMessageRepliesPageQuery,
    useGetMessageRepliesInfiniteQuery,
    useGetThreadRepliesPageQuery,
    useGetThreadRepliesInfiniteQuery,
    useGetLoginHistoryPageQuery,
    useGetLoginHistoryInfiniteQuery,
    useGetForumPostsPageQuery,
    useGetForumPostsInfiniteQuery,
    useSearchReportsPageQuery,
    useSearchReportsInfiniteQuery,
    useSearchThreadsPageQuery,
    useSearchThreadsInfiniteQuery,
    useSearchMessagesPageQuery,
    useSearchMessagesInfiniteQuery,
    useSearchSeriesPageQuery,
    useSearchSeriesInfiniteQuery,
    useSearchCharactersPageQuery,
    useSearchCharactersInfiniteQuery,
    useSearchArtistsPageQuery,
    useSearchArtistsInfiniteQuery,
    useSearchPostsInfiniteQuery,
    useSearchPostsPageQuery,
    useSearchCommentsInfiniteQuery,
    useSearchCommentsPageQuery,
    useSearchNotesInfiniteQuery,
    useSearchNotesPageQuery,
    useSearchTagsInfiniteQuery,
    useSearchTagsPageQuery,
    useSearchGroupsInfiniteQuery,
    useSearchGroupsPageQuery,
    useSearchHistoryInfiniteQuery,
    useSearchHistoryPageQuery,
    usePostHistoryInfiniteQuery,
    usePostHistoryPageQuery,
    useTagHistoryInfiniteQuery,
    useTagHistoryPageQuery,
    useGroupHistoryInfiniteQuery,
    useGroupHistoryPageQuery,
    useGetPostQuery,
    useGetPostParentQuery,
    useGetPostChildrenQuery,
    useGetPostGroupsQuery,
    useGetPostHistoryQuery,
    useGetCommentsQuery,
    useGetTagQuery,
    useGetTagHistoryQuery,
    useGetGroupQuery,
    useLazyGetGroupQuery,
    useGetGroupHistoryQuery,
    useGetFavgroupsQuery,
    useGetFavgroupQuery,
    useLazyGetFavgroupQuery,
    useGetUserQuery,
    useGetUploadsInfiniteQuery,
    useGetFavoritesInfiniteQuery,
    useGetFavoriteTagsQuery,
    useGetFavoriteGroupsQuery,
    useGetUserCommentsInfiniteQuery,
    useGetUserCommentsPageQuery
} = api