const BN_DIGITS = '০১২৩৪৫৬৭৮৯'
const EN_DIGITS = /[0-9]/g

export function toBengaliDigits(value) {
  return String(value).replace(EN_DIGITS, (digit) => BN_DIGITS[digit])
}

function shouldSkip(node) {
  const parent = node.parentElement
  if (!parent) return true
  return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT'].includes(parent.tagName) ||
    parent.closest('[data-no-bengali-numerals="true"]')
}

export function applyBengaliNumerals(root = document.body) {
  if (!root) return
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  let node
  while ((node = walker.nextNode())) nodes.push(node)
  nodes.forEach((textNode) => {
    if (shouldSkip(textNode)) return
    const next = toBengaliDigits(textNode.nodeValue)
    if (next !== textNode.nodeValue) textNode.nodeValue = next
  })
}

export function enableBengaliNumerals() {
  const root = document.body
  if (!root) return () => {}
  applyBengaliNumerals(root)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        if (!shouldSkip(mutation.target)) {
          const next = toBengaliDigits(mutation.target.nodeValue)
          if (next !== mutation.target.nodeValue) mutation.target.nodeValue = next
        }
      } else {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (!shouldSkip(node)) node.nodeValue = toBengaliDigits(node.nodeValue)
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            applyBengaliNumerals(node)
          }
        })
      }
    }
  })
  observer.observe(root, { subtree: true, childList: true, characterData: true })
  return () => observer.disconnect()
}
