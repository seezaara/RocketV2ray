const {
    contextBridge,
    ipcRenderer,
    clipboard,
    shell
} = require("electron");

const core = require('./core')
const openExternal = shell.openExternal
const api = ipcRenderer.invoke

contextBridge.exposeInMainWorld("core", core);
contextBridge.exposeInMainWorld("openExternal", openExternal);
contextBridge.exposeInMainWorld("clipboard", clipboard);
contextBridge.exposeInMainWorld("api", api);

// =============================================
const http = require('http');
const https = require('https');

async function lastversion(resolve) {
    var time = new Date().getTime()
    https.get("https://github.com/seezaara/RocketV2ray/releases/latest?d=" + time, function (res) {
        if (res.statusCode === 302) {
            this.abort()
            resolve(res.headers.location.replace(/.+\/[^]/, ""))
            return
        }
        resolve("")
    }).on('error', function () {
        resolve("")
    });
}
async function ping(resolve) {
    var time = new Date().getTime()
    http.get("http://www.google.com/gen_204", (res) => {
        if (res.statusCode === 204) {
            resolve(undefined, new Date().getTime() - time)
        } else {
            res.resume();
            resolve('Request Failed.\n' +
                `Status Code: ${res.statusCode}`);
            return;
        }
    }).on('error', resolve);
}
contextBridge.exposeInMainWorld("ping", ping);
contextBridge.exposeInMainWorld("lastversion", lastversion);
//====================================== 
const fs = require('fs');

contextBridge.exposeInMainWorld("languages", fs.readdirSync(__dirname + "/language").map(x => x.substring(0, 2)));
contextBridge.exposeInMainWorld("setlanguage", function (lang) { contextBridge.exposeInMainWorld("lang", require(__dirname + "/language/" + lang)) });