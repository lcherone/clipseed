<template>
  <router-view :state="state"></router-view>
</template>

<script>
const defaultStats = {
  torrents: 0,
  size: 0,
  downloaded: 0,
  uploaded: 0
}

export default {
  data() {
    return {
      timers: {
        stats: 0,
        users: 0
      },
      state: {
        user: {
          id: '',
        },
        peers: {},
        client: new WebTorrent(),
        stats: defaultStats
      }
    }
  },
  sockets: {
    connect: function () {
      if (!this.state.user.id) {
        this.state.user.id = this.$socket.id
        this.$socket.emit('announce', {
          id: this.$socket.id
        }, ack => {
          this.getPeers()
        })
      }
    },
    'peer:joined': function () {
      this.getPeers()
    },
    'peer:left': function () {
      this.getPeers()
    },
    disconnected: function () {
      console.log('socket disconnected app')
    }
  },
  created() {

    this.timers.stats = setInterval(() => {
      if (this.state.client.torrents) {
        this.state.stats.torrents = this.state.client.torrents.length

        this.state.stats.downloaded = this.state.stats.uploaded = this.state.stats.size = 0
        for (let i in this.state.client.torrents) {
          // uploaded/downloaded
          if (this.state.client.torrents[i].downloaded) {
            this.state.stats.downloaded += this.state.client.torrents[i].downloaded
          }
          if (this.state.client.torrents[i].uploaded) {
            this.state.stats.uploaded += this.state.client.torrents[i].uploaded
          }
          if (this.state.client.torrents[i].length) {
            this.state.stats.size += Number(this.state.client.torrents[i].length)
          }
        }
      } else {
        this.state.stats = defaultStats
      }
    }, 1500)
  },
  beforeDestroy() {
    clearInterval(this.timers.stats)
    clearInterval(this.timers.users)
  },
  methods: {
    getPeers() {
      this.$socket.emit('peers:get', {
        id: this.state.user.id
      }, ack => {
        this.state.peers = Object.values(ack)
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "./assets/style.css";
</style>
