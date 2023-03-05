
const VMESS_PROTO = 'vmess://';

function streamSettingsReverse(config) {
  let net = null, tls = null, sni = null, host = null, type = null, path = null;

  net = config.network;

  if (config.security === 'tls') {
    tls = 'tls';
    sni = config.tlsSettings.serverName;
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
    net, tls, sni, host, type, path
  }
}


function createVmessObj(outboundConfig) {
  const ps = outboundConfig.tag;
  const streamSettings = outboundConfig.streamSettings;
  const [vnext] = outboundConfig.settings.vnext;
  const { address, port } = vnext;
  const [user] = vnext.users;
  const id = user.id;
  const security = user.security;
  const aid = user.alterId;
  const { net, tls, sni, host, type, path } = streamSettingsReverse(streamSettings);
  const obj = {
    v: "2",
    ps: ps || "none",
    add: address || "none",
    port: Number(port) || 0,
    id: id || 0,
    aid: aid || 0,
    net: net || "none",
    type: type || "",
    host: host || "",
    path: path || "",
    tls: tls || "",
    scy: security || "",
    sni: sni || "",
    alpn: "",
  }

  return obj;
}

function createEncodedUrl(vmessObj) {
  try {
    const jsoned = JSON.stringify(vmessObj, null, 2);
    const encodedString = Buffer.from(jsoned).toString('base64')
    return `${VMESS_PROTO}${encodedString}`;
  } catch (e) {
    return false;
  }
}


function config2vmess(config, stringify = true) {
  try {
    const [outbound] = config.outbounds;
    if (outbound.protocol === 'vmess') {
      var obj = createVmessObj(outbound) 
      if (!obj)
        return false;
      if (!stringify)
        return obj;
      else
        return createEncodedUrl(obj)
    } else
      return false;
  } catch (error) {
    return false;
  }
}
module.exports = {
  c2v: config2vmess,
  stringify: createEncodedUrl,
}