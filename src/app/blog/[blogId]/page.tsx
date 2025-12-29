// import BlogPostClient from "./BlogPostClient"

// export async function generateMetadata({ params }: { params: Promise<{ blogId: string }> }) {
//   const { blogId } = await params
  
//   // Fetch the blog post using the same JSON-in-script method
//   try {
//     const response = await fetch(
//       `https://ifyssdv.blogspot.com/feeds/posts/default?alt=json&max-results=50`,
//       { next: { revalidate: 3600 } } // Cache for 1 hour
//     )
    
//     if (!response.ok) {
//       throw new Error('Failed to fetch blog posts')
//     }
    
//     const data = await response.json()
    
//     if (data.feed?.entry) {
//       const post = data.feed.entry.find((entry: any) => 
//         entry.id.$t.split("-").pop() === blogId
//       )
      
//       if (post) {
//         const title = post.title.$t
//         const content = post.content?.$t || post.summary?.$t || ""
//         const description = content.replace(/<[^>]*>/g, '').substring(0, 160) || "Read our latest blog posts on Spotix"
        
//         // Extract thumbnail
//         let thumbnail = "/placeholder.svg"
//         if (post.media$thumbnail) {
//           thumbnail = post.media$thumbnail.url
//         } else if (content) {
//           const match = content.match(/<img[^>]+src="([^">]+)"/)
//           if (match) thumbnail = match[1]
//         }
        
//         return {
//           title: `${title} - Spotix Blog`,
//           description,
//           openGraph: {
//             title,
//             description,
//             images: [thumbnail],
//           },
//           twitter: {
//             card: "summary_large_image",
//             title,
//             description,
//             images: [thumbnail],
//           },
//         }
//       }
//     }
//   } catch (error) {
//     console.error('Error fetching blog post for metadata:', error)
//   }
  
//   // Fallback metadata
//   return {
//     title: "Blog Post - Spotix Blog",
//     description: "Read our latest blog posts on Spotix",
//     openGraph: {
//       title: "Blog Post - Spotix Blog",
//       description: "Read our latest blog posts on Spotix",
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: "Blog Post - Spotix Blog",
//       description: "Read our latest blog posts on Spotix",
//     },
//   }
// }

// export default async function BlogPostPage({ params }: { params: Promise<{ blogId: string }> }) {
//   const { blogId } = await params
//   return <BlogPostClient blogId={blogId} />
// }