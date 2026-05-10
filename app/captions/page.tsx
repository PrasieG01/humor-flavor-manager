'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Filter, RefreshCw } from 'lucide-react'

export default function CaptionsPage() {
  const [flavors, setFlavors] = useState<any[]>([])
  const [selectedFlavorId, setSelectedFlavorId] = useState('ALL')
  const [captions, setCaptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch flavors for the dropdown
      const { data: fData } = await supabase.from('humor_flavors').select('id, slug')
      if (fData) setFlavors(fData)
      
      // Auto-load ALL captions immediately
      await loadCaptions('ALL')
    }
    fetchInitialData()
  }, [])

  // 2. Fetch Captions Logic
  const loadCaptions = async (flavorId: string) => {
    setLoading(true)
    
    // Updated with your actual column names
    let query = supabase
      .from('captions')
      .select(`
        id, 
        content, 
        like_count, 
        created_datetime_utc, 
        images ( url ), 
        humor_flavors ( slug )
      `)
      .order('created_datetime_utc', { ascending: false })
      .limit(100)

    if (flavorId !== 'ALL') {
      query = query.eq('humor_flavor_id', flavorId)
    }

    const { data, error } = await query
    
    if (error) {
      console.error("Supabase Error:", error)
    } else if (data) {
      setCaptions(data)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-100 font-sans transition-colors duration-200 pb-24">

      {/* TOP BAR */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-8 py-4 flex items-center gap-4 bg-zinc-50 dark:bg-[#0f0f0f]">
        <Link href="/" className="flex items-center gap-2 text-zinc-500 hover:text-blue-600 dark:hover:text-yellow-400 transition-colors text-xs font-black uppercase tracking-widest">
          <ArrowLeft size={14} /> Back_To_Builder
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`} />
          <span className={`text-[9px] font-black tracking-widest uppercase ${loading ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
            {loading ? 'Fetching_Data...' : 'Caption_Archive_Live'}
          </span>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <div className="text-[9px] font-black tracking-[0.4em] text-blue-500 dark:text-yellow-500 uppercase mb-2">// Output_Log</div>
          <h1 className="text-4xl font-black uppercase italic text-zinc-900 dark:text-white tracking-tight">
            Caption Archive
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-2 uppercase tracking-wide font-bold">
            Browse generations produced by your humor pipelines
          </p>
        </div>

        {/* FILTER BAR */}
        <div className="bg-zinc-50 dark:bg-[#0f0f0f] p-6 border border-zinc-200 dark:border-zinc-800 mb-8 flex items-end gap-4 rounded-lg shadow-sm">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
              Filter by Flavor
            </label>
            <select
              value={selectedFlavorId}
              onChange={(e) => setSelectedFlavorId(e.target.value)}
              className="w-full bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 focus:border-blue-500 dark:focus:border-yellow-500 p-3 text-xs uppercase outline-none text-zinc-900 dark:text-white font-bold tracking-wide transition-colors rounded-md"
            >
              <option value="ALL">-- Show All Flavors --</option>
              {flavors.map(f => <option key={f.id} value={f.id}>{f.slug}</option>)}
            </select>
          </div>
          <button
            onClick={() => loadCaptions(selectedFlavorId)}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 dark:bg-yellow-500 hover:bg-blue-500 dark:hover:bg-yellow-400 text-white dark:text-black px-6 py-3 font-black text-xs uppercase transition-colors disabled:opacity-50 rounded-md tracking-widest"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Filter size={14} />}
            {loading ? 'Loading...' : 'Apply Filter'}
          </button>
        </div>

        {/* TABLE */}
        <div className="bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-600">Image</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-600">Caption Content</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-600">Flavor Used</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-600 text-right">Date Generated</th>
              </tr>
            </thead>
            <tbody>
  {loading && captions.length === 0 ? (
    <tr>
      <td colSpan={4} className="py-24 text-center">
        <p className="text-xs text-zinc-400 uppercase font-black tracking-widest">Loading Database...</p>
      </td>
    </tr>
  ) : captions.length === 0 ? (
    <tr>
      <td colSpan={4} className="py-24 text-center">
        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wide">No data found</p>
      </td>
    </tr>
  ) : (
    /* THIS BRACE BELOW IS THE ONE YOU NEEDED */
    captions.map((c, i) => {
      const imageUrl = Array.isArray(c.images) ? c.images[0]?.url : c.images?.url;
      const flavorSlug = Array.isArray(c.humor_flavors) ? c.humor_flavors[0]?.slug : c.humor_flavors?.slug || 'ORIGINAL';
      const rawDate = c.created_datetime_utc || c.created_at;
      const formattedDate = rawDate && !isNaN(Date.parse(rawDate)) ? new Date(rawDate).toLocaleDateString() : "Pending...";

      return (
        <tr key={c.id || i} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
          <td className="px-6 py-4">
            {imageUrl ? (
              <img src={imageUrl} className="w-12 h-12 object-cover rounded border border-zinc-200 dark:border-zinc-800" alt="target" />
            ) : (
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-[8px] text-zinc-400 font-black rounded uppercase">No_Img</div>
            )}
          </td>

          <td className="px-6 py-4 max-w-sm">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {c.content || c.image_description || "Empty Caption"}
            </p>
            <div className="text-[10px] text-zinc-400 mt-1 font-bold flex items-center gap-1">
              <span className="text-pink-500">◆</span> LIKES: {c.like_count || c.vote_count || 0}
            </div>
          </td>

          <td className="px-6 py-4">
            <span className="inline-block text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-yellow-500 bg-blue-50 dark:bg-yellow-500/10 px-2.5 py-1 rounded border border-blue-100 dark:border-yellow-500/20 whitespace-nowrap">
              {flavorSlug}
            </span>
          </td>

          <td className="px-6 py-4 text-right text-xs font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
            {formattedDate}
          </td>
        </tr>
      );
    }) /* END OF MAP */
  )} 
</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}