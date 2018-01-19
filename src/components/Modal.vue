<template>
	<div class="modal-mask" v-show="show" transition="modal">
		<div class="modal-wrapper" @click.self="close">
			<div class="modal-container">
				<div class="modal-header">
					<div class="modal-title" slot="header">{{ title }}</div>
					<div class="modal-close" @click="close">
						<span></span>
						<span></span>
					</div>
				</div>
				<div class="modal-body">
					<slot name="content">default body</slot>
				</div>
			</div>
		</div>
	</div>
</template>
<script>
export default {
  name: 'modal',
  props: {
    title: {
      type: String,
      default: ''
    },
    show: false
  },
  data () {
    return {
    }
  },
  watch: {
    show (newValue) {
      const body = window.document.querySelectorAll('body')[0]
      body.classList.toggle('modal-open')
    }
  },
  methods: {
    close () {
      this.$emit('close')
    }
  },
  mounted () {
  }
}
</script>
<style>

.modal-mask {
	position: fixed;
	z-index: 9998;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
	display: table;
	transition: opacity .16s linear;
}
.modal-wrapper {
	display: table-cell;
	vertical-align: middle;
	padding: 0 20px;
}
.modal-container {
	margin: 0px auto;
	// padding: 1.5rem 2rem 1.8rem 2rem;
	background-color: #fff;
	border-radius: 5px;
	box-shadow: 0 0 10px #C5C5C5;
	transition: all .12s ease-in;
	max-width: 800px;
}
.modal-header {
	position: relative;
	height: .3rem;
	line-height: .3rem;
	background: theme;
	border-top-left-radius: 5px;
	border-top-right-radius: 5px;
}
.modal-title {
	font-size: .13rem;
	text-align: center;
}
.modal-full {
	position: absolute;
	z-index: 10;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: #FFFFFF;
	display: table;
	transition: opacity .12s linear;
}
.modal-full-wrapper {
	// padding: 6rem 2rem;
	margin: 0 auto;
	max-width: 640px;
	box-sizing: inherit;
	position: relative;
	transition: all .12s ease-in;
}
.modal-full-wrapper .modal-close {
	top: 6.2rem;
	right: -4rem;
	transform: translate(0, 0);
}
.modal-close {
	height: 25px;
	width: 25px;
	position: absolute;
	top: 50%;
	right: 10px;
	transform: translate(0, -50%);
}
.modal-close:hover {
	cursor: pointer;
}
.modal-close:hover span {
	background-color: #0C0C0C;
}
.modal-close span {
	position: absolute;
	Z-index: 1;
	width: 2px;
	height: 28px;
	top: -1px;
	margin-left: 12px;
	background-color: #CBCBCB;
	transition: all .12s linear;
	display: block;
}
.modal-close span:first-child {
	transform: rotate(45deg);
}
.modal-close span:last-child {
	transform: rotate(135deg);
}
.modal-body {
	// padding: .1rem;
}
.modal-default-button {
	float: right;
}
.modal-enter, .modal-leave {
	opacity: 0;
}
.modal-enter .modal-container,
.modal-leave .modal-container {
	-webkit-transform: scale(0.7);
	transform: scale(0.7);
	opacity: 0;
}
.modal-enter .modal-full-wrapper,
.modal-leave .modal-full-wrapper {
	-webkit-transform: scale(0.95);
	transform: scale(0.95);
	opacity: 0;
}
.modal-mask .button {
	height: 36px;
	line-height: 32px;
	background: none;
	padding: 0 1rem;
	overflow: visible;
	border-radius: 5px;
	margin-left: 1rem;
	letter-spacing: 1px;
	font-size: 13px;
	color: #b6b6b6;
	text-transform: uppercase;
	border: 2px solid #cbcbcb;
	font-weight: 600;
	transition: all .12s linear;
	float: right;
}
.button-action {
	border-color: #12d758;
	color: #10bf4e;
}
.button-action:hover {
	background: #12d758;
	color: #fff;
}
.cf:after, .cf:before {
	content: " ";
	display: table;
}
.cf:after {
	clear: both;
}
.cf:after, .cf:before {
	content: " ";
	display: table;
}
</style>
