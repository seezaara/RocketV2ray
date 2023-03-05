const baseConfig = '{"log":{"access":"","error":"","loglevel":"none"},"inbounds":[{"tag":"proxy","port":58694,"listen":"127.0.0.1","protocol":"socks","sniffing":{"enabled":true,"destOverride":["http","tls"]},"settings":{"auth":"noauth","udp":true,"ip":null,"address":null,"clients":null},"streamSettings":null}],"outbounds":[{"tag":"proxy","protocol":"vmess","settings":{"vnext":[{"users":[{"security":"auto"}]}],"servers":null,"response":null},"streamSettings":{"network":"tcp","security":null,"tlsSettings":{"allowInsecure":true},"kcpSettings":{"mtu":1350,"tti":50,"uplinkCapacity":12,"downlinkCapacity":100,"congestion":false,"readBufferSize":2,"writeBufferSize":2,"header":{"type":"wechat-video"}},"wsSettings":{"connectionReuse":true,"path":"/path","headers":{"Host":"host.host.host"}},"httpSettings":{"host":["host.com"],"path":"/host"},"quicSettings":{"security":"none","key":"","header":{"type":"none"}},"tcpSettings":{"connectionReuse":true,"header":{"type":"http","request":{"version":"1.1","method":"GET","path":["/"],"headers":{"Host":[""],"User-Agent":["Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36","Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/53.0.2785.109 Mobile/14A456 Safari/601.1.46"],"Accept-Encoding":["gzip, deflate"],"Connection":["keep-alive"],"Pragma":"no-cache"}}}}},"mux":{"enabled":false}},{"tag":"direct","protocol":"freedom"}],"stats":{},"dns":{},"routing":{"domainStrategy":"AsIs","rules":[]}}';

function streamSettings(inp, data) {
    var config = {}
    config.network = data.net;

    if (data.tls === 'tls') {
        config.security = 'tls';
        if (data.host) config.tlsSettings.serverName = data.host;
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
    config.protocol = 'vmess';
    config.tag = data.ps;
}

function outbound(config, data) {
    if (data.protocol === 'vmess') {
        vmess(config, data);
    }
    config.streamSettings = streamSettings(config.streamSettings, data);
}

function parseVMess(url) {
    if (!url) return false;
    if (!url.startsWith('vmess://')) return false;

    try {
        const vmDec = Buffer.from(url.slice(8), 'base64').toString();
        if (!vmDec) return false;

        return { protocol: 'vmess', ...JSON.parse(vmDec) };
    } catch (error) {
        return false
    }

}

function vmess2config({ data, url, port, listen, dns }) {
    if (!data) {
        if (!url)
            return false;
        data = parseVMess(url);
    }
    if (!data)
        return false;
    var config = JSON.parse(baseConfig);
    const [inbound] = config.inbounds;
    if (port) inbound.port = port;
    if (listen) inbound.listen = listen;
    if (listen) inbound.settings.ip = listen;
    if (dns) config.dns.servers = dns;
    outbound(config.outbounds[0], data);
    return config;
}

module.exports = {
    parse: parseVMess,
    v2c: vmess2config
};