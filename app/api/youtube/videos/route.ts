import { NextResponse } from 'next/server'

const CHANNEL_ID = 'UCLA_DiR1FfKNvjuUpBHmylQ' // NASA
const MAX_RESULTS = 10

export async function GET() {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY!
    if (!API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing API key' },
        { status: 500 }
      )
    }

    // 1️⃣ Get uploads playlist ID
    const channelRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}&key=${API_KEY}`
    )
    const channelData = await channelRes.json()

    const uploadsPlaylistId =
      channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return NextResponse.json(
        { success: false, error: 'Uploads playlist not found' },
        { status: 404 }
      )
    }

    // 2️⃣ Get latest video IDs
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=${MAX_RESULTS}&key=${API_KEY}`
    )
    const playlistData = await playlistRes.json()

    const videoIds = playlistData.items.map(
      (item: any) => item.contentDetails.videoId
    )

    // 3️⃣ Get per-video statistics
    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(
        ','
      )}&key=${API_KEY}`
    )
    const videosData = await videosRes.json()

    const videos = videosData.items.map((video: any) => ({
      videoId: video.id,
      title: video.snippet.title,
      publishedAt: video.snippet.publishedAt,
      thumbnail: video.snippet.thumbnails.medium.url,
      views: Number(video.statistics.viewCount),
      likes: Number(video.statistics.likeCount ?? 0),
      comments: Number(video.statistics.commentCount ?? 0),
    }))

    return NextResponse.json({
      success: true,
      count: videos.length,
      videos,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
