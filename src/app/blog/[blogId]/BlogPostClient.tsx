// "use client"

// import { useState, useEffect, useRef } from "react"
// import Image from "next/image"
// import Link from "next/link"
// import { User, Calendar, Tag, Facebook, Twitter, Copy, Share2 } from "lucide-react"
// import AutoScrollControls from "./helper/auto-scroll"

// interface BlogPostClientProps {
//   blogId: string
// }

// interface BlogPost {
//   id: string
//   title: string
//   content: string
//   author: string
//   published: string
//   thumbnail: string
//   categories: string[]
// }

// interface RelatedPost {
//   id: string
//   title: string
//   thumbnail: string
//   published: string
// }

// declare global {
//   interface Window {
//     loadPostCallback?: (data: any) => void
//   }
// }

// export default function BlogPostClient({ blogId }: BlogPostClientProps) {
//   const [post, setPost] = useState<BlogPost | null>(null)
//   const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
//   const [loading, setLoading] = useState(true)
//   const [isScrolling, setIsScrolling] = useState(false)
//   const [scrollSpeed, setScrollSpeed] = useState(50)
//   const [progress, setProgress] = useState(0)
//   const [copySuccess, setCopySuccess] = useState(false)
//   const [isSticky, setIsSticky] = useState(false)

//   const animationFrameRef = useRef<number | null>(null)
//   const controlsRef = useRef<HTMLDivElement>(null)
//   const lastTimestampRef = useRef<number>(0)

//   useEffect(() => {
//     if (blogId) {
//       loadPost()
//     }

//     return () => {
//       stopAutoScroll()
//       if (typeof window !== "undefined") {
//         window.removeEventListener("scroll", updateProgress)
//         window.removeEventListener("scroll", handleStickyControls)
//       }
//     }
//   }, [blogId])

//   useEffect(() => {
//     window.addEventListener("scroll", updateProgress)
//     window.addEventListener("scroll", handleStickyControls)
//     updateProgress()
//     handleStickyControls()

//     return () => {
//       window.removeEventListener("scroll", updateProgress)
//       window.removeEventListener("scroll", handleStickyControls)
//     }
//   }, [])

//   const handleStickyControls = () => {
//     if (controlsRef.current) {
//       const rect = controlsRef.current.getBoundingClientRect()
//       // 68px = 64px nav height + 4px progress bar
//       setIsSticky(rect.top <= 68)
//     }
//   }

//   const loadPost = () => {
//     window.loadPostCallback = (data: any) => {
//       try {
//         if (data.feed.entry) {
//           const allPosts = data.feed.entry
//           const currentPost = allPosts.find((entry: any) => entry.id.$t.split("-").pop() === blogId)

//           if (currentPost) {
//             const postData: BlogPost = {
//               id: currentPost.id.$t.split("-").pop(),
//               title: currentPost.title.$t,
//               content: currentPost.content?.$t || "",
//               author: currentPost.author[0].name.$t,
//               published: new Date(currentPost.published.$t).toLocaleDateString("en-US", {
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               }),
//               thumbnail: extractThumbnail(currentPost),
//               categories: currentPost.category ? currentPost.category.map((cat: any) => cat.term) : [],
//             }

//             setPost(postData)

//             const related = allPosts
//               .filter((entry: any) => {
//                 const postId = entry.id.$t.split("-").pop()
//                 if (postId === blogId) return false

//                 const postCategories = entry.category ? entry.category.map((cat: any) => cat.term) : []
//                 return postCategories.some((cat: string) => postData.categories.includes(cat))
//               })
//               .slice(0, 5)
//               .map((entry: any) => ({
//                 id: entry.id.$t.split("-").pop(),
//                 title: entry.title.$t,
//                 thumbnail: extractThumbnail(entry),
//                 published: new Date(entry.published.$t).toLocaleDateString("en-US", {
//                   month: "short",
//                   day: "numeric",
//                   year: "numeric",
//                 }),
//               }))

//             setRelatedPosts(related)
//           }
//         }
//       } catch (error) {
//         console.error("Error processing post:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     const script = document.createElement("script")
//     script.src = `https://ifyssdv.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=50&callback=loadPostCallback`
//     script.onerror = () => {
//       console.error("Failed to load post")
//       setLoading(false)
//     }
//     document.body.appendChild(script)

//     return () => {
//       if (document.body.contains(script)) {
//         document.body.removeChild(script)
//       }
//       delete window.loadPostCallback
//     }
//   }

//   const extractThumbnail = (entry: any): string => {
//     if (entry.media$thumbnail) return entry.media$thumbnail.url
//     if (entry.content && entry.content.$t) {
//       const match = entry.content.$t.match(/<img[^>]+src="([^">]+)"/)
//       if (match) return match[1]
//     }
//     return "/placeholder.svg"
//   }

//   const updateProgress = () => {
//     const windowHeight = window.innerHeight
//     const documentHeight = document.documentElement.scrollHeight - windowHeight
//     const scrolled = window.scrollY
//     const progress = (scrolled / documentHeight) * 100
//     setProgress(Math.min(progress, 100))
//   }

//   const toggleAutoScroll = () => {
//     if (isScrolling) {
//       stopAutoScroll()
//     } else {
//       startAutoScroll()
//     }
//   }

//   const startAutoScroll = () => {
//     setIsScrolling(true)
//     lastTimestampRef.current = performance.now()

//     const scroll = (timestamp: number) => {
//       const deltaTime = timestamp - lastTimestampRef.current
//       lastTimestampRef.current = timestamp

//       // Speed range: 10-100, convert to 20-400 pixels per second
//       const pixelsPerSecond = (scrollSpeed / 100) * 380 + 20
//       const scrollAmount = (pixelsPerSecond * deltaTime) / 1000

//       window.scrollBy({
//         top: scrollAmount,
//         behavior: "auto",
//       })

//       updateProgress()

//       // Check if reached bottom
//       if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
//         stopAutoScroll()
//         return
//       }

//       animationFrameRef.current = requestAnimationFrame(scroll)
//     }

//     animationFrameRef.current = requestAnimationFrame(scroll)
//   }

//   const stopAutoScroll = () => {
//     setIsScrolling(false)
//     if (animationFrameRef.current) {
//       cancelAnimationFrame(animationFrameRef.current)
//       animationFrameRef.current = null
//     }
//   }

//   const shareOnFacebook = () => {
//     const url = encodeURIComponent(window.location.href)
//     window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "width=600,height=400")
//   }

//   const shareOnTwitter = () => {
//     const url = encodeURIComponent(window.location.href)
//     const text = encodeURIComponent(post?.title || "")
//     window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, "_blank", "width=600,height=400")
//   }

//   const shareOnReddit = () => {
//     const url = encodeURIComponent(window.location.href)
//     const title = encodeURIComponent(post?.title || "")
//     window.open(`https://reddit.com/submit?url=${url}&title=${title}`, "_blank", "width=600,height=700")
//   }

//   const copyLink = () => {
//     navigator.clipboard.writeText(window.location.href).then(() => {
//       setCopySuccess(true)
//       setTimeout(() => setCopySuccess(false), 2000)
//     })
//   }

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <nav className="bg-white shadow-md sticky top-0 z-50">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex justify-between items-center h-16">
//               <Link href="/blog" className="flex items-center space-x-2">
//                 <span className="text-2xl font-bold text-[#6b2fa5]">Spotix Blog</span>
//               </Link>
//             </div>
//           </div>
//         </nav>

//         <div className="flex items-center justify-center min-h-[60vh]">
//           <div className="text-center">
//             <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b2fa5] mb-4"></div>
//             <p className="text-gray-600 text-xl">Loading post...</p>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   if (!post) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <nav className="bg-white shadow-md sticky top-0 z-50">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="flex justify-between items-center h-16">
//               <Link href="/blog" className="flex items-center space-x-2">
//                 <span className="text-2xl font-bold text-[#6b2fa5]">Spotix Blog</span>
//               </Link>
//               <Link href="/blog" className="text-gray-900 hover:text-[#6b2fa5] font-medium transition-colors">
//                 ← Back to All Posts
//               </Link>
//             </div>
//           </div>
//         </nav>

//         <div className="flex items-center justify-center min-h-[60vh]">
//           <div className="text-center">
//             <p className="text-gray-600 text-xl mb-4">Post not found</p>
//             <Link
//               href="/blog"
//               className="inline-block bg-[#6b2fa5] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#5a2589] transition-colors"
//             >
//               Return to Home
//             </Link>
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Progress Bar */}
//       <div
//         className="fixed top-0 left-0 h-1 bg-[#6b2fa5] z-[9999] transition-all duration-100"
//         style={{ width: `${progress}%` }}
//       />

//       {/* Navigation */}
//       <nav className="bg-white shadow-md sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <Link href="/blog" className="flex items-center space-x-2">
//               <span className="text-2xl font-bold text-[#6b2fa5]">Spotix Blog</span>
//             </Link>
//             <Link href="/blog" className="text-gray-900 hover:text-[#6b2fa5] font-medium transition-colors">
//               ← Back to All Posts
//             </Link>
//           </div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Post Content */}
//           <div className="lg:col-span-2">
//             <div className="bg-white rounded-xl shadow-md overflow-hidden">
//               {/* Post Header */}
//               <div className="p-6 sm:p-8">
//                 {/* Auto Scroll Controls - Sticky */}
//                 <div 
//                   ref={controlsRef}
//                   className={`transition-all duration-300 mb-6 ${
//                     isSticky 
//                       ? 'fixed top-[68px] left-0 right-0 z-40 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8' 
//                       : 'relative'
//                   }`}
//                 >
//                   <div className={`${
//                     isSticky 
//                       ? 'bg-white/95 backdrop-blur-sm shadow-lg border-b-2 border-[#6b2fa5]' 
//                       : 'bg-white border-2 border-[#6b2fa5]'
//                   } rounded-lg px-4 py-4 transition-all duration-300`}>
//                     <AutoScrollControls
//                       isScrolling={isScrolling}
//                       scrollSpeed={scrollSpeed}
//                       onToggle={toggleAutoScroll}
//                       onSpeedChange={setScrollSpeed}
//                     />
//                   </div>
//                 </div>

//                 <h1 className="text-3xl sm:text-4xl font-bold text-[#6b2fa5] mb-4">{post.title}</h1>
//                 <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
//                   <span className="flex items-center gap-2">
//                     <User size={18} />
//                     By {post.author}
//                   </span>
//                   <span className="flex items-center gap-2">
//                     <Calendar size={18} />
//                     {post.published}
//                   </span>
//                   {post.categories.length > 0 && (
//                     <span className="flex items-center gap-2">
//                       <Tag size={18} />
//                       {post.categories.join(", ")}
//                     </span>
//                   )}
//                 </div>

//                 <div
//                   className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-[#0f0b01] prose-a:text-[#6b2fa5] prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-md prose-li:text-[#0f0b01] prose-strong:text-[#0f0b01]"
//                   dangerouslySetInnerHTML={{ __html: post.content }}
//                 />

//                 {/* Share Section */}
//                 <div className="mt-12 pt-8 border-t border-gray-200">
//                   <h3 className="text-xl font-bold text-gray-900 mb-4">Share this post</h3>
//                   <div className="flex flex-wrap gap-3">
//                     <button
//                       onClick={shareOnFacebook}
//                       className="flex items-center gap-2 bg-[#1877f2] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#0d65d9] transition-colors"
//                     >
//                       <Facebook size={20} />
//                       Facebook
//                     </button>
//                     <button
//                       onClick={shareOnTwitter}
//                       className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
//                     >
//                       <Twitter size={20} />
//                       Twitter
//                     </button>
//                     <button
//                       onClick={shareOnReddit}
//                       className="flex items-center gap-2 bg-[#ff4500] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#e03d00] transition-colors"
//                     >
//                       <Share2 size={20} />
//                       Reddit
//                     </button>
//                     <button
//                       onClick={copyLink}
//                       className="flex items-center gap-2 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
//                     >
//                       <Copy size={20} />
//                       {copySuccess ? "Copied!" : "Copy Link"}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Sidebar - Related Posts */}
//           <div className="lg:col-span-1">
//             <div className="bg-white rounded-xl shadow-md p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-hidden flex flex-col">
//               <h3 className="text-xl font-bold text-gray-900 mb-4">
//                 {relatedPosts.length > 0 ? "Related Posts" : "Recent Posts"}
//               </h3>
//               {relatedPosts.length === 0 ? (
//                 <p className="text-gray-600">No related posts found</p>
//               ) : (
//                 <div className="overflow-y-auto space-y-4 pr-2 custom-scrollbar">
//                   {relatedPosts.map((relatedPost) => (
//                     <Link
//                       key={relatedPost.id}
//                       href={`/blog/${relatedPost.id}`}
//                       className="flex gap-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors"
//                     >
//                       <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
//                         <Image
//                           src={relatedPost.thumbnail || "/placeholder.svg"}
//                           alt={relatedPost.title}
//                           fill
//                           className="object-cover"
//                           sizes="80px"
//                         />
//                       </div>
//                       <div className="flex-1 min-w-0">
//                         <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#6b2fa5] line-clamp-2 transition-colors">
//                           {relatedPost.title}
//                         </h4>
//                         <p className="text-xs text-gray-600 mt-1">{relatedPost.published}</p>
//                       </div>
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white mt-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <div className="text-center">
//             <Link href="/blog" className="text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
//               ← Back to All Posts
//             </Link>
//             <p className="text-gray-400 mt-4">&copy; {new Date().getFullYear()} Spotix Blog. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>

//       <style jsx global>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 8px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 10px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #6b2fa5;
//           border-radius: 10px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: #5a2589;
//         }

//         /* Firefox scrollbar */
//         .custom-scrollbar {
//           scrollbar-width: thin;
//           scrollbar-color: #6b2fa5 #f1f1f1;
//         }
//       `}</style>
//     </div>
//   )
// }