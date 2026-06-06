import { Request, Response } from 'express';
import { query } from '../config/database';
import { success, error } from '../utils/helpers';
import { Product } from '../types';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface ParsedFilters {
  search?: string;
  brand?: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  ram?: string;
  storage?: string;
  color?: string;
  size?: string;
  rating?: number;
}

/**
 * Local NLP Rule-Based Fallback Parser
 */
function localNLPParser(message: string): { reply: string; filters: ParsedFilters } {
  const text = message.toLowerCase().trim();
  const filters: ParsedFilters = {};

  // 1. Intent Classification: Greetings
  const greetings = ['hi', 'hello', 'hey', 'yo', 'namaste', 'hola', 'greetings', 'good morning', 'good afternoon', 'good evening'];
  const isGreetingOnly = greetings.some(g => text === g || text.startsWith(g + ' ') || text.endsWith(' ' + g));
  
  // 2. Intent Classification: Support / General Inquiry / Contact
  const isSupportInquiry = text.includes('inquiry') || 
                            text.includes('question') || 
                            text.includes('help') || 
                            text.includes('contact') || 
                            text.includes('support') || 
                            text.includes('customer care') || 
                            text.includes('email') || 
                            text.includes('phone number') || 
                            text.includes('contact number') || 
                            text.includes('mobile number') || 
                            text.includes('call you') ||
                            text.includes('address') ||
                            text.includes('office');

  // 3. Intent Classification: Shipping & Delivery
  const isShippingInquiry = text.includes('shipping') || 
                             text.includes('delivery') || 
                             text.includes('dispatch') || 
                             text.includes('arrive') || 
                             text.includes('track') || 
                             text.includes('status') ||
                             text.includes('shipment');

  // 4. Intent Classification: Returns & Refunds
  const isReturnInquiry = text.includes('return') || 
                           text.includes('refund') || 
                           text.includes('replace') || 
                           text.includes('exchange') || 
                           text.includes('cancel');

  if (isReturnInquiry) {
    return {
      reply: "We offer a 7-day hassle-free return and replacement policy for all products. If you are not satisfied with your purchase, you can initiate a return directly from the 'Orders' section in your account dashboard, or email support@shopnow.in for help.",
      filters
    };
  }

  if (isShippingInquiry) {
    return {
      reply: "Most orders are shipped within 24 hours and delivered within 3-5 business days. Free shipping is available for all orders above ₹500! You can track your packages in real-time under the 'Orders' tab in your account.",
      filters
    };
  }

  if (isSupportInquiry) {
    return {
      reply: "Sure, I'd be happy to help with your inquiry! You can reach our customer support team 24/7 at **support@shopnow.in** or call us toll-free at **1800-123-4567**. How else can I assist you today?",
      filters
    };
  }

  if (isGreetingOnly && !text.includes('buy') && !text.includes('show') && !text.includes('find') && !text.includes('search')) {
    return {
      reply: "Hello! 👋 Welcome to ShopNow Shopping Assistant. I can help you find products (e.g., 'show me Nike shoes under 5000' or 'laptops with 16GB RAM'), check order statuses, or answer general questions. What are you looking for today?",
      filters
    };
  }

  // Extract Price Limits
  const underMatch = text.match(/(?:under|below|less than|within)\s*(?:rs\.?|inr|rupees)?\s*(\d+)(?:\s*k)?/i);
  if (underMatch) {
    let price = parseInt(underMatch[1]);
    if (text.includes(`${underMatch[1]}k`)) {
      price *= 1000;
    }
    filters.max_price = price;
  }

  const aboveMatch = text.match(/(?:above|greater than|more than|over)\s*(?:rs\.?|inr|rupees)?\s*(\d+)(?:\s*k)?/i);
  if (aboveMatch) {
    let price = parseInt(aboveMatch[1]);
    if (text.includes(`${aboveMatch[1]}k`)) {
      price *= 1000;
    }
    filters.min_price = price;
  }

  // Extract RAM
  const ramMatch = text.match(/(\d+)\s*(?:gb|gigabyte)?\s*ram/i);
  if (ramMatch) {
    filters.ram = `${ramMatch[1]}GB`;
  }

  // Extract Storage
  const storageMatch = text.match(/(\d+)\s*(?:gb|tb|gigabyte|terabyte)?\s*(?:storage|rom|internal)/i) || 
                       text.match(/(128|256|512|64)\s*(?:gb|tb)/i);
  if (storageMatch) {
    const value = storageMatch[1];
    const unit = text.includes('tb') ? 'TB' : 'GB';
    filters.storage = `${value}${unit}`;
  }

  // Extract Colors
  const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'grey', 'gray', 'silver', 'gold'];
  for (const color of colors) {
    if (new RegExp(`\\b${color}\\b`, 'i').test(text)) {
      filters.color = color;
      break;
    }
  }

  // Extract Category hints
  if (text.includes('phone') || text.includes('mobile') || text.includes('smartphone')) {
    filters.category = 'Smartphones';
  } else if (text.includes('laptop') || text.includes('computer') || text.includes('notebook')) {
    filters.category = 'Laptops';
  } else if (text.includes('shoe') || text.includes('sneaker') || text.includes('footwear')) {
    filters.category = 'Footwear';
  } else if (text.includes('shirt') || text.includes('tshirt') || text.includes('clothing') || text.includes('apparel') || text.includes('jeans')) {
    filters.category = 'Clothing';
  }

  // Extract Brand hints
  const brands = ['apple', 'samsung', 'oneplus', 'nike', 'adidas', 'puma', 'dell', 'hp', 'lenovo', 'sony', 'boat'];
  for (const b of brands) {
    if (new RegExp(`\\b${b}\\b`, 'i').test(text)) {
      filters.brand = b;
      break;
    }
  }

  // Clean Search text (removing common filler words and extracted entities)
  const stopWords = new Set([
    'i', 'want', 'to', 'buy', 'show', 'me', 'find', 'search', 'for', 'looking', 'need', 'give', 'get', 'please',
    'best', 'good', 'cheap', 'top', 'latest', 'new', 'some', 'any', 'the', 'a', 'an', 'of', 'in', 'on', 'with', 'under',
    'above', 'below', 'price', 'budget', 'rate', 'rupees', 'rs', 'inr', 'star', 'stars', 'rating', 'matching', 'items', 'products'
  ]);

  let cleanQuery = text.toLowerCase();
  
  // Apply regex to strip out price patterns and RAM patterns
  cleanQuery = cleanQuery
    .replace(/(?:under|below|less than|within|above|greater than|more than|over)\s*(?:rs\.?|inr|rupees)?\s*\d+(?:\s*k)?/gi, '')
    .replace(/\b\d+\s*(?:gb|tb|gigabyte|terabyte)?\s*(?:ram|storage|rom|internal)\b/gi, '');

  // Split into words, filter out stop words, and join
  cleanQuery = cleanQuery
    .split(/[\s,.\-\/]+/)
    .filter(word => word && !stopWords.has(word))
    .join(' ');

  // Remove brand and color from clean search query to keep it focused
  if (filters.brand) {
    cleanQuery = cleanQuery.replace(new RegExp(`\\b${filters.brand}\\b`, 'gi'), '');
  }
  if (filters.color) {
    cleanQuery = cleanQuery.replace(new RegExp(`\\b${filters.color}\\b`, 'gi'), '');
  }
  cleanQuery = cleanQuery.replace(/\s+/g, ' ').trim();

  // If the query is just a generic category name/hint, we clear it to avoid over-filtering the text search
  const genericCategoryWords = new Set([
    'shoe', 'shoes', 'sneaker', 'sneakers', 'footwear',
    'shirt', 'shirts', 'tshirt', 'tshirts', 't shirt', 't shirts', 't-shirt', 't-shirts', 'clothing', 'apparel', 'jeans',
    'phone', 'phones', 'mobile', 'mobiles', 'smartphone', 'smartphones',
    'laptop', 'laptops', 'computer', 'computers', 'notebook', 'notebooks'
  ]);

  if (filters.category && genericCategoryWords.has(cleanQuery)) {
    cleanQuery = '';
  }

  if (cleanQuery.length >= 2) {
    filters.search = cleanQuery;
  }

  // Construct a friendly response based on what we understood
  let responseParts = [];
  if (filters.category) responseParts.push(filters.category);
  if (filters.brand) responseParts.push(`from ${filters.brand.toUpperCase()}`);
  if (filters.ram) responseParts.push(`with ${filters.ram} RAM`);
  if (filters.storage) responseParts.push(`and ${filters.storage} storage`);
  if (filters.color) responseParts.push(`in ${filters.color}`);
  if (filters.max_price) responseParts.push(`under ₹${filters.max_price}`);

  const criteria = responseParts.join(' ');
  const reply = criteria 
    ? `Sure! I am searching for **${criteria}** products for you.` 
    : "I'll search our catalog for products matching your query.";

  return { reply, filters };
}

/**
 * Handle POST /api/ai/chat
 */
export async function chatWithAI(req: Request, res: Response): Promise<void> {
  try {
    const { message, chatHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json(error('Message must be a non-empty string'));
      return;
    }

    // ── Product-Specific Q&A Detection (Ask Rufus) ──
    // Messages from Ask Rufus have the pattern: [About: Product Name] Question
    const productQAMatch = message.match(/^\[About:\s*(.+?)\]\s*(.+)$/);
    if (productQAMatch) {
      const productName = productQAMatch[1].trim();
      const question = productQAMatch[2].trim();

      // Fetch the product from database
      const productResult = await query<any>(
        `SELECT p.*, c.name as category_name,
                COALESCE(
                  (SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r WHERE r.product_id = p.id),
                  0
                ) as avg_rating,
                COALESCE(
                  (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id),
                  0
                ) as total_reviews
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.name ILIKE $1 AND p.is_active = true
         LIMIT 1`,
        [`%${productName}%`]
      );

      const product = productResult[0];

      if (product) {
        const specs = product.specifications || {};
        const specLines = Object.entries(specs)
          .map(([k, v]) => `${(k as string).replace(/_/g, ' ')}: ${v}`)
          .join(', ');

        const apiKey = process.env.GEMINI_API_KEY || '';
        let answer = '';

        if (apiKey) {
          try {
            const qaPrompt = `You are a helpful product assistant for ShopNow.in.
A customer is viewing the product "${product.name}" and has asked a question about it.

Product Details:
- Name: ${product.name}
- Brand: ${product.brand || 'N/A'}
- Category: ${product.category_name || 'N/A'}
- Price: ₹${product.selling_price} (MRP: ₹${product.mrp})
- Condition: ${product.condition}
- Description: ${product.description || 'N/A'}
- Specifications: ${specLines || 'None listed'}
- Average Rating: ${product.avg_rating}/5 (${product.total_reviews} reviews)
- Stock: ${product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}

Customer Question: "${question}"

Provide a concise, helpful, friendly answer (2-4 sentences) based on the product information above. If the information isn't available in the product details, say so honestly but suggest the customer check the product page or contact support. Do NOT make up specifications or features that aren't listed. Respond as plain text (no JSON).`;

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: qaPrompt }] }],
              })
            });

            if (geminiRes.ok) {
              const result = (await geminiRes.json()) as any;
              answer = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
            }
          } catch (err) {
            console.error('Gemini Q&A error, using fallback:', err);
          }
        }

        // Local fallback if Gemini is unavailable or failed
        if (!answer) {
          const qLower = question.toLowerCase();
          if (qLower.includes('durable') || qLower.includes('quality') || qLower.includes('build')) {
            answer = `The ${product.brand || ''} ${product.name} is a ${product.condition === 'new' ? 'brand new' : product.condition.replace(/_/g, ' ')} product. ${Number(product.avg_rating) >= 4 ? `With a rating of ${product.avg_rating}/5 from ${product.total_reviews} customers, it's well-regarded for quality.` : Number(product.total_reviews) > 0 ? `It has a ${product.avg_rating}/5 rating from ${product.total_reviews} reviews.` : 'It has no reviews yet, but you can be the first to share your experience!'} ${specLines ? `Key specs include: ${specLines}.` : ''}`;
          } else if (qLower.includes('warranty')) {
            const warrantySpec = specs.warranty || specs.Warranty || null;
            answer = warrantySpec
              ? `The ${product.name} comes with a ${warrantySpec} warranty.`
              : `Warranty information isn't listed in the product specifications. We recommend contacting our support at support@shopnow.in for warranty details.`;
          } else if (qLower.includes('worth') || qLower.includes('price') || qLower.includes('value')) {
            const discount = Math.round((1 - product.selling_price / product.mrp) * 100);
            answer = `The ${product.name} is priced at ₹${Number(product.selling_price).toLocaleString('en-IN')} (${discount}% off MRP ₹${Number(product.mrp).toLocaleString('en-IN')}). ${Number(product.avg_rating) >= 4 ? `With a ${product.avg_rating}/5 rating, customers generally find it a good value.` : Number(product.total_reviews) > 0 ? `It has a ${product.avg_rating}/5 rating from ${product.total_reviews} reviews.` : 'Be the first to review it and share if it was worth the price!'}`;
          } else if (qLower.includes('feature') || qLower.includes('spec')) {
            answer = specLines
              ? `Here are the key specifications for the ${product.name}: ${specLines}.`
              : `Detailed specifications aren't listed for this product. ${product.description ? `Description: "${product.description.substring(0, 200)}"` : ''}`;
          } else {
            answer = `About the **${product.name}**${product.brand ? ` by ${product.brand}` : ''}: It's priced at ₹${Number(product.selling_price).toLocaleString('en-IN')}. ${product.description ? product.description.substring(0, 150) + '.' : ''} ${Number(product.avg_rating) > 0 ? `Rated ${product.avg_rating}/5 by ${product.total_reviews} customers.` : ''} For more details, check the product page or contact our support!`;
          }
        }

        res.json(success({
          reply: answer.trim(),
          products: [],
          filters: {}
        }));
        return;
      }
    }

    // ── Standard Product Search Flow ──
    const apiKey = process.env.GEMINI_API_KEY || '';
    let aiResponseText = '';
    let extractedFilters: ParsedFilters = {};

    if (apiKey) {
      try {
        // Prepare historical context for the LLM
        const formattedHistory = chatHistory
          .slice(-6) // Keep last 6 messages
          .map((msg: Message) => `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`)
          .join('\n');

        // Gemini API payload
        const prompt = `You are a smart shopping assistant for "ShopNow.in".
Your task is to analyze the user's latest message and output a JSON response containing a friendly conversational text reply and structured product catalog search filters.

Database filters available:
- category (string matches like 'Smartphones', 'Laptops', 'Shoes', 'Apparel', 'Electronics')
- search (string query for matching product title/description)
- brand (string like 'Apple', 'Samsung', 'Nike', etc.)
- min_price (numeric minimum price)
- max_price (numeric maximum price)
- ram (string like '4GB', '8GB', '16GB', '12GB')
- storage (string like '64GB', '128GB', '256GB', '512GB', '1TB')
- color (string like 'Black', 'Blue', 'White', 'Red', etc.)
- size (string like 'S', 'M', 'L', 'XL', '7', '8', '9', '10')
- rating (numeric minimum rating, 1 to 5)

Provide your response in EXACTLY this JSON structure, with no markdown code blocks outside of the JSON itself:
{
  "reply": "Conversational response in friendly, short Hinglish or English (as chosen by user). e.g., 'Sure, here are some Apple smartphones under ₹80,000 for you!'",
  "filters": {
    "category": "Smartphones",
    "brand": "Apple",
    "max_price": 80000
  }
}

Chat History:
${formattedHistory}

Latest User Message: "${message}"

Response (strictly JSON):`;

        // Direct fetch to Gemini endpoint
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const response = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' }
          })
        });

        if (response.ok) {
          const result = (await response.json()) as any;
          const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = JSON.parse(responseText.trim());
          aiResponseText = parsed.reply;
          extractedFilters = parsed.filters || {};
        } else {
          console.warn('Gemini API call failed, falling back to local NLP.');
          const fallback = localNLPParser(message);
          aiResponseText = fallback.reply;
          extractedFilters = fallback.filters;
        }
      } catch (err) {
        console.error('Error contacting Gemini API:', err);
        const fallback = localNLPParser(message);
        aiResponseText = fallback.reply;
        extractedFilters = fallback.filters;
      }
    } else {
      // Fallback if no API key is configured
      const fallback = localNLPParser(message);
      aiResponseText = fallback.reply;
      extractedFilters = fallback.filters;
    }

    // Now, run database query using the extracted filters
    let formattedProducts: any[] = [];
    const hasSearchFilters = Object.keys(extractedFilters).length > 0;

    if (hasSearchFilters) {
      const conditions: string[] = ['p.is_active = true'];
      const params: unknown[] = [];
      let paramIdx = 1;

      // Apply Filters
      if (extractedFilters.search) {
        conditions.push(`(p.name ILIKE $${paramIdx} OR p.description ILIKE $${paramIdx})`);
        params.push(`%${extractedFilters.search}%`);
        paramIdx++;
      }

      if (extractedFilters.category) {
        conditions.push(`c.name ILIKE $${paramIdx}`);
        params.push(`%${extractedFilters.category}%`);
        paramIdx++;
      }

      if (extractedFilters.brand) {
        conditions.push(`p.brand ILIKE $${paramIdx}`);
        params.push(`%${extractedFilters.brand}%`);
        paramIdx++;
      }

      if (extractedFilters.min_price) {
        conditions.push(`p.selling_price >= $${paramIdx}`);
        params.push(Number(extractedFilters.min_price));
        paramIdx++;
      }

      if (extractedFilters.max_price) {
        conditions.push(`p.selling_price <= $${paramIdx}`);
        params.push(Number(extractedFilters.max_price));
        paramIdx++;
      }

      if (extractedFilters.rating) {
        conditions.push(`p.average_rating >= $${paramIdx}`);
        params.push(Number(extractedFilters.rating));
        paramIdx++;
      }

      if (extractedFilters.ram) {
        conditions.push(`(p.specifications->>'ram' ILIKE $${paramIdx} OR p.specifications->>'RAM' ILIKE $${paramIdx})`);
        params.push(extractedFilters.ram);
        paramIdx++;
      }

      if (extractedFilters.storage) {
        conditions.push(`(p.specifications->>'storage' ILIKE $${paramIdx} OR p.specifications->>'Storage' ILIKE $${paramIdx})`);
        params.push(extractedFilters.storage);
        paramIdx++;
      }

      if (extractedFilters.color) {
        conditions.push(`(p.specifications->>'color' ILIKE $${paramIdx} OR p.specifications->>'Color' ILIKE $${paramIdx})`);
        params.push(extractedFilters.color);
        paramIdx++;
      }

      if (extractedFilters.size) {
        conditions.push(`(p.specifications->>'size' ILIKE $${paramIdx} OR p.specifications->>'Size' ILIKE $${paramIdx})`);
        params.push(extractedFilters.size);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      
      // Select matching products limit to 6 for chat suggestions
      const dbQuery = `
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON c.id = p.category_id
        ${whereClause}
        ORDER BY p.is_featured DESC, p.created_at DESC
        LIMIT 6
      `;

      const products = await query<Product & { category_name: string; category_slug: string }>(dbQuery, params);

      // Format products properly (images JSON array parsing)
      formattedProducts = products.map(p => {
        let images = p.images;
        if (typeof images === 'string') {
          try { images = JSON.parse(images); } catch { images = []; }
        }
        if (Array.isArray(images)) {
          images = images.map(img => typeof img === 'string' ? { url: img, is_primary: true } : img);
        } else {
          images = [];
        }
        return { ...p, images };
      });

      // If no products were found, adjust reply slightly to keep it natural
      if (formattedProducts.length === 0) {
        aiResponseText = `I understood you are looking for products matching those filters, but unfortunately, we don't have any matching items in stock right now. Try searching for something else!`;
      }
    }

    res.json(success({
      reply: aiResponseText,
      products: formattedProducts,
      filters: extractedFilters
    }));
  } catch (err) {
    console.error('aiController chat error:', err);
    res.status(500).json(error('Internal server error'));
  }
}
