export interface Dataset<T> {
    label: string;
    backgroundColor?: string;
    data: T[];

    [i: string]: any;
}

export interface ChartData<T, L = string> {
    labels?: L[];
    datasets: Array<Dataset<T>>;
}
