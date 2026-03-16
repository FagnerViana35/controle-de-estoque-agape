// This is a placeholder. Replace with actual API logic.
// For production, you'll need to host your data or use a database.
// Example using a hosted JSON (e.g., from jsonbin.io or similar)

export default async function handler(req, res) {
  // Example: Fetch from a hosted JSON
  // const response = await fetch('https://api.jsonbin.io/v3/b/your-bin-id');
  // const data = await response.json();

  // For now, return static data (replace with your db.json content)
  const data = {
    "raw-materials": [
      {
        "id": "1",
        "name": "Farinha de Trigo",
        "unit": "kg",
        "quantity_in_stock": 35,
        "unit_cost": 5.5,
        "created_at": "2024-03-15T10:00:00Z"
      }
      // Add more data...
    ]
  };

  res.status(200).json(data['raw-materials']);
}