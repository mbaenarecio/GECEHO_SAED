export function Alert({ type='info', message, onClose }) {
  const c={success:'bg-green-50 text-green-800 border-green-200',error:'bg-red-50 text-red-800 border-red-200',info:'bg-blue-50 text-blue-800 border-blue-200'}
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border text-sm ${c[type]}`}>
      <span>{message}</span>
      {onClose && <button onClick={onClose} className="ml-4 font-bold">&times;</button>}
    </div>
  )
}