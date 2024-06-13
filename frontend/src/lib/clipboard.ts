import { toast } from "src/components/ui/use-toast";

export function copyToClipboard(content: string) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(content);
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = content;
    textArea.style.position = "absolute";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    selectElement(textArea);
    new Promise((res, rej) => {
      document.execCommand("copy") ? res(content) : rej();
      textArea.remove();
    });
  }
  toast({ title: "Copied to clipboard." });
}

function selectElement(element: Element) {
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNode(element);
    selection.addRange(range);
  }
}
