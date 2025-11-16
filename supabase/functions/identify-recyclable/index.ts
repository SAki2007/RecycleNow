import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CITY_RECYCLING_RULES = {
  Vancouver: {
    plastic: "Blue bin (mixed recycling)",
    metal: "Blue bin (mixed recycling)",
    paper: "Blue bin (mixed recycling)",
    glass: "Blue bin (mixed recycling)",
    organic: "Green bin (organics)",
  },
  Toronto: {
    plastic: "Blue bin",
    metal: "Blue bin",
    paper: "Blue bin",
    glass: "Blue bin",
    organic: "Green bin",
  },
  Montreal: {
    plastic: "Blue bin (recyclables)",
    metal: "Blue bin (recyclables)",
    paper: "Blue bin (recyclables)",
    glass: "Blue bin (recyclables)",
    organic: "Brown bin (compost)",
  },
  Calgary: {
    plastic: "Blue cart (recycling)",
    metal: "Blue cart (recycling)",
    paper: "Blue cart (recycling)",
    glass: "Blue cart (recycling)",
    organic: "Green cart (organics)",
  },
  Ottawa: {
    plastic: "Blue box",
    metal: "Blue box",
    paper: "Blue box",
    glass: "Blue box",
    organic: "Green bin",
  },
  Edmonton: {
    plastic: "Blue bag",
    metal: "Blue bag",
    paper: "Blue bag",
    glass: "Blue bag",
    organic: "Green cart",
  },
  Winnipeg: {
    plastic: "Blue cart",
    metal: "Blue cart",
    paper: "Blue cart",
    glass: "Blue cart",
    organic: "Green cart",
  },
  "Quebec City": {
    plastic: "Blue bin",
    metal: "Blue bin",
    paper: "Blue bin",
    glass: "Blue bin",
    organic: "Brown bin",
  },
  Hamilton: {
    plastic: "Blue box",
    metal: "Blue box",
    paper: "Blue box",
    glass: "Blue box",
    organic: "Green bin",
  },
  Victoria: {
    plastic: "Blue box",
    metal: "Blue box",
    paper: "Blue box",
    glass: "Blue box",
    organic: "Green bin",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, city } = await req.json();

    if (!image) {
      throw new Error("No image provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing image for city:", city);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a recycling expert. Analyze images of items and identify the recyclable material type. 
            Respond ONLY with a JSON object in this exact format:
            {
              "material": "one of: plastic, metal, paper, glass, organic, or other",
              "confidence": "high, medium, or low",
              "description": "brief description of what you see"
            }`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "What recyclable material is this? Respond with JSON only.",
              },
              {
                type: "image_url",
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI response:", data);

    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let aiResult;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResult = JSON.parse(jsonMatch[0]);
      } else {
        aiResult = JSON.parse(aiContent);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      throw new Error("Invalid AI response format");
    }

    const material = aiResult.material.toLowerCase();
    const cityRules = CITY_RECYCLING_RULES[city as keyof typeof CITY_RECYCLING_RULES] || CITY_RECYCLING_RULES.Vancouver;
    const binType = cityRules[material as keyof typeof cityRules] || "Contact local waste management";

    let instructions = "";
    let specialNotes = "";

    switch (material) {
      case "plastic":
        instructions = `Clean and dry the plastic item before recycling. Remove any labels if possible. Check the recycling number on the bottom.`;
        specialNotes = "Note: Not all plastics are accepted. Look for numbers 1, 2, 4, and 5.";
        break;
      case "metal":
        instructions = "Rinse the metal item to remove any food residue. Aluminum cans and tin cans are widely accepted.";
        specialNotes = "Tip: Crushing cans saves space in your recycling bin!";
        break;
      case "paper":
        instructions = "Keep paper clean and dry. Remove any plastic windows from envelopes. Flatten cardboard boxes.";
        specialNotes = "Avoid: Wax-coated paper, paper towels, and tissues cannot be recycled.";
        break;
      case "glass":
        instructions = "Rinse the glass container and remove lids. Empty bottles and jars are accepted.";
        specialNotes = `${city === "Vancouver" ? "Vancouver accepts all glass colors." : "Separate glass by color if required in your area."}`;
        break;
      case "organic":
        instructions = "Place food scraps and yard waste in your organics bin. No plastic bags.";
        specialNotes = "Compostable items help reduce landfill waste and create nutrient-rich soil!";
        break;
      default:
        instructions = "This item may require special disposal. Check with your local waste management facility.";
        specialNotes = "When in doubt, contact your municipality for proper disposal guidelines.";
    }

    const result = {
      material: aiResult.material,
      binType,
      instructions,
      specialNotes,
      confidence: aiResult.confidence,
      description: aiResult.description,
    };

    console.log("Final result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});