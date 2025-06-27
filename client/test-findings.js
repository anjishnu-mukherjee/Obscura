// Test script to add sample findings for testing
// Run this in browser console after replacing YOUR_CASE_ID with an actual case ID

async function addTestFinding(caseId, source, sourceDetails, finding, importance) {
  try {
    const response = await fetch('/api/investigation/findings/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        caseId,
        source,
        sourceDetails,
        finding,
        importance,
        isNew: true
      })
    });
    
    const result = await response.json();
    console.log('Add finding result:', result);
    return result;
  } catch (error) {
    console.error('Error adding test finding:', error);
  }
}

// Sample test findings - replace 'YOUR_CASE_ID' with your actual case ID
async function addSampleFindings(caseId) {
  await addTestFinding(
    caseId,
    'interrogation',
    'Interview with John Smith',
    'Subject appeared nervous when asked about their whereabouts on the night of the incident. Claimed to be at home alone with no alibi.',
    'critical'
  );
  
  await addTestFinding(
    caseId,
    'location_visit',
    'Crime scene investigation',
    'Found partial fingerprint on the door handle. Matches are being processed in the database.',
    'important'
  );
  
  await addTestFinding(
    caseId,
    'clue_discovery',
    'Evidence analysis',
    'Security camera footage shows a figure in dark clothing leaving the building at 11:47 PM.',
    'critical'
  );
  
  await addTestFinding(
    caseId,
    'interrogation',
    'Interview with Jane Doe',
    'Witness confirms seeing the suspect in the area around the time of the incident.',
    'important'
  );
}

// Usage:
// addSampleFindings('your-case-id-here');

console.log('Test functions loaded. Use addSampleFindings("your-case-id") to add test data.');
