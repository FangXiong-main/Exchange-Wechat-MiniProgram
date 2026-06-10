import request from '../../utils/request.js'
import { getSearchedPostListApi } from '../../api/post.js'

Page({
  data: {
    searchKey: '',
    postList: [],
    loading: false,
    pageNum: 1,
    pageSize: 10,
    noMore: false,
    pageTitle: '搜索结果',
    emptyTip: '暂无相关帖子',
    fromDetail: false
  },

  onLoad(options) {
    const key = options.key || ''
    this.setData({
      searchKey: key,
      pageTitle: `搜索 “${key}” 的结果`,
      emptyTip: `未找到 “${key}” 相关帖子`
    })
    this.getPostList(true)
  },

  onShow() {
    if (this.data.fromDetail) {
      this.setData({ fromDetail: false })
    }
  },

  onPullDownRefresh() {
    this.setData({
      pageNum: 1,
      postList: [],
      noMore: false
    })
    this.getPostList(true)
  },

  onReachBottom() {
    if (this.data.loading || this.data.noMore) return
    this.setData({ pageNum: this.data.pageNum + 1 })
    this.getPostList(false)
  },

  async getPostList(isRefresh) {
    const { pageNum, pageSize, searchKey, postList } = this.data
    this.setData({ loading: true })

    try {
      const res = await getSearchedPostListApi({
        pageNum,
        pageSize,
        content: searchKey
      })

      if (res.code === 200 && res.data) {
        let list = res.data.rows || []

        list = list.map(item => {
          // 头像
          let avatar = item.avatarUrl || ''
          if (avatar && !avatar.startsWith('http')) {
            avatar = request.baseURL + avatar
          }

          // 单张图
          let img = ''
          if (item.images && item.images.trim() !== '') {
            img = item.images.split(',')[0] || ''
            if (img && !img.startsWith('http')) {
              img = request.baseURL + img
            }
          }

          // 时间
          const createTime = this.formatTime(item.createTime)

          // 类型名称
          const typeMap = {
            1: '好人好事',
            2: '失物招领',
            3: '校园闲聊',
            4: '生活互助'
          }
          const typeName = typeMap[item.type] || '未知'

          return {
            ...item,
            avatarUrl: avatar,
            img,
            viewCount: item.viewCount ?? 0,
            commentCount: item.commentCount ?? 0,
            createTime,
            typeName
          }
        })

        this.setData({
          postList: isRefresh ? list : [...postList, ...list],
          noMore: list.length < pageSize
        })
      }
    } catch (err) {
      console.error('搜索失败', err)
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  // 时间格式化
  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}`
  },

  // ✅ 修复：跳转到帖子详情页（和主页完全一样）
  goDetail(e) {
    const item = e.currentTarget.dataset.item
    const post = encodeURIComponent(JSON.stringify(item))
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?post=${post}`
    })
  }
})