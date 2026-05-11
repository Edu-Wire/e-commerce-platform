import { query } from '../src/config/database';

async function mock() {
  const address = {
    city: "Bhopal",
    pincode: "462010",
    addresses: [
      {
        name: "Aish",
        details: "Indraprastha Colony Model Public School, Hinotiya, Sangam Tent",
        city: "BHOPAL",
        state: "MADHYA PRADESH",
        pincode: "462010"
      },
      {
        name: "Aish",
        details: "26 Bhadbhada Road, Guru Teg Bahadur Complex, North TT Nagar",
        city: "BHOPAL",
        state: "MADHYA PRADESH",
        pincode: "462003"
      }
    ]
  };

  try {
    const result = await query(
      "UPDATE customers SET address = $1 WHERE name LIKE $2 RETURNING *",
      [JSON.stringify(address), '%Aish%']
    );
    console.log('Updated customers:', result.length);
  } catch (err) {
    console.error('Failed to update:', err);
  }
}

mock();
