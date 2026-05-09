'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Filter } from 'lucide-react'

export default function CaptionsPage() {
  const [flavors, setFlavors] = useState<any[]>([])
  const [selectedFlavorId, setSelectedFlavorId] = useState('')
  const [captions, setCaptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const fetchFlavors = async () => {
      const { data } = await supabase.from('humor_flavors').select('id, slug')
      if (data) setFlavors(data)
    }
    fetchFlavors()
  }, [])

  const loadCaptions = async () => {
    if (!selectedFlavorId) return
    setLoading(true)
    const { data } = await supabase
      .from('captions')
      .select(`content, like_count, created_at, images ( url ), humor_flavors ( slug )`)
      .eq('humor_flavor_id', selectedFlavorId)
      .order('created_at', { ascending: false })
    if (data) setCaptions(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#080808] text-zinc-900 dark:text-zinc-100 font-mono transition-colors duration-200">

      {/* TOP BAR */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors text-xs font-black uppercase">
          <ArrowLeft size={14} /> Back_To_Builder
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] font-black text-green-600 dark:text-green-400 tracking-widest uppercase">Caption_Archive</span>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <div className="text-[9px] font-black tracking-[0.4em] text-pink-500 uppercase mb-2">// Output_Log</div>
          <h1 className="text-4xl font-black uppercase italic text-zinc-900 dark:text-white">
            Caption <span className="text-yellow-400">Archive</span>
          </h1>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-2 uppercase tracking-wide">
            Browse captions produced by each humor flavor pipeline
          </p>
        </div>

        {/* FILTER */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 border border-zinc-200 dark:border-zinc-800 mb-8 flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-[9px] font-black uppercase tracking-widest text-yellow-500 dark:text-yellow-400 mb-2">
              // Filter_by_Flavor
            </label>
            <select
              value={selectedFlavorId}
              onChange={(e) => setSelectedFlavorId(e.target.value)}
              className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 focus:border-yellow-400 p-2.5 text-xs uppercase outline-none text-zinc-900 dark:text-white font-mono transition-colors"
            >
              <option value="">Select a flavor...</option>
              {flavors.map(f => <option key={f.id} value={f.id}>{f.slug}</option>)}
            </select>
          </div>
          <button
            onClick={loadCaptions}
            disabled={!selectedFlavorId || loading}
            className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-black px-6 py-2.5 font-black text-xs uppercase transition-colors disabled:opacity-50"
          >
            <Filter size={13} />
            {loading ? 'Loading...' : 'Filter'}
          </button>
        </div>

        {/* TABLE */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-zinc-200 dark:border-zinc-800">
              <th className="py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Image</th>
              <th className="py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Caption</th>
              <th className="py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Flavor</th>
              <th className="py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right">Likes</th>
              <th className="py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 text-right">Date</th>
            </tr>
          </thead>
          <tbody>
            {captions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-16 text-center">
                  <div className="text-[9px] font-black tracking-widest text-pink-500 uppercase mb-2">// No_Data</div>
                  <p className="text-xs text-zinc-400 uppercase font-black">
                    {selectedFlavorId ? 'No captions found — run a test chain first' : 'Select a flavor and hit filter'}
                  </p>
                </td>
              </tr>
            ) : (
              captions.map((c, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-yellow-50 dark:hover:bg-yellow-400/5 transition-colors">
                  <td className="py-4">
                    {c.images?.url ? (
                      <img src={c.images.url} className="w-12 h-12 object-cover border border-zinc-200 dark:border-zinc-800" alt="caption image" />
                    ) : (
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[9px] text-zinc-400 uppercase font-black">
                        No_Img
                      </div>
                    )}
                  </td>
                  <td className="py-4 pr-8 text-sm text-zinc-700 dark:text-zinc-300 max-w-md">{c.content}</td>
                  <td className="py-4">
                    <span className="text-[10px] font-black uppercase text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-400/10 px-2 py-1">
                      {c.humor_flavors?.slug}
                    </span>
                  </td>
                  <td className="py-4 text-right font-mono text-xs text-zinc-400">{c.like_count || 0}</td>
                  <td className="py-4 text-right text-zinc-400 text-xs">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}