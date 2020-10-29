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
            <a class="is-active">Videos</a>
          </li>
        </ol>
      </nav>

      <div class="row">
        <template v-if="items && items.length">
          <div
            class="col-12 col-sm-6 col-md-4"
            @click="goto('/videos/'+item.hash)"
            v-for="(item, index) in items"
            :key="index"
            @mouseover="screens('play', index)"
            @mouseout="screens('stop', index)"
          >
            <div class="card border-primary">
              <img :src="item.activeScreen" class="card-img-top" alt />
              <div class="card-body p-2">
                <h5 class="card-title">{{ item.name }}</h5>
                <h6 class="card-subtitle mb-2 text-muted">
                  <i class="fa fa-clock-o"></i>
                  {{ item.duration | formatSeconds }} -
                  <i class="fa fa-file"></i>
                  {{ item.size | formatBytes}}
                  <i class="fa fa-mime"></i>
                </h6>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="col">Bummer! No videos are currently being shared :(</div>
        </template>
      </div>
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
    return {
      items: [],
      item: {},
      timer: 0
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
  mounted() {
    this.$nextTick(function () {
      this.getItems()
    });
  },
  methods: {
    goto(path) {
      this.$router.push({ path })
    },
    magnetURI(infoHash) {
      return 'magnet:?xt=urn:btih:' + infoHash + '&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com'
    },
    getItems() {
      this.$socket.emit('videos:get', {
        id: this.$socket.id,
        page: 0,
        filter: '',
        order: {
          field: '',
          desc: ''
        }
      }, data => {
        this.items = data
        for (let i in this.items) {
          if (this.items[i].screens[0]) {
            //
            let torrent = this.state.client.get(this.magnetURI(this.items[i].screens[0]))

            //
            if (torrent) {
              let file = torrent.files.find(function (file) {
                return file.name.endsWith('.jpg')
              })
              if (file) {
                file.getBlobURL((err, url) => {
                  this.$set(this.items[i], 'activeScreen', url)
                })
              }
            } else {
              this.state.client.add(this.magnetURI(this.items[i].screens[0]), (torrent) => {
                torrent.on('done', () => {
                  let file = torrent.files.find(function (file) {
                    return file.name.endsWith('.jpg')
                  })
                  if (file) {
                    file.getBlobURL((err, url) => {
                      this.$set(this.items[i], 'activeScreen', url)
                    })
                  }
                })
              })
            }
          }
        }
      })
    },
    screens(action, index) {
      let current = 0
      if (action === 'play') {
        //
        this.timer = setInterval(() => {
          //
          current = (current >= this.items[index].screens.length - 1) ? 0 : current + 1

          if (!this.items[index].screens[current]) {
            return
          }

          // get
          let torrent = this.state.client.get(this.magnetURI(this.items[index].screens[current]))

          // have
          if (torrent) {
            let file = torrent.files.find(function (file) {
              return file.name.endsWith('.jpg')
            })
            if (!file) return;

            file.getBlobURL((err, url) => {
              this.$set(this.items[index], 'activeScreen', url)
            })
          } else {
            this.state.client.add(this.magnetURI(this.items[index].screens[current]), (torrent) => {
              torrent.on('done', () => {
                let file = torrent.files.find(function (file) {
                  return file.name.endsWith('.jpg')
                })
                if (!file) return;

                file.getBlobURL((err, url) => {
                  this.$set(this.items[index], 'activeScreen', url)
                })
              })
            })
          }
        }, 500);
      } else {
        //
        clearInterval(this.timer);

        if (!this.items[index].screens[0]) {
          return
        }

        //
        let torrent = this.state.client.get(this.magnetURI(this.items[index].screens[0]))

        //
        if (torrent) {
          let file = torrent.files.find(function (file) {
            return file.name.endsWith('.jpg')
          })
          if (!file) return;

          file.getBlobURL((err, url) => {
            this.$set(this.items[index], 'activeScreen', url)
          })
        } else {
          this.state.client.add(this.magnetURI(this.items[index].screens[0]), (torrent) => {
            torrent.on('done', () => {
              let file = torrent.files.find(function (file) {
                return file.name.endsWith('.jpg')
              })
              if (!file) return;

              file.getBlobURL((err, url) => {
                this.$set(this.items[index], 'activeScreen', url)
              })
            })
          })
        }
      }
    }
  }
}
</script>

<style></style>