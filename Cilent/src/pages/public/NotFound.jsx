import { useNavigate, useLocation } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

const NotFound = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const getHomeLink = () => {
    const path = location.pathname
    if (path.startsWith('/tenant')) return '/tenant/login'
    if (path.startsWith('/admin')) return '/admin/login'
    if (path.startsWith('/landlord')) return '/landlord/login'
    return '/'
  }

  const getHomeLabel = () => {
    const path = location.pathname
    if (path.startsWith('/tenant')) return 'Go to Tenant Login'
    if (path.startsWith('/admin')) return 'Go to Admin Login'
    if (path.startsWith('/landlord')) return 'Go to Landlord Login'
    return 'Go to Homepage'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg text-center">
        <div className="relative mb-6">
          <p className="text-[160px] font-black leading-none text-green-700/8 select-none absolute inset-0 flex items-center justify-center pointer-events-none">
            404
          </p>

          <div className="relative z-10 flex items-center justify-center pt-8">
            <div className="w-32 h-32 bg-white rounded-full shadow-xl border-4 border-green-100 flex items-center justify-center">
              <Search className="w-14 h-14 text-green-700 opacity-60" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 mt-4">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">P</span>
            </div>
            <span className="font-black text-green-800 text-lg tracking-tight">ProTech</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" />
            Error 404
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-3">Page Not Found</h1>

          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            The page you are looking for does not exist, has been moved, or the link you followed is incorrect.
          </p>

          <p className="text-xs text-slate-400 font-mono bg-slate-50 rounded-xl px-3 py-2 mb-6 break-all">
            {location.pathname}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>

            <button
              onClick={() => navigate(getHomeLink())}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-green-700 text-white font-bold text-sm rounded-xl hover:bg-green-800 active:scale-[0.98] transition-all shadow-sm shadow-green-900/20"
            >
              <Home className="w-4 h-4" />
              {getHomeLabel()}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 mb-3 font-medium">Or go directly to:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                { label: 'Landlord Login', path: '/landlord/login' },
                { label: 'Tenant Login', path: '/tenant/login' },
                { label: 'Register', path: '/landlord/register' },
              ].map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-all"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-5">ProTech Property Management Platform</p>
      </div>
    </div>
  )
}

export default NotFound
