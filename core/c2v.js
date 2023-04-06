
const querystring = require('querystring');

function streamSettingsReverse(config) {
	let net = null, alpn = null, tls = null, sni = null, host = null, type = null, path = null;

	net = config.network;

	if (config.security) {
		tls = config.security;
		if (config[tls + "Settings"]) {
			sni = config[tls + "Settings"].serverName;
			if (config[tls + "Settings"].alpn)
				alpn = config[tls + "Settings"].alpn.join(",");
		} else if (config.tlsSettings) {
			sni = config.tlsSettings.serverName;
			if (config.tlsSettings.alpn)
				alpn = config.tlsSettings.alpn.join(",");
		}
	}

	if (net === 'kcp') {
		const { kcpSettings } = config;
		type = kcpSettings.header.type
	} else if (net === 'ws') {
		const { wsSettings } = config;
		host = wsSettings.headers.Host;
		if (wsSettings.path) path = wsSettings.path;
	} else if (net === 'h2') {
		const { httpSettings } = config;
		if (httpSettings.host) host = httpSettings.host.join(',');
		path = httpSettings.path;
	} else if (net === 'quic') {
		const { quicSettings } = config;
		host = quicSettings.security
		path = quicSettings.key
		type = quicSettings.header.type;
	} else if (net === 'tcp') {
		const { tcpSettings } = config;
		if (tcpSettings && tcpSettings.header && tcpSettings.header.type === 'http') {
			type = tcpSettings.header.type;
			host = tcpSettings.header.request.headers.Host
			path = tcpSettings.header.request.path[0]
		}
	}

	return {
		net, alpn, tls, sni, host, type, path
	}
}


function vmess(outbounds, stream) {
	const [vnext] = outbounds.settings.vnext;
	const [user] = vnext.users;
	return {
		v: "2",
		protocol: outbounds.protocol,
		ps: outbounds.tag || "none",
		add: vnext.address || "none",
		port: Number(vnext.port) || 0,
		id: user.id || "",
		aid: (user.alterId + "") || "0",
		scy: user.security || "",
		net: stream.net || "none",
		type: stream.type || "",
		host: stream.host || "",
		path: stream.path || "",
		tls: stream.tls || "",
		sni: stream.sni || "",
		alpn: stream.alpn || "",
	}
}
function vless(outbounds, stream) {
	const [vnext] = outbounds.settings.vnext;
	const [user] = vnext.users;
	return {
		protocol: outbounds.protocol,
		ps: outbounds.tag || "none",
		add: vnext.address || "none",
		port: Number(vnext.port) || 0,
		id: user.id || "",
		scy: user.security,
		net: stream.net || "none",
		type: stream.type || "",
		host: stream.host || "",
		path: stream.path || "/",
		tls: stream.tls || "",
		sni: stream.sni || "",
		alpn: stream.alpn || "",
		enc: user.encryption || "",
		flow: user.flow || "",
	}
}

function trojan(outbounds, stream) {
	const [server] = outbounds.settings.servers;
	return {
		protocol: outbounds.protocol,
		ps: outbounds.tag || "none",
		add: server.address || "none",
		port: Number(server.port) || 0,
		id: server.password || "",
		scy: server.method || "",
		net: stream.net || "none",
		type: stream.type || "",
		host: stream.host || "",
		path: stream.path || "/",
		tls: stream.tls || "",
		sni: stream.sni || "",
		alpn: stream.alpn || "",
		// enc: user.encryption || "",
		flow: server.flow || "",
	}
}

function shadowSocks(outbounds, stream) {
	const [server] = outbounds.settings.servers;
	return {
		protocol: "ss",
		ps: outbounds.tag || "none",
		add: server.address || "none",
		port: Number(server.port) || 0,
		id: server.password || "",
		scy: server.method || "",
		net: stream.net || "none",
	}
}

function socks(outbounds, stream) {
	const [server] = outbounds.settings.servers;
	const user = server.users ? server.users[0] : {};
	return {
		protocol: outbounds.protocol,
		ps: outbounds.tag || "none",
		add: server.address || "none",
		port: Number(server.port) || 0,
		id: user.pass || "",
		scy: user.user || "",
		net: stream.net || "none",
	}
}

function createObj(outbounds) {
	const stream = streamSettingsReverse(outbounds.streamSettings);
	if (outbounds.protocol === 'vmess') {
		return vmess(outbounds, stream);
	} else if (outbounds.protocol === 'vless') {
		return vless(outbounds, stream);
	} else if (outbounds.protocol === "trojan") {
		return trojan(outbounds, stream);
	} else if (outbounds.protocol === "shadowsocks") {
		return shadowSocks(outbounds, stream);
	} else if (outbounds.protocol === "socks") {
		return socks(outbounds, stream);
	}
}

function createEncodedUrl(data) {
	try {
		var protocol = data.protocol
		delete data.protocol
		if (protocol === 'vmess') {
			return `${protocol}://` + Buffer.from(JSON.stringify(data, null, 2)).toString('base64')
		} else if (protocol === 'vless' || protocol === "trojan") {
			var out = `${data.id}@${data.add}:${data.port}?`
			out += querystring.stringify({
				type: data.net,
				headerType: data.type,
				host: data.host,
				path: data.path,
				security: data.tls,
				encryption: data.enc,
				sni: data.sni,
				flow: data.flow,
				alpn: data.alpn
			})
			return `${protocol}://${out}#${encodeURIComponent(data.ps)}`;
		} else if (protocol === "ss" || protocol === "socks") {
			return `${protocol}://${Buffer.from(data.scy + ":" + data.id).toString('base64')}@${data.add}:${data.port}#${encodeURIComponent(data.ps)}`
		}
	} catch (e) {
		return false;
	}
}


function config2vmess(config, stringify = true) {
	try {
		if (!config)
			return false;
		const [outbound] = config.outbounds;
		var obj = createObj(outbound)
		if (!obj)
			return false;
		if (!stringify)
			return obj;
		else
			return createEncodedUrl(obj)
	} catch (error) {
		console.log(error)
		return false;
	}
}
module.exports = {
	c2v: config2vmess,
	stringify: createEncodedUrl,
}