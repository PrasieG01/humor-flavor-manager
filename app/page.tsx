import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, MessageSquare, Terminal, ArrowUpDown, Play, Database } from "lucide-react"
import FlavorEditor from "@/components/FlavorEditor" 
import { logout } from "@/app/login/actions"
import { createFlavor } from "@/app/actions/prompt-chains"
import ThemeToggle from "@/components/ThemeToggle"

export default async function Project3Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const supabase = await createClient()
  const params = await searchParams
  
  // 1. ADMIN GATE
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('is_superadmin, is_matrix_admin').eq('id', user?.id).single()
  if (!profile?.is_superadmin && !profile?.is_matrix_admin) redirect('/unauthorized')

  // 2. DATA FETCH
  const { data: flavors } = await supabase.from('humor_flavors').select('*').order('created_datetime_utc', { ascending: false })
  
  let selectedFlavor = null
  let steps = []
  if (params.id) {
    // Force both to be strings so they match regardless of DB type
    selectedFlavor = flavors?.find(f => String(f.id) === String(params.id)) 
    
    const { data: stepData } = await supabase.from('humor_flavor_steps')
      .select('*').eq('humor_flavor_id', params.id).order('order_by', { ascending: true })
    steps = stepData || []
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-mono">
      {/* SIDEBAR: FLAVORS */}
      <aside className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col z-10 bg-white dark:bg-[#050505]">
        
        {/* HEADER & THEME TOGGLE */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h1 className="text-xl font-black uppercase italic">Chain_Builder</h1>
          <ThemeToggle />
        </div>

        {/* CAPTIONS PAGE NAVIGATION */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <Link 
            href="/captions" 
            className="flex items-center justify-center gap-2 w-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold py-3 px-4 rounded border border-zinc-200 dark:border-zinc-800 text-xs uppercase transition-colors"
          >
            <MessageSquare size={16} />
            View_Captions_Page
          </Link>
        </div>

        {/* NEW: CREATE FLAVOR FORM */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#0a0a0a]">
          <form action={createFlavor} className="flex gap-2">
            <input 
              name="slug" 
              placeholder="NEW_FLAVOR_NAME" 
              required 
              className="flex-1 bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 p-2 text-xs uppercase outline-none focus:border-blue-500 transition-colors"
            />
            <button type="submit" className="bg-blue-600 text-white px-3 flex items-center justify-center hover:bg-blue-700 transition-colors" title="Initialize new humor sequence">
              <Plus size={16} />
            </button>
          </form>
        </div>

        {/* FLAVOR LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {flavors?.map(f => (
            <Link key={f.id} href={`/?id=${f.id}`} className={`block p-4 border transition-all ${params.id === f.id ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-200 dark:border-zinc-900 hover:border-zinc-500'}`}>
              <span className="text-xs font-bold uppercase">{f.slug}</span>
            </Link>
          ))}
        </div>

        {/* LOGOUT BUTTON */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
          <form action={logout}>
            <button className="w-full border border-zinc-300 dark:border-zinc-800 p-3 text-[10px] font-black uppercase hover:bg-red-500/10 hover:text-red-500 hover:border-red-500 transition-colors">
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN: STEPS & TESTING OR ONBOARDING GUIDE */}
      <main className="flex-1 overflow-y-auto">
        {selectedFlavor ? (
          <FlavorEditor flavor={selectedFlavor} steps={steps} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-zinc-800 dark:text-zinc-300">
            
            <div className="max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-[#0a0a0a] p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <Terminal className="text-blue-500" size={24} />
                <h2 className="text-xl font-black uppercase tracking-widest">System_Manual: v1.0</h2>
              </div>
              
              <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
                Welcome to the Chain Builder. Your objective is to program the AI to simulate human comedy. 
                Select a flavor from the left panel, or follow these operating procedures to create a new one:
              </p>

              <div className="space-y-6">
                
                {/* Rule 1 */}
                <div className="flex gap-4">
                  <div className="mt-1 bg-zinc-200 dark:bg-zinc-800 p-2 rounded h-min">
                    <Database size={18} className="text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide mb-1">1. Define the Flavor</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Use the sidebar to create a "Humor Flavor" (e.g., <code>CORPORATE_ROAST</code> or <code>DAD_JOKE_MODE</code>). This acts as the container for your prompt instructions.
                    </p>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="flex gap-4">
                  <div className="mt-1 bg-zinc-200 dark:bg-zinc-800 p-2 rounded h-min">
                    <ArrowUpDown size={18} className="text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide mb-1">2. Build the Execution Steps</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Add steps to guide the AI's logic. <strong className="dark:text-white">Use the Up (▲) and Down (▼) arrows</strong> on each step to reorder them. The AI reads these top-to-bottom. Order is critical for synthesizing comedy.
                    </p>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="flex gap-4">
                  <div className="mt-1 bg-zinc-200 dark:bg-zinc-800 p-2 rounded h-min">
                    <Play size={18} className="text-green-600 dark:text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm uppercase tracking-wide mb-1">3. Run the Pipeline</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      Click the green <strong className="text-green-600 dark:text-green-500">RUN_TEST_CHAIN</strong> button at the bottom of the editor to fire your prompts at the target image. The results will print to the API terminal.
                    </p>
                  </div>
                </div>

              </div>

              <div className="mt-10 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-center">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest animate-pulse">
                  Awaiting_Operator_Input...
                </span>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}