const RoomPageSkeleton = () => {
  return (
    <div className="pt-18 pb-2 px-2 relative h-screen overflow-hidden flex flex-col-reverse xl:flex-row gap-2">
      <div className="flex-1 xl:flex-[5] h-full border overflow-y-auto rounded-lg p-3 border-zinc-800">
        <div className="flex p-1 items-center justify-between">
          <div className="h-7 w-32 bg-zinc-800 animate-pulse rounded-lg" />
          <div className="flex items-center gap-6">
            <div className="h-5 w-24 bg-zinc-800 animate-pulse rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col px-5 py-4 h-[300px] gap-3 bg-zinc-900/25 rounded-lg border border-zinc-800"
            >
              <div className="flex justify-between items-center">
                <div className="h-6 w-24 bg-zinc-800 animate-pulse rounded-lg" />
              </div>
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex gap-3 items-center">
                  <div className="size-5 bg-zinc-800 animate-pulse rounded-full" />
                  <div className="h-4 w-3/4 bg-zinc-800 animate-pulse rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 xl:flex-[2] h-full border rounded-lg border-zinc-800 overflow-y-auto p-3">
        <div className="flex items-center gap-1">
          <div className="w-full h-10 rounded-lg bg-zinc-800 animate-pulse" />
          <div className="w-20 h-10 rounded-lg bg-zinc-800 animate-pulse" />
        </div>
        <div className="flex flex-col gap-2 py-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex gap-3 items-center bg-zinc-800/20 p-2 rounded-lg"
            >
              <div className="size-5 bg-zinc-800 animate-pulse rounded" />
              <div className="flex-1 h-4 bg-zinc-800 animate-pulse rounded-lg" />
              <div className="size-4 bg-zinc-800 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton = () => {
  return (
    <div className="pt-16 px-5 max-w-screen-xl mx-auto relative">
      <div className="mt-12 flex justify-end">
        <div className="h-5 w-24 bg-zinc-800 animate-pulse rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4 sm:px-8 px-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="flex flex-col gap-4 p-4 rounded-md shadow-lg bg-zinc-800/40 md:bg-zinc-800/10 backdrop-blur-md border border-zinc-600 md:border-zinc-900"
          >
            <div className="flex justify-between items-center">
              <div className="h-6 w-32 bg-zinc-800 animate-pulse rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-zinc-800 animate-pulse rounded-lg" />
              <div className="h-4 w-16 bg-zinc-800 animate-pulse rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { DashboardSkeleton, RoomPageSkeleton };
