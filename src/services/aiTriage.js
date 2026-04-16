// Simulate Multi-Modal AI model analyzing a citizen report
export async function runAITriage(reportData) {
  // Simulate network/inference latency
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const text = reportData.description.toLowerCase();
  let baseScore = 60;
  
  // Keyword heuristics simulating NLP
  if (text.includes('flood') || text.includes('water')) baseScore += 20;
  if (text.includes('blocked') || text.includes('stuck') || text.includes('tree')) baseScore += 15;
  if (text.includes('emergency') || text.includes('help')) baseScore += 10;
  
  if (baseScore > 98) baseScore = 98;
  
  const isHighRelevance = baseScore > 75;
  
  return {
    confidence: baseScore + (Math.random() * 2), // e.g. 85.3
    analysis: isHighRelevance 
      ? 'High correlation with recent satellite radar and local rainfall data. Likely inundation zone.'
      : 'Moderate relevance. No severe localized weather anomalies detected via satellite, requires local validation.',
    inferredTags: isHighRelevance ? ['Hazard', 'High Priority'] : ['Low Priority'],
    suggestedAction: isHighRelevance ? 'Approve & Route to Emergency Responders' : 'Hold for more evidence',
    coordinates: reportData.location // Passing through
  };
}
