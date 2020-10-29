<template>
  <section>
    <!-- -->
    <section class="content container">
      <!-- -->
      <navbar :state="state"></navbar>

      <!-- -->
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb mt-3">
          <li class="breadcrumb-item">
            <router-link :to="{ path: '/' }">Home</router-link>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            <a class="is-active">Users</a>
          </li>
        </ol>
      </nav>

      <!-- -->
      <section>
        <div class="card">
          <table class="table table-sm" style="margin-bottom: 0;margin-top:-1px">
            <thead>
              <tr class="table-active">
                <th scope="col">#</th>
                <th scope="col">Videos</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="peer in state.peers" :key="peer.id">
                <th scope="row">
                  {{ peer.id }}
                  <span
                    v-if="state.user && state.user.id === peer.id"
                    class="text-success"
                  >(you)</span>
                </th>
                <td>{{ peer.videos.length }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </section>
</template>

<script>
import navbar from '/components/navbar.vue'

export default {
  name: 'index',
  props: ['state'],
  components: {
    navbar
  },
  data: function () {
    return {}
  },
  watch: {
    // work around this.$socket.id being undefined on refresh
    'state.user.id': function () {
      if (newValue) {
        this.getItem()
      }
    }
  },
  mounted() {
    this.getItems()
  },
  methods: {
    getItems() {
      this.$socket.emit('peers:get', {
        id: this.state.user.id
      }, ack => {
        this.state.peers = Object.values(ack)
      })
    }
  }
}
</script>

<style></style>