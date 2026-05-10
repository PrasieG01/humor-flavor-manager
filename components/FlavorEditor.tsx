'use client'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  updateStep, deleteStep, reorderSteps, createStep, createFlavor, deleteFlavor,
  getImages, getFlavors, getStepsForFlavor, duplicateFlavor 
} from '@/app/actions/prompt-chains'
import { ArrowUp, ArrowDown, Trash2, Play, Plus, Image as ImageIcon, LogOut, Terminal, Copy } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle' // Ensure this path is correct!

export default function FlavorEditor() {
  // --- STATE ---
  const router = useRouter()
  const [images, setImages] = useState<any[]>([])
  const [imagePage, setImagePage] = useState(1)
  const [hasMoreImages, setHasMoreImages] = useState(false)
  const [isLoadingImages, setIsLoadingImages] = useState(false)
  
  const [flavors, setFlavors] = useState<any[]>([])
  const [steps, setSteps] = useState<any[]>([])
  
  const [selectedImage, setSelectedImage] = useState<any | null>(null)
  const [selectedFlavor, setSelectedFlavor] = useState<any | null>(null)
  const [newFlavorName, setNewFlavorName] = useState("")
  
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

 // --- DATA LOADING ---
  useEffect(() => {
    async function loadInitialData() {
      setIsLoadingImages(true)
      const imgRes = await getImages(1, 20)
      const fetchedFlavors = await getFlavors()
      
      setImages(imgRes.data)
      setHasMoreImages(imgRes.hasMore)
      setFlavors(fetchedFlavors)
      
      if (imgRes.data.length > 0) setSelectedImage(imgRes.data[0])
      setIsLoadingImages(false)
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    async function fetchMoreImages() {
      if (imagePage === 1) return 
      setIsLoadingImages(true)
      
      const imgRes = await getImages(imagePage, 20)
      setImages(imgRes.data)
      setHasMoreImages(imgRes.hasMore)
      
      setIsLoadingImages(false)
    }
    fetchMoreImages()
  }, [imagePage])

  useEffect(() => {
    async function loadSteps() {
      if (!selectedFlavor) {
        setSteps([])
        return
      }
      const fetchedSteps = await getStepsForFlavor(selectedFlavor.id)
      setSteps(fetchedSteps)
    }
    loadSteps()
  }, [selectedFlavor])

  // --- ACTIONS ---

  const handleLogout = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error("Logout Error:", error.message)
    } else {
      // Clear local state and send them back to the login page
      router.push('/login')
      router.refresh()
    }
  }

  const handleDuplicate = async (flavorId: string) => {
    // 1. Call the server action to clone everything in the DB
    const res = await duplicateFlavor(flavorId)
    
    if (res.success) {
      // 2. Refresh the list of flavors from the database
      const fetchedFlavors = await getFlavors()
      setFlavors(fetchedFlavors)
      
      // 3. Automatically select the newly created copy
      setSelectedFlavor(res.newFlavor)
    } else {
      alert("Failed to duplicate: " + res.error)
    }
  }
  const handleCreateFlavor = async () => {
    if (!newFlavorName.trim()) return
    const formData = new FormData()
    formData.append('slug', newFlavorName)
    await createFlavor(formData)
    setNewFlavorName("")
    const fetchedFlavors = await getFlavors()
    setFlavors(fetchedFlavors)
  }

  const move = async (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const pos = direction === 'up' ? index - 1 : index + 1
    if (pos < 0 || pos >= steps.length) return
    
    const [movedItem] = newSteps.splice(index, 1)
    newSteps.splice(pos, 0, movedItem)
    
    const formattedSteps = newSteps.map((s, i) => ({ ...s, order_by: i + 1 }))
    setSteps(formattedSteps)
    await reorderSteps(formattedSteps.map(s => s.id))
  }

  const runTest = async () => {
    if (!selectedImage || !selectedFlavor) return
    
    setIsTesting(true)
    setTestResult(`[SYSTEM] Authenticating session...`)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setTestResult("❌ ERROR: Not logged in"); return }

      const token = session.access_token
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

      setTestResult(prev => prev + `\n[SYSTEM] Auth OK.\n[SYSTEM] Generating captions...`)

      const captionRes = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
        method: 'POST', 
        headers, 
        body: JSON.stringify({ imageId: selectedImage.id, humorFlavorId: selectedFlavor.id })
      })
      
      const result = await captionRes.json()

      if (!Array.isArray(result)) {
        setTestResult(prev => prev + `\n❌ Unexpected response from API:\n${JSON.stringify(result, null, 2)}`)
        return
      }

      // --- ROBUST DATABASE INSERT ---
      setTestResult(prev => prev + `\n[SYSTEM] Saving ${result.length} captions to database...`)
      
      const captionsToInsert = result.map((c: any) => ({
        // Fallback to "No content generated" if c.content is missing/null
        content: c.content || "No content generated",
        
        humor_flavor_id: selectedFlavor.id,
        image_id: selectedImage.id,
        like_count: 0,
        
        // Map user ID to both potential profile columns
        created_by_user_id: session.user.id,
        profile_id: session.user.id, // ADD THIS to satisfy the new constraint
        
        // Default to true, or use a fallback if logic requires it
        is_public: true 
      }))

      const { error: dbError } = await supabase
        .from('captions')
        .insert(captionsToInsert)

      if (dbError) {
        setTestResult(prev => prev + `\n⚠️ DB Save Failed: ${dbError.message}`)
      } else {
        setTestResult(prev => prev + `\n✅ Database Sync Complete.`)
      }

      const formatted = result.map((c: any, i: number) => `${i + 1}. ${c.content}`).join('\n\n')
      setTestResult(prev => prev + `\n\n=== SUCCESS ===\n\n${formatted}`)

    } catch (err: any) {
      setTestResult(`❌ ERROR: ${err.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    // FULL SCREEN LAYOUT
    <div className="h-screen w-full bg-zinc-50 dark:bg-[#0a0a0a] text-zinc-900 dark:text-zinc-300 flex overflow-hidden font-sans selection:bg-blue-500/30 transition-colors duration-200">
      
      {/* ==========================================
          COLUMN 1: SIDEBAR (FLAVORS) 
          ========================================== */}
      <div className="w-[260px] flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f0f] flex-shrink-0 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <h1 className="text-sm font-black italic tracking-widest text-zinc-900 dark:text-white">CHAIN_BUILDER</h1>
          <ThemeToggle />
        </div>

        {/* View Captions Button */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link href="/captions" className="w-full py-2.5 px-4 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[10px] font-bold tracking-widest flex items-center justify-center gap-2 rounded transition-colors uppercase">
            <Terminal size={12} /> View_Captions
          </Link>
        </div>

        {/* Add New Flavor */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex gap-2">
          <input 
            value={newFlavorName}
            onChange={(e) => setNewFlavorName(e.target.value)}
            placeholder="NEW_FLAVOR"
            className="flex-1 bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2.5 text-[10px] tracking-wider outline-none focus:border-blue-500 w-full"
          />
          <button 
            onClick={handleCreateFlavor}
            className="bg-blue-600 hover:bg-blue-500 text-white w-10 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Flavor List (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {flavors.map(flavor => {
  const isActive = selectedFlavor?.id === flavor.id
  return (
    <div key={flavor.id} className="group relative">
      <button
        onClick={() => setSelectedFlavor(flavor)}
        className={`w-full text-left p-3 border text-[10px] font-bold tracking-widest transition-all truncate pr-10 ${
          isActive 
            ? 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-white' 
            : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
        }`}
      >
        {flavor.slug.toUpperCase()}
      </button>
      
      {/* DUPLICATE BUTTON */}
      {/* DUPLICATE BUTTON */}
      <button 
        onClick={(e) => {
          e.stopPropagation(); 
          handleDuplicate(flavor.id);
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-yellow-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        title="Duplicate Flavor"
      >
        <Copy size={14} />
      </button>
    </div>
  )
})}
        </div>

        {/* Footer */}
<div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black mt-auto">
  <button 
    onClick={handleLogout} // Add this
    className="w-full py-2 flex items-center justify-center gap-3 text-[10px] font-black tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-red-500 transition-colors"
  >
      <div className="h-5 w-5 rounded-full border border-zinc-300 dark:border-zinc-700 flex items-center justify-center text-[8px]">
        <LogOut size={10} />
      </div>
      LOGOUT
  </button>
</div>
      </div>

      {/* ==========================================
          COLUMN 2: TARGET IMAGE & RUN BUTTON
          ========================================== */}
      <div className="w-96 flex flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a] flex-shrink-0 transition-colors duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xs font-black tracking-widest text-blue-600 dark:text-yellow-500 flex items-center gap-2 uppercase">
            <ImageIcon size={14}/> 1. Select Target Image
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          {/* Image Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {images.map(img => (
              <button 
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className={`aspect-square relative overflow-hidden border-2 transition-all bg-zinc-200 dark:bg-zinc-900 ${
                  selectedImage?.id === img.id ? 'border-blue-600 dark:border-yellow-500' : 'border-transparent hover:border-zinc-400 dark:hover:border-zinc-700'
                }`}
              >
                <img src={img.url} alt="Target" className={`w-full h-full object-cover ${isLoadingImages ? 'opacity-50' : 'opacity-100'}`} />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/50 transition-opacity">
                  <span className="text-[10px] text-white tracking-widest">{img.url.includes('600x400') ? '600 × 400' : 'SELECT'}</span>
                </div>
              </button>
            ))}
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="flex justify-between items-center mb-8 border-t border-zinc-200 dark:border-zinc-800 pt-4">
            <button
              onClick={() => setImagePage(prev => Math.max(1, prev - 1))}
              disabled={imagePage === 1 || isLoadingImages}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 uppercase tracking-widest transition-colors"
            >
              ← Prev
            </button>
            
            <span className="text-[10px] font-black text-zinc-700 dark:text-zinc-500 tracking-widest">
              {isLoadingImages ? 'LOADING...' : `PAGE ${imagePage}`}
            </span>
            
            <button
              onClick={() => setImagePage(prev => prev + 1)}
              disabled={!hasMoreImages || isLoadingImages}
              className="text-[10px] font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white disabled:opacity-30 uppercase tracking-widest transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Description */}
          {selectedImage && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide">Description:</h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                {selectedImage.image_description || "No description available for this image in the database."}
              </p>
            </div>
          )}
        </div>

        {/* Run Button */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0f0f0f]">
          <button
            onClick={runTest}
            disabled={isTesting || !selectedFlavor || !selectedImage || steps.length === 0}
            className="w-full bg-blue-600 dark:bg-yellow-500 hover:bg-blue-500 dark:hover:bg-yellow-400 text-white dark:text-black py-4 font-black tracking-widest text-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Play size={16} fill="currentColor" /> 
            {isTesting ? 'EXECUTING...' : 'RUN CHAIN'}
          </button>
        </div>
      </div>

      {/* ==========================================
          COLUMN 3: STEP SEQUENCE & TERMINAL
          ========================================== */}
      <div className="flex-1 flex flex-col bg-zinc-50 dark:bg-[#0a0a0a] min-w-[400px] transition-colors duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-[#0a0a0a] z-10 relative shadow-sm dark:shadow-md">
          <h2 className="text-xs font-black tracking-widest text-blue-600 dark:text-yellow-500 uppercase">
            3. Edit Step Sequence
          </h2>
          {selectedFlavor && (
            <button onClick={() => { if (confirm("Delete flavor?")) { deleteFlavor(selectedFlavor.id); setSelectedFlavor(null); } }} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Scrollable Steps Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
          
          {/* Empty States */}
          {!selectedFlavor ? (
            <div className="h-full flex items-center justify-center">
              <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-600 uppercase w-full max-w-md">
                Select a flavor on the left to edit steps
              </div>
            </div>
          ) : steps.length === 0 ? (
            <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-600 uppercase">
              No Execution Steps Found
            </div>
          ) : null}

          {/* Step Cards */}
          {steps.map((step, i) => (
            <div key={step.id} className="bg-white dark:bg-[#0f0f0f] border border-zinc-200 dark:border-zinc-800 p-6 flex gap-6 group shadow-sm dark:shadow-none">
              
              {/* Reorder */}
              <div className="flex flex-col gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <button onClick={() => move(i, 'up')} disabled={i === 0} className="p-1 hover:text-blue-600 dark:hover:text-yellow-500 disabled:opacity-20"><ArrowUp size={16} /></button>
                <div className="h-8 w-8 flex items-center justify-center font-black border border-zinc-300 dark:border-zinc-700 rounded-full text-blue-600 dark:text-yellow-500 text-xs">
                  {step.order_by}
                </div>
                <button onClick={() => move(i, 'down')} disabled={i === steps.length - 1} className="p-1 hover:text-blue-600 dark:hover:text-yellow-500 disabled:opacity-20"><ArrowDown size={16} /></button>
              </div>

              {/* Editor */}
              <div className="flex-1 space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 block mb-2">Step Description</label>
                  <input
                    defaultValue={step.description}
                    onBlur={(e) => updateStep(step.id, { description: e.target.value })}
                    className="w-full bg-transparent border-b border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white font-bold tracking-wide outline-none pb-2 focus:border-blue-600 dark:focus:border-yellow-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 block mb-2">System Prompt (Context)</label>
                  <textarea
                    defaultValue={step.llm_system_prompt}
                    onBlur={(e) => updateStep(step.id, { llm_system_prompt: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 text-xs tracking-wide min-h-[80px] outline-none focus:border-blue-600 dark:focus:border-yellow-500 text-zinc-800 dark:text-zinc-300 custom-scrollbar resize-y transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 block mb-2">User Prompt</label>
                  <textarea
                    defaultValue={step.llm_user_prompt}
                    onBlur={(e) => updateStep(step.id, { llm_user_prompt: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 text-xs tracking-wide min-h-[80px] outline-none focus:border-blue-600 dark:focus:border-yellow-500 text-zinc-800 dark:text-zinc-300 custom-scrollbar resize-y transition-colors"
                  />
                </div>
              </div>

              {/* Delete */}
              <div>
                <button onClick={async () => { await deleteStep(step.id); setSteps(steps.filter(s => s.id !== step.id)); }} className="text-zinc-400 dark:text-zinc-600 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Step Button */}
          {selectedFlavor && (
            <button
              onClick={async () => {
                const res = await createStep(selectedFlavor.id, steps.length + 1)
                if (res.success) {
                  const refreshedSteps = await getStepsForFlavor(selectedFlavor.id)
                  setSteps(refreshedSteps)
                }
              }}
              className="w-full border-2 border-dashed border-zinc-300 dark:border-zinc-800 p-6 text-xs font-bold tracking-widest text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 transition-all flex items-center justify-center gap-2 uppercase"
            >
              <Plus size={16} /> Append Execution Step
            </button>
          )}

          {/* Terminal Output */}
          {testResult && (
            <div className="mt-8 bg-zinc-100 dark:bg-black border border-zinc-300 dark:border-zinc-800 p-6 rounded-md">
              <div className="flex items-center gap-3 mb-4 border-b border-zinc-300 dark:border-zinc-900 pb-4">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                <span className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest">Execution_Terminal</span>
                <button onClick={() => setTestResult(null)} className="ml-auto text-zinc-500 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white text-[10px] uppercase font-bold tracking-widest transition-colors">CLEAR LOG</button>
              </div>
              <pre className="text-xs text-green-700 dark:text-green-400/90 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed custom-scrollbar max-h-[400px]">
                {testResult}
              </pre>
            </div>
          )}
          
        </div>
      </div>

      {/* Global CSS for scrollbars to adapt to theme slightly */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a1a1aa; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />
    </div>
  )
}