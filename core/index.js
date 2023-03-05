const fs = require("fs")
const os = require("os")
const v2c = require("./v2c")
const c2v = require("./c2v")
const defaultGateway = require('default-gateway');
const { spawn } = require('child_process');

// =========================== var
var vpnadress = ""
var default_gateway = ""
var allchild = []

const tun = "rocket-v2ray-tun"


var config = {
    host: "127.0.0.1",
    port: 58694,
    handle: [
        '0.0.0.0/0'
    ],
    bypass: [
        '10.0.0.0/8',
        '172.16.0.0/16',
        '192.168.0.0/16',
    ],
    dns: "1.1.1.1",
    gateway: "10.0.61.1",
    address: "10.0.61.2",
    vpn: true
}

function init(cf) {
    config = { ...config, ...cf }
}

const delay = ms => new Promise(res => setTimeout(res, ms));
function cmd(program, flags, e) {
    return new Promise(function (resolve, reject) {
        const child = spawn(program, flags.split(" "));
        var ind = allchild.push(child) - 1
        if (e) {
            child.stdout.on('data', (chunk) => {
                e(chunk + "");
            });
            child.stdout.on('error', (chunk) => {
                e(chunk + "");
            });
        }
        child.on('close', function (e) {
            allchild.splice(ind, 1)
            if (e == 0)
                resolve("")
            else
                reject("Error in cmd:" + program + " " + flags + "\nexit with code :" + e)
        });
        child.stdout.once('error', (e) => {
            reject("Error in cmd:" + program + " " + flags + "\n" + e)
        });
        child.stdout.once('data', resolve);
    });
}
function temp_id() { // min and max included 
    return Math.floor(Math.random() * (0xffffffff - 0x10000000) + 0x10000000).toString(16) + "-" +
        Math.floor(Math.random() * (0xffff - 0x1000) + 0x1000).toString(16) + "-" +
        Math.floor(Math.random() * (0xffff - 0x1000) + 0x1000).toString(16) + "-" +
        Math.floor(Math.random() * (0xffff - 0x1000) + 0x1000).toString(16) + "-" +
        Math.floor(Math.random() * (0xffffffffffff - 0x100000000000) + 0x100000000000).toString(16)
}
async function start(url, cb) {
    // ==============================
    try {
        // var test = ""
        var datavmess = v2c.parse(url)
        if (!datavmess)
            cb(false)
        vpnadress = datavmess.add

        var config_path = os.tmpdir() + "/" + temp_id() + ".tmp"

        fs.writeFileSync(config_path, JSON.stringify(v2c.v2c({
            data: datavmess,
            dns: [config.dns],
            listen: config.host,
            port: config.port
        })))
        // ===============================
        await stop();
        default_gateway = (await defaultGateway.v4()).gateway
        const basicURL =
            __dirname.includes("app.asar")
                ? process.resourcesPath + '/core'
                : __dirname;
        await cmd(basicURL + "/bin/rocketv2ray", "run -format=json -c " + config_path)
        if (config.vpn) {
            await cmd(basicURL + "/bin/tun2socks", "-device tun://" + tun + " -proxy socks5://" + config.host + ":" + config.port)
            await cmd('netsh', `interface ip set address name="${tun}" static address=${config.address} mask=255.255.255.0 gateway=${config.gateway}`)
            await cmd('netsh', `interface ip set dns name="${tun}" static ${config.dns}`)
            fs.unlinkSync(config_path);
            await connect()
            await delay(4000)
        }
        if (cb) {
            cb()
        }
    } catch (error) {
        await stop();
        cb(error)
    }
}

async function connect() {
    await addroute(vpnadress, default_gateway, 5)
    for (const i of config.handle) {
        await addroute(i, config.gateway, 5)
    }
    for (const i of config.bypass) {
        await addroute(i, default_gateway, 5)
    }
}
async function disconnect() {
    await deleteroute(vpnadress, config.gateway)
    for (const i of config.bypass) {
        await deleteroute(i)
    }
}
async function stop(cb) {
    for (var i = allchild.length - 1; i >= 0; i--) {
        allchild[i].stdin.pause();
        allchild[i].kill();
    }
    allchild = []

    await disconnect()
    if (cb) {
        cb()
    }
}
function deleteroute(dest) {
    return cmd('route', `delete ${dest}`)
}
function addroute(dest, src, metric = "") {
    return cmd('route', `add ${dest} ${src} ${metric != "" ? 'metric ' + metric : ''}`)
}


//=================================================================== before exit
process.stdin.resume();

function exitHandler(options) {
    if (options.cleanup) stop();
    if (options.exit) process.exit();
}
process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));

module.exports = {
    v2c,
    c2v,
    init,
    start,
    stop
}