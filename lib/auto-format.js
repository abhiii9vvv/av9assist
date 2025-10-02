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
  
  // Keep markdown formatting intact - don't strip headers!
  // Just clean up any excessive whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .trim();
  
  return text;
}

export default autoFormatResponse;
