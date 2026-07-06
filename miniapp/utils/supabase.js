const SUPABASE_URL = 'https://ialmdeggizzddhkcqsfl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_qWVUFWRCPF4g7NeusbKyyg_bQlJLQr9'

function request(path, options = {}) {
  const token = options.token || wx.getStorageSync('sb_access_token') || SUPABASE_ANON_KEY
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${SUPABASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: options.prefer || 'return=representation',
        ...(options.header || {})
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(res.data?.message || res.data?.error_description || `请求失败 ${res.statusCode}`))
        }
      },
      fail: reject
    })
  })
}

function signIn(email, password) {
  return request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    data: { email, password }
  })
}

function signOut() {
  wx.removeStorageSync('sb_access_token')
  wx.removeStorageSync('sb_user')
}

function getPublicImageUrl(bucket, path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

function getProfile(userId) {
  return request(`/rest/v1/profiles?id=eq.${userId}&select=id,name`).then((rows) => rows?.[0] || null)
}

function getMyMembership(userId) {
  return request(`/rest/v1/couple_members?user_id=eq.${userId}&left_at=is.null&select=*`).then((rows) => rows?.[0] || null)
}

function getCouple(coupleId) {
  return request(`/rest/v1/couples?id=eq.${coupleId}&select=*`).then((rows) => rows?.[0] || null)
}

function getPartnerInfo(userId) {
  return request('/rest/v1/rpc/get_partner_info', {
    method: 'POST',
    data: { p_user_id: userId }
  }).then((rows) => rows?.[0] || null)
}

function getMoods() {
  return request('/rest/v1/moods?select=*&order=sort_order.asc')
}

function getDiaries(coupleId) {
  return request(`/rest/v1/diaries?couple_id=eq.${coupleId}&select=id,date&order=date.desc`)
}

function getEntries() {
  return request('/rest/v1/diary_entries?select=*,mood:mood_id(*)&status=eq.published&order=created_at.desc&limit=100')
}

function getEntryImages(entryIds) {
  if (!entryIds.length) return Promise.resolve([])
  return request(`/rest/v1/diary_entry_images?entry_id=in.(${entryIds.join(',')})&select=entry_id,image_id,images(bucket,path,width,height)`)
}

function createDiary(coupleId, date) {
  return request('/rest/v1/diaries', {
    method: 'POST',
    data: { couple_id: coupleId, date }
  }).then((rows) => rows?.[0] || null)
}

function findDiary(coupleId, date) {
  return request(`/rest/v1/diaries?couple_id=eq.${coupleId}&date=eq.${date}&select=id`).then((rows) => rows?.[0] || null)
}

function createEntry(payload) {
  return request('/rest/v1/diary_entries', {
    method: 'POST',
    data: payload
  }).then((rows) => rows?.[0] || null)
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  request,
  signIn,
  signOut,
  getPublicImageUrl,
  getProfile,
  getMyMembership,
  getCouple,
  getPartnerInfo,
  getMoods,
  getDiaries,
  getEntries,
  getEntryImages,
  findDiary,
  createDiary,
  createEntry
}
