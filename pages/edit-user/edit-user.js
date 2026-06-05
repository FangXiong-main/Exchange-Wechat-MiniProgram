import { updateUserInfoApi } from '../../api/user.js'
import { getSchoolListApi } from '../../api/user.js'
import { uploadFile } from '../../api/upload.js' 
import request from '../../utils/request.js' // 预览才用

Page({
  data: {
    avatarUrl: "",
    username: "",
    loading: false,
    loadText: '保存中...',

    schoolMap: {},
    schoolArray: [],
    selectedSchoolId: '',
    selectedSchoolName: ''
  },

  onLoad() {
    let user = wx.getStorageSync('userInfo') || {}
    this.setData({
      avatarUrl: user.avatarUrl ? request.baseURL + user.avatarUrl : "/images/default-avatar.png",
      username: user.username || "",
      selectedSchoolId: user.school || ''
    })
    this.loadSchoolData()
  },

  async loadSchoolData() {
    try {
      let schoolMap = wx.getStorageSync('schoolName')
      if (!schoolMap) {
        this.setData({ loading: true, loadText: '正在获取学校信息...' })
        const res = await getSchoolListApi()
        if (res.code === 200) {
          schoolMap = res.data
          wx.setStorageSync('schoolName', schoolMap)
        }
      }
      if (!schoolMap) return

      const schoolArray = Object.entries(schoolMap).map(([id, item]) => {
        return { id: Number(id), name: item.school_name || item }
      })

      this.setData({ schoolMap, schoolArray })

      if (this.data.selectedSchoolId) {
        const school = schoolArray.find(s => s.id == this.data.selectedSchoolId)
        if (school) this.setData({ selectedSchoolName: school.name })
      }

    } catch (err) {
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  showSchoolPicker() {
    const { schoolArray } = this.data
    if (schoolArray.length === 0) {
      wx.showToast({ title: '暂无学校', icon: 'none' })
      return
    }

    wx.showActionSheet({
      itemList: schoolArray.map(s => s.name),
      success: (res) => {
        const school = this.data.schoolArray[res.tapIndex]
        this.setData({
          selectedSchoolId: school.id,
          selectedSchoolName: school.name
        })
      }
    })
  },

  // ======================================
  // ✅ 上传头像：只存路径，不拼接！
  // ======================================
  async chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      success: async (res) => {
        const tempPath = res.tempFilePaths[0]
        this.setData({ loading: true, loadText: '头像上传中...' })

        try {
          const uploadRes = await uploadFile(tempPath)
          if (uploadRes.code === 200) {
            // ✅ 只存路径：/ExchangeUploads/xxx.jpg
            const imgPath = uploadRes.data

            this.setData({
              avatarUrl: request.baseURL + imgPath, // 👈 仅页面显示用
              avatarUploadPath: imgPath,            // 👈 专门存上传后的路径
              loading: false
            })
            wx.showToast({ title: '上传成功', icon: 'success' })
          } else {
            wx.showToast({ title: uploadRes.msg || '上传失败', icon: 'none' })
            this.setData({ loading: false })
          }
        } catch (err) {
          console.error(err)
          wx.showToast({ title: '上传异常', icon: 'none' })
          this.setData({ loading: false })
        }
      }
    })
  },

  setNick(e) {
    this.setData({ username: e.detail.value })
  },

  // ==============================
  // ✅ 保存：只传路径！不传完整URL！
  // ==============================
  async save() {
    const { avatarUploadPath, username, selectedSchoolId, loading } = this.data
    if (loading) return

    if (!username.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!selectedSchoolId) {
      wx.showToast({ title: '请选择学校', icon: 'none' })
      return
    }

    this.setData({ loading: true, loadText: '保存中...' })

    try {
      const params = {
        avatarUrl: avatarUploadPath || '', // ✅ 只传路径！
        changedUsername: username,
        school: selectedSchoolId
      }

      const res = await updateUserInfoApi(params)

      if (res.code === 200) {
        wx.showToast({
          title: '修改已提交，等待审核',
          icon: 'success',
          duration: 2500
        })
        setTimeout(() => wx.navigateBack(), 2500)
      } else {
        wx.showToast({ title: res.msg || '提交失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})