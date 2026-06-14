export default function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-5 w-5", md: "h-8 w-8", lg: "h-12 w-12" }
  return (
    <div className="flex justify-center items-center p-8">
      <div className={`animate-spin rounded-full ${sizes[size]} border-2 border-brand-200 border-t-brand-500`} />
    </div>
  )
}
