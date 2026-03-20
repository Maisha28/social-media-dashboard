import { NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'

console.log('🔥 YOUTUBE SYNC ROUTE LOADED')

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const CHANNEL_ID = 'UCLA_DiR1FfKNvjuUpBHmylQ' // NASA

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST() {
  try {
    // 🔐 ENV CHECKS
    if (!YOUTUBE_API_KEY) {
      throw new Error('Missing YOUTUBE_API_KEY')
    }

    console.log('🚀 Sync started')
    console.log('📺 Channel:', CHANNEL_ID)

    // 1️⃣ FETCH LATEST VIDEOS
    const searchRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/search',
      {
        params: {
          part: 'snippet',
          channelId: CHANNEL_ID,
          maxResults: 10,
          order: 'date',
          type: 'video',
          key: YOUTUBE_API_KEY,
        },
      }
    )

    const videos = searchRes.data.items
    if (!videos || videos.length === 0) {
      throw new Error('No videos found')
    }

    const videoIds = videos
      .map((v: any) => v.id.videoId)
      .join(',')

    console.log('🎬 Video IDs:', videoIds)

    // 2️⃣ FETCH VIDEO STATISTICS
    const statsRes = await axios.get(
      'https://www.googleapis.com/youtube/v3/videos',
      {
        params: {
          part: 'statistics,snippet',
          id: videoIds,
          key: YOUTUBE_API_KEY,
        },
      }
    )

    const stats = statsRes.data.items
    if (!stats || stats.length === 0) {
      throw new Error('No statistics found')
    }

    // 3️⃣ PREPARE ROWS
    const rows = stats.map((video: any) => ({
      video_id: video.id,
      title: video.snippet.title,
      views: Number(video.statistics.viewCount || 0),
      likes: Number(video.statistics.likeCount || 0),
      comments: Number(video.statistics.commentCount || 0),
    }))

    console.log('🧾 Rows prepared:', rows.length)

    // 4️⃣ TEST SUPABASE CONNECTION
    const test = await supabase
      .from('youtube_video_stats')
      .select('*')
      .limit(1)

    console.log('🧪 Supabase test:', test)

    if (test.error) {
      throw test.error
    }

    // 5️⃣ INSERT DATA
    const { error } = await supabase
      .from('youtube_video_stats')
      .insert(rows)

    if (error) {
      throw error
    }

    console.log(`✅ Inserted ${rows.length} videos`)

    return NextResponse.json({
      success: true,
      inserted: rows.length,
    })
  } catch (err: any) {
    console.error('❌ SYNC ERROR:', err)
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
