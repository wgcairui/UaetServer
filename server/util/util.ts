export const parseToken = (token:string)=>{
    return token.replace(/(bearer)/,'').trim()
}