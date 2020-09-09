const a = '(x,(x/2)-20)'

function parseString(str: string) {
    if (/\(*\)/.test(str)) {
        const s = str.replace(/(^\(|\)$)/g, '').split(',')
        s[s.length - 1] = 'return ' + s[s.length - 1]
        console.log(s);
        return new Function(...s)
    } return str
}

const f = parseString(a)

if(typeof f !== 'string'){
    console.log(f(88));
}else{
    console.log(a);
    
}


const d = new Function('pid','instruct',`const content = ("AA" + pid.toString(16).padStart(2, "0") + instruct).replace(/\s*/g, "");
const num = 255 - (Buffer.from(content, 'hex').toJSON().data.reduce((pre, cur) => pre + cur));
const crc = Buffer.allocUnsafe(2);
crc.writeInt16BE(num, 0);
return content + crc.slice(1, 2).toString("hex").padStart(2, '0')`)

console.log(d(1,'FFFFFF000000000000000000'));
