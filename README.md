# Grabber Proxy & Launcher

A system to intercept, capture, and manage files and data from an Adobe Flash MMORPG 2D Game, featuring a local proxy server, download queue, and an Electron-based launcher with Flash plugin support.

---

## Description

This project includes:

* **Proxy Server:** Runs locally on port 8002, intercepting and modifying game HTTP requests and responses.
* **Grabber:** Extracts and saves game assets such as items, quests, and maps.
* **Queue:** Manages downloads sequentially to avoid concurrency issues.
* **Launcher:** Electron desktop application that launches the game with embedded Pepper Flash Player support.

---

## Technologies

* Node.js with TypeScript
* Express and `http-proxy-middleware` for the proxy server
* Electron (v11) for desktop launcher
* Axios for HTTP requests
* WS (WebSocket) library for real-time communication
* Electron-Builder for packaging and distribution

---

## Installation

1. Clone the repo:

```bash
git clone https://github.com/anthony-hyo/grabber.git
cd grabber
```

2. Install dependencies:

```bash
npm install
```

---

## Available Scripts

* **Start the app (compile + run Electron):**

```bash
npm start
```

* **Run tests:**

```bash
npm test
```

* **Build Windows portable executable:**

```bash
npm run dist-win
```

* **Clean build artifacts:**

```bash
npm run clean
```

---

## Notes

* Flash plugin version used: **31.0.0.153**
* Requires Node.js and npm.
* Tested with Electron v11.
* Windows build supports both x64 and ia32 architectures.

---

## Contributing

Contributions are welcome! Please open issues or pull requests for improvements.

---

## License

This project is licensed under the MIT License.
