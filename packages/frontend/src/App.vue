<script setup lang="ts">
import axios from 'axios'
import { computed, nextTick, reactive, ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue';

const newArr = ref()
const createTime = ref()
const currentImgUrl = ref()
const currentOriginUrl = ref()
const itemClick = (item: any) => {
  currentImgUrl.value = item.imgHref
  currentOriginUrl.value = item.href
}

// #region 更新数据部分逻辑
const btnLoading = ref(false)
const progressPercent = ref(0)
const currentStage = ref('')

// 初始化开始时间
let startTime: any

const refresh = () => {
  startTime = Date.now()
  btnLoading.value = true
  axios
    .get('/api/run-index')
    .then((res) => {
      newArr.value = res.data
      console.log(res)
      if (res.data.status === 'success') {
        // btnLoading.value = false
        // window.location.reload()
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
    console.log('WebSocket connection established')

    // 向服务器发送消息
    socket.send('Hello Server!')
  }

  // 当收到服务器消息时触发
  socket.onmessage = (event) => {
    progressPercent.value = JSON.parse(event.data).progress
    currentStage.value = JSON.parse(event.data).currentStage
    console.log('Message from server!')
  }

  // 当 WebSocket 连接关闭时触发
  socket.onclose = () => {
    console.log('WebSocket connection closed')
  }

  // 当发生错误时触发
  socket.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
}

const elapsedTime = ref()

setInterval(() => {
  elapsedTime.value = Date.now() - startTime
})

const formattedElapsedTime = computed(() => {
  const hours = Math.floor(elapsedTime.value / (1000 * 60 * 60))
  const minutes = Math.floor((elapsedTime.value % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((elapsedTime.value % (1000 * 60)) / 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 数据录入部分逻辑
const selectedSearchType = ref([])
const selectedCompany = ref([])
const editSearchType = ref(false)
const editCompany = ref(false)

const searchTypeInputRef = ref()
const searchTypeData = reactive({
  tags: [] as string[],
  inputVisible: false,
  inputValue: '',
})
const companyInputRef = ref()
const companyData = reactive({
  tags: [] as string[],
  inputVisible: false,
  inputValue: '',
})

const handleInputConfirm = (type: string) => {
  let currentData;
  if (type === 'searchType') {
    currentData = searchTypeData
  } else {
    currentData = companyData
  }
  const inputValue = currentData.inputValue;
  let tags = currentData.tags;
  if (inputValue && !tags.includes(inputValue)) {
    tags = [...tags, inputValue];
  }
  Object.assign(currentData, {
    tags,
    inputVisible: false,
    inputValue: '',
  });
};

const showInput = (type: string) => {
  let currentData, currentRef;
  if (type === 'searchType') {
    currentData = searchTypeData
    currentRef = searchTypeInputRef
  } else {
    currentData = companyData
    currentRef = companyInputRef
  }
  currentData.inputVisible = true;
  nextTick(() => {
    currentRef.value.focus();
  });
};

const removeTag = (tag: string, type: string) => {
  let currentData;
  if (type === 'searchType') {
    currentData = searchTypeData
  } else {
    currentData = companyData
  }
  currentData.tags = currentData.tags.filter(item => item !== tag)
}

const editTag = (currentType: boolean, type: string) => {
  let currentData;
  if (type === 'searchType') {
    currentData = editSearchType
  } else {
    currentData = editCompany
  }
  currentData.value = !currentData.value
  // 编辑状态下需要提交信息
  if (currentType) {
    axios.post('/api/updateSearchData', {
      searchType: searchTypeData.tags,
      company: companyData.tags,
    })
  }
}

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
  // 获取图片数据
  axios
    .get('/api/data')
    .then((res) => {
      newArr.value = res.data
    })
    .catch((err) => {
      console.log(err)
    })
  // 获取搜索数据
  axios
    .get('/api/searchData')
    .then((res) => {
      searchTypeData.tags = res.data.searchType
      companyData.tags = res.data.company
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
        <div class="searchData">
          <a-descriptions title="数据选择" bordered :label-style="{ width: '200px' }">
            <a-descriptions-item :span="3" label="搜索类型：">
              <div v-show="!editSearchType" class="showTag">
                <a-checkable-tag
                  v-for="(tag, index) in searchTypeData.tags"
                  :key="tag"
                  v-model:checked="selectedSearchType[index]"
                >
                  {{ tag }}
                </a-checkable-tag>
              </div>
              <div v-show="editSearchType" class="editTag">
                <a-space :size="[0, 'small']" wrap>
                  <a-tag v-for="tag in searchTypeData.tags" :key="tag" :bordered="false" closable @close="removeTag(tag, 'searchType')">
                    {{ tag }}
                  </a-tag>
                  <a-input
                    v-if="searchTypeData.inputVisible"
                    ref="searchTypeInputRef"
                    v-model:value="searchTypeData.inputValue"
                    type="text"
                    size="small"
                    :style="{ width: '78px' }"
                    @blur="handleInputConfirm('searchType')"
                    @keyup.enter="handleInputConfirm('searchType')"
                  />
                  <a-tag v-else style="background: #fff; border-style: dashed" @click="showInput('searchType')">
                    <PlusOutlined />
                    新增
                  </a-tag>
                </a-space>
              </div>
              <a-button class="edit" type="primary" size="small" @click="editTag(editSearchType, 'searchType')">
                {{ editSearchType ? '完成编辑' : '编辑' }}
              </a-button>
            </a-descriptions-item>
            <a-descriptions-item label="搜索公司：">
              <div v-show="!editCompany" class="showTag">
                <a-checkable-tag
                  v-for="(tag, index) in companyData.tags"
                  :key="tag"
                  v-model:checked="selectedCompany[index]"
                >
                  {{ tag }}
                </a-checkable-tag>
              </div>
              <div v-show="editCompany" class="editTag">
                <a-space :size="[0, 'small']" wrap>
                  <a-tag v-for="tag in companyData.tags" :key="tag" :bordered="false" closable @close="removeTag(tag, 'company')">
                    {{ tag }}
                  </a-tag>
                  <a-input
                    v-if="companyData.inputVisible"
                    ref="companyInputRef"
                    v-model:value="companyData.inputValue"
                    type="text"
                    size="small"
                    :style="{ width: '78px' }"
                    @blur="handleInputConfirm('company')"
                    @keyup.enter="handleInputConfirm('company')"
                  />
                  <a-tag v-else style="background: #fff; border-style: dashed" @click="showInput('company')">
                    <PlusOutlined />
                    新增
                  </a-tag>
                </a-space>
              </div>
              <a-button class="edit" type="primary" size="small" @click="editTag(editCompany, 'company')">
                {{ editCompany ? '完成编辑' : '编辑' }}
              </a-button>
            </a-descriptions-item>
            <template #extra>
              <div class="button">
                <a-button :loading="btnLoading" type="primary" @click="refresh">
                  数据更新
                </a-button>
              </div>
            </template>
          </a-descriptions>
        </div>
        <div v-if="btnLoading" class="progress">
          <a-progress :percent="progressPercent" status="active" />
          <h5>当前正处于{{ currentStage }}阶段</h5>
          <h5>已耗时： {{ formattedElapsedTime }}</h5>
        </div>
        <div />
      </div>

      <a-tabs type="card">
        <a-tab-pane v-for="(item, index) in newArr" :key="index" :tab="item.type">
          <div class="main-content">
            <div class="left">
              <a-menu mode="inline" style="width: 256px">
                <template v-for="childrenItem in item.news" :key="childrenItem">
                  <a-sub-menu>
                    <template #title>
                      {{ childrenItem.company }}
                    </template>
                    <template v-for="subItem in childrenItem.news" :key="subItem.imgHref">
                      <a-menu-item @click="itemClick(subItem)">
                        {{ subItem.title }}
                      </a-menu-item>
                    </template>
                  </a-sub-menu>
                </template>
              </a-menu>
            </div>
            <div class="right">
              <template v-if="currentOriginUrl">
                原始地址：
                <a target="_blank" :href="currentOriginUrl">
                  {{ currentOriginUrl }}
                </a>
              </template>
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
      .edit {
        font-size: 12px;
        height: 24px;
      }
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

:deep(.ant-descriptions-item-content) > span {
  display: flex;
  justify-content: space-between;
}
</style>
