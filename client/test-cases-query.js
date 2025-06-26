// Test script to debug Firestore query
// Run this in browser console or as a standalone test

// Simple test query without orderBy
async function testSimpleQuery(userId) {
  try {
    const response = await fetch(`/api/cases/user/${userId}`);
    const result = await response.json();
    console.log('Simple query result:', result);
    return result;
  } catch (error) {
    console.error('Simple query failed:', error);
  }
}

// Test with your actual user ID
// Replace 'YOUR_USER_ID' with your actual user ID
// testSimpleQuery('YOUR_USER_ID');

console.log('Test functions loaded. Run testSimpleQuery("your-user-id") to test');
