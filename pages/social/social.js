import { addViewCountApi, getPostPageApi } from '../../api/post.js';
import request from '../../utils/request.js';

Page({
  data: {
    filterList: ["全部", "好人好事", "失物招领", "校园闲聊", "生活互助"],
    filterIndex: 0, // 默认一定是 0（全部）

    postList: [],
    searchKey: '',

    pageNum: 1,
    pageSize: 10,
    total: 0,
    isLast: false,
    loading: false
  },

  onShow() {
    // 从本地取
    const saveType = wx.getStorageSync('post_type');
    console.log("本地读取到的类型：", saveType);

    // 只有合法值才覆盖，否则保持 0（全部）
    if (saveType !== '' && saveType != null && !isNaN(saveType)) {
      const idx = Number(saveType);
      // 必须在 0-4 之间才有效
      if (idx >= 0 && idx <= 4) {
        this.setData({ filterIndex: idx });
      }
    }

    this.onPullDownRefresh();
  },

  onPullDownRefresh() {
    if (this.data.loading) return;
    this.setData({
      pageNum: 1,
      postList: [],
      isLast: false
    }, () => {
      this.getPostPage();
    });
  },

  onReachBottom() {
    if (this.data.isLast || this.data.loading) return;
    this.setData({
      pageNum: this.data.pageNum + 1
    }, () => {
      this.getPostPage();
    });
  },

  async getPostPage() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const filterIndex = this.data.filterIndex;
      const type = filterIndex; 

      const res = await getPostPageApi({
        pageNum: this.data.pageNum,
        pageSize: this.data.pageSize,
        type: type
      });

      if (res.code === 0) {
        wx.showToast({ title: res.msg || '请求异常', icon: 'none' });
        return;
      }

      if (res.code === 200) {
        const { total, rows } = res.data;
        let newList = (rows || []).map(item => {
          let avatar = item.avatarUrl || '';
          if (avatar && !avatar.startsWith('http')) {
            avatar = request.baseURL + avatar;
          }

          let img = '';
          if (item.images && item.images.trim() !== '') {
            img = item.images.split(',')[0] || '';
            if (img && !img.startsWith('http')) {
              img = request.baseURL + img;
            }
          }

          const viewCount = item.viewCount ?? 0;
          const commentCount = item.commentCount ?? 0;
          const createTime = this.formatTime(item.createTime);
          
          return {
            ...item,
            avatarUrl: avatar,
            img,
            viewCount,
            commentCount,
            createTime
          };
        });

        const finalList = this.data.pageNum === 1
          ? newList
          : [...this.data.postList, ...newList];

        this.setData({
          postList: finalList,
          total: total,
          isLast: finalList.length >= total
        });
      }
    } catch (err) {
      console.error('请求失败：', err);
      wx.showToast({ title: '网络请求失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  formatTime(time) {
    if (!time) return '';
    const date = new Date(time);
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const hh = date.getHours().toString().padStart(2, '0');
    const mm = date.getMinutes().toString().padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}`;
  },

  showFilter() {
    if (this.data.loading) return;
    wx.showActionSheet({
      itemList: this.data.filterList,
      success: (res) => {
        const idx = res.tapIndex;
        this.setData({ filterIndex: idx }, () => {
          wx.setStorageSync('post_type', idx);
          this.onPullDownRefresh();
        });
      }
    });
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value });
  },

  goSearchPage() {
    const key = this.data.searchKey.trim();
    wx.navigateTo({
      url: `/pages/search/search?key=${key}`
    });
  },

  goDetail(e) {
    const item = e.currentTarget.dataset.item;
    addViewCountApi(item.id);
    const post = encodeURIComponent(JSON.stringify(item));
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?post=${post}`
    });
  },

  goPublish() {
    wx.navigateTo({
      url: '/pages/publishPost/publishPost'
    });
  }
});