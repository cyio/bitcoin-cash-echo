const Koa = require('koa'),
  Router = require('koa-router'),
  statics = require('koa-static'),
  axios = require('axios'),
  path = require('path'),
  history = require('koa2-connect-history-api-fallback'),
  bch = require('bitcoincashjs'),
  config = require('../private-config.json'),
  websockify = require('koa-websocket');

axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded'

const app = new Koa()
const socket = websockify(app)
const router = new Router()
const ws = new Router()

const defaultFee = 227
let status = 'waiting'

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
// 总是将 acct1 的 utxo 返回
setInterval(async () => {
// setTimeout(async () => {
  const utxos = await getUtxos(acct1.address)
  if (utxos && utxos.length) {
    let utxo
    for (utxo of utxos) {
      const utxoTxDetail = await getTxDetail(utxo.txId)
      const outputAddress = utxoTxDetail.inputAddress
      console.log('spend to ' + outputAddress)
      spendUtxo(acct1.address, acct1.privateKey, outputAddress, utxo, defaultFee)
    }
  }
}, 5000)

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
  console.log('begin broadcast', tx)
  return axios.post('https://bch-chain.api.btc.com/v3/tools/tx-publish', { rawhex: tx })
    .then(res => {
      if (res.data.err_msg) {
        console.log(res.data.err_msg)
        return
      }
      console.log('broadcast success!')
      status = 'success'
    })
    .catch(err => console.log(err))
}

// address => utxos
const getUtxos = (addr) => {
  return axios.get(`https://bitcoincash.blockexplorer.com/api/addrs/${addr}/utxo`)
    .then(res => {
      // console.log(res)
      if (!res.data.length) {
        console.log('no spendable utxo for address ' + addr)
        status = 'waiting'
        return null
      }
      const spendableUtxos = res.data.filter(utxo => utxo.satoshis >= 5000)
      if (!spendableUtxos.length) {
        console.log('no spendable utxo for address ' + addr)
        status = 'waiting'
        return null
      }
      let result = []
      let toSpendUtxo
      for (toSpendUtxo of spendableUtxos) {
        result.push({
          'txId' : toSpendUtxo.txid,
          'outputIndex' : toSpendUtxo.vout,
          'address': toSpendUtxo.address,
          'script': toSpendUtxo.scriptPubKey,
          'satoshis' : toSpendUtxo.satoshis
        })
      }
      console.log('utxos', result)
      return result
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

let addressDetailCache = null
const getAddressDetail = (address) => {
  return axios.get(`https://bch-chain.api.btc.com/v3/address/${address}`).then(res => {
    addressDetailCache = res.data.data
    return res.data.data
  }).catch(err => console.log(err))
}
setInterval(() => {
  getAddressDetail(acct1.address)
}, 10000)

router.get('/api/address', async (ctx, next) => {
  ctx.body = addressDetailCache || (await getAddressDetail(acct1.address))
})
router.get('/api/status', async (ctx, next) => {
  ctx.body = status
})

ws.all('/*', async (ctx, next) => {
  console.log('connected websocket')
  setInterval(() => {
    ctx.websocket.send(status)
  }, 1000)
})

app
  .use(router.routes())
  .use(router.allowedMethods())
  .use(history({whkteList: ['/api']}))
  .use(statics(path.join(__dirname, '../dist')))

app.ws.use(ws.routes()).use(ws.allowedMethods())

module.exports = app
