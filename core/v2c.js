const urlparse = require('url');
const querystring = require('querystring');

const baseConfig = '{"log":{"access":"","error":"","loglevel":"none"},"inbounds":[{"tag":"proxy","port":58694,"listen":"127.0.0.1","protocol":"socks","sniffing":{"enabled":true,"destOverride":["http","tls"]},"settings":{"auth":"noauth","udp":true,"ip":null,"address":null,"clients":null},"streamSettings":null}],"outbounds":[{"tag":"proxy","protocol":"","settings":{"vnext":[{"users":[{"security":"auto"}]}],"servers":null,"response":null},"streamSettings":{"network":"tcp","security":null,"tlsSettings":{"allowInsecure":true,"fingerprint":"randomized"},"kcpSettings":{"mtu":1350,"tti":50,"uplinkCapacity":12,"downlinkCapacity":100,"congestion":false,"readBufferSize":2,"writeBufferSize":2,"header":{"type":"wechat-video"}},"wsSettings":{"connectionReuse":true,"path":"/path","headers":{"Host":"host.host.host"}},"httpSettings":{"host":["host.com"],"path":"/host"},"quicSettings":{"security":"none","key":"","header":{"type":"none"}},"tcpSettings":{"connectionReuse":true,"header":{"type":"http","request":{"version":"1.1","method":"GET","path":["/"],"headers":{"Host":[""],"User-Agent":["Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36","Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/53.0.2785.109 Mobile/14A456 Safari/601.1.46"],"Accept-Encoding":["gzip, deflate"],"Connection":["keep-alive"],"Pragma":"no-cache"}}}}},"mux":{"enabled":false}},{"tag":"direct","protocol":"freedom"}],"stats":{},"dns":{},"routing":{"domainStrategy":"AsIs","rules":[]}}';

function streamSettings(inp, data) {
    var config = {}
    config.network = data.net;

    if (data.tls) {
        config.security = data.tls;
        if (data.sni)
            inp.tlsSettings.serverName = data.sni;
        else if (data.host)
            inp.tlsSettings.serverName = data.host;
        if (data.alpn)
            inp.tlsSettings.alpn = data.alpn.split(",");
        config[data.tls + "Settings"] = inp.tlsSettings
    }
    if (data.net === 'kcp') {
        const { kcpSettings } = inp;
        kcpSettings.header.type = data.type;
        config.kcpSettings = kcpSettings
    } else if (data.net === 'ws') {
        const { wsSettings } = inp;
        if (data.host) wsSettings.headers.Host = data.host;
        if (data.path) wsSettings.path = data.path;
        config.wsSettings = wsSettings
    } else if (data.net === 'h2') {
        const { httpSettings } = inp;
        if (data.host) httpSettings.host = data.host.split(',');
        httpSettings.path = data.path;
        config.httpSettings = httpSettings
    } else if (data.net === 'quic') {
        const { quicSettings } = inp;
        quicSettings.security = data.host;
        quicSettings.key = data.path;
        quicSettings.header.type = data.type;
        config.quicSettings = quicSettings
    } else if (data.net === 'tcp') {
        if (data.type === 'http') {
            const { tcpSettings } = inp;
            tcpSettings.header.request.headers.Host = data.host;
            tcpSettings.header.request.path = [data.path];
            config.tcpSettings = tcpSettings
        }
    } else {
    }
    return config
}

function vmess(config, data) {
    const [vnext] = config.settings.vnext;
    const [user] = vnext.users;
    vnext.address = data.add;
    vnext.port = +data.port;
    user.id = data.id;
    user.security = data.scy;
    user.alterId = +data.aid;
    config.protocol = data.protocol;
    config.tag = data.ps;
}
function vless(config, data) {
    const [vnext] = config.settings.vnext;
    const [user] = vnext.users;
    vnext.address = data.add;
    vnext.port = +data.port;
    user.id = data.id;
    user.security = data.scy;
    if (data.flow) user.encryption = data.enc;
    if (data.flow) user.flow = data.flow;
    config.protocol = data.protocol;
    config.tag = data.ps;
}

function trojan(config, data) {
    delete config.settings.vnext;
    config.settings.servers = [{}]
    const [servers] = config.settings.servers;
    servers.address = data.add;
    servers.port = +data.port;
    servers.password = data.id;
    servers.method = data.scy;
    servers.ota = false;
    if (data.enc) servers.encryption = data.enc;
    if (data.flow) servers.flow = data.flow;
    config.protocol = data.protocol;
    config.tag = data.ps;
}

function shadowSocks(config, data) {
    delete config.settings.vnext;
    config.settings.servers = [{}]
    const [servers] = config.settings.servers;
    servers.address = data.add;
    servers.port = +data.port;
    servers.password = data.id;
    servers.method = data.scy;
    servers.ota = false;
    config.protocol = "shadowsocks";
    config.tag = data.ps;
}

function socks(config, data) {
    delete config.settings.vnext;
    config.settings.servers = [{ "users": [{}] }]
    const [servers] = config.settings.servers;
    servers.address = data.add;
    servers.port = +data.port;
    servers.users[0].pass = data.id;
    servers.users[0].user = data.scy;
    servers.ota = false;
    servers.password = "";
    config.protocol = "socks";
    config.tag = data.ps;
}

function outbound(data) {
    var config = JSON.parse(baseConfig);
    const [outbounds] = config.outbounds;
    if (data.protocol === 'vmess') {
        vmess(outbounds, data);
    } else if (data.protocol === 'vless') {
        vless(outbounds, data);
    } else if (data.protocol === "trojan") {
        trojan(outbounds, data);
    } else if (data.protocol === "ss") {
        shadowSocks(outbounds, data);
    } else if (data.protocol === "socks") {
        socks(outbounds, data);
    }
    outbounds.streamSettings = streamSettings(outbounds.streamSettings, data);

    return config
}

function parseProtocol(url) {
    try {
        if (!url) return false;
        let temp = url.split("://");
        let protocol = temp[0].toLowerCase();
        if (protocol === "vmess") {
            const vmDec = Buffer.from(url.slice(8), 'base64').toString();
            if (!vmDec) return false;
            if (!vmDec.path)
                vmDec.path = "/"
            return { protocol: protocol, ...JSON.parse(vmDec) };
        } else if (protocol === "vless" || protocol === "trojan") {
            let parsed_url = urlparse.parse(decodeURIComponent(url));
            let netquery = Object.fromEntries(Object.entries(querystring.parse(parsed_url.query)).map(([k, v]) => [k, v.length > 1 ? v : v[0]]));
            return {
                protocol: protocol,
                ps: parsed_url.hash.substring(1) || "none",
                add: parsed_url.hostname || "none",
                port: Number(parsed_url.port) || 0,
                id: parsed_url.auth || "",
                scy: "auto",
                net: netquery.type || "none",
                type: netquery.headerType || "",
                host: netquery.host || "",
                path: netquery.path || "/",
                tls: netquery.security || "",
                enc: netquery.encryption,
                sni: netquery.sni || "",
                flow: netquery.flow || "",
                alpn: netquery.alpn
            }

        } else if (protocol === "ss") {
            let parsed_url = urlparse.parse(decodeURIComponent(url));
            parsed_url.auth = Buffer.from(parsed_url.auth, 'base64').toString().split(":")
            return {
                id: parsed_url.auth[1] || "",
                protocol: protocol,
                ps: parsed_url.hash.substring(1) || "none",
                add: parsed_url.hostname || "none",
                port: Number(parsed_url.port) || 0,
                scy: parsed_url.auth[0] || "auto",
                net: "tcp"
            }
        } else if (protocol === "socks") {
            let parsed_url = urlparse.parse(decodeURIComponent(url));
            parsed_url.auth = Buffer.from(parsed_url.auth, 'base64').toString().split(":")
            return {
                id: parsed_url.auth[1] || "",
                protocol: protocol,
                ps: parsed_url.hash.substring(1) || "none",
                add: parsed_url.hostname || "none",
                port: Number(parsed_url.port) || 0,
                scy: parsed_url.auth[0] || "auto",
                net: "tcp"
            }
        }
    } catch (error) {
        console.log(error)
        return false
    }

}

function vmess2config({ data, url, port, listen, dns }) {
    if (!data) {
        if (!url)
            return false;
        data = parseProtocol(url);
    }
    if (!data)
        return false;
    var config = outbound(data);
    const [inbound] = config.inbounds;
    if (port) inbound.port = port;
    if (listen) inbound.listen = listen;
    if (listen) inbound.settings.ip = listen;
    if (dns) config.dns.servers = dns;
    return config
}

module.exports = {
    parse: parseProtocol,
    v2c: vmess2config
};