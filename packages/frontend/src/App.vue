<script setup lang="ts">
import axios from 'axios'
import { computed, ref } from 'vue'

const newArr = ref()
const createTime = ref()
const currentImgUrl = ref()
const itemClick = (item: any) => {
  currentImgUrl.value = item
  console.log(item)
}

// #region 更新数据部分逻辑
const btnLoading = ref(false)
const progressPercent = ref(0)
const currentStage = ref('')

// 初始化开始时间
let startTime: any

const refresh = () => {
  startTime = Date.now();
  btnLoading.value = true
  axios
    .get('/api/run-index')
    .then((res) => {
      newArr.value = res.data
      console.log(res)
      if (res.data.status === 'success') {
        btnLoading.value = false
        window.location.reload()
      } else {
        btnLoading.value = false
        console.error('更新失败')
      }
    })
    .catch((err) => {
      console.log(err)
    })

  const socket = new WebSocket('ws://localhost:3001')

  // 当 WebSocket 连接打开时触发
  socket.onopen = () => {
    console.log('WebSocket connection established');

    // 向服务器发送消息
    socket.send('Hello Server!');
  };

  // 当收到服务器消息时触发
  socket.onmessage = (event) => {
    progressPercent.value = JSON.parse(event.data).progress
    currentStage.value = JSON.parse(event.data).currentStage
    console.log('Message from server!');
  };

  // 当 WebSocket 连接关闭时触发
  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };

  // 当发生错误时触发
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

const elapsedTime = ref()

setInterval(() => {
  elapsedTime.value = Date.now() - startTime;
})

const formattedElapsedTime = computed(() => {
  const hours = Math.floor(elapsedTime.value / (1000 * 60 * 60));
  const minutes = Math.floor((elapsedTime.value % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((elapsedTime.value % (1000 * 60)) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
})

// #endregion
const init = () => {
  // 获取当前数据创建时间
  axios
    .get('/api/currentActiveTime')
    .then((res) => {
      createTime.value = res.data.lastModifiedTime
    })
    .catch((err) => {
      console.log(err)
    })
  // 获取后台数据
  axios
    .get('/api/data')
    .then((res) => {
      newArr.value = res.data
      console.log(res)
    })
    .catch((err) => {
      console.log(err)
    })
}

init()
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>hr爬虫系统</h1>
      <h4>当前数据为 {{ createTime }} 更新，如需更新，请点击数据更新按钮</h4>
    </div>
    <div class="content">
      <div class="top">
        <div class="button">
          <a-button :loading="btnLoading" type="primary" @click="refresh">
            数据更新
          </a-button>
        </div>
        <!--         -->
        <div v-if="btnLoading" class="progress">
          <a-progress :percent="progressPercent" status="active" />
          <h5>当前正处于{{ currentStage }}阶段</h5>
          <h5>
            已耗时： {{ formattedElapsedTime }}
          </h5>
        </div>

        <div />
      </div>

      <a-tabs type="card">
        <a-tab-pane v-for="(item, key, index) in newArr" :key="index" :tab="key">
          <div class="main-content">
            <div class="left">
              <a-menu mode="inline" style="width: 256px">
                <template v-for="(childrenItem, childrenKey) in item">
                  <a-sub-menu>
                    <template #title>
                      {{ childrenKey }}
                    </template>
                    <template v-for="(subItem, subKey) in childrenItem" :key="subKey">
                      <a-menu-item @click="itemClick(subItem)">
                        {{ subKey }}
                      </a-menu-item>
                    </template>
                  </a-sub-menu>
                </template>
              </a-menu>
            </div>
            <div class="right">
              <img :src="currentImgUrl" alt="" />
            </div>
          </div>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  .header {
    margin-bottom: 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .content {
    width: 80%;
    .top {
      margin-bottom: 10px;
    }
  }
  .main-content {
    display: flex;
    .right {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
