import { publishPostApi } from '../../api/post.js';
// 引入你项目统一的上传和请求工具
import { uploadFile } from '../../api/upload.js';
import request from '../../utils/request.js';

Page({
  data: {
    content: '',
    // 统一规范：imgPath 存路径 / imgShow 显示用
    imgPath: '',   // 传给后端：纯路径（不带域名）
    imgShow: '',   // 页面显示：完整URL
    typeIndex: 0,
    typeList: ['好人好事', '失物招领', '校园闲聊', '生活互助'],
    canPublish: false,
    showTypePanel: false
  },

  onInput(e) {
    const content = e.detail.value;
    this.setData({ content });
    this.checkBtn();
  },

  openTypeSelect() {
    this.setData({ showTypePanel: true })
  },
  closeTypeSelect() {
    this.setData({ showTypePanel: false })
  },
  selectType(e) {
    const idx = e.currentTarget.dataset.index;
    this.setData({
      typeIndex: idx,
      showTypePanel: false
    })
  },

  checkBtn() {
    const can = this.data.content.trim().length > 0;
    this.setData({ canPublish: can });
  },

  // ====================
  // ✅ 选择图片（统一规范）
  // ====================
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempPath = res.tempFiles[0].tempFilePath;
        this.uploadImage(tempPath);
      }
    });
  },

  // ====================
  // ✅ 上传图片（用你项目接口）
  // ====================
  async uploadImage(filePath) {
    wx.showLoading({ title: '上传中...' });
    try {
      const uploadRes = await uploadFile(filePath);
      if (uploadRes.code === 200) {
        const imgPath = uploadRes.data;
        this.setData({
          imgPath: imgPath,                     // 存路径
          imgShow: request.baseURL + imgPath    // 显示用
        });
        wx.showToast({ title: '上传成功', icon: 'success' });
      } else {
        wx.showToast({ title: '上传失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '上传异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // ====================
  // ✅ 预览图片
  // ====================
  previewImage() {
    const { imgShow } = this.data;
    if (!imgShow) return;
    wx.previewImage({
      current: imgShow,
      urls: [imgShow]
    });
  },

  // ====================
  // ✅ 删除图片
  // ====================
  deleteImg() {
    this.setData({
      imgPath: '',
      imgShow: ''
    });
  },

  // ====================
  // ✅ 发布（只传路径！）
  // ====================
  async publish() {
    const { content, imgPath, typeIndex } = this.data;
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }

    const type = Number(typeIndex) + 1;
    wx.showLoading({ title: '发布中...' });

    try {
      const res = await publishPostApi({
        content: content,
        images: imgPath || '',  // ✅ 只传路径
        type: type
      });

      if (res.code === 200) {
        wx.showToast({ title: '发布成功' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: res.msg || '发布失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});