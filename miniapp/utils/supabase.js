const SUPABASE_URL = 'https://ialmdeggizzddhkcqsfl.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_qWVUFWRCPF4g7NeusbKyyg_bQlJLQr9'

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${SUPABASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data,
      header: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        ...(options.header || {})
      },
      success: (res) => resolve(res.data),
      fail: reject
    })
  })
}

module.exports = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  request
}
