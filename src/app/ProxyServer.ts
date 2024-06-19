import express, {Application, NextFunction, Request, Response} from 'express';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {IElectronLog} from "electron-log";
import _path from "path";
import Grabber from "./Grabber";

export default class ProxyServer {

    private static readonly port: number = 8002;

    private readonly log: IElectronLog;
    private readonly path: string;
    private readonly app: Application;

    constructor(log: IElectronLog, path: string) {
        this.log = log;
        this.path = path;
        this.app = express();

        this.app.use((req: Request, res: Response, next: NextFunction) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            next();
        });

        const proxy: any = createProxyMiddleware({
            target: Grabber.target,
            changeOrigin: true,
        });

        this.app.get('/game/api/data/gameversion', (req: Request, res: Response) => res.type('application/json').send(`{"sFile":"Game3085a.swf","sTitle":"Hi","sBG":"Generic2.swf","sVersion":"R0033"}`));

        this.app.get('/crossdomain.xml', (req: Request, res: Response) => res.type('application/xml').send(`<?xml version="1.0"?><!DOCTYPE cross-domain-policy SYSTEM "http://www.adobe.com/xml/dtds/cross-domain-policy.dtd"><cross-domain-policy><allow-access-from domain="*" /></cross-domain-policy>`));

        this.app.get('/game/gamefiles/Game3085a.swf', (req: Request, res: Response) => res.sendFile(_path.join(this.path, 'public', 'Game.swf')));

        this.app.use('/', proxy);

        this.app.listen(ProxyServer.port);
    }

}