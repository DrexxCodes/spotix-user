// "use client"

// import { useState, useEffect } from "react"
// import Image from "next/image"
// import Link from "next/link"

// interface BlogPost {
//   id: string
//   title: string
//   excerpt: string
//   thumbnail: string
//   author: string
//   published: string
//   content: string
// }

// // Declare global callback function
// declare global {
//   interface Window {
//     loadBlogPostsCallback?: (data: any) => void
//   }
// }

// export default function BlogPage() {
//   const [posts, setPosts] = useState<BlogPost[]>([])
//   const [loading, setLoading] = useState(true)
//   const [menuOpen, setMenuOpen] = useState(false)

//   useEffect(() => {
//     loadBlogPosts()
//   }, [])

//   const loadBlogPosts = () => {
//     // Define callback function
//     window.loadBlogPostsCallback = (data: any) => {
//       try {
//         if (data.feed.entry) {
//           const formattedPosts = data.feed.entry.map((entry: any) => ({
//             id: entry.id.$t.split("-").pop(),
//             title: entry.title.$t,
//             excerpt: extractText(entry.content?.$t || "").substring(0, 150) + "...",
//             thumbnail: extractThumbnail(entry),
//             author: entry.author[0].name.$t,
//             published: new Date(entry.published.$t).toLocaleDateString("en-US", {
//               year: "numeric",
//               month: "short",
//               day: "numeric",
//             }),
//             content: entry.content?.$t || "",
//           }))

//           setPosts(formattedPosts)
//         }
//       } catch (error) {
//         console.error("Error processing blog posts:", error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     // Create and inject JSONP script
//     const script = document.createElement("script")
//     script.src =
//       "https://ifyssdv.blogspot.com/feeds/posts/default?alt=json-in-script&max-results=50&callback=loadBlogPostsCallback"
//     script.onerror = () => {
//       console.error("Failed to load blog posts")
//       setLoading(false)
//     }
//     document.body.appendChild(script)

//     // Cleanup
//     return () => {
//       document.body.removeChild(script)
//       delete window.loadBlogPostsCallback
//     }
//   }

//   const extractText = (html: string): string => {
//     if (typeof window === "undefined") return ""
//     const div = document.createElement("div")
//     div.innerHTML = html
//     return div.textContent || div.innerText || ""
//   }

//   const extractThumbnail = (entry: any): string => {
//     if (entry.media$thumbnail) return entry.media$thumbnail.url
//     if (entry.content && entry.content.$t) {
//       const match = entry.content.$t.match(/<img[^>]+src="([^">]+)"/)
//       if (match) return match[1]
//     }
//     return "/placeholder.svg"
//   }

//   const toggleMenu = () => {
//     setMenuOpen(!menuOpen)
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Navigation */}
//       <nav className="bg-white shadow-md sticky top-0 z-50">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             {/* Logo */}
//             <Link href="/blog" className="flex items-center space-x-2">
//               <span className="text-2xl font-bold text-[#6b2fa5]">Spotix Blog</span>
//             </Link>

//             {/* Desktop Navigation */}
//             <ul className="hidden md:flex space-x-8">
//               <li>
//                 <Link
//                   href="/blog"
//                   className="text-gray-900 hover:text-[#6b2fa5] font-medium transition-colors"
//                 >
//                   Home
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   href="#about"
//                   className="text-gray-900 hover:text-[#6b2fa5] font-medium transition-colors"
//                 >
//                   About
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   href="#categories"
//                   className="text-gray-900 hover:text-[#6b2fa5] font-medium transition-colors"
//                 >
//                   Categories
//                 </Link>
//               </li>
//             </ul>

//             {/* Contact Button */}
//             <Link
//               href="#contact"
//               className="hidden md:block bg-[#6b2fa5] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#5a2589] transition-colors"
//             >
//               Contact Us
//             </Link>

//             {/* Mobile Hamburger */}
//             <button
//               onClick={toggleMenu}
//               className="md:hidden flex flex-col space-y-1 focus:outline-none"
//             >
//               <span className="w-6 h-0.5 bg-gray-900 transition-all"></span>
//               <span className="w-6 h-0.5 bg-gray-900 transition-all"></span>
//               <span className="w-6 h-0.5 bg-gray-900 transition-all"></span>
//             </button>
//           </div>

//           {/* Mobile Menu */}
//           {menuOpen && (
//             <ul className="md:hidden pb-4 space-y-2">
//               <li>
//                 <Link
//                   href="/blog"
//                   className="block py-2 text-gray-900 hover:text-[#6b2fa5] font-medium"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   Home
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   href="#about"
//                   className="block py-2 text-gray-900 hover:text-[#6b2fa5] font-medium"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   About
//                 </Link>
//               </li>
//               <li>
//                 <Link
//                   href="#categories"
//                   className="block py-2 text-gray-900 hover:text-[#6b2fa5] font-medium"
//                   onClick={() => setMenuOpen(false)}
//                 >
//                   Categories
//                 </Link>
//               </li>
//             </ul>
//           )}
//         </div>
//       </nav>

//       {/* Hero Section */}
//       <div className="bg-gradient-to-r from-[#6b2fa5] to-[#8b5cf6] text-white text-center py-16 px-4">
//         <h1 className="text-4xl md:text-5xl font-bold mb-4">Spotix Blog</h1>
//         <p className="text-lg md:text-xl opacity-90">
//           Insights, stories, and updates from the Spotix team
//         </p>
//       </div>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//         {loading ? (
//           <div className="text-center py-16">
//             <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#6b2fa5] mb-4"></div>
//             <p className="text-gray-600 text-xl">Loading posts...</p>
//           </div>
//         ) : posts.length === 0 ? (
//           <div className="text-center py-16">
//             <p className="text-gray-600 text-xl">No posts found.</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//             {posts.map((post) => (
//               <Link
//                 key={post.id}
//                 href={`/blog/${post.id}`}
//                 className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
//               >
//                 <div className="relative h-48 w-full overflow-hidden">
//                   <Image
//                     src={post.thumbnail}
//                     alt={post.title}
//                     fill
//                     className="object-cover group-hover:scale-105 transition-transform duration-300"
//                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                     onError={(e) => {
//                       const target = e.target as HTMLImageElement
//                       target.src = "/placeholder.svg"
//                     }}
//                   />
//                 </div>
//                 <div className="p-6">
//                   <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#6b2fa5] transition-colors">
//                     {post.title}
//                   </h3>
//                   <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
//                   <div className="flex items-center justify-between text-sm text-gray-500">
//                     <span className="font-medium">By {post.author}</span>
//                     <span>{post.published}</span>
//                   </div>
//                 </div>
//               </Link>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white mt-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
//             {/* About */}
//             <div>
//               <h4 className="text-[#8b5cf6] font-semibold text-lg mb-4">About Spotix</h4>
//               <p className="text-gray-300 leading-relaxed">
//                 Your premier event ticketing platform. Discover, book, and experience amazing events
//                 with ease.
//               </p>
//             </div>

//             {/* Quick Links */}
//             <div>
//               <h4 className="text-[#8b5cf6] font-semibold text-lg mb-4">Quick Links</h4>
//               <ul className="space-y-2">
//                 <li>
//                   <Link href="/blog" className="text-gray-300 hover:text-[#8b5cf6] transition-colors">
//                     Home
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     href="#about"
//                     className="text-gray-300 hover:text-[#8b5cf6] transition-colors"
//                   >
//                     About
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     href="#categories"
//                     className="text-gray-300 hover:text-[#8b5cf6] transition-colors"
//                   >
//                     Categories
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     href="#contact"
//                     className="text-gray-300 hover:text-[#8b5cf6] transition-colors"
//                   >
//                     Contact
//                   </Link>
//                 </li>
//               </ul>
//             </div>

//             {/* Connect */}
//             <div>
//               <h4 className="text-[#8b5cf6] font-semibold text-lg mb-4">Connect With Us</h4>
//               <p className="text-gray-300 mb-4">
//                 Stay updated with the latest events and news.
//               </p>
//               <div className="flex space-x-4">
//                 <a
//                   href="#twitter"
//                   className="text-gray-300 hover:text-[#8b5cf6] transition-colors"
//                   aria-label="Twitter"
//                 >
//                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
//                   </svg>
//                 </a>
//                 <a
//                   href="#facebook"
//                   className="text-gray-300 hover:text-[#8b5cf6] transition-colors"
//                   aria-label="Facebook"
//                 >
//                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
//                   </svg>
//                 </a>
//                 <a
//                   href="#instagram"
//                   className="text-gray-300 hover:text-[#8b5cf6] transition-colors"
//                   aria-label="Instagram"
//                 >
//                   <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
//                     <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
//                   </svg>
//                 </a>
//               </div>
//             </div>
//           </div>

//           {/* Footer Bottom */}
//           <div className="border-t border-gray-700 pt-8 text-center">
//             <p className="text-gray-400">
//               &copy; {new Date().getFullYear()} Spotix Blog. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   )
// }