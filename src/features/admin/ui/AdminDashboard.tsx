'use client'

import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/shared/store'
import { setMonth, setSelectedPostId, setChannelOverride } from '@/features/admin/model/adminSlice'
import type { AdminPost } from '@/features/admin/types'
import { publishPost } from '@/features/admin/actions/publishPost'
import { AdminSidebar } from './AdminSidebar'
import { AdminTopbar } from './AdminTopbar'
import { AdminCalendar } from './AdminCalendar'
import { AdminAgenda } from './AdminAgenda'
import { CrossPostingPanel } from './CrossPostingPanel'
import { AdminArchive } from './AdminArchive'
import { AdminBottomNav } from './AdminBottomNav'
import { ArchiveView } from './ArchiveView'

export function AdminDashboard() {
  const dispatch = useDispatch<AppDispatch>()
  const { currentYear, currentMonth, selectedPostId, channelOverrides, currentView } = useSelector(
    (state: RootState) => state.admin
  )

  const [calendarPosts, setCalendarPosts] = useState<AdminPost[]>([])
  const [archivePosts, setArchivePosts] = useState<AdminPost[]>([])
  const [crossProviders, setCrossProviders] = useState<{ id: string; name: string; slug: string }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/admin/posts?year=${currentYear}&month=${currentMonth}`)
      .then(r => r.json())
      .then(data => {
        setCalendarPosts(data.calendarPosts ?? [])
        setArchivePosts(data.archivePosts ?? [])
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [currentYear, currentMonth])

  useEffect(() => {
    fetch('/api/admin/services?type=CROSS_POSTING')
      .then(r => r.json())
      .then(d => setCrossProviders(d.services ?? []))
      .catch(console.error)
  }, [])

  const selectedPost = calendarPosts.find(p => p.id === selectedPostId) ?? null
  const channels: Record<string, boolean> = channelOverrides[selectedPostId ?? ''] ?? {}

  async function handlePublish() {
    if (!selectedPostId) return
    setIsPublishing(true)
    // Build per-slug enabled map, defaulting to true for any provider not explicitly toggled
    const channelMap = Object.fromEntries(
      crossProviders.map(p => [p.slug, channels[p.slug] ?? true])
    )
    const result = await publishPost(selectedPostId, channelMap)
    if (result.success) {
      const data = await fetch(`/api/admin/posts?year=${currentYear}&month=${currentMonth}`).then(r => r.json())
      setCalendarPosts(data.calendarPosts ?? [])
      setArchivePosts(data.archivePosts ?? [])
    }
    setIsPublishing(false)
  }

  function handleSelectPost(id: string) {
    dispatch(setSelectedPostId(id === selectedPostId ? null : id))
  }

  function handleNavigate(year: number, month: number) {
    dispatch(setMonth({ year, month }))
    dispatch(setSelectedPostId(null))
  }

  function handleToggleChannel(channel: string, enabled: boolean) {
    if (!selectedPostId) return
    dispatch(setChannelOverride({ postId: selectedPostId, channel, enabled }))
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#0e0a0b', color: '#fff' }}>
      <AdminSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <AdminTopbar />

        {/* Desktop body */}
        <div className="hidden lg:flex flex-col flex-1 gap-5 overflow-auto">
          {currentView === 'overview' ? (
            <div style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 22, alignItems: 'start' }}>
                <AdminCalendar
                  posts={calendarPosts}
                  year={currentYear}
                  month={currentMonth}
                  selectedPostId={selectedPostId}
                  onSelectPost={handleSelectPost}
                  onNavigate={handleNavigate}
                  isLoading={isLoading}
                />
                <CrossPostingPanel
                  post={selectedPost}
                  providers={crossProviders}
                  channels={channels}
                  onToggle={handleToggleChannel}
                  onPublish={handlePublish}
                  isPublishing={isPublishing}
                />
              </div>
              <AdminArchive posts={archivePosts} />
            </div>
          ) : (
            <ArchiveView selectedPostId={selectedPostId} onSelectPost={handleSelectPost} />
          )}
        </div>

        {/* Mobile body */}
        <div className="flex lg:hidden flex-col gap-6 px-5 py-5" style={{ paddingBottom: 96 }}>
          <AdminCalendar
            posts={calendarPosts}
            year={currentYear}
            month={currentMonth}
            selectedPostId={selectedPostId}
            onSelectPost={handleSelectPost}
            onNavigate={handleNavigate}
            isLoading={isLoading}
          />
          <AdminAgenda
            posts={calendarPosts}
            selectedPostId={selectedPostId}
            onSelectPost={handleSelectPost}
          />
          <CrossPostingPanel
            post={selectedPost}
            providers={crossProviders}
            channels={channels}
            onToggle={handleToggleChannel}
            onPublish={handlePublish}
            isPublishing={isPublishing}
          />
          <AdminArchive posts={archivePosts} />
        </div>

        <AdminBottomNav />
      </div>
    </div>
  )
}
