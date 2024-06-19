import Grabber from "./Grabber";

export default class Queue {

    private static downloadQueue: Array<() => Promise<void>> = [];
    private static isDownloading: boolean = false;

    public static addToQueue(path: string, url: string): void {
        const downloadTask = async (): Promise<void> => {
            try {
                Grabber.download(path, url);
            } finally {
                this.isDownloading = false;
                this.processQueue();
            }
        };

        this.downloadQueue.push(downloadTask);

        if (!this.isDownloading) {
            this.processQueue();
        }
    }

    private static processQueue(): void {
        if (this.downloadQueue.length > 0) {
            const nextTask = this.downloadQueue.shift();

            if (nextTask) {
                this.isDownloading = true;

                nextTask()
                    .catch(console.error);
            }
        }
    }

}