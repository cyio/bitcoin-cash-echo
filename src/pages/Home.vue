<template>
<div class="home-view">
  <p>
    使用：向本页面地址发送小额 BCH，本页面地址接收后，会立刻将金额原路返回。返还交易会扣除手续费 227 聪，仅相当于几分钱
  </p>
  <div class="qr-wrap">
    <qrcode 
      :value="address" 
      v-if="address" 
      :options="{ size: 170 }">
    </qrcode>
    <div class="right">
      <div>成功返还：{{Math.round(txCount / 2)}}笔</div>
      <div>共计：{{totalValue / 100}} bit</div>
      <button @click="copyAddress" class="btn">复制地址</button>
      <div>
        <label for="checkbox">使用新版地址</label>
        <input type="checkbox" id="checkbox" v-model="useCashAddr" @change="convertAddress">
      </div>
      <a :href="addressUrl" target="_blank" class="btn">在区块链上查看</a>
    </div>
  </div>
  <textarea ref="addr" readonly >{{address}}</textarea>
  <div class="msg">
    <div>{{status}}</div>
  </div>
	<modal :show='showModal' title='捐赠开发者(BCH)' @close='showModal = false'>
	  <div slot="content" class="donate-modal">
      <qrcode 
        :value="donateAddress" 
        :options="{ size: 170 }">
      </qrcode>
      <textarea readonly >{{donateAddress}}</textarea>
      <div>
        <a href="https://github.com/cyio/bitcoin-cash-echo" target="_blank">开放源代码：cyio/bitcoin-cash-echo</a>
      </div>
    </div>
	</modal>
	<div @click="showModal = true" class="about">关于</div>
</div>
</template>

<script>
import mixin from '@/mixin.js'
// import numeral from 'numeral'
import axios from 'axios'
import Qrcode from '@xkeshi/vue-qrcode'
import bchaddr from 'bchaddrjs'
import Modal from '../components/Modal'
// import Timeago from 'timeago.js'
// const timeAgo = new Timeago()
axios.defaults.timeout = 5000
const msgs = {
  default: '等待支付中...',
  waiting: '等待支付中...',
  success: '有新的交易，金额已返还'
}
export default {
  name: 'Home',
  mixins: [mixin],
  components: {
    Qrcode,
    Modal
  },
  data () {
    return {
      address: null,
      txCount: 0,
      totalValue: 0,
      useCashAddr: false,
      showModal: false,
      donateAddress: '1M1FYu4zuVaxRPWLZG5CnP8qQrZaqu6c2L',
      status: '等待支付中...'
    }
  },
  methods: {
    getStatus () {
      this.$bar.start()
      return axios.get('/api/status')
        .then(res => {
          this.$bar.finish()
          return res.data
        })
        .catch(err => console.log(err))
    },
    getAddress () {
      axios.get('/api/address')
        .then(res => {
          const data = res.data
          this.address = data.address
          this.txCount = data.tx_count
          this.totalValue = data.received
        })
        .catch(err => console.log(err))
    },
    copyAddress () {
      this.$refs.addr.select()
      document.execCommand('copy')
    },
    convertAddress () {
      this.address = this.useCashAddr
        ? bchaddr.toCashAddress(this.address)
        : bchaddr.toLegacyAddress(this.address)
      this.donateAddress = this.useCashAddr
        ? bchaddr.toCashAddress(this.donateAddress)
        : bchaddr.toLegacyAddress(this.donateAddress)
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
        this.status = msgs[status]
        if (status === 'success') {
          this.getAddress()
        }
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
    margin: .03rem;
		text-align: left;
  }
  .msg {
    color: #737373;
    font-size: .12rem;
    height: .2rem;
    line-height: .2rem;
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
		font-size: 0.12rem;
		padding: .05rem 0;
		text-align: center;
    border: none;
	}
  .btn {
    font-size: .12rem;
    background: #eee;
    color: #333;
		margin: .05rem;
  }
  .qr-wrap {
    display: flex;
  }
  .qr-wrap .right {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
</style>
