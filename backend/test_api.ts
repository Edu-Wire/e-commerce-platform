import http from 'http';

http.get('http://localhost:4000/api/admin/inventory?category_id=335', {
  headers: {
    // If we need auth, we will get 401. Let's see if we get 401 or something else
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Status Code:", res.statusCode);
    console.log("Response:", data.substring(0, 500));
  });
}).on('error', err => console.error(err));
