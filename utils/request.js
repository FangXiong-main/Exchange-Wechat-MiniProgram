
const baseURL = "http://10.90.215.160:8080";

const request = (config) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseURL + config.url,
      method: config.method || "GET",
      data: config.data || {},
      header: {
        "token": wx.getStorageSync("userInfo")?.token || "",
        "id": wx.getStorageSync("userInfo")?.id || "",
        "school": wx.getStorageSync("userInfo")?.school || "",
        "Content-Type": "application/json"
      },
      success: (res) => {
        if (res.statusCode === 403) {
          wx.clearStorageSync();
          wx.showModal({
            title: "账号封禁",
            content: "您已被强制下线，请联系管理员处理！",
            showCancel: false,
            confirmText: "确定",
            success: () => {
              wx.redirectTo({
                url: "/pages/login/login"
              });
            }
          });
          reject(res);
          return;
        }

        if (res.statusCode === 401) {
          wx.clearStorageSync();
          wx.showToast({
            title: "登录已过期",
            icon: "none"
          });
          setTimeout(() => {
            wx.navigateTo({
              url: "/pages/login/login"
            });
          }, 1000);
          reject(res);
          return;
        }

        resolve(res.data);
      },
      fail: reject
    });
  });
};

const RequestApi = {
  get: (url, data) => request({ method: "GET", url, data }),
  post: (url, data) => request({ method: "POST", url, data }),
  baseURL: baseURL
};

export default RequestApi;