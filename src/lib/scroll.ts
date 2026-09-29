export function scrollToY(y: number) {
  window.dispatchEvent(new CustomEvent("delhi:scrollTo", { detail: y }))
}
