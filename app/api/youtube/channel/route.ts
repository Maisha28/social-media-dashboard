import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const API_KEY = process.env.YOUTUBE_API_KEY!

    const CHANNEL_ID = 'UCLA_DiR1FfKNvjuUpBHmylQ' // NASA (official)

    const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.error) {
      return NextResponse.json(
        { success: false, error: data.error },
        { status: 500 }
      )
    }

    if (!data.items || data.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No channel data returned' },
        { status: 404 }
      )
    }

    const channel = data.items[0]

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscribers: Number(channel.statistics.subscriberCount),
        views: Number(channel.statistics.viewCount),
        videos: Number(channel.statistics.videoCount),
        publishedAt: channel.snippet.publishedAt,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
