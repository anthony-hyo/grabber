import * as fs from "fs";
import axios, {AxiosResponse} from "axios";
import IItem from "../interfaces/IItem";
import Builder from "../helper/Builder";
import Queue from "./Queue";

export default class Grabber {

    private static _directory: string = null;

    public static current_area: string = 'battleon';

    public static readonly target: string = 'https://game.aq.com';

    public static readonly INVALID_PATH_CHARS: RegExp = /[<>:"|?*]/g;

    public static get directory(): string {
        return `${this._directory}/${this.current_area}`;
    }

    public static set directory(value: string) {
        this._directory = value;
    }

    public static grabItems(path: string, file_name: string, items: IItem[], call: Function = null, call2: Function = null): void {
        this.writeToFile(path, `${file_name}.json`, JSON.stringify(items, null, 2));

        let insertsV4: string = ``;
        let insertsV4Clean: string = ``;
        let insertsV4CleanAQW: string = ``;
        let insertsV3Clean: string = ``;

        if (call2) {
            insertsV4 += call2();
        }

        /**
         * database: v4
         * table: items, items_aqw
         */
        items.forEach((item: IItem): void => {
            if (item.sES === 'None') {
                item.sES = 'Item';
            }

            const insertValue: {
                Description: string;
                TypeItemID: { query: string };
                Icon: string;
                File: string;
                Link: string;
                Name: string
            } = {
                'Name': item.sName,
                'Description': item.sDesc,
                'File': item.sFile,
                'Link': item.sLink,
                'Icon': item.sIcon,
                'TypeItemID': {
                    'query': `(SELECT id FROM types_items WHERE Name = '${item.sType}' AND EquipSpot = '${item.sES}')`
                }
            };

            const insertV4: string = `${Builder.queryInsert('items', insertValue)}\n`;
            const insertV4Clean: string = `${Builder.queryInsert('items_aqw', insertValue)}\n`;
            const insertV3Clean: string = `${Builder.queryInsert('items', {
                'Name': item.sName,
                'Description': item.sDesc,
                'File': item.sFile,
                'Link': item.sLink,
                'Icon': item.sIcon,
                'Equipment': item.sES,
                'Type': item.sType
            })}\n`;

            insertsV4 += insertV4;
            insertsV4Clean += insertV4;
            insertsV4CleanAQW += insertV4Clean;
            insertsV3Clean += insertV3Clean;

            if (call) {
                insertsV4 += call();
            }
        });

        this.writeToFile(path, `${file_name} - v4.sql`, insertsV4);
        this.writeToFile(path, `${file_name} - v4.items.sql`, insertsV4Clean);
        this.writeToFile(path, `${file_name} - v4.items_aqw.sql`, insertsV4CleanAQW);
        this.writeToFile(path, `${file_name} - v3.items.sql`, insertsV3Clean);

        items.forEach((item: IItem): void => {
            if (item.sFile === '') {
                return;
            }

            switch (item.sType) {
                case 'Class':
                case 'Armor':
                    this.download(path, `${this.target}/game/gamefiles/classes/m/${item.sFile}`);
                    this.download(path, `${this.target}/game/gamefiles/classes/f/${item.sFile}`);
                    break;
                case 'Building':
                    this.download(path, `${this.target}/game/gamefiles/maps/${item.sFile}`);
                    break;
                case 'House':
                    this.download(path, `${this.target}/game/gamefiles/maps/${item.sFile}`);
                    this.download(path, `${this.target}/game/gamefiles/maps/${item.sFile.split('.swf')[0]}_preview.swf`);
                    break;
                default:
                    this.download(path, `${this.target}/game/gamefiles/${item.sFile}`);
                    break;
            }
        });
    }

    public static grabQuestItems(target: any, file_name: string, path: string) {
        const items: IItem[] = [];

        for (const itemKey of Object.keys(target)) {
            items.push(target[itemKey] as IItem)
        }

        this.grabItems(path, file_name, items);
    }

    public static download(path: string, url: string): void {
        if (!url.endsWith(`.swf`) || !this._directory) {
            return;
        }

        try {
            const path_split: string[] = new URL(url).pathname.split('/');
            const pathName: string = `${path}/${path_split.slice(2, -1).join('/')}/`;
            const file_name: string = path_split[path_split.length - 1];
            const path_full: string = `${pathName}${file_name}`;

            if (fs.existsSync(path_full)) {
                return;
            }

            axios
                .get(url, {
                    responseType: 'arraybuffer',
                    headers: {
                        "Referer": `${this.target}/game/'`,
                        "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2225.0 Safari/537.36"
                    }
                })
                .then((response: AxiosResponse<any>): void => this.writeToFile(pathName, file_name, response.data))
                .catch(function (error: any): void {
                    console.error('Error during download:', error);

                    if (error.response) {
                        console.error(1, error.response.status, error.config.url);
                    } else if (error.request) {
                        console.error(2, error.code, error.config.url);
                    } else {
                        console.error(3, error.message);
                    }

                    Queue.addToQueue(path, url);
                });
        } catch (e) {
            console.error(`error`, e);
        }
    }

    public static writeToFile(path: string, file_name: string, content: any): void {
        fs.mkdirSync(path, {
            recursive: true
        })

        fs.writeFileSync(`${path}/${file_name}`, content);
    }

    public static replaceInvalidChars(value: string): string {
        return value.replace(this.INVALID_PATH_CHARS, ``);
    }

}