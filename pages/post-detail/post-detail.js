import { 
    getCommentListApi, 
    addCommentApi, 
    deletePostApi 
  } from '../../api/post.js';
  import request from '../../utils/request.js'; // 👈 加上
  
  Page({
    data: {
      post: {},
      commentList: [],
      content: '',
      pageNum: 1,
      pageSize: 10,
      loading: false,
      fullLoading: false,
      isLast: false,
      isOwner: false,
      userId: null
    },
  
    onLoad(options) {
      const post = JSON.parse(decodeURIComponent(options.post));
      
      // ======================
      // ✅ 头像 + 图片自动拼接域名
      // ======================
      if (post.avatarUrl && !post.avatarUrl.startsWith('http')) {
        post.avatarUrl = request.baseURL + post.avatarUrl;
      }
      if (post.images && !post.images.startsWith('http')) {
        post.images = request.baseURL + post.images;
      }
  
      this.setData({ post });
  
      const userInfo = wx.getStorageSync('userInfo');
      const userId = userInfo?.id;
      this.setData({ userId });
  
      if (post.userId === userId) {
        this.setData({ isOwner: true });
      }
  
      this.getCommentList();
    },
  
    onPullDownRefresh() {
      this.setData({
        pageNum: 1,
        commentList: [],
        isLast: false
      }, () => {
        this.getCommentList();
      });
    },
  
    onReachBottom() {
      if (this.data.isLast || this.data.loading) return;
      this.setData({ pageNum: this.data.pageNum + 1 }, () => {
        this.getCommentList();
      });
    },
  
    async getCommentList() {
      const isFirstPage = this.data.pageNum === 1;
      if (isFirstPage) {
        this.setData({ fullLoading: true });
      } else {
        this.setData({ loading: true });
      }
  
      try {
        const params = {
          postId: this.data.post.id,
          pageNum: this.data.pageNum,
          pageSize: this.data.pageSize
        };
        const res = await getCommentListApi(params);
        
        if (res.code === 0) {
          wx.showToast({ title: res.msg || '加载失败', icon: 'none' });
          return;
        }
  
        if (res.code === 200) {
          const { total, rows } = res.data;
          const newList = (rows || []).map(item => {
            // 评论头像拼接
            if (item.avatarUrl && !item.avatarUrl.startsWith('http')) {
              item.avatarUrl = request.baseURL + item.avatarUrl;
            }
            return {
              ...item,
              createTime: this.formatTime(item.createTime)
            };
          });
  
          const finalList = isFirstPage
            ? newList
            : [...this.data.commentList, ...newList];
  
          this.setData({
            commentList: finalList,
            isLast: finalList.length >= total
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.setData({
          loading: false,
          fullLoading: false
        });
        wx.stopPullDownRefresh();
      }
    },
  
    // ======================
    // ✅ 图片点击预览
    // ======================
    previewImage() {
      const img = this.data.post.images;
      if (!img) return;
      wx.previewImage({
        current: img,
        urls: [img]
      });
    },
  
    onInput(e) {
      let value = e.detail.value;
      if (value.length > 100) {
        value = value.substring(0, 100);
      }
      this.setData({ content: value });
    },
  
    async sendComment() {
      const content = this.data.content.trim();
      if (!content) {
        wx.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }
      if (content.length > 100) {
        wx.showToast({ title: '评论不能超过100个字', icon: 'none' });
        return;
      }
  
      this.setData({ fullLoading: true });
      try {
        const res = await addCommentApi({
          id: this.data.post.id,
          content: content
        });
  
        if (res.code === 200) {
          wx.showToast({ title: '评论成功' });
          this.setData({
            content: '',
            pageNum: 1,
            commentList: []
          }, () => {
            this.getCommentList();
          });
        } else {
          wx.showToast({ title: res.msg || '评论失败', icon: 'none' });
        }
      } catch (err) {
        wx.showToast({ title: '网络异常', icon: 'none' });
      } finally {
        this.setData({ fullLoading: false });
      }
    },
  
    deletePost() {
      wx.showModal({
        title: '确认删除',
        content: '删除后无法恢复',
        success: (res) => {
          if (!res.confirm) return;
          this.doDeletePost();
        }
      });
    },
    
    async doDeletePost() {
      this.setData({ fullLoading: true });
      try {
        const delRes = await deletePostApi({ id: this.data.post.id });
        
        if (delRes.code === 200) {
          wx.showToast({ title: '删除成功' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: delRes.msg || '删除失败', icon: 'none' });
        }
      } catch (err) {
        console.error('删除报错', err);
        wx.showToast({ title: '删除失败', icon: 'none' });
      } finally {
        this.setData({ fullLoading: false });
      }
    },
  
    formatTime(time) {
      if (!time) return '';
      const d = new Date(time);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${y}-${m}-${day} ${hh}:${mm}`;
    }
  });