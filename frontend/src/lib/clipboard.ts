import { toast } from "src/components/ui/use-toast";

export function copyToClipboard(content: string) {
  const copyPromise = new Promise((resolve, reject) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(content).then(resolve).catch(reject);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = content;
      textArea.style.position = "absolute";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      selectElement(textArea);
      if (document.execCommand("copy")) {
        resolve(content);
      } else {
        reject();
      }
      textArea.remove();
    }
  });

  copyPromise
    .then(() => {
      toast({ title: "Copied to clipboard." });
    })
    .catch(() => {
      toast({
        title: "Failed to copy",
        variant: "destructive",
      });
    });
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
