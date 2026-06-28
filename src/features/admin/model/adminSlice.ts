import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AdminState {
  currentYear: number
  currentMonth: number
  selectedPostId: string | null
  channelOverrides: Record<string, { vk?: boolean; tg?: boolean }>
  currentView: 'overview' | 'archive'
}

const now = new Date()

const initialState: AdminState = {
  currentYear: now.getFullYear(),
  currentMonth: now.getMonth() + 1,
  selectedPostId: null,
  channelOverrides: {},
  currentView: 'overview' as const,
}

export const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setMonth(state, action: PayloadAction<{ year: number; month: number }>) {
      state.currentYear = action.payload.year
      state.currentMonth = action.payload.month
    },
    setSelectedPostId(state, action: PayloadAction<string | null>) {
      state.selectedPostId = action.payload
    },
    setChannelOverride(state, action: PayloadAction<{ postId: string; channel: 'vk' | 'tg'; enabled: boolean }>) {
      const { postId, channel, enabled } = action.payload
      if (!state.channelOverrides[postId]) state.channelOverrides[postId] = {}
      state.channelOverrides[postId][channel] = enabled
    },
    setCurrentView(state, action: PayloadAction<'overview' | 'archive'>) {
      state.currentView = action.payload
    },
  },
})

export const { setMonth, setSelectedPostId, setChannelOverride, setCurrentView } = adminSlice.actions
export default adminSlice.reducer
