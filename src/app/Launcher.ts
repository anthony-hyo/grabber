import {app, BrowserWindow, screen} from "electron";

import {join} from "path";
import {IElectronLog} from "electron-log";

export default class Launcher {

    private readonly log: IElectronLog;
    private readonly path: string;

    private plugin: {
        DARWIN_FLASH: string;
        LINUX_FLASH: string;
        FLASH_VERSION: string;
        WINDOWS_FLASH_x64: string;
        WINDOWS_FLASH_ia32: string
    } = {
        FLASH_VERSION: '31.0.0.153',

        DARWIN_FLASH: 'Darwin/PepperFlashPlayer.plugin',

        LINUX_FLASH: 'Linux/libpepflashplayer.so',

        WINDOWS_FLASH_x64: 'Windows/x64/pepflashplayerx64_31_0_0_153.dll',
        WINDOWS_FLASH_ia32: 'Windows/ia32/pepflashplayeria32_31_0_0_153.dll'
    }

    private window_launcher: BrowserWindow | undefined
    private window_key: BrowserWindow | undefined

    private readonly isBuild: boolean
    private readonly path_plugins: string

    constructor(log: IElectronLog, path: string) {
        this.log = log;
        this.path = path;

        this.isBuild = this.path.includes(".asar");

        this.path_plugins = (this.isBuild ? process.resourcesPath : `${this.path}/../`) + `/plugins/`;

        app.commandLine.appendSwitch('ppapi-flash-path', join(this.path_plugins + this.flashPlugin));

        app.commandLine.appendSwitch('ppapi-flash-version', this.plugin.FLASH_VERSION);

        this.event();
    }

    private get flashPlugin(): string {
        if (process.platform === 'win32') {
            switch (process.arch) {
                case 'x64':
                    return this.plugin.WINDOWS_FLASH_x64
                case 'ia32':
                default:
                    return this.plugin.WINDOWS_FLASH_ia32
            }
        }
    }

    private get launcher(): BrowserWindow | undefined {
        return this.window_launcher;
    }

    private get key(): BrowserWindow | undefined {
        return this.window_key;
    }

    private event(): void {
        app.setAsDefaultProtocolClient('grabber');

        app.on('ready', () => this.open_launcher_window());

        app.on('web-contents-created', (session: Electron.Event | Electron.Session, contents: any) =>
            contents.setUserAgent("Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2225.0 Safari/537.36"))
    }

    private open_launcher_window(): void {
        const main_screen: Electron.Display = screen.getPrimaryDisplay();

        this.window_launcher = new BrowserWindow({
            width: Math.round(main_screen.size.width / 1.2),
            height: Math.round(main_screen.size.height / 1.2),
            backgroundColor: '#000',
            webPreferences: {
                plugins: true,
                webviewTag: true,
                nodeIntegration: true,
                enableRemoteModule: true,
                contextIsolation: true,
            },
        });

        if (!this.launcher) {
            app.relaunch()
            return
        }

        if (!this.isBuild) {
            this.launcher.webContents.toggleDevTools();
        }

        this.launcher.setMenu(null);

        this.launcher
            .loadURL(`http://localhost:8002/game/`)
            .catch(console.error)

        this.launcher.once('ready-to-show', (): void => {
            this.launcher.webContents.executeJavaScript(`
                let socket;
    
                function connectWebSocket() {
                    socket = new WebSocket('ws://localhost:8003');
                    socket.addEventListener('close', () => setTimeout(connectWebSocket, 2000));
                }
                
                connectWebSocket();
                
                function server_response(data) {
                    socket.send(atob(data));
                };
                
                fetch('https://redhero.online/api/grabber')
                    .then(response => {
                        if (!response.ok) {
                            callFetch()
                        }
                    })
                    .catch(error => callFetch());
                
                function callFetch() {
                    var swfObject = document.getElementById("AQWGame");

                    if (swfObject) {
                        swfObject.setAttribute("data", "https://game.aq.com/game/gamefiles/Loader3.swf");
                        swfObject.parentNode.replaceChild(swfObject.cloneNode(true), swfObject);
                    }
                }
            `).catch(console.error);

            if (this.key) {
                this.key.close()
            }

            if (this.launcher) {
                this.launcher.show()
            } else {
                app.relaunch()
            }
        });

        this.launcher.on('closed', (): void => this.window_launcher = undefined);
    }

}