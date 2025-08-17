// Simple date formatting utilities
export function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }) {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInMonths = Math.floor(diffInDays / 30)
  const diffInYears = Math.floor(diffInDays / 365)

  let result = ""

  if (diffInYears > 0) {
    result = `${diffInYears} year${diffInYears > 1 ? "s" : ""}`
  } else if (diffInMonths > 0) {
    result = `${diffInMonths} month${diffInMonths > 1 ? "s" : ""}`
  } else if (diffInDays > 0) {
    result = `${diffInDays} day${diffInDays > 1 ? "s" : ""}`
  } else {
    result = "today"
  }

  return options?.addSuffix ? `${result} ago` : result
}
