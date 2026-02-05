/**
 * Gemini API Service
 * Handles AI-powered explanations for analytics dashboards
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
// Using gemini-2.5-flash instead of gemini-1.5-flash (which is not available)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Warn if API key is not set
if (!GEMINI_API_KEY) {
  console.warn('⚠️  VITE_GEMINI_API_KEY environment variable is not set. AI explanations will not work.');
}

export interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Generate AI explanation using Gemini API
 * @param prompt - The prompt to send to Gemini
 * @returns AI-generated explanation text
 */
export async function generateAIExplanation(prompt: string): Promise<string> {
  try {
    console.log('🚀 Starting Gemini API call...');
    console.log('📝 Prompt length:', prompt.length);
    
    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    };

    console.log('📤 Sending request to Gemini API...');
    const fullUrl = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    console.log('📊 API Response status:', response.status);
    console.log('📊 API Response headers:', {
      contentType: response.headers.get('content-type'),
      status: response.status,
      statusText: response.statusText,
    });

    // Get response text first to log it
    const responseText = await response.text();
    console.log('📋 API Response body (first 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      console.error('❌ Gemini API HTTP Error:', response.status, response.statusText);
      console.error('❌ Response body:', responseText);
      
      // Try to parse error details
      try {
        const errorData = JSON.parse(responseText);
        console.error('❌ Error details:', errorData);
        throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
      } catch {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
    }

    // Parse response
    let data: GeminiResponse;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Response parsed successfully');
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      throw new Error('Invalid JSON response from Gemini API');
    }

    // Extract text from response
    if (
      data.candidates &&
      data.candidates[0] &&
      data.candidates[0].content &&
      data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0]
    ) {
      const explanation = data.candidates[0].content.parts[0].text;
      console.log('✅ Explanation extracted successfully, length:', explanation.length);
      return explanation;
    }

    console.error('❌ Unexpected response structure. Full response:', data);
    throw new Error('Unexpected Gemini API response structure');
  } catch (error) {
    console.error('❌ Error generating AI explanation:', error);
    
    // Provide more helpful error messages
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        console.error('💡 Possible causes: CORS issue, network error, or API endpoint unavailable');
      }
    }
    
    throw error;
  }
}

/**
 * Generate context-aware prompt for commune analysis with actual data
 */
export function generateCommuneAnalysisPrompt(
  chartType: 'cv' | 'bikes' | 'comparison',
  communeData?: any[]
): string {
  let dataContext = '';

  if (communeData && communeData.length > 0) {
    if (chartType === 'cv') {
      // Format CV data for analysis
      const cvData = communeData.slice(0, 5).map(c => `${c.code} (${c.name}): CV=${(c.cv || 0).toFixed(2)}%`).join(', ');
      const avgCV = communeData.reduce((sum, c) => sum + (c.cv || 0), 0) / communeData.length;
      dataContext = `\n\nACTUAL DATA:\nTop 5 Communes by CV: ${cvData}\nAverage CV: ${avgCV.toFixed(2)}%`;
    } else if (chartType === 'bikes') {
      // Format bikes data for analysis
      const bikesData = communeData.slice(0, 5).map(c => `${c.code}: ${c.bikes} bikes, ${c.docks} docks`).join('; ');
      const totalBikes = communeData.reduce((sum, c) => sum + c.bikes, 0);
      dataContext = `\n\nACTUAL DATA:\nTop 5 Communes: ${bikesData}\nTotal bikes in network: ${totalBikes}`;
    } else if (chartType === 'comparison') {
      // Format comparison data for analysis
      const top4 = communeData.slice(0, 4);
      const comparisonData = top4.map(c => `${c.code}: ${c.stations} stations, ${c.bikes} bikes, CV=${(c.cv || 0).toFixed(2)}%`).join('; ');
      dataContext = `\n\nACTUAL DATA:\nTop 4 Communes Comparison: ${comparisonData}`;
    }
  }

  const prompts = {
    cv: `You are an expert data analyst for a bike-sharing system (Vélib in Paris). 
Analyze the Coefficient of Variation (CV) metric for communes in the bike-sharing network.

Context: CV measures relative variability of bike activity across communes. 
- High CV (>30%): Unpredictable usage, sensitive to external factors
- Low CV (<20%): Stable, predictable usage
- Medium CV (20-30%): Moderate variability

Provide a brief (3-4 sentences), insightful analysis of:
1. Which communes have the most/least predictable patterns
2. Operational implications for demand forecasting
3. Recommendations for resource allocation${dataContext}

Be specific and reference actual data values. Keep response concise and professional. Respond in French.`,

    bikes: `You are an expert data analyst for a bike-sharing system (Vélib in Paris).
Analyze bike availability distribution across communes.

Context: This shows bikes available vs docks available per commune.
- High bike count: Strong demand or recent rebalancing
- Low availability: High utilization or poor distribution
- Balanced ratio: Well-calibrated station

Provide a brief (3-4 sentences) analysis of:
1. Which communes have the best/worst bike availability
2. Demand intensity and utilization patterns
3. Where rebalancing may be needed${dataContext}

Be specific with numbers and locations. Keep response concise and professional. Respond in French.`,

    comparison: `You are an expert data analyst for a bike-sharing system (Vélib in Paris).
Compare top communes across multiple metrics: stations count, bikes available, and CV.

Context: These metrics reveal different aspects of network performance.
- Stations: Infrastructure density and coverage
- Bikes: Available supply and demand capacity
- CV: Demand predictability and volatility

Provide a brief (3-4 sentences) insight about:
1. Which communes are best/worst performing and why
2. Resource allocation efficiency across top communes
3. Strategic priorities for network optimization${dataContext}

Be specific with data comparisons. Keep response concise and professional. Respond in French.`,
  };

  return prompts[chartType];
}

/**
 * Generate context-aware prompt for station analysis with actual data
 */
export function generateStationAnalysisPrompt(
  chartType: 'daily' | 'weekly' | 'monthly',
  stationName?: string,
  chartData?: any
): string {
  let dataContext = '';

  if (chartData) {
    if (chartType === 'daily' && Array.isArray(chartData)) {
      // Extract key metrics from daily data
      const fluxValues = chartData.map((d: any) => parseFloat(d.flux || 0)).filter(v => !isNaN(v));
      const cvValues = chartData.map((d: any) => parseFloat(d.cv || 0)).filter(v => !isNaN(v));
      const maxFlux = Math.max(...fluxValues);
      const minFlux = Math.min(...fluxValues);
      const avgCV = cvValues.length > 0 ? (cvValues.reduce((a: number, b: number) => a + b, 0) / cvValues.length).toFixed(2) : '0';
      
      dataContext = `\n\nACTUAL DATA:\nFlux range: ${minFlux.toFixed(1)} to ${maxFlux.toFixed(1)} bikes/hour\nAverage CV: ${avgCV}%\nData points: ${chartData.length} hours`;
    } else if (chartType === 'weekly' && Array.isArray(chartData)) {
      // Extract key metrics from weekly data
      const fluxByDay = chartData.map((d: any) => `${d.day}: ${(d.avgFlux || 0).toFixed(2)} bikes/day (CV: ${(d.avgCV || 0).toFixed(2)}%)`).join('; ');
      dataContext = `\n\nACTUAL DATA:\nWeekly pattern: ${fluxByDay}`;
    } else if (chartType === 'monthly' && Array.isArray(chartData)) {
      // Extract key metrics from monthly data
      const weekData = chartData.map((d: any) => `${d.date}: flux=${(d.flux || 0).toFixed(2)}, CV=${(d.cv || 0).toFixed(2)}%`).join('; ');
      const totalFlux = chartData.reduce((sum: number, d: any) => sum + (d.flux || 0), 0);
      dataContext = `\n\nACTUAL DATA:\nMonthly trend: ${weekData}\nTotal flux over period: ${totalFlux.toFixed(2)}`;
    }
  }

  const prompts = {
    daily: `You are an expert data analyst for a bike-sharing system (Vélib in Paris).
Analyze the 24-hour station behavior pattern${stationName ? ` for ${stationName}` : ''}.

Context: You are analyzing:
- Flux de Transit: Rate of bike flow (positive=supply source, negative=demand sink)
- CV (Coefficient of Variation): Activity variability/unpredictability (0-100%)
- Bikes/Docks: Available bikes and docking spaces

Provide a brief (3-4 sentences) analysis focusing on:
1. Peak demand hours and traffic patterns
2. Whether this is a source or sink station
3. Operational recommendations for rebalancing${dataContext}

Reference specific times and values. Keep response concise and professional. Respond in French.`,

    weekly: `You are an expert data analyst for a bike-sharing system (Vélib in Paris).
Analyze the weekly pattern (Monday-Sunday)${stationName ? ` for ${stationName}` : ''}.

Context: You are looking at daily averages showing:
- Average flux per day (bike flow direction and magnitude)
- CV per day (variability and unpredictability)
- Total daily bike movements

Provide a brief (3-4 sentences) analysis focusing on:
1. Weekday vs weekend behavior differences
2. Days with highest demand/variability
3. Staffing and rebalancing priorities by day${dataContext}

Reference specific days and values. Keep response concise and professional. Respond in French.`,

    monthly: `You are an expert data analyst for a bike-sharing system (Vélib in Paris).
Analyze the monthly trend (5-week evolution)${stationName ? ` for ${stationName}` : ''}.

Context: You are seeing aggregated data showing:
- Total flux per week (cumulative bike movements)
- CV evolution (demand predictability trend)
- Growth or decline patterns

Provide a brief (3-4 sentences) analysis focusing on:
1. Overall trend (growing, declining, or stable)
2. Weeks with unusual activity or volatility
3. Forecast and maintenance recommendations${dataContext}

Reference specific weeks and values. Keep response concise and professional. Respond in French.`,
  };

  return prompts[chartType];
}

/**
 * Cache for explanations to avoid repeated API calls
 */
const explanationCache = new Map<string, { text: string; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

export async function getExplanationWithCache(
  cacheKey: string,
  prompt: string
): Promise<string> {
  // Check cache
  const cached = explanationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📦 Using cached explanation for:', cacheKey);
    return cached.text;
  }

  // Fetch from API
  console.log('🌐 Fetching explanation from Gemini API for:', cacheKey);
  const text = await generateAIExplanation(prompt);

  // Cache result
  explanationCache.set(cacheKey, { text, timestamp: Date.now() });

  return text;
}
