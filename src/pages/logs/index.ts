// logs.ts
// const util = require('../../utils/util.js')
import { formatTime } from '../../utils/util'

Page({
  data: {
    logs: [],
  },
  onLoad() {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map((log: string) => {
        console.log(log)
        return {
          date: formatTime(new Date(log)),
          timeStamp: log
        }
      }),
    })
  },
})
