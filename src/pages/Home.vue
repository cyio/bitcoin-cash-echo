<template>
<div class="home-view">
  <p>
    使用：向本页面地址发送小额 BCH，本页面地址接收后，会立刻将金额原路返回。返还交易手续费为 227 聪，仅相当于几分钱
  </p>
  <div class="qr-wrap">
    <qrcode 
      :value="address" 
      v-if="address" 
      :options="{ size: 170 }">
    </qrcode>
    <div class="right">
      <div>累计返还：{{Math.round(txCount / 2)}}笔</div>
      <div>共计：{{totalValue / 100}} bit</div>
      <button @click="copyAddress" class="btn">复制地址</button>
      <a :href="addressUrl" target="_blank" class="btn">在区块链上查看</a>
    </div>
  </div>
  <textarea ref="addr" readonly rows="1">{{address}}</textarea>
  <div class="msg">
    <div v-for="msg in someStatus">{{msg}}</div>
    <div>...</div>
  </div>
</div>
</template>

<script>
import mixin from '@/mixin.js'
// import numeral from 'numeral'
import axios from 'axios'
import Qrcode from '@xkeshi/vue-qrcode'
// import Timeago from 'timeago.js'
// const timeAgo = new Timeago()
axios.defaults.timeout = 5000
export default {
  name: 'Home',
  mixins: [mixin],
  components: {
    qrcode: Qrcode
  },
  data () {
    return {
      address: null,
      txCount: 0,
      totalValue: 0,
      status: []
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
    }
  },
  computed: {
    addressUrl () {
      return `https://bch.btc.com/${this.address}`
    },
    someStatus () {
      let tmp = this.status.slice()
      tmp.length = 10
      return tmp
    }
  },
  filters: {
  },
  created () {
    this.getAddress()
    this.getStatus().then(data => {
      this.status.unshift(data)
    })
    setInterval(() => {
      this.getStatus().then(data => {
        this.status.unshift(data)
      })
    }, 2000)
  },
  mounted () {
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
		white-space: nowrap;
		font-size: 0.12rem;
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
</style>
