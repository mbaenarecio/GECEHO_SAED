export function Button({ children, onClick, variant='primary', disabled, type='button', className='' }) {
  const base='inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'
  const v={primary:'bg-blue-600 text-white hover:bg-blue-700',secondary:'bg-gray-100 text-gray-700 hover:bg-gray-200',danger:'bg-red-600 text-white hover:bg-red-700',outline:'border border-gray-300 text-gray-700 hover:bg-gray-50'}
  return <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v[variant]} ${className}`}>{children}</button>
}