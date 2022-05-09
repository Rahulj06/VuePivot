import Vue from 'vue'
import Pivottable from './App.vue'

// import VuePivottable from 'vue-pivottable'
// import 'vue-pivottable/dist/vue-pivottable.css'
// Vue.use(VuePivottable)

Vue.config.productionTip = false

new Vue({
  render: h => h(Pivottable)
}).$mount('#pivot-table')
