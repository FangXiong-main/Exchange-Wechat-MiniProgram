import {
    logoutApi,
    infoIsChangedApi,
    getUserInfoApi
  } from '../../api/user.js'
  import { getSchoolListApi } from '../../api/user.js'
  import { getUnresolvedOrdersCountApi } from '../../api/order.js'
  
  Page({
    data: {
      userInfo: {},
      schoolName: '',
      loading: false,
      changedStatus: 0,
      auditStatus: 0,
      unresolvedCount: 0
    },
  
    onShow() {
      this.setData({
        userInfo: wx.getStorageSync('userInfo') || {}
      })
      this.loadSchoolData()
      this.checkInfoStatus()
      this.getUnresolvedOrdersCount()
    },
  
    async getUnresolvedOrdersCount() {
      try {
        const res = await getUnresolvedOrdersCountApi()
        if (res.code === 200) {
          let num = res.data ?? 0
          this.setData({ unresolvedCount: num })
        } else {
          this.setData({ unresolvedCount: 0 })
        }
      } catch (err) {
        this.setData({ unresolvedCount: 0 })
      }
    },
  
    async loadSchoolData() {
      try {
        const userInfo = this.data.userInfo
        const schoolId = userInfo.school
  
        if (!schoolId) {
          this.setData({ schoolName: '' })
          return
        }
  
        let schoolMap = wx.getStorageSync('schoolName')
  
        if (!schoolMap) {
          this.setData({ loading: true })
          const res = await getSchoolListApi()
          if (res.code === 200) {
            schoolMap = res.data || {}
            wx.setStorageSync('schoolName', schoolMap)
          }
        }
  
        const schoolObj = schoolMap[schoolId]
        const name = schoolObj?.school_name || '未知学校'
        this.setData({ schoolName: name })
  
      } catch (err) {
        console.error('加载学校失败', err)
      } finally {
        this.setData({ loading: false })
      }
    },
  
    async checkInfoStatus() {
      try {
        const res = await infoIsChangedApi()
        if (res.code !== 200) return
  
        if (res.data === null) {
          this.setData({
            changedStatus: 0,
            auditStatus: 0
          })
          return
        }
  
        const data = res.data
        this.setData({
          changedStatus: data.changedStatus,
          auditStatus: data.auditStatus
        })
  
        if (data.auditStatus === -1) {
          wx.showModal({
            title: '提示',
            content: '管理员超时未处理您修改个人信息的请求，您的请求已被删除，非常抱歉，您可以重新修改。',
            showCancel: false,
            success: () => {
              this.setData({ changedStatus: 0, auditStatus: 0 })
            }
          })
          return
        }
  
        if (data.auditStatus === 2) {
          wx.showModal({
            title: '提示',
            content: "您的修改个人信息请求已被驳回，原因：" + (data.rejectReason || "未填写原因"),
            showCancel: false,
            success: () => {
              this.setData({ changedStatus: 0, auditStatus: 0 })
            }
          })
          return
        }
  
        if (data.auditStatus === 1) {
          wx.showModal({
            title: '提示',
            content: '您的个人信息审核已通过',
            showCancel: false,
            success: async () => {
              this.setData({ loading: true })
              try {
                const userRes = await getUserInfoApi()
                if (userRes.code === 200) {
                  wx.setStorageSync('userInfo', userRes.data)
                  this.setData({ userInfo: userRes.data })
                  this.loadSchoolData()
                }
              } finally {
                this.setData({
                  loading: false,
                  changedStatus: 0,
                  auditStatus: 0
                })
              }
            }
          })
        }
  
      } catch (err) {
        console.error('checkInfoStatus error', err)
      }
    },
  
    goEditUser() { wx.navigateTo({ url: '/pages/edit-user/edit-user' }) },
    goMyPublish() { wx.navigateTo({ url: '/pages/my-publish/my-publish' }) },
    goMyOrder() { wx.navigateTo({ url: '/pages/order/order' }) },
    goMyFavorite() { wx.navigateTo({ url: '/pages/favorite/favorite' }) },
    // 🔥 新增钱包跳转
    goExcWallet() { wx.navigateTo({ url: '/pages/excWallet/excWallet' }) },
  
    logout() {
      wx.showModal({
        title: '退出登录',
        content: '确定要退出吗？',
        success: async (res) => {
          if (!res.confirm) return
          try {
            const result = await logoutApi()
            if (result.code === 200) {
              wx.clearStorageSync()
              wx.redirectTo({ url: '/pages/login/login' })
            } else {
              wx.showToast({ title: result.msg || '退出失败', icon: 'none' })
            }
          } catch (err) {
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      })
    }
  })