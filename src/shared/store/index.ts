import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import adminReducer from '@/features/admin/model/adminSlice'

const adminPersistConfig = {
  key: 'admin',
  storage,
  whitelist: ['currentYear', 'currentMonth', 'selectedPostId'],
}

const persistedAdmin = persistReducer(adminPersistConfig, adminReducer)

export const store = configureStore({
  reducer: { admin: persistedAdmin },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
})

export const persistor = persistStore(store)
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
