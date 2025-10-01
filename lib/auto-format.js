// Ultra-simple auto-formatter - returns AI text as-is with minimal cleanup
// No markdown processing, no headers added, no formatting changes

function cleanupHtmlTags(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Fix malformed font tags and convert to markdown with color preservation
  text = text
    // Convert font color tags to HTML span with inline styles (markdown doesn't support colors)
    .replace(/<font\s+color=["']([^"']*)["']>([^<]*)<\/font>/gi, '<span style="color:$1">$2</span>')
    // Fix unclosed font tags
    .replace(/<font\s+color=["']([^"']*)["']([^<]*)<\/font/gi, (match, color, content) => {
      const cleanContent = content.replace(/[^>]*$/, '');
      return `<span style="color:${color}">${cleanContent}</span>`;
    })
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

export function autoFormatResponse(text, options = {}) {
  if (!text || typeof text !== "string") return "";

  // Clean HTML first
  text = cleanupHtmlTags(text);
  
  // Strip ALL markdown headers aggressively
  // Remove headers at start of lines: # ## ### #### ##### ######
  text = text.replace(/^#{1,6}\s+/gm, '');
  
  // Also remove headers that might have spaces before them
  text = text.replace(/^\s*#{1,6}\s+/gm, '');
  
  // Remove standalone hash symbols that might be left
  text = text.replace(/^#{1,6}$/gm, '');
  
  return text.trim();
}

export default autoFormatResponse;
