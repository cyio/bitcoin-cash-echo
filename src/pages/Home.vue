<template lang="pug">
.home-view
  p
    | {{$t('home.usage')}}
  .qr-wrap
    .qrcode(v-if='address')
      img(:src='qrUrls.addr')
    .right
      // button.btn(@click='copyAddress') {{isCopied ? $t('home.copied') : $t('home.copyAddr')}}
      .text {{$t('home.currentNet')}}: {{useTestnet ? $t('home.testnet') : $t('home.mainnet') }}
      // button.btn(@click="switchNetwork" :disabled="networkSwitching") {{networkSwitching ? '切换中，稍等' : '切换网络'}}
      button.btn(@click="switchNetwork" :disabled="networkSwitching") {{$t('home.switchNetwork')}}
      // .btn
        // label(for='checkbox')
          // | {{$t('home.useTestnet')}}
          // input#checkbox(type='checkbox', v-model='useTestnet')
      .btn
        label(for='checkbox')
          | {{$t('home.useLegacyAddr')}}
          input#checkbox(type='checkbox', v-model='useLegacyAddr', @change='convertAddress')
      a.btn(:href='addressUrl', target='_blank') {{$t('home.openInBlockExplorer')}}
  textarea(ref='addr', readonly='') {{address}}
  .status(v-bind:class="{ success: statusKey !== 'waiting' }") {{status[statusKey]}}
  ul.success-list
    li(v-for="txid in successTxList" )
      a(:href="txUrl(txid)" target='_blank') {{txid}} 
  modal(:show='showModal', @close='showModal = false')
    .donate-modal(slot='content')
      .qrcode(v-if='address')
        img(:src='qrUrls.donateAddr')
      textarea(readonly='') {{donateAddr}}
      div
        | {{$t('home.sourceCode')}}: 
        a(href='https://github.com/cyio/bitcoin-cash-echo', target='_blank') cyio/bitcoin-cash-echo
  .about(@click='showModal = true') {{$t('home.about')}}
</template>

<script>
import mixin from '@/mixin.js'
import axios from 'axios'
import Modal from '../components/Modal'
import QRCode from 'qrcode'
axios.defaults.timeout = 5000
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
let BITBOXCli = require('bitbox-cli/lib/bitbox-cli').default
let account0
let previousUtxoTxid
let pollInstance
let BITBOX = new BITBOXCli()
let bchaddr = BITBOX.Address
let getUtxos = async (address) => {
  return new Promise((resolve, reject) => {
    BITBOX.Address.utxo(address).then((result) => {
      console.log('utxo: ', result)
      resolve(result)
    }, (err) => {
      console.log(err)
      reject(err)
    })
  })
}
let sendTxAsync = async (hex) => {
  return new Promise((resolve, reject) => {
    BITBOX.RawTransactions.sendRawTransaction(hex).then((result) => {
      console.log('txid:', result)
      resolve(result)
    }, (err) => {
      console.log(err)
      reject(err)
    })
  })
}
const getSenderAddress = (txid) => {
  return new Promise((resolve, reject) => {
    BITBOX.Transaction.details(txid).then(txDetail => {
      console.log({txDetail})
      resolve(txDetail.vin[0].cashAddress)
    }, (err) => {
      console.log(err)
      reject(err)
    })
  })
}
export default {
  name: 'Home',
  mixins: [mixin],
  components: {
    Modal
  },
  data () {
    return {
      address: null,
      useLegacyAddr: false,
      useTestnet: false,
      showModal: false,
      donateAddr: 'bitcoincash:qrdka2205f4hyukutc2g0s6lykperc8nsu5u2ddpqf',
      isCopied: false,
      qrUrls: {
        addr: null,
        donateAddr: null
      },
      statusKey: 'waiting',
      status: {
        'waiting': this.$t('home.waitingForTransaction'),
        'new utxo': this.$t('home.newUtxo'),
        'success': this.$t('home.newTransaction')
      },
      networkSwitching: false,
      successTxList: [],
    }
  },
  methods: {
    copyAddress () {
      this.$refs.addr.select()
      document.execCommand('copy')
      this.isCopied = true
      setTimeout(() => {
        this.isCopied = false
      }, 3000)
    },
    async convertAddress () {
      this.address = !this.useLegacyAddr
        ? bchaddr.toCashAddress(this.address)
        : bchaddr.toLegacyAddress(this.address)
      this.donateAddr = !this.useLegacyAddr
        ? bchaddr.toCashAddress(this.donateAddr)
        : bchaddr.toLegacyAddress(this.donateAddr)
      this.qrUrls.addr = await this.generateQR(this.address)
      this.qrUrls.donateAddr = await this.generateQR(this.donateAddr)
    },
    async generateQR (text) {
      const url = await QRCode.toDataURL(!this.useLegacyAddr ? text.toUpperCase() : text, { mode: 'alphanumeric' })
      return url
    },
    switchNetwork() {
      if (this.networkSwitching) return
      this.networkSwitching = true
      this.successTxList = []
      console.log('set net start', this.networkSwitching)
      this.useTestnet = !this.useTestnet
      if (pollInstance) {
        clearTimeout(pollInstance)
      }
      BITBOX = new BITBOXCli({
        restURL: this.useTestnet ? 'https://trest.bitbox.earth/v1/' : 'https://rest.bitbox.earth/v1/',
      })
      this.createWallet()
    },
    async createWallet() {
      let mnemonic = localStorage.getItem('mnemonic')
      if (!mnemonic) {
        mnemonic = BITBOX.Mnemonic.generate(128)
        localStorage.setItem('mnemonic', mnemonic)
      }
      let rootSeed = BITBOX.Mnemonic.toSeed(mnemonic)
      let masterHDNode = BITBOX.HDNode.fromSeed(rootSeed, this.useTestnet ? 'testnet' : 'bitcoincash')
      let account = BITBOX.HDNode.derivePath(masterHDNode, "m/44'/145'/0'")
      account0 = BITBOX.HDNode.derivePath(account, '0/0')
      this.address = BITBOX.HDNode.toCashAddress(account0)
      console.log(this.address)
      this.qrUrls.addr = await this.generateQR(this.address)
      this.qrUrls.donateAddr = await this.generateQR(this.donateAddr)
      this.poll(this.address)
      this.networkSwitching = false
    },
    spendUtxo(utxo, targetAddress) {
      let transactionBuilder = new BITBOX.TransactionBuilder(this.useTestnet ? 'testnet' : 'bitcoincash')
      let originalAmount = utxo.satoshis
      let vout = utxo.vout
      let txid = utxo.txid
      transactionBuilder.addInput(txid, vout)
      let byteCount = BITBOX.BitcoinCash.getByteCount({ P2PKH: 1 }, { P2PKH: 1 })
      let sendAmount = originalAmount - byteCount
      transactionBuilder.addOutput(targetAddress, sendAmount)
      let keyPair = BITBOX.HDNode.toKeyPair(account0)
      let redeemScript
      transactionBuilder.sign(0, keyPair, redeemScript, transactionBuilder.hashTypes.SIGHASH_ALL, originalAmount)
      let tx = transactionBuilder.build()
      let hex = tx.toHex()
      console.log({hex})
      sendTxAsync(hex).then((txid) => {
        previousUtxoTxid = utxo.txid
        this.statusKey = 'success'
        this.successTxList.push(txid)
      })
    },
    poll(address) {
      this.statusKey = 'waiting'
      pollInstance = setTimeout(async () => {
        const utxos = await getUtxos(address)
        if (utxos && utxos.length) {
          for (let utxo of utxos) {
            // console.log(utxo.txid, previousUtxoTxid)
            if (utxo.txid !== previousUtxoTxid) {
              console.log({utxo})
              this.statusKey = 'new utxo'
              let targetAddress = await getSenderAddress(utxo.txid)
              await this.spendUtxo(utxo, targetAddress)
              // 广播交易后，多等一会再进行下一次轮询
              await sleep(10000)
            } else {
              console.log('pass utxo')
            }
          }
          this.poll(address)
        } else {
          this.poll(address)
        }
      }, 1000 * 5)
    },
    txUrl(txid) {
      let explorerUrl = this.useTestnet ? 'https://www.blocktrail.com/tBCC/tx/' : 'https://bch.btc.com/'
      return explorerUrl + txid
    }
  },
  computed: {
    addressUrl () {
      let explorerUrl = this.useTestnet ? 'https://www.blocktrail.com/tBCC/address/' : 'https://bch.btc.com/'
      return explorerUrl + this.address
    }
  },
  watch: {
  },
  filters: {
  },
  created () {
  },
  mounted () {
    this.createWallet()
  }
}
</script>

<style>
  .home-view {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
  p {
    margin: .1rem;
		text-align: left;
  }
  .msg div:first-child {
    font-size: .13rem;
    color: #333;
  }
  .small {
    font-size: .11rem;
    color: #929191;
  }
	textarea {
    width: 86%;
    resize: none;
		font-size: 0.13rem;
		padding: .05rem 0;
		text-align: center;
    border: none;
	}
  .btn {
    font-size: .12rem;
    background: #eee;
    color: #333;
    margin: .05rem;
    padding: .05rem;
    border: 1px solid #dedada;
    color: var(--theme);
  }
  .qr-wrap {
    display: flex;
		justify-content: space-around;
    width: 95%;
  }
  .qr-wrap .right {
    display: flex;
    flex-direction: column;
    // align-items: center;
    justify-content: center;
    width: 70%;
  }
  .donate-modal {
    padding-bottom: .1rem;
  }
  .about {
    position: fixed;
    bottom: .2rem;
    left: .2rem;
    background: rgba(238, 238, 238, .7);
    width: .4rem;
    padding: .05rem;
    border-radius: .1rem;
    border: .01rem solid #d8d7d7;
  }
  .status {
    font-size: .14rem;
    font-weight: bold;
    margin-top: .05rem;
  }
  .status.success {
    color: green;
  }
  .highlight {
    color: var(--theme);
  }
  .ad {
    background: #eee;
    width: 90%;
    height: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #989494;
		margin: .05rem;
  }
  canvas {
    width: 170px;
    height: 170px;
  }
  .qrcode {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .qrcode img {
    width: 1.5rem;
  }
  .success-list {
    margin-top: 20px;
    width: 90%;
		overflow: hidden;
  }
</style>
