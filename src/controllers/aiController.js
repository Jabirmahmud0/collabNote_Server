import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY_A || process.env.GEMINI_API_KEY);

/**
 * Summarize note content
 * POST /api/ai/summarize
 */
export const summarizeNote = async (req, res, next) => {
  try {
    const { content, title } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    // Convert Quill delta to text
    let textContent = '';
    if (content.ops) {
      textContent = content.ops
        .filter((op) => typeof op.insert === 'string')
        .map((op) => op.insert)
        .join(' ')
        .slice(0, 10000); // Limit content length
    } else {
      textContent = typeof content === 'string' ? content.slice(0, 10000) : JSON.stringify(content);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Please provide a concise summary of the following note titled "${title || 'Untitled'}":\n\n${textContent}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.status(200).json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    console.error('AI Summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate summary',
    });
  }
};

/**
 * Auto-generate tags for note
 * POST /api/ai/tags
 */
export const generateTags = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    // Convert Quill delta to text
    let textContent = '';
    if (content.ops) {
      textContent = content.ops
        .filter((op) => typeof op.insert === 'string')
        .map((op) => op.insert)
        .join(' ')
        .slice(0, 5000);
    } else {
      textContent = typeof content === 'string' ? content.slice(0, 5000) : JSON.stringify(content);
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze the following text and suggest 3-5 relevant tags (single words or short phrases, comma-separated, no explanations):\n\n${textContent}`;

    const result = await model.generateContent(prompt);
    const tagsResponse = result.response.text();

    // Parse tags from response
    const tags = tagsResponse
      .split(',')
      .map((tag) => tag.trim().replace(/[#*]/g, ''))
      .filter((tag) => tag.length > 0 && tag.length < 30)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: { tags },
    });
  } catch (error) {
    console.error('AI Tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tags',
    });
  }
};
