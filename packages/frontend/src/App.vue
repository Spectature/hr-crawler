<script setup lang="ts">
import axios from 'axios'
import { ref } from 'vue'

const newArr = ref()

const currentImgUrl = ref()

const itemClick = (item: any) => {
  currentImgUrl.value = item
  console.log(item)
}

const btnLoading = ref(false)

const refresh = () => {
  btnLoading.value = true
  axios
    .get('/api/run-index')
    .then((res) => {
      newArr.value = res.data
      console.log(res)
      if (res.data.status === 'success') {
        // btnLoading.value = false
        window.location.reload()
      } else {
        btnLoading.value = false
        console.error('更新失败')
      }
    })
    .catch((err) => {
      console.log(err)
    })
}
axios
  .get('/api/data')
  .then((res) => {
    newArr.value = res.data
    console.log(res)
  })
  .catch((err) => {
    console.log(err)
  })
</script>

<template>
  <div class="container">
    <div class="header">
      <h1>hr爬虫系统</h1>
    </div>
    <div class="content">
      <a-tabs type="card">
        <a-tab-pane v-for="(item, key, index) in newArr" :tab="key" :key="index">
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
        <template #rightExtra>
          <a-button :loading="btnLoading" type="primary" @click="refresh">获取最新数据</a-button>
        </template>
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
  }
  .content {
    width: 80%;
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
