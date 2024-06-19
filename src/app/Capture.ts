import {IElectronLog} from "electron-log";
import * as http from 'http';
import * as WebSocket from 'ws';
import {dialog} from "electron";
import Grabber from "./Grabber";
import IItem from "../interfaces/IItem";
import Builder from "../helper/Builder";
import {writeFileSync} from "fs";

export default class Capture {

    private static readonly port: number = 8003;
    private static chunk: string = ``;
    private readonly log: IElectronLog;
    private readonly server: http.Server;
    private readonly wss: WebSocket.Server;

    constructor(log: IElectronLog) {
        this.log = log;

        this.server = http.createServer();
        this.wss = new WebSocket.Server({server: this.server});

        this.wss.on('connection', (ws: WebSocket) => ws.on('message', (message: string) => this.handler(JSON.parse(message.toString()))));

        this.server.listen(Capture.port);
    }

    private handler(data: any): void {
        this.log.info(JSON.stringify(data));

        try {
            writeFileSync('logfile.log', JSON.stringify(data) + '\n', { flag: 'a' });
        } catch (err) {
            console.error('Error writing to log file:', err);
        }

        const targetRequest: Function = (this as any)[data.cmd];

        if (targetRequest !== undefined) {
            dialog
                .showOpenDialog({
                    title: 'Select directory',
                    defaultPath: '~/Documents/',
                    buttonLabel: 'Select',
                    properties: [
                        'openDirectory'
                    ]
                })
                .then((result: Electron.OpenDialogReturnValue): void => {
                    if (result.canceled) {
                        return;
                    }

                    Grabber.directory = result.filePaths[0];

                    targetRequest(data);
                })
                .catch(console.error);
        }
    }

    private loadShop(data: any): void {
        const path: string = `${Grabber.directory}/Shop - ${Grabber.replaceInvalidChars(data.shopinfo.sName)}`;

        Grabber.writeToFile(path, `shop_items.json`, JSON.stringify(data, null, 2));

        let inserts: string = Builder.queryInsert('shops', {
            'Name': data.shopinfo.sName,
        });

        inserts += `\n\n`;

        const items: IItem[] = (data.shopinfo.items as IItem[]);

        Grabber.grabItems(path, `shop_items`, items,
            (): string => {
                return `${Builder.queryInsert('shops_items', {
                    'ShopID': {
                        'query': `(SELECT id FROM shops ORDER BY DateCreated DESC)`
                    },
                    'ItemID': {
                        'query': `(SELECT id FROM items ORDER BY DateCreated DESC)`
                    }
                })}\n\n`
            },
            (): string => inserts);
    }

    private getQuests(data: any): void {
        const questsKeys: string[] = Object.keys(data.quests);

        const formattedDateTime: string = new Date().toISOString().slice(0, 19).replace(/[:T]/g, ' ');

        for (const questKey of questsKeys) {
            const quest: any = data.quests[questKey];

            const path: string = `${Grabber.directory}/Quest - ${formattedDateTime}/${Grabber.replaceInvalidChars(quest.sName)}`;

            Grabber.writeToFile(path, `quest.json`, JSON.stringify(quest, null, 2));

            let inserts: string = Builder.queryInsert('quests', {
                'Name': quest.sName,
                'Description': quest.sDesc,
                'EndText': quest.sEndText,
            });

            Grabber.writeToFile(path, `quest.sql`, inserts);

            for (const rewardKey of Object.keys(quest.oRewards)) {
                Grabber.grabQuestItems(quest.oRewards[rewardKey], 'quest_rewards', path);
            }

            Grabber.grabQuestItems(quest.oItems, 'quest_requirements', path);
        }
    }

    private moveToArea(data: any): void {
        Grabber.current_area = data.strMapName;

        //const path: string = `${Grabber.directory}/Map - ${data.strMapName}`;
        const path: string = `${Grabber.directory}`;

        Grabber.writeToFile(path, `map.json`, JSON.stringify(data, null, 2));

        /**
         * Map
         */
        let inserts: string = Builder.queryInsert('maps', {
            'Name': data.strMapName,
            'File': data.strMapFileName,
        });

        Grabber.download(path, `${Grabber.target}/game/gamefiles/maps/${data.strMapFileName}`);

        inserts += `\n\n`;

        const monstersDefinitions: any[] = data.mondef ? (data.mondef as []) : [];
        const monstersMap: any[] = data.monmap ? (data.monmap as []) : [];

        /**
         * Monster
         */
        monstersDefinitions.forEach((monsterDefinition: any): void => {
            inserts += `${Builder.queryInsert('monsters', {
                'Name': monsterDefinition.strMonName,
                'File': monsterDefinition.strMonFileName,
                'Linkage': monsterDefinition.strLinkage,
            })}\n`

            Grabber.download(path, `${Grabber.target}/game/gamefiles/mon/${monsterDefinition.strMonFileName}`);

            monstersMap
                .filter(monsterMap => monsterMap.MonID == monsterDefinition.MonID)
                .forEach((monsterMap: any): void => {
                    inserts += `${Builder.queryInsert('maps_monsters', {
                        'MapID': {
                            'query': `(SELECT id FROM maps ORDER BY id DESC LIMIT 1)`
                        },
                        'MonsterID': {
                            'query': `(SELECT id FROM monsters ORDER BY id DESC LIMIT 1)`
                        },
                        'MonMapID': monsterMap.MonMapID,
                        'Frame': monsterMap.strFrame
                    })}\n`
                });

            inserts += `\n`;
        });

        Grabber.writeToFile(path, `map.sql`, inserts);
    }

}




















