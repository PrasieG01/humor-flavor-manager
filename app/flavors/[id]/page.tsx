'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { ArrowUp, ArrowDown, Trash2, Play } from 'lucide-react'
import TestFlavorEngine from '@/components/FlavorEditor'

export default function FlavorDetails({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [flavor, setFlavor] = useState<any>(null)
  const [steps, setSteps] = useState<any[]>([])
  const [newInstruction, setNewInstruction] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    fetchFlavorAndSteps()
  }, [])

  const fetchFlavorAndSteps = async () => {
    const { data: fData } = await supabase.from('humor_flavors').select('*').eq('id', params.id).single()
    const { data: sData } = await supabase.from('humor_flavor_steps').select('*').eq('flavor_id', params.id).order('sequence_number', { ascending: true })
    if (fData) setFlavor(fData)
    if (sData) setSteps(sData)
  }

  const addStep = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextSeq = steps.length > 0 ? steps[steps.length - 1].sequence_number + 1 : 1
    await supabase.from('humor_flavor_steps').insert([{ flavor_id: params.id, instruction: newInstruction, sequence_number: nextSeq }])
    setNewInstruction('')
    fetchFlavorAndSteps()
  }

  const deleteStep = async (id: string) => {
    await supabase.from('humor_flavor_steps').delete().eq('id', id)
    fetchFlavorAndSteps()
  }

  const moveStep = async (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) return

    const currentStep = steps[index]
    const swapStep = direction === 'up' ? steps[index - 1] : steps[index + 1]

    // Swap sequence numbers in DB
    await supabase.from('humor_flavor_steps').update({ sequence_number: swapStep.sequence_number }).eq('id', currentStep.id)
    await supabase.from('humor_flavor_steps').update({ sequence_number: currentStep.sequence_number }).eq('id', swapStep.id)
    fetchFlavorAndSteps()
  }

  if (!flavor) return <div>Loading...</div>

  return (
    <div className="space-y-8 relative">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-sm font-bold tracking-widest text-indigo-500 uppercase">Flavor Chain Builder</h2>
          <h1 className="text-4xl font-black">{flavor.name}</h1>
        </div>
        <button onClick={() => setIsTesting(!isTesting)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all">
          <Play fill="currentColor" size={18}/> {isTesting ? 'Close Tester' : 'Test Engine'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 p-6">
        <form onSubmit={addStep} className="flex gap-4 mb-8">
          <input 
            className="flex-1 p-4 rounded-xl border dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="e.g., Take the output from step 1 and make it sound like a pirate..." 
            value={newInstruction} 
            onChange={(e) => setNewInstruction(e.target.value)} 
          />
          <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-bold">Add Step</button>
        </form>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border dark:border-slate-700/50">
              <div className="flex flex-col gap-1">
                <button onClick={() => moveStep(index, 'up')} className="text-gray-400 hover:text-indigo-500 disabled:opacity-30" disabled={index === 0}><ArrowUp size={20}/></button>
                <button onClick={() => moveStep(index, 'down')} className="text-gray-400 hover:text-indigo-500 disabled:opacity-30" disabled={index === steps.length - 1}><ArrowDown size={20}/></button>
              </div>
              <div className="w-8 h-8 flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold rounded-full flex items-center justify-center">
                {index + 1}
              </div>
              <div className="flex-1 font-medium">{step.instruction}</div>
              <button onClick={() => deleteStep(step.id)} className="text-red-500 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={20}/></button>
            </div>
          ))}
          {steps.length === 0 && <p className="text-center text-gray-500 py-10">No steps added yet. Build your prompt chain above!</p>}
        </div>
      </div>
    </div>
  )
}