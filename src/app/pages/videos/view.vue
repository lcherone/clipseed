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
            <router-link :to="{ path: '/videos' }">Videos</router-link>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            <a class="is-active">{{ item.name }}</a>
          </li>
        </ol>
      </nav>

      <div class="card mb-4">
        <div class="embed-responsive embed-responsive-16by9">
          <video
            id="video"
            controls="controls"
            preload="none"
            class="embed-responsive-item"
            style="width: 100%"
            :poster="item.activeScreen"
          ></video>
        </div>
        <div class="card-body">
          <h5 class="card-title">{{ item.name }}</h5>
          <h6 class="card-subtitle mb-2 text-muted">
            <i class="fa fa-clock-o"></i>
            {{ item.duration | formatSeconds }} -
            <i class="fa fa-file"></i>
            {{ item.size | formatBytes }}
            <i class="fa fa-mime"></i>
          </h6>
          <p class="card-text"></p>
        </div>
      </div>
    </section>
  </section>
</template>

<script>
import navbar from '/components/navbar.vue'

export default {
  name: 'index',
  props: ['state', 'hash'],
  components: {
    navbar
  },
  data: function () {
    return {
      item: {},
      timer: 0,
      playing: false
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
    },
    formatSeconds(seconds) {
      if (!seconds) {
        return '00:00:00'
      }
      return new Date(Number(seconds) * 1000).toISOString().substr(11, 8)
    }
  },
  watch: {
    // work around this.$socket.id being undefined on refresh
    'state.user.id': function (newValue) {
      if (newValue) {
        this.getItem(this.hash)
      }
    }
  },
  beforeMount() {
    console.log('get:video', this.state.user.id, this.hash)
    this.getItem(this.hash)
  },
  methods: {
    getItem(hash) {
      if (!this.state.user.id) {
        return
      }
      this.$socket.emit('video:get', {
        id: this.state.user.id,
        video: { hash }
      }, ack => {
        if (ack) {
          this.item = ack

          if (this.item.screens[0]) {
            //
            let torrent = this.state.client.get(this.magnetURI(this.item.screens[0]))

            //
            if (torrent) {
              let file = torrent.files.find(function (file) {
                return file.name.endsWith('.jpg')
              })
              if (file) {
                file.getBlobURL((err, url) => {
                  this.$set(this.item, 'activeScreen', url)
                })
              }
            } else {
              this.state.client.add(this.magnetURI(this.item.screens[0]), (torrent) => {
                torrent.on('done', () => {
                  let file = torrent.files.find(function (file) {
                    return file.name.endsWith('.jpg')
                  })
                  if (file) {
                    file.getBlobURL((err, url) => {
                      this.$set(this.item, 'activeScreen', url)
                    })
                  }
                })
              })
            }
          }

          this.play(this.item)
        }
      })
    },
    magnetURI(infoHash) {
      return 'magnet:?xt=urn:btih:' + infoHash + '&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com'
    },
    play(item) {
      clearInterval(this.timer);

      this.item = item
      this.playing = true

      this.$nextTick(function () {
        //
        let torrent = this.state.client.get(this.magnetURI(item.hash))

        //
        if (torrent) {
          let file = torrent.files.find(function (file) {
            return file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.webm') || file.name.endsWith('.avi') || file.name.endsWith('.mpeg')
          })
          if (!file) return;

          file.renderTo('video#video', {
            autoplay: true,
            muted: true,
            controls: true,
            preload: 'none'
          })
        } else {
          //
          this.state.client.add(this.magnetURI(item.hash), (torrent) => {
            torrent.on('done', () => {
              //
              let file = torrent.files.find(function (file) {
                return file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.webm') || file.name.endsWith('.avi') || file.name.endsWith('.mpeg')
              })

              file.renderTo('#video', {
                autoplay: true,
                muted: true,
                controls: true,
                preload: 'none'
              })

              this.$socket.emit('video:downloaded', {
                id: this.state.user.id,
                video: {
                  hash: item.hash
                }
              })
            })
          })
        }
      })
    }
  }
}
</script>

<style></style>