const Koa = require('koa')
const Router = require('koa-router')
const statics = require('koa-static')
const axios = require('axios')
const cheerio = require('cheerio')
const path = require('path')
const url = require('url')
const request = require('request')
const history = require('koa2-connect-history-api-fallback')
const bch = require('bitcoincashjs')
const config = require('../private-config.json')
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

const app = new Koa()
const router = new Router()

const defaultFee = 227
let status = '无可花费金额，等待中'

const setAccount = (key) => {
  const privateKey = new bch.PrivateKey(key)
  const address = (privateKey.toAddress()).toString()
  return {
    privateKey: privateKey,
    address: address
  }
}

let acct1 = setAccount(config.private_key)
// console.log(acct1) 
// 总是将 acct1 中的 utxo 返回
setInterval(async () => {
  const utxo = await getUtxo(acct1.address)
  if (utxo) {
    const utxoTxDetail = await getTxDetail(utxo.txId)
    const outputAddress = utxoTxDetail.inputAddress
    console.log('spend to ' + outputAddress)
    status = `返还 ${utxo.satoshis} satoshi 到 ${outputAddress }`
    spendUtxo(acct1.address, acct1.privateKey, outputAddress, utxo, defaultFee)
  }
}, 8000)

// (address, privatekey, outputAddress, utxo, fee)
const spendUtxo = (address, privateKey, outputAddress, utxo, fee) => {
  console.log('begin spend utxo')
  const transaction = new bch.Transaction().fee(fee)
    .from(utxo)
    .to(outputAddress, utxo.satoshis - fee)
    .sign(privateKey)
  console.log(transaction)
  broadcastTx(transaction.toString())
}

// 广播交易, 注意 post 类型要设置 urlencoded
// tx => promise
const broadcastTx = (tx) => {
  console.log('begin broadcast')
  status = '准备发送交易'
  return axios.post('https://bch-chain.api.btc.com/v3/tools/tx-publish', { rawhex: tx })
    .then(res => {
      if (res.data.err_msg) {
        console.log(res.data.err_msg)
        return
      }
      console.log('broadcast success!')
      status = '交易发送成功'
    })
    .catch(err => console.log(err))
}

// address => utxo
const getUtxo = (addr) => {
  return axios.get(`https://api.blocktrail.com/v1/bcc/address/${addr}/unspent-outputs?api_key=${config.blocktrail_key}`)
    .then(res => {
      // console.log(res)
      if (!res.data.total) {
        console.log('no utxo for address ' + addr)
        status = '无可花费金额，等待中'
        return null
      }
      // 简化，总是返回最近一笔 utxo
      const tmp = res.data.data[0]
      return {
        'txId' : tmp.hash,
        'outputIndex' : tmp.index,
        'address': tmp.address,
        'script': tmp.script_hex,
        'satoshis' : tmp.value
      };
    })
    .catch(err => console.log(err))
}

// 50f883d9c4acf8cc24c3ddc44d2dc8a8e9298c0c55d562441dbaad6c8ba913fd
const getTxDetail = (txId) => {
  return axios.get(`https://bch-chain.api.btc.com/v3/tx/${txId}`).then(res => {
    const data = res.data.data
    return {    // 假定 input 只有一个
      'inputAddress': data.inputs[0].prev_addresses[0]
    }
  }).catch(err => console.log(err))
}

router.get('/api/address', async (ctx, next) => {
  ctx.body = acct1.address
})
router.get('/api/status', async (ctx, next) => {
  ctx.body = status
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(history({whkteList: ['/api']}))
  .use(statics(path.join(__dirname, '../dist')))

module.exports = app
