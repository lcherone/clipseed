<template>
  <div>
    <div class="content container">
      <navbar :state="state"></navbar>
      <section>
        <div class="mt-2 jumbotron" v-if="!item.name">
          <h1 class="display-4">ClipSeed!</h1>
          <p class="lead">no storage p2p video sharing, using webtorrent and socket.io :/</p>
          <hr class="my-4">
          <p>
            <b>max shared video filesize:</b> Whatever doesn't crash your browser.
          </p>
          <p>
            <a
              href="javascript:void(0)"
              role="button"
              class="btn btn-lg btn-primary"
              onClick="$('[name=\'file\']').trigger('click')"
            >
              <i class="fa fa-upload"></i> *Share Video
            </a>
          </p>
          <form
            id="uploadForm"
            ref="uploadForm"
            action="/upload"
            method="post"
            enctype="multipart/form-data"
          >
            <input
              type="file"
              name="file"
              accept="video/*"
              style="display: none"
              @change="loadVideo($event)"
            >
          </form>
          <small>*all files are kindly hosted and shared by
            <router-link :to="{ path: '/users' }">active users</router-link>&nbsp;of the site.
          </small>
        </div>

        <div class="progress" v-if="item.loading">
          <div
            class="progress-bar"
            role="progressbar"
            style="width: 100%"
            aria-valuenow="100"
            aria-valuemin="0"
            aria-valuemax="100"
          >loading file into browser</div>
        </div>

        <div class="progress" v-if="item.complete">
          <div
            class="progress-bar bg-success"
            role="progressbar"
            style="width: 100%"
            aria-valuenow="100"
            aria-valuemin="0"
            aria-valuemax="100"
          >done, sharing is caring!</div>
        </div>

        <div class="progress" v-if="item.progress && !item.complete">
          <div
            class="progress-bar"
            role="progressbar"
            :style="{width: item.progress+'%'}"
            :aria-valuenow="item.progress"
            aria-valuemin="0"
            aria-valuemax="100"
          >{{ item.progress }}%{{ item.progress_label ? ' ('+item.progress_label+')' : '' }}</div>
        </div>

        <div class="card mb-4" v-if="item.name">
          <div class="embed-responsive embed-responsive-16by9">
            <video
              id="video_preview"
              @error="failed($event)"
              controls="controls"
              preload="none"
              muted
              style="width: 100%"
              class="embed-responsive-item"
            ></video>
          </div>
          <video
            id="video"
            @error="failed($event)"
            controls="controls"
            preload="none"
            muted
            style="display:none"
          ></video>
          <div class="card-body">
            <h5 class="card-title">{{ item.name }}</h5>
            <h6 class="card-subtitle mb-2 text-muted">
              <i class="fa fa-clock-o"></i>
              {{ item.duration | formatSeconds }} -
              <i class="fa fa-file"></i>
              {{ item.size | formatBytes }}
            </h6>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import navbar from "/components/navbar.vue";

export default {
  name: "index",
  props: ["state"],
  components: {
    navbar
  },
  data: function() {
    return {
      item: {
        name: "",
        size: 0,
        duration: 0,
        hash: "",
        video: null,
        screens: [],
        loading: false,
        processing: false,
        complete: false,
        progress: 0
      }
    };
  },
  computed: {
    screens: function() {
      return this.item.screens.reverse();
    }
  },
  filters: {
    formatBytes(bytes) {
      bytes = Number(bytes);
      if (bytes === 0) return "0 Bytes";
      var k = 1024;
      var dm = 2;
      var sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
      var i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    formatSeconds(seconds) {
      if (!seconds) {
        return "00:00:00";
      }
      return new Date(Number(seconds) * 1000).toISOString().substr(11, 8);
    }
  },
  methods: {
    fileListItem(a) {
      a = [].slice.call(Array.isArray(a) ? a : arguments);
      for (var c, b = (c = a.length), d = !0; b-- && d; )
        d = a[b] instanceof File;
      if (!d)
        throw new TypeError(
          "expected argument to FileList is File or array of File objects"
        );
      for (
        b = new ClipboardEvent("").clipboardData || new DataTransfer();
        c--;

      )
        b.items.add(a[c]);
      return b.files;
    },
    dataURIToBlob(dataURI) {
      let mime = dataURI
        .split(",")[0]
        .split(":")[1]
        .split(";")[0];
      let binary = atob(dataURI.split(",")[1]);
      let array = [];
      for (let i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
      }
      return new Blob([new Uint8Array(array)], {
        type: mime
      });
    },
    failed(e) {
      switch (e.target.error.code) {
        case e.target.error.MEDIA_ERR_ABORTED:
          console.log("You aborted the video playback.");
          break;
        case e.target.error.MEDIA_ERR_NETWORK:
          console.log(
            "A network error caused the video download to fail part-way."
          );
          break;
        case e.target.error.MEDIA_ERR_DECODE:
          console.log(
            "The video playback was aborted due to a corruption problem or because the video used features your browser did not support."
          );
          break;
        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          console.log(
            "The video could not be loaded, either because the server or network failed or because the format is not supported."
          );
          break;
        default:
          console.log("An unknown error occurred.");
          break;
      }
    },
    takeScreen() {
      const width = this.item.video.videoWidth;
      const height = this.item.video.videoHeight;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this.item.video, 0, 0, width, height);

      const resizeWidth = 240;
      const resizeHeight = 240;

      //
      const ratio = Math.min(resizeWidth / width, resizeHeight / height);

      this.resizeCanvas(canvas, width * ratio, height * ratio, true);

      this.item.screens.push(canvas.toDataURL("image/jpg"));
    },
    resizeCanvas: function(canvas, width, height, resize_canvas) {
      width = Math.round(width);
      height = Math.round(height);

      let width_source = canvas.width;
      let height_source = canvas.height;
      let ratio_w = width_source / width;
      let ratio_h = height_source / height;
      let ratio_w_half = Math.ceil(ratio_w / 2);
      let ratio_h_half = Math.ceil(ratio_h / 2);
      let ctx = canvas.getContext("2d");
      let img = ctx.getImageData(0, 0, width_source, height_source);
      let img2 = ctx.createImageData(width, height);
      let data = img.data;
      let data2 = img2.data;

      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          let x2 = (i + j * width) * 4;
          let weight = 0;
          let weights = 0;
          let weights_alpha = 0;
          let gx_r = 0;
          let gx_g = 0;
          let gx_b = 0;
          let gx_a = 0;
          let center_y = (j + 0.5) * ratio_h;
          let yy_start = Math.floor(j * ratio_h);
          let yy_stop = Math.ceil((j + 1) * ratio_h);
          for (let yy = yy_start; yy < yy_stop; yy++) {
            let dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
            let center_x = (i + 0.5) * ratio_w;
            let w0 = dy * dy; //pre-calc part of w
            let xx_start = Math.floor(i * ratio_w);
            let xx_stop = Math.ceil((i + 1) * ratio_w);
            for (let xx = xx_start; xx < xx_stop; xx++) {
              let dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
              let w = Math.sqrt(w0 + dx * dx);
              if (w >= 1) {
                continue;
              }
              weight = 2 * w * w * w - 3 * w * w + 1;
              let pos_x = 4 * (xx + yy * width_source);
              gx_a += weight * data[pos_x + 3];
              weights_alpha += weight;
              if (data[pos_x + 3] < 255)
                weight = (weight * data[pos_x + 3]) / 250;
              gx_r += weight * data[pos_x];
              gx_g += weight * data[pos_x + 1];
              gx_b += weight * data[pos_x + 2];
              weights += weight;
            }
          }
          data2[x2] = gx_r / weights;
          data2[x2 + 1] = gx_g / weights;
          data2[x2 + 2] = gx_b / weights;
          data2[x2 + 3] = gx_a / weights_alpha;
        }
      }
      if (resize_canvas === true) {
        canvas.width = width;
        canvas.height = height;
      } else {
        ctx.clearRect(0, 0, width_source, height_source);
      }
      ctx.putImageData(img2, 0, 0);
    },
    process() {
      let vm = this;

      //
      if (!vm.item.processing && !vm.item.complete) {
        vm.item.processing = true;
        vm.item.progress_label = "generating screens";
        vm.item.duration = vm.item.video.duration;

        (function repeat(i) {
          setTimeout(function() {
            if (--i) {
              vm.item.progress_label =
                "generating screens (" + vm.item.screens.length + " of 10)";
              vm.item.progress = 100 - i * 10;
              let timestamp = ((vm.item.video.duration / 10) * i) / 1.1;
              vm.item.video.currentTime = timestamp;
              repeat(i);
            } else {
              vm.item.processing = false;
              vm.item.complete = true;
              vm.item.progress = 100 - vm.item.screens.length;
              vm.item.progress_label = "creating torrents";

              // create torrent for each screen
              let screens = [];
              for (let ii in vm.item.screens) {
                let files = new vm.fileListItem([
                  new File([vm.dataURIToBlob(vm.item.screens[ii])], ii + ".jpg")
                ]);
                vm.state.client.seed(files, torrent => {
                  vm.item.progress++;
                  screens.push(torrent.infoHash);
                });
              }
              // replace screens array with torrent hashes
              vm.item.screens = screens;

              vm.item.progress_label = "done";

              setTimeout(function() {
                vm.$socket.emit("video:add", {
                  id: vm.$socket.id,
                  video: {
                    name: vm.item.name,
                    size: vm.item.size,
                    duration: vm.item.duration,
                    hash: vm.item.hash,
                    screens: vm.item.screens
                  }
                });
              }, 2000);
            }
          }, 500); // how fast to attempt to grab screens
        })(10); // iterations i.e how many screens
      }
    },
    loadVideo(event) {
      // set item state
      this.item = {
        ...this.item,
        ...{
          name: event.target.files[0].name || "",
          size: event.target.files[0].size || 0
        },
        loading: true,
        screens: []
      };

      this.$nextTick(function() {
        //
        // create torrent for video
        this.state.client.seed(event.target.files, torrent => {
          //
          this.item.loading = false;

          // hash
          this.item.hash = torrent.infoHash;

          // load file for player
          let file = torrent.files.find(function(file) {
            return (
              file.name.endsWith(".mp4") ||
              file.name.endsWith(".mov") ||
              file.name.endsWith(".webm") ||
              file.name.endsWith(".avi") ||
              file.name.endsWith(".mpeg")
            );
          });
          if (!file) return;

          // load preview
          file.renderTo(
            "#video_preview",
            {
              autoplay: true,
              muted: true,
              controls: true,
              preload: "none"
            },
            (err, elem) => {
              if (err) {
                this.item.error = err;
                return;
              }
              // get blob to set into hidden player to get screens
              file.getBlobURL((err, url) => {
                this.item.video = document.getElementById("video");
                this.item.video.src = url;
                this.item.video.autoplay = true;

                this.item.video.removeEventListener(
                  "canplay",
                  this.process,
                  false
                );
                this.item.video.addEventListener(
                  "canplay",
                  this.process,
                  false
                );
                this.item.video.removeEventListener(
                  "seeked",
                  this.process,
                  false
                );
                this.item.video.addEventListener(
                  "seeked",
                  this.takeScreen,
                  false
                );
              });
            }
          );
        });
      });
    }
  }
};
</script>

<style></style>