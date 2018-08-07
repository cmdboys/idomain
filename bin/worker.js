const Chrome = require('../util/Chrome')
const Domains = require('../config').domain
const Colors = require('colors')
const url = require("url");
const parseString = require('xml2js').parseString;

async function mainWorker() {
  console.log('|-----------------------------------|'.yellow)
  console.log('| 欢迎来到域名查询小助手[idomain]'.yellow)
  console.log('| 请输入要查询的域名，不加域名后缀为全文搜索'.yellow)
  console.log('|-----------------------------------|'.yellow)
  
  process.stdin.setEncoding('utf8');
  
  process.stdin.on('readable', async () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
      if(chunk == ''){
        console.log('[warn]不能为空'.red)
        return
      }
  
      let baseName = chunk.replace(/[\n|\t|\b|\s]/img, '')
      
      if(baseName.indexOf('.') != -1){
        // 带域名后缀的
        let domainInfo = url.parse(baseName)
        
        let nowDomain = domainInfo.host
        
        if(!nowDomain){
          // 如果输入的是 www.xxx.com || xxxx.com 不能正常解析
          nowDomain = baseName.replace(/www\./g, '')
        }
        
        console.log('查询中...'.green)
        let beginTime = new Date().getTime()
        
        let res = await findDomain(nowDomain)
        console.log(res.msg)
        console.log(('-------------查询完毕[耗时'+((new Date().getTime() - beginTime) / 1000)+'s]--------------').green)
        console.log('[接下来你还可以 (继续输入查询), (Ctrl + C 退出)]'.yellow)
        return
      }else{
        // 批量查询
        
        console.log('查询中...'.green)
        let beginTime = new Date().getTime()
        await search(baseName)
        console.log(('-------------查询完毕[耗时'+((new Date().getTime() - beginTime) / 1000)+'s]--------------').green)
        console.log('[接下来你还可以 (继续输入查询), (Ctrl + C 退出)]'.yellow)
      }
    }
  });
  
  process.stdin.on('end', () => {
    process.stdout.write('end');
  });
}


async function search(hostName){
  for(var i=0; i<Domains.length; i++){
    let press = Math.floor(((i+1)  / Domains.length) * 100)
    let res = await findDomain(hostName + '.' + Domains[i], (' [' + press + '%]').gray )
    console.log(res.msg)
  }
  
}


async function findDomain(fullDomainName, fujia){
  let res = await Chrome.getDomain(fullDomainName)
  let data = {}
  try{
    if(res.code == 200){
    
      let pas = await superParse(res.data)
    
      if(pas.property.returncode[0] == '200'){
        data.code = 200
        data.data = pas
      
        // 请求成功
        if(pas.property.original[0].indexOf('210') != -1){
          data.msg = ('[✔] [' + fullDomainName + '] ' + '域名可以使用').green + (fujia || '')
        }else{
          data.msg = ('[✘] [' + fullDomainName + '] ' + '域名已被注册').red + (fujia || '')
        }
      
      }else{
        data.code = 500
        data.msg = '请求失败，请在  https://github.com/Jon-Millent/idomain/issues/new   提交bug'.red
      }
    
    
    }else{
      data.code = 500
      data.data = null
      data.msg = '请求失败，请在  https://github.com/Jon-Millent/idomain/issues/new   提交bug'.red
    }
  }catch (e) {
    data.code = 500
    data.data = null
    data.msg = '请求失败，请在  https://github.com/Jon-Millent/idomain/issues/new   提交bug'.red
  }
  return data
}

async function superParse(xml){
  return new Promise(resolve => {
    parseString(xml, function (err, result) {
      resolve(result);
    });
  })
}

module.exports = mainWorker