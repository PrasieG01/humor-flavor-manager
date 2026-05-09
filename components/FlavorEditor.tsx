'use client'
import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { updateStep, deleteStep, reorderSteps, createStep, updateFlavor, deleteFlavor } from '@/app/actions/prompt-chains'
import { ArrowUp, ArrowDown, Trash2, Play, Plus } from 'lucide-react'

export default function FlavorEditor({ flavor, steps }: { flavor: any, steps: any[] }) {
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const move = async (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const pos = direction === 'up' ? index - 1 : index + 1
    if (pos < 0 || pos >= steps.length) return
    const [movedItem] = newSteps.splice(index, 1)
    newSteps.splice(pos, 0, movedItem)
    await reorderSteps(newSteps.map(s => s.id))
  }

  const runTest = async () => {
    setIsTesting(true)
    setTestResult("Step 1: Getting presigned URL...")

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setTestResult("❌ Not logged in"); return }

      const token = session.access_token
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

      const presignRes = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
        method: 'POST', headers, body: JSON.stringify({ contentType: 'image/jpeg' })
      })
      const { presignedUrl, cdnUrl } = await presignRes.json()
      setTestResult(`Step 1 ✅ cdnUrl: ${cdnUrl}\nStep 2: Uploading image...`)

      const imageBlob = await (await fetch('https://placehold.co/600x400.jpg')).blob()
      await fetch(presignedUrl, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: imageBlob })
      setTestResult(prev => prev + '\nStep 2 ✅\nStep 3: Registering image...')

      const registerRes = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
        method: 'POST', headers, body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false })
      })
      const { imageId } = await registerRes.json()
      setTestResult(prev => prev + `\nStep 3 ✅ imageId: ${imageId}\nStep 4: Generating captions...`)

      const captionRes = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
        method: 'POST', headers, body: JSON.stringify({ imageId, humorFlavorId: flavor.id })
      })
      const captions = await captionRes.json()
      const formatted = captions.map((c: any, i: number) => `${i + 1}. ${c.content}`).join('\n')
      setTestResult(prev => prev + `\nStep 4 ✅ — ${captions.length} captions generated\n\n${formatted}`)

    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto pb-24">

      {/* HEADER */}
      <header className="flex justify-between items-end border-b border-zinc-200 dark:border-zinc-800 pb-6">
        <div className="flex-1">
          <span className="text-[10px] font-black uppercase text-yellow-500 dark:text-yellow-400 tracking-widest block mb-1">Active_Chain_Editor</span>
          <input
            defaultValue={flavor.slug}
            onBlur={(e) => updateFlavor(flavor.id, e.target.value)}
            className="text-3xl font-black uppercase tracking-tight bg-transparent border-none outline-none focus:ring-2 ring-yellow-400 rounded px-1 w-full text-zinc-900 dark:text-white"
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => { if (confirm("Delete this flavor?")) deleteFlavor(flavor.id) }}
            className="text-zinc-400 hover:text-red-500 transition-colors p-2"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={runTest}
            disabled={isTesting || steps.length === 0}
            className="bg-green-500 hover:bg-green-400 text-black px-6 py-3 font-black uppercase text-xs flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Play size={14} /> {isTesting ? 'Executing...' : 'Run_Test_Chain'}
          </button>
        </div>
      </header>

      {/* STEPS */}
      <div className="space-y-4">
        {steps.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <p className="text-xs font-black uppercase text-zinc-400">No_Execution_Steps_Found</p>
          </div>
        )}

        {steps.map((step, i) => (
          <div key={step.id} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-6 flex gap-6 shadow-sm hover:border-yellow-400/50 dark:hover:border-yellow-400/50 transition-colors">

            {/* Reorder */}
            <div className="flex flex-col gap-2">
              <button onClick={() => move(i, 'up')} disabled={i === 0} className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-400/10 disabled:opacity-30 transition-colors">
                <ArrowUp size={16} />
              </button>
              <div className="h-10 w-10 flex items-center justify-center font-black border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-full text-yellow-500 dark:text-yellow-400">
                {step.order_by}
              </div>
              <button onClick={() => move(i, 'down')} disabled={i === steps.length - 1} className="p-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-400/10 disabled:opacity-30 transition-colors">
                <ArrowDown size={16} />
              </button>
            </div>

            {/* Inputs */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 block mb-1">Step_Description</label>
                <input
                  defaultValue={step.description}
                  onBlur={(e) => updateStep(step.id, { description: e.target.value })}
                  placeholder="e.g., Extract visual features from the image"
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-700 font-bold uppercase text-sm focus:border-yellow-400 outline-none pb-2 text-zinc-900 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 block mb-1">System_Prompt (LLM Context)</label>
                <textarea
                  defaultValue={step.llm_system_prompt}
                  onBlur={(e) => updateStep(step.id, { llm_system_prompt: e.target.value })}
                  placeholder="You are a funny assistant..."
                  className="w-full bg-zinc-50 dark:bg-black p-4 text-xs min-h-[100px] outline-none border border-zinc-200 dark:border-zinc-800 focus:border-yellow-400 font-mono text-zinc-900 dark:text-zinc-300 transition-colors"
                />
              </div>
            </div>

            {/* Delete */}
            <div>
              <button onClick={() => deleteStep(step.id)} className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 p-2 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD STEP */}
      <button
        onClick={() => createStep(flavor.id, steps.length + 1)}
        className="w-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-xs font-black uppercase hover:border-yellow-400 text-zinc-400 hover:text-yellow-500 dark:hover:text-yellow-400 transition-all flex items-center justify-center gap-2 bg-zinc-50 dark:bg-black/50"
      >
        <Plus size={16} /> Append_New_Execution_Step
      </button>

      {/* TERMINAL */}
      {testResult && (
        <div className="mt-12 bg-zinc-950 dark:bg-black p-6 border border-zinc-800 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">API_Response_Terminal</span>
            <button onClick={() => setTestResult(null)} className="ml-auto text-zinc-600 hover:text-zinc-400 text-[10px] uppercase font-black">
              [Clear]
            </button>
          </div>
          <pre className="text-[11px] text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{testResult}</pre>
        </div>
      )}
    </div>
  )
}