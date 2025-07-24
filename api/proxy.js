// /api/proxy.js

// This function will run on Vercel's servers, not in the browser.
// It acts as a backend proxy to securely communicate with the Browserbase API.

export default async function handler(req, res) {
    // Extract the target path from a custom header sent by the frontend.
    const targetPath = req.headers['x-target-path'];
    if (!targetPath) {
        return res.status(400).json({ message: 'x-target-path header is required.' });
    }
    const browserbaseApiUrl = `https://api.browserbase.com/v1${targetPath}`;

    // Set CORS headers to allow requests from your Vercel deployment.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-bb-api-key, x-target-path');

    // Respond to preflight CORS requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Forward the request from the frontend to the Browserbase API.
        const response = await fetch(browserbaseApiUrl, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                // FIX: Only the API key is needed in the header for most requests.
                // The project ID is passed in the body by the client when required.
                'x-bb-api-key': req.headers['x-bb-api-key'],
            },
            body: req.body ? JSON.stringify(req.body) : null,
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Error from Browserbase API:", errorData);
            return res.status(response.status).send(errorData);
        }
        
        if (response.status === 204) { // No Content
            return res.status(204).end();
        }

        const data = await response.json();
        res.status(200).json(data);

    } catch (error) {
        console.error('Error in proxy function:', error);
        res.status(500).json({ message: 'An error occurred in the proxy server.' });
    }
}
