import { updateUserInfoApi } from '../../api/user.js'
import { getSchoolListApi } from '../../api/user.js'

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
      avatarUrl: user.avatarUrl || "/images/default-avatar.png",
      username: user.username || "",
      selectedSchoolId: user.school || ''
    })
    this.loadSchoolData()
  },

  // 加载学校列表（和设置页完全一样）
  async loadSchoolData() {
    try {
      let schoolMap = wx.getStorageSync('schoolName')

      if (!schoolMap) {
        this.setData({
          loading: true,
          loadText: '正在获取学校信息...'
        })
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

      // 回显当前学校
      const { selectedSchoolId } = this.data
      if (selectedSchoolId) {
        const school = schoolArray.find(s => s.id == selectedSchoolId)
        if (school) {
          this.setData({ selectedSchoolName: school.name })
        }
      }

    } catch (err) {
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 选择学校
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

  // 更换头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({ avatarUrl: res.tempFilePaths[0] })
      }
    })
  },

  setNick(e) { this.setData({ username: e.detail.value }) },

  // 保存
  async save() {
    const { avatarUrl, username, selectedSchoolId, loading } = this.data
    if (loading) return

    if (!username.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (!selectedSchoolId) {
      wx.showToast({ title: '请选择学校', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const params = {
        avatarUrl: avatarUrl,
        // ✅ 这里改成 changedUsername（只改了这一行！）
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