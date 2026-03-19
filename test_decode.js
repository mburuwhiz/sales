const b64 = Buffer.from('{\n  "creds.json": { "myCreds": true },\n  "key1": "value1"\n}').toString('base64');
console.log('Base64:', b64);
const str = b64.substring(b64.indexOf('ewo'));
console.log('Decoded:', Buffer.from(str, 'base64').toString('utf-8'));
