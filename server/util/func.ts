/**
 * 使用于非标协议前置脚本,转换脚本为Function
 * @param fun 命令字符串
 */
export const ParseFunction = (fun: string) => {
    const content = fun.replace(/(^function\(pid,instruct\)\{|\}$)/g, '')
    return new Function('pid', 'instruct', content)
}

/**
 * 适用于非标协议后置脚本
 * @param fun 
 */
export const ParseFunctionEnd = (fun: string) => {
    const content = fun.replace(/(^function\(content,arr\)\{|\}$)/g, '')
    return new Function('content', 'arr', content)
}

/**
 * 转换参数值系数
 * @param fun 转换函数
 * @param val 待转换的值
 */
export const ParseCoefficient = (fun: string, val: number) => {
    if (Number(fun)) return Number(fun) * val as number
    else {
        const args = fun.replace(/(^\(|\)$)/g, '').split(',')
        const Fun = new Function(args[0], `return ${args[1]}`)
        return Fun(val) as number
    }
}
