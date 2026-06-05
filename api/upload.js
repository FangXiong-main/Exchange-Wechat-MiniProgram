import request from '../utils/request.js'

export function uploadFile(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: request.baseURL + "/upload/img",
      filePath: filePath,
      name: 'file',
      header: {
        token: wx.getStorageSync("userInfo")?.token || "",
        id: wx.getStorageSync("userInfo")?.id || "",
        school: wx.getStorageSync("userInfo")?.school || ""
      },

      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          resolve(data)
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}