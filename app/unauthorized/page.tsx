import { logout } from '@/app/login/actions'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] flex flex-col items-center justify-center font-mono text-zinc-900 dark:text-zinc-300 p-4">
      <div className="text-center space-y-6 max-w-md border border-red-900/50 bg-red-950/10 p-8">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4" />
        <h1 className="text-2xl font-black uppercase text-red-600">Access_Denied</h1>
        <p className="text-xs text-zinc-500 uppercase leading-relaxed">
          Your credentials are valid, but your profile lacks required clearance levels. 
          <br/><br/>
          Required: <span className="text-zinc-300">is_superadmin</span> OR <span className="text-zinc-300">is_matrix_admin</span>.
        </p>
        
        <form action={logout}>
          <button className="border border-zinc-700 px-6 py-2 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-colors mt-4">
            Terminate_Session
          </button>
        </form>
      </div>
    </div>
  )
}