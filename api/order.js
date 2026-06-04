import request from '../utils/request.js'

// ======================
// 订单相关接口
// ======================

// 获取我的订单列表（分页）
export const getMyOrderApi = (params) => 
  request.get('/order/my-orders',  params )

// 根据ID获取订单详情
export const getOrderDetailApi = (id) => 
  request.get('/order/orderDetail?id=' + id)

// 取消订单
export const cancelOrderApi = (id) => 
  request.post('/order/cancel?id=' + id)

// 立即支付
export const payOrderApi = (id) => 
  request.post('/order/pay?id=' + id)

// 申请退款
export const refundOrderApi = (id) => 
  request.post('/order/refund?id=' + id)

// 确认收货
export const confirmOrderApi = (id) => 
  request.post('/order/confirm?id=' + id)

// 卖家发货
export const sendGoodsApi = (id) => 
  request.post('/order/send?id=' + id)

// 删除订单
export const deleteOrderApi = (id) => 
  request.post('/order/delete?id=' + id)

export const createOrderApi = (params)=>request.post('/order/createOrder',params)


export const getUnresolvedOrdersCountApi = ()=>request.get('/order/getUnresolvedOrdersCount') 