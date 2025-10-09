import functions from "../functions/Functions"
import {Session} from "../types/Types"

export default class NativeFunctions {
    private static wasmModule: Promise<any> | null = null

    private static getWasmModule = async () => {
        if (!this.wasmModule) {
            // @ts-ignore
            this.wasmModule = await window.Module()
        }
        return this.wasmModule
    }

    public static permutations(query: string) {
        const sliced = query.split(/ +/g)
        
        function* iterRecur(sliced: string[]) {
            if (sliced.length == 1) return yield sliced
            for (const result of iterRecur(sliced.slice(1))) {
                yield [sliced[0] + "-" + result[0], ...result.slice(1)]
                yield [sliced[0], ...result]
            }
        }
        return [...iterRecur(sliced)]
    }

    public static indexOfMax = (arr: number[]) => {
        if (arr.length === 0) return -1
        let max = arr[0]
        let maxIndex = 0
        for (var i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
                maxIndex = i
                max = arr[i]
            }
        }
        return maxIndex
    }

    public static parseSpaceEnabledSearch = async (query: string, session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!query) return query
        if (query.split(/ +/g).length > 10) return query
        let savedTags = await functions.cache.tagsCache(session, setSessionFlag)
        let permutations = NativeFunctions.permutations(query)
        let matchesArray = new Array(permutations.length).fill(0)
        let specialFlagsArray = new Array(permutations.length).fill("")
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < permutations[i].length; j++) {
                if (permutations[i][j]?.startsWith("+-")) {
                    specialFlagsArray[j] = "+-"
                    permutations[i][j] = permutations[i][j].replace("+-", "")
                }
                if (permutations[i][j]?.startsWith("+")) {
                    specialFlagsArray[j] = "+"
                    permutations[i][j] = permutations[i][j].replace("+", "")
                }
                if (permutations[i][j]?.startsWith("-")) {
                    specialFlagsArray[j] = "-"
                    permutations[i][j] = permutations[i][j].replace("-", "")
                }
                if (permutations[i][j]?.startsWith("*")) {
                    specialFlagsArray[j] = "*"
                    permutations[i][j] = permutations[i][j].replace("*", "")
                }
                const exists = savedTags[permutations[i][j]]
                if (exists) matchesArray[i]++
            }
        }
        for (let i = 0; i < permutations.length; i++) {
            for (let j = 0; j < permutations[i].length; j++) {
                for (let savedTag of Object.values(savedTags)) {
                    const exists = savedTag.aliases.find((a) => a?.alias === permutations[i][j])
                    if (exists) matchesArray[i]++
                }
            }
        }
        const index = NativeFunctions.indexOfMax(matchesArray)
        if (index !== -1 && matchesArray[index] !== 0) {
            let queries = [] as string[] 
            for (let j = 0; j < permutations[index].length; j++) {
                queries.push(`${specialFlagsArray[j]}${permutations[index][j]}`)
            }
            return queries.join(" ")
        }
        return query
    }

    public static parseSpaceEnabledSearchNative = async (query: string, session: Session, setSessionFlag: (value: boolean) => void) => {
        if (!query) return query
        let savedTags = await functions.cache.tagsCache(session, setSessionFlag)
        const nativeFunctions = await NativeFunctions.getWasmModule()
        return nativeFunctions.ccall("parseSpaceEnabledSearch", "string", ["string", "string"], [query, JSON.stringify(savedTags)])
    }
}