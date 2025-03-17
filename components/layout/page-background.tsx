export function PageBackground() {
  return (
    <div className="fixed inset-0 z-0 opacity-20">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,170,0.15),transparent_40%)]"></div>
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_70%,rgba(255,0,128,0.15),transparent_40%)]"></div>
      <div className="absolute inset-0 bg-[url('/placeholder.svg?height=1000&width=1000')] bg-repeat opacity-5"></div>
    </div>
  )
}

