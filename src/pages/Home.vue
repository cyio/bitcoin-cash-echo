<template>
<div class="home-view">
  <p>用途：比特币现金支付自助测试</p>
  <p>使用：向本页面地址发送小额 BCH，本页面地址接收后，会立刻将金额原路返回</p>
  <p class="small">返还交易手续费为 227 聪，仅相当于几分钱</p>
  <div><a :href="addressUrl" target="_blank">{{address}}</a></div>
  <div>
    <qrcode 
      :value="address" 
      v-if="address" 
      :options="{ size: 170 }">
    </qrcode>
  </div>
  <div class="txs" v-if="txs.length > 3">
    <div>成功交易：{{txs.length}} 笔</div>
    <div v-for="tx in txs">{{tx}}</div>
  </div>
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
      status: [],
      txs: []
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
      return axios.get('/api/address')
        .then(res => res.data)
        .catch(err => console.log(err))
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
    this.getAddress().then(data => {
      this.address = data
    })
    this.getStatus().then(data => {
      this.status.unshift(data)
    })
    setInterval(() => {
      this.getStatus().then(data => {
        this.status.unshift(data)
      })
    }, 1500)
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
    margin: .03rem 0;
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
</style>
