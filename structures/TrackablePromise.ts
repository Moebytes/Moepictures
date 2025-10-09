export type PromiseState = "pending" | "fulfilled" | "rejected"

export class TrackablePromise<T> {
    public state: PromiseState = "pending"
    public promise: Promise<T>
    private resolveFn!: (value: T | PromiseLike<T>) => void
    private rejectFn!: (reason?: any) => void

    public readonly [Symbol.toStringTag] = "Promise"

    public constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolveFn = (value) => {
                this.state = "fulfilled"
                resolve(value)
            };
            this.rejectFn = (reason) => {
                this.state = "rejected"
                reject(reason)
            }
        })
    }

    public resolve = (value: T | PromiseLike<T>) => {
        this.resolveFn(value)
    }

    public reject = (reason?: string) => {
        this.rejectFn(reason)
    }

    public then = <TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
    ) => {
        return this.promise.then(onfulfilled, onrejected)
    }

    public catch = <TResult = never>(
        onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
    ) => {
        return this.promise.catch(onrejected)
    }

    public finally = (onfinally?: (() => void) | undefined | null) => {
        return this.promise.finally(onfinally)
    }
}