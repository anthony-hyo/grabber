import Launcher from "./app/Launcher";

import log from "electron-log"
import Capture from "./app/Capture";
import ProxyServer from "./app/ProxyServer";

log.transports.file.level = "info";

new ProxyServer(log, __dirname);

new Capture(log);

new Launcher(log, __dirname);
