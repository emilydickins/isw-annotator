import Vue from 'vue';
import './plugins/axios'
import App from './App.vue';
import './plugins/vuetify';
import store from './plugins/vuex'

Vue.config.productionTip = true;
Vue.config.devtools = true
Vue.config.performance = true
Vue.config.silent = false;

new Vue({
  store,
  render: h => h(App)
}).$mount('#app');