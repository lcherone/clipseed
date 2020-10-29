import Vue from 'vue'
import Router from 'vue-router'

import PageIndex from './pages/index.vue'
import PageVideos from './pages/videos/index.vue'
import PageVideoView from './pages/videos/view.vue'
import PageUsers from './pages/users/index.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: '/',
  routes: [
    {
      path: '/',
      component: PageIndex
    },
    {
      path: '/videos',
      component: PageVideos
    },
    {
      path: '/videos/:hash',
      component: PageVideoView,
      props: true
    },
    {
      path: '/users',
      component: PageUsers
    },
    {
      path: '/users/:id',
      component: PageUsers,
      props: true
    },
    {
      path: '*',
      redirect: '/'
    }
  ]
})