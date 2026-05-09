import { signInWithGoogle } from './actions'
import { GitMerge, AlertCircle, Key } from 'lucide-react'

export default async function LoginPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ message?: string }> 
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col items-center justify-center font-mono text-zinc-900 dark:text-zinc-300 p-4">
      
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 p-8 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600/10 p-4 rounded-full mb-4">
            <GitMerge className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Chain_Builder</h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 text-center">
            Restricted_Access <br/> Matrix_Admin_Clearance_Required
          </p>
        </div>

        {params.message && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-600 p-3 mb-6 flex items-center gap-2 text-xs font-bold uppercase">
            <AlertCircle size={14} />
            {params.message.replace(/_/g, ' ')}
          </div>
        )}

        <form action={signInWithGoogle} className="space-y-4">
          <button className="w-full flex items-center justify-center gap-3 bg-white dark:bg-black text-black dark:text-white border-2 border-zinc-300 dark:border-zinc-800 font-black uppercase p-4 text-xs hover:border-blue-500 hover:text-blue-500 transition-colors">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Authorize_With_Google
          </button>
        </form>
      </div>

    </div>
  )
}