'use client'

import Image from 'next/image'

export default function ProfileImagePage() {
  const handleDownload = async () => {
    const response = await fetch('/instagram-profile.jpg')
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'readmap-instagram-profile.jpg'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-white text-2xl font-bold mb-8">ReadMap Instagram Profile Image</h1>
      <div className="bg-gray-800 p-4 rounded-xl shadow-xl">
        <Image
          src="/instagram-profile.jpg"
          alt="ReadMap Instagram Profile"
          width={400}
          height={400}
          className="rounded-lg"
        />
      </div>
      <button
        onClick={handleDownload}
        className="mt-8 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors"
      >
        Download Image
      </button>
    </div>
  )
}
