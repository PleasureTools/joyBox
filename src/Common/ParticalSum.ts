export function* ParticalSum(iterable: number[]) {
    let s = 0;

    for (const x of iterable) {
        s += x;
        yield s;
    }
}
