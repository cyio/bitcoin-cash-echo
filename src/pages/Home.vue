<template>
<div class="home-view">
  <p>
		{{$t('home.usage')}}
  </p>
  <div class="ad"> ---- {{$t('home.ad')}} ---- </div>
  <div class="qr-wrap">
    <div class="qrcode" v-if="address"><img :src="qrUrls.addr" /></div>
    <div class="right">
      <div>{{$t('home.successfullyReturned')}}：<span class="highlight">{{sentCount}}</span> {{$t('home.txCountUnit')}}</div>
      <div>{{$t('home.totalValue')}}：<span class="highlight">{{sentTotalValue / 100}}</span> Bits</div>
      <button @click="copyAddress" class="btn">{{isCopied ? $t('home.copied') : $t('home.copyAddr')}}</button>
      <div class="btn">
        <label for="checkbox">{{$t('home.useCashAddr')}}
          <input type="checkbox" id="checkbox" v-model="useCashAddr" @change="convertAddress">
        </label>
      </div>
      <a :href="addressUrl" target="_blank" class="btn">{{$t('home.openInBlockExplorer')}}</a>
    </div>
  </div>
  <textarea ref="addr" readonly >{{address}}</textarea>
  <div class="status" v-bind:class="{ success: statusKey === 'success' }" >{{status[statusKey]}}</div>
	<modal :show='showModal' @close='showModal = false'>
	  <div slot="content" class="donate-modal">
      <div class="qrcode" v-if="address"><img :src="qrUrls.donateAddr" /></div>
      <textarea readonly >{{donateAddr}}</textarea>
      <div>{{$t('home.mobile')}}：13621208032 </br>{{$t('home.email')}}：ibeceo@gmail.com</div>
      <div>
        {{$t('home.sourceCode')}}：<a href="https://github.com/cyio/bitcoin-cash-echo" target="_blank">cyio/bitcoin-cash-echo</a>
        {{$t('home.inspiredBy')}}: <a href="http://sandbox.swarmops.com/Admin/BitcoinEchoTest" target="_blank">Swarmops - Sandbox - Bitcoin Cash Hotwallet Echo Test</a>
      </div>
    </div>
	</modal>
	<div @click="showModal = true" class="about">{{$t('home.about')}}</div>
</div>
</template>

<script>
import mixin from '@/mixin.js'
// import numeral from 'numeral'
import axios from 'axios'
// import Qrcode from '@xkeshi/vue-qrcode'
import bchaddr from 'bchaddrjs'
import Modal from '../components/Modal'
import QRCode from 'qrcode'
// import Timeago from 'timeago.js'
// const timeAgo = new Timeago()
axios.defaults.timeout = 5000
export default {
  name: 'Home',
  mixins: [mixin],
  components: {
    Modal
  },
  data () {
    return {
      address: null,
      sentCount: 0,
      sentTotalValue: 0,
      useCashAddr: false,
      showModal: false,
      donateAddr: '1M1FYu4zuVaxRPWLZG5CnP8qQrZaqu6c2L',
      statusKey: 'waiting',
      isCopied: false,
      qrUrls: {
        addr: null,
        donateAddr: null
      },
      status: {
        waiting: this.$t('home.waitingForTransaction'),
        success: this.$t('home.newTransaction')
      }
    }
  },
  methods: {
    getStatus () {
      return axios.get('/api/status')
        .then(res => res.data)
        .catch(err => console.log(err))
    },
    getAddress () {
      axios.get('/api/address')
        .then(async res => {
          const data = res.data
          this.address = data.address
          this.sentCount = Math.floor(data.tx_count / 2)
          this.sentTotalValue = data.sent
          this.qrUrls.addr = await this.generateQR(this.address)
          this.qrUrls.donateAddr = await this.generateQR(this.donateAddr)
        })
        .catch(err => console.log(err))
    },
    copyAddress () {
      this.$refs.addr.select()
      document.execCommand('copy')
      this.isCopied = true
      setTimeout(() => {
        this.isCopied = false
      }, 3000)
    },
    async convertAddress () {
      this.address = this.useCashAddr
        ? bchaddr.toCashAddress(this.address)
        : bchaddr.toLegacyAddress(this.address)
      this.donateAddr = this.useCashAddr
        ? bchaddr.toCashAddress(this.donateAddr)
        : bchaddr.toLegacyAddress(this.donateAddr)
      this.qrUrls.addr = await this.generateQR(this.address)
      this.qrUrls.donateAddr = await this.generateQR(this.donateAddr)
    },
    async generateQR (text) {
      const url = await QRCode.toDataURL(this.useCashAddr ? text.toUpperCase() : text, { mode: 'alphanumeric' })
      return url
    }
  },
  computed: {
    addressUrl () {
      return `https://bch.btc.com/${this.address}`
    }
  },
  filters: {
  },
  created () {
    this.getAddress()
    setInterval(() => {
      this.getStatus().then(status => {
        if (status === 'success') {
          this.getAddress()
        }
        this.statusKey = status
      })
    }, 2000)
  },
  mounted () {
    if (window.io) {
      const socket = window.io('https://blockexplorer.com/')
      socket.on('connect', () => {
        // Join the room.
        socket.emit('subscribe', 'inv')
      })
      socket.on('tx', (data) => {
        console.table(data)
      })
    }
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
</style>
