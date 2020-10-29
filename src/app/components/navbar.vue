<template>
  <header>
    <nav class="mt-4 navbar navbar-dark bg-primary navbar-expand-sm rounded-top">
      <router-link class="navbar-brand" :to="{ path: '/' }">ClipSeed</router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarNavDropdown"
        aria-controls="navbarNavDropdown"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarNavDropdown">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item">
            <router-link class="nav-link" active-class="active" :to="{ path: '/' }" exact>Home</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" active-class="active" :to="{ path: '/videos' }">Videos</router-link>
          </li>
          <li class="nav-item">
            <router-link
              class="nav-link"
              active-class="active"
              :to="{ path: '/users' }"
            >Users ({{ total_peers }})</router-link>
          </li>
        </ul>
      </div>
    </nav>
    <!-- -->
    <div class="rounded-bottom stats-bar">
      <small>
        <strong>Sharing:</strong>
        {{ state.stats.torrents }} files ({{ state.stats.size | formatBytes }}) -
        <strong>Downloaded:</strong>
        {{ state.stats.downloaded | formatBytes }} -
        <strong>Uploaded:</strong>
        {{ state.stats.uploaded | formatBytes }}
      </small>
    </div>
  </header>
</template>

<script>
export default {
  name: 'navbar',
  props: ['state'],
  data: function () {
    return {
    }
  },
  computed: {
    total_peers: function () {
      return this.state.peers && this.state.peers.length ? this.state.peers.length : 0
    }
  },
  filters: {
    formatBytes(bytes) {
      bytes = Number(bytes)
      if (bytes === 0) return '0 Bytes'
      var k = 1024
      var dm = 2
      var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
      var i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped lang="scss">
.stats-bar {
  background-color: #e9ecef;
  display: flex;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  padding: 0.4rem 0.55rem;
  margin-bottom: 1rem
}
</style>
