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
