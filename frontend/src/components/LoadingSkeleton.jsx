const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="h-12 bg-slate-100 rounded-lg w-48 mb-4 ml-6 mt-6"></div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl"></div>
              <div className="flex-1">
                <div className="h-3 bg-slate-100 rounded w-20 mb-2"></div>
                <div className="h-6 bg-slate-100 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4">
          <div className="h-5 bg-slate-100 rounded w-20"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-4 text-left">
                  <div className="h-4 bg-slate-100 rounded w-16"></div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="h-4 bg-slate-100 rounded w-20"></div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="h-4 bg-slate-100 rounded w-24"></div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="h-4 bg-slate-100 rounded w-20"></div>
                </th>
                <th className="px-6 py-4 text-right">
                  <div className="h-4 bg-slate-100 rounded w-16 ml-auto"></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded bg-slate-100"></div>
                      <div className="h-5 bg-slate-100 rounded w-40"></div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-slate-100 rounded-full w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-slate-100 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-5 bg-slate-100 rounded-full w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-end">
                      <div className="w-8 h-8 rounded bg-slate-100"></div>
                      <div className="w-8 h-8 rounded bg-slate-100"></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;