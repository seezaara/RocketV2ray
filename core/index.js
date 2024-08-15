const fs = require("fs")
const os = require("os")
const tools = require("js2ray-tools")

const dns = require('dns');
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
    dns: [
        "1.1.1.1",
        "8.8.8.8"
    ],
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
        const child = spawn(program, flags.match(/("[^"]+"|[^\s"]+)/g));
        var ind = allchild.push(child) - 1
        if (e) {
            child.stdout.on('data', (chunk) => {
                e(chunk + "");
            });
            child.stderr.on('data', (chunk) => {
                e("Error in cmd:" + program + " " + flags + "\n" + chunk)
            });
        }
        child.on('close', function (e) {
            allchild.splice(ind, 1)
            if (e == 0)
                resolve("")
            else
                reject("Error in cmd:" + program + " " + flags + "\nexit with code :" + e)
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
async function start(configjson, cb) {
    // ==============================
    try {
        if (!configjson)
            cb(false)
        vpnadress = await lookupPromise(tools.config2url(configjson, false).add)
        var config_path = os.tmpdir() + "/" + temp_id() + ".tmp"
        fs.writeFileSync(config_path, JSON.stringify(tools.url2config({
            config: configjson,
            dns: config.dns,
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
            await cmd(basicURL + "/bin/tun2socks", "-loglevel warning -tcp-auto-tuning -device tun://" + tun + " -proxy socks5://" + config.host + ":" + config.port + " -tun-post-up \"echo 1\"")
            await cmd('netsh', `interface ip set address name="${tun}" static address=${config.address} mask=255.255.255.0 gateway=${config.gateway}`)
            await cmd('netsh', `interface ip set dns name="${tun}" static address=${config.dns[0]} validate=no`)
            await cmd('netsh', `interface ip add dnsserver name="${tun}" address=${config.dns[1]} index=2 validate=no`)
            fs.unlinkSync(config_path);
            await delay(4000)
            await connect()
        } else {
            await delay(100)
            fs.unlinkSync(config_path);
        }

        if (cb) {
            cb()
        }
    } catch (error) {
        try {
            disconnect()
        } catch (error) {
            console.log(error)
        }
        console.log(error)
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
async function lookupPromise(address) {
    // return address + " mask 255.255.255.255"
    return new Promise((resolve, reject) => {
        dns.lookup(address, (err, address, family) => {
            if (err) reject(err);
            resolve(address);
        });
    });
};


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
    tools,
    init,
    start,
    stop
}