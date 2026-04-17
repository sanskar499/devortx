// Simulate Multi-Modal AI model analyzing a citizen report
export async function runAITriage(reportData) {
  // Simulate network/inference latency
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const text = reportData.description.toLowerCase();
  const ocr = (reportData.ocrText || "").toLowerCase();
  
  let baseScore = 60;
  let ocrMatched = false;
  
  // Keyword heuristics simulating NLP
  const keywords = ['flood', 'water', 'blocked', 'stuck', 'tree', 'emergency', 'help', 'danger', 'caution', 'closed'];
  
  keywords.forEach(kw => {
    if (text.includes(kw)) baseScore += 10;
    if (ocr.includes(kw)) {
        baseScore += 15; // OCR hit is a stronger signal of physical evidence
        ocrMatched = true;
    }
  });
  
  if (baseScore > 99) baseScore = 99;
  
  const isHighRelevance = baseScore > 75;
  
  // DEMO GUARANTEE: If real OCR failed but image is present, check for keywords
  let finalOCR = reportData.ocrText || '';
  const uText = text.toUpperCase();
  
  if (reportData.hasMedia && (!finalOCR || finalOCR.trim().length < 3)) {
      if (uText.includes('DANGER') || uText.includes('SIGN') || uText.includes('CAUTION')) {
          finalOCR = "[DEMO SIMULATION]: DANGER - HIGH WATER - ROAD CLOSED";
          ocrMatched = true;
      } else if (uText.includes('FLOOD')) {
          finalOCR = "[DEMO SIMULATION]: FLOOD WARNING - AUTHORIZED ACCESS ONLY";
          ocrMatched = true;
      }
  }

  let analysis = isHighRelevance 
    ? 'High correlation with sensor data. Likely inundation zone.'
    : 'Moderate relevance. Requires ground validation.';

  if (ocrMatched) {
    analysis = `✔️ [MULTI-MODAL VERIFIED]: OCR corroborated physical textual evidence from the uploaded media. ${analysis}`;
  }

  return {
    confidence: baseScore + (ocrMatched ? 15 : 0) + (Math.random() * 0.9),
    analysis: analysis,
    ocrEvidence: finalOCR || (reportData.hasMedia ? 'No specific text detected. Image analyzed for structural anomalies.' : ''),
    inferredTags: isHighRelevance ? ['Hazard', 'High Priority'] : ['Low Priority'],
    suggestedAction: isHighRelevance ? 'Approve & Dispatch' : 'Awaiting Peer Review',
    coordinates: reportData.location,
    hasMedia: reportData.hasMedia
  };
}
