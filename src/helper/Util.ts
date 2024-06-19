import * as https from "https";

export default class Util {
    public static pingWebsite(websiteUrl: string, callback: Function): void {
        https.get(websiteUrl, (response) => {
            switch (response.statusCode) {
                case 200:
                    callback(null, true);
                    break;
                default:
                    callback(null, false);
                    break;
            }
        }).on('error', (error) => callback(error, false));
    }

}