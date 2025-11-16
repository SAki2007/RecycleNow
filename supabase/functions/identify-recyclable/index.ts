import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CITY_RECYCLING_RULES = {
  Vancouver: {
    plastic: "Blue Bin (containers)",
    plastic_flexible: "Recycling Depot (flexible plastics)",
    metal: "Blue Bin (containers)",
    paper: "Mixed Paper/Yellow Bag",
    glass: "Glass/Grey Bin",
    organic: "Green Bin (organics)",
    garbage: "Black/Garbage Bin",
    other: "Recycling Depot (special items)",
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
            content: `You are a recycling expert specializing in Vancouver's recycling system. Analyze images and identify ALL materials present with specific details.
            
            For PLASTICS, identify:
            - The plastic type (PET #1, HDPE #2, PVC #3, LDPE #4, PP #5, or unknown)
            - Whether it's rigid plastic (curbside recyclable) or flexible plastic (depot only)
            - Rigid plastics include: bottles, containers, plates, bowls, cups, food storage, cutlery, straws, hangers, black plastic pots, coffee cups
            - Flexible plastics include: bags, crinkly wrappers, food storage bags, overwrap, shrink wrap, bubble wrap
            
            For ORGANICS, be careful to identify items that CANNOT be composted:
            - NO to: pet waste, kitty litter, diapers, wax-coated paper
            - YES to: food scraps, yard waste, coffee grounds, tea bags, compostable paper
            
            For PAPER, identify items that CANNOT be recycled:
            - NO to: wax-coated paper, greasy pizza boxes, tissues, paper towels, napkins
            - YES to: clean cardboard, newspapers, magazines, office paper, clean paper bags
            
            Respond ONLY with a JSON object in this exact format:
            {
              "materials": [
                {
                  "material": "one of: plastic, metal, paper, glass, organic, garbage, or other",
                  "confidence": "high, medium, or low",
                  "description": "brief description of this specific item",
                  "plasticType": "if plastic: PET #1, HDPE #2, PVC #3, LDPE #4, PP #5, or unknown",
                  "plasticCategory": "if plastic: rigid or flexible"
                }
              ]
            }
            If multiple items are visible, include each as a separate object in the materials array.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify all recyclable materials in this image. List each item separately. Respond with JSON only.",
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

    const cityRules = CITY_RECYCLING_RULES[city as keyof typeof CITY_RECYCLING_RULES] || CITY_RECYCLING_RULES.Vancouver;

    const getInstructions = (material: string, plasticType?: string, plasticCategory?: string) => {
      switch (material) {
        case "plastic":
          if (plasticCategory === "flexible") {
            return {
              instructions: `Take flexible plastics to a Recycle BC depot. This includes: plastic bags, crinkly wrappers, food storage bags, overwrap, shrink wrap, and bubble wrap.`,
              specialNotes: `Plastic Type: ${plasticType || "Check item for number"}. These cannot go in your Blue Bin - they must go to a depot.`,
            };
          }
          return {
            instructions: `Clean and dry the plastic item before recycling. Remove any labels if possible. Place in your Blue Bin.`,
            specialNotes: `Plastic Type: ${plasticType || "Check item for recycling number"}. Accepted curbside: containers, plates, bowls, cups, cutlery, straws, hangers, black plastic pots.`,
          };
        case "metal":
          return {
            instructions: "Rinse the metal item to remove any food residue. Aluminum cans and tin cans are widely accepted.",
            specialNotes: "Tip: Crushing cans saves space in your recycling bin!",
          };
        case "paper":
          return {
            instructions: "Keep paper clean and dry. Remove any plastic windows from envelopes. Flatten cardboard boxes.",
            specialNotes: "CAN recycle: clean cardboard, newspapers, magazines, office paper. CANNOT recycle: wax-coated paper, greasy pizza boxes, tissues, paper towels, napkins.",
          };
        case "glass":
          return {
            instructions: "Rinse the glass container and remove lids. Empty bottles and jars are accepted.",
            specialNotes: city === "Vancouver" ? "Vancouver accepts all glass colors." : "Separate glass by color if required in your area.",
          };
        case "organic":
          return {
            instructions: "Place food scraps and yard waste in your Green Bin. No plastic bags.",
            specialNotes: "CAN compost: food scraps, yard waste, coffee grounds, tea bags. CANNOT compost: pet waste, kitty litter, diapers, wax-coated paper.",
          };
        case "garbage":
          return {
            instructions: "This item cannot be recycled or composted. Place in your Black/Garbage Bin.",
            specialNotes: "Items like wax-coated paper, greasy materials, pet waste, and contaminated items go here.",
          };
        default:
          return {
            instructions: "This item may require special disposal. Check with your local waste management facility.",
            specialNotes: "When in doubt, contact your municipality for proper disposal guidelines.",
          };
      }
    };

    const materials = aiResult.materials.map((item: any) => {
      const material = item.material.toLowerCase();
      const plasticType = item.plasticType;
      const plasticCategory = item.plasticCategory;
      
      // Determine bin type based on material and plastic category
      let binType = cityRules[material as keyof typeof cityRules] || "Contact local waste management";
      if (material === "plastic" && plasticCategory === "flexible" && "plastic_flexible" in cityRules) {
        binType = (cityRules as any).plastic_flexible;
      }
      
      const { instructions, specialNotes } = getInstructions(material, plasticType, plasticCategory);

      return {
        material: item.material,
        binType,
        instructions,
        specialNotes,
        confidence: item.confidence,
        description: item.description,
        plasticType,
        plasticCategory,
      };
    });

    const result = {
      materials,
      totalItems: materials.length,
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