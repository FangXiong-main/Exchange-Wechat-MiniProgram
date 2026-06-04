import { updateSchoolApi } from '../../api/user.js'
import { getSchoolListApi } from '../../api/user.js'

Page({
  data: {
    loading: false,
    loadText: '保存中...',

    schoolMap: {},         // 本地学校缓存 {id:name}
    schoolArray: [],       // 下拉框数组
    selectedSchoolId: '',  // 选中的学校ID
    selectedSchoolName: '' // 选中的学校名
  },

  onLoad() {
    this.loadSchoolData()
  },

  onUnload() {
    wx.switchTab({ url: '/pages/mine/mine' })
  },

  // ==========================
  // 加载学校：本地不存在 → 请求
  // ==========================
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

      // 转成下拉框需要的数组
      const schoolArray = Object.entries(schoolMap).map(([id, item]) => {
        return { id: Number(id), name: item.school_name || item }
      })

      this.setData({ schoolMap, schoolArray })

    } catch (err) {
      console.error(err)
      wx.showToast({ title: '获取学校失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },

  // ==========================
  // 弹出选择学校
  // ==========================
  showSchoolPicker() {
    const { schoolArray } = this.data
    if (schoolArray.length === 0) {
      wx.showToast({ title: '暂无学校数据', icon: 'none' })
      return
    }

    wx.showActionSheet({
      itemList: schoolArray.map(s => s.name),
      success: (res) => {
        const index = res.tapIndex
        const school = schoolArray[index]
        this.setData({
          selectedSchoolId: school.id,
          selectedSchoolName: school.name
        })
      }
    })
  },

  // ==========================
  // 保存（提交 schoolId）
  // ==========================
  async saveSchool() {
    const { selectedSchoolId, selectedSchoolName, loading } = this.data

    if (loading) return
    if (!selectedSchoolId) {
      wx.showToast({ title: '请选择学校', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      // 传给后端：学校ID（数字）
      const res = await updateSchoolApi(selectedSchoolId)

      if (res.code === 200) {
        wx.showToast({ title: '保存成功', icon: 'success' })

        const user = wx.getStorageSync('userInfo') || {}
        user.school = selectedSchoolId
        wx.setStorageSync('userInfo', user)

        setTimeout(() => {
          wx.switchTab({ url: '/pages/my/my' })
        }, 1500)
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})