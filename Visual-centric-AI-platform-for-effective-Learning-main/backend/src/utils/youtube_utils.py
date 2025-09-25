import os
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import logging

logger = logging.getLogger(__name__)

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

def search_youtube_videos(query, max_results=4):
    if not YOUTUBE_API_KEY:
        logger.error("YOUTUBE_API_KEY not found in environment variables.")
        return {"error": "YouTube API key is not configured."}

    try:
        youtube = build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=YOUTUBE_API_KEY)

        search_response = youtube.search().list(
            q=query,
            part="snippet",
            type="video",
            maxResults=max_results,
            videoEmbeddable="true" # Optional: only search for embeddable videos
        ).execute()

        videos = []
        for search_result in search_response.get("items", []):
            if search_result["id"]["kind"] == "youtube#video":
                video_id = search_result["id"]["videoId"]
                videos.append({
                    "title": search_result["snippet"]["title"],
                    "videoId": video_id,
                    "thumbnail": search_result["snippet"]["thumbnails"]["default"]["url"],
                    "url": f"https://www.youtube.com/watch?v={video_id}"
                })
        
        logger.info(f"Found {len(videos)} YouTube videos for query: {query}")
        return {"videos": videos}

    except HttpError as e:
        logger.error(f"An HTTP error {e.resp.status} occurred:\n{e.content}")
        return {"error": f"YouTube API HTTP error: {e.resp.status} - {e._get_reason()}"}
    except Exception as e:
        logger.error(f"An unexpected error occurred while searching YouTube: {e}", exc_info=True)
        return {"error": f"An unexpected error occurred: {str(e)}"}

if __name__ == '__main__':
    # Example usage:
    # Ensure YOUTUBE_API_KEY is set in your environment or .env file
    from dotenv import load_dotenv
    load_dotenv()
    YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY") # Reload after dotenv
    
    if not YOUTUBE_API_KEY:
        print("Please set the YOUTUBE_API_KEY environment variable.")
    else:
        test_query = "Python programming tutorials for beginners"
        results = search_youtube_videos(test_query, max_results=2)
        if results.get("error"):
            print(f"Error: {results.get('error')}")
        else:
            print(f"Videos found for '{test_query}':")
            for video in results.get("videos", []):
                print(f"  Title: {video['title']}")
                print(f"  URL: {video['url']}")
                print(f"  Thumbnail: {video['thumbnail']}")
                print("---")
